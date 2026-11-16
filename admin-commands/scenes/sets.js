// Shared HOME + SCHOOL background sets for "What If You Had ADMIN COMMANDS in Real Life?".
//
// Every set is drawn in WORLD SPACE for the full 1920x1080 frame (camera at rest = the frame) and is padded far past
// the frame edges, so camera moves / zoom-outs never show a gap. Each set takes `t` (absolute seconds; only used
// for small idle motion: curtains, steam, blinking lamps) and an `opts` object. Room sets also expose
// `set.layers(t, opts)` -> { bg, mid, front, fg, light }:
//   bg    — what is seen through windows (sky, yard, city)        draw with view(cam, bg, 0.5..0.8)
//   mid   — the room itself: walls, floor, furniture backs        draw with view(cam, mid, 1)
//   front — furniture FRONTS: blanket, couch front, counter, desk, table, open fridge door...  Draw it AFTER the
//           characters who are behind/inside that furniture (sleeping, seated, the lunch lady, the principal) and
//           BEFORE the characters standing on the FLOOR line.
//   fg    — occluders close to the camera (may be '')            draw with view(cam, fg, 1.15..1.3)
//   light — night / evening / glow overlay (may be '')           draw LAST with view(cam, light, 1)
// Calling the set directly, e.g. heroRoom(t, opts), returns all layers composited at k = 1.
// Street-type sets take the camera themselves: street(t, cam, opts) returns the parallax layers already
// transformed (cam = { x, y, zoom } as from K.camKeys); street.layers(t, cam, opts) -> { bg, mid, fg } (transformed).
// FLOOR[set] = characters' feet y in the default framing (the stand line); SPOTS[set] = useful anchors.
// Static gradients/patterns/clips live in DEFS (ids prefixed `sets`); main.js adds DEFS to every frame.
// Screens everywhere take an svg centred on (0,0) of the screen box, or fn(w, h) => svg.
// Contact sheet: `node tools/sets_sheet.js` -> concept/sets_home.png (the hero is drawn on each FLOOR line; `--only k1,k2`,
// `--full DIR` writes full-size tiles, `--noref` hides the hero).
//
// Index (details in the comment above each function; anchors in SPOTS.<set>):
//   heroRoom(t, o)        YOUR bedroom. o: time 'day'|'evening'|'night', laptop (screen svg|fn: puts the magic laptop on the
//                         bed), laptopAt 'bed'|'desk'|false, laptopOff, glow, monitor (svg|fn), monitorOff, note (password
//                         sticky lines), notes 0..1, floatDust 0..1, lamp, bonk 0..1 + bonkX. + .layers (front = blanket +
//                         laptop on the bed).
//                         The ceiling line is y 100: SPOTS.heroRoom.ceiling (hero s .5 bonking -> feet y 572).
//   laptop(x, y, s, screen, o)   the magical old laptop; screen box 400x300 centred (0,-296) = LAPTOP_SCREEN.
//                         o: glow 0..1, off, lid 0..1, back (seen from behind), dust 0..1, rot, t
//   adminScreen(t, o)     -> fn(w, h): the black ADMIN PANEL v1.0 chat UI for any screen. o: lines, typed, cursor, title,
//                         battery, commands (help chips), glitch 0..1, welcome:false
//   kitchen(t, o)         o: time, pancakes 0..400, wind 0..1, notes 0..1, fridgeOpen 0..1, panCake:false, steam:false.
//                         + .layers (front = table + fridge door)
//   fridgeInside(t, o)    close-up inside the open fridge (hero squeezed between milk + cake). o: dark 0..1, cake 0..1, chill
//   livingRoom(t, o)      o: time, call (true|false|svg|fn on Dad's laptop), callOpts, tv (svg|fn), tvOff, windowOpen,
//                         curtains 0..1, lamp, catBed:false. + .layers (front = couch front + coffee table)
//   videoCall(x, y, w, h, t, o)  video-call app window CENTRED on (x, y). o: boss (svg|fn), bossFace 'bored'|'amazed'|
//                         'confused', mouth 0..1, speaking, self (svg|fn), selfSky, muted 0..1, title, timer, tiles
//   houseExterior(t, o)   wide street shot of the family house. o: time, lift 0..1, tail, house:false, splash 0..1.
//                         + .layers (front = the house: draw the giant cat between mid and front)
//   house(x, y, s, o)     the family house alone (origin = foundation bottom centre). o: time, lit, uprooted 0..1, tilt,
//                         tail, notes:false
//   street(t, cam, o)     morning suburban street (parallax, long). o: time, pigeon {x, state, sandwich, lift, flip, s} | false
//   serverStreet(t, cam, o)  the street that shouldn't exist (violet dusk). o: flicker 0..1, sale:false
//   garageSale(t, o)      o: gone 0..1 (the sale vanishes), tumble 0..1, laptop:false, glow. + .layers (front = table skirt)
//   cafeteria(t, o)       o: menu [lines], trays:false, steam:false. + .layers (front = counter + sneeze guard + table)
//   gym(t, o)             o: scoreboard ([4] | 'TEXT'), track:false, cones:false, rope:false. + .layers
//   hallway(t, cam, o)    long locker hallway (parallax). o: posters:false, doorOpen (door index)
//   principalOffice(t, o) o: hole 0..1 (hero-shaped hole in the back wall), holeX, floorHole 0..1, steam. + .layers (front = desk)
//   classroom(t, o)       o: board [lines], test:false, clock. + .layers (front = desk tops)
//   schoolyard(t, o)      o: time 'dawn'|'day'|'sunset'. + .layers
//   cage(x, y, s, t, o)   the jail command cage. o: drop 0..1, part 'back'|'front'|'all', theme 'green'|'gold', glow,
//                         vanish 0..1, plate
//   newsStudio(t, o)      o: chaos 0..1 | window (svg|fn), ticker (text), tickerY (870), logo. + .layers, .ticker(t, text, {y})
//   props: pigeon, tray, mailbox, lampPost, streetSign, tumbleweed, lavaLamp, stuffedOwl, pancakeStack, catClock, bossBust,
//          stickyNote, dntSticker, schoolPoster, schoolClock, cloud, tree, sparkle
//   helpers: frameIn(svg1080, w, h), glowSpot(x, y, r, id, op), darkPool(x, y, r, op), sky(t, time, cx, cy, w, h, o), vanish(svg,
//          k, box, seed), heroHoleD(s, k, ox, oy), camTf, mix, LAPTOP_SCREEN, ADMIN_CMDS, MOM_NOTES
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
const T = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, esc(s));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OUTX = (w = 8) => ({ stroke: LINE, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const pts = (a) => a.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
const poly = (a, at = {}) => P('M' + pts(a) + ' Z', at);
const pline = (a) => 'M' + pts(a);
const quad = (a) => 'M' + pts(a) + ' Z';
const circD = (cx, cy, r) => `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
const ellD = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)} a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0 a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0 Z`;
const md = (a, n) => ((a % n) + n) % n;
const bool01 = (v, d = 0) => (v === true ? 1 : v === false || v === undefined || v === null ? d : clamp(+v, 0, 1));

// padded full-cover bounds (camera zoom-outs and pans never show the edge)
const XL = -760, XR = 2680, YT = -640, YB = 1720;
const cover = (fill, extra = {}) => R(XL, YT, XR - XL, YB - YT, 0, { fill, ...extra });
const band = (y0, y1, fill, extra = {}) => R(XL, y0, XR - XL, y1 - y0, 0, { fill, ...extra });

// ---------------------------------------------------------------- colour helpers
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = (a) => '#' + a.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();
function mix(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const A = hx(a), B = hx(b);
  return toHex(A.map((v, i) => lerp(v, B[i], k)));
}

// ---------------------------------------------------------------- static defs (collected per section)
const DEF = [];
const def = (s) => { DEF.push(s); };
const lg = (id, stops, x2 = 0, y2 = 1, extra = '') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rg = (id, stops, extra = '') => `<radialGradient id="${id}"${extra}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;

// skies (shared by windows and exteriors)
def(lg('setsSkyDay', [[0, '#3C9BFF'], [0.6, '#8ED4FF'], [1, '#DDF4FF']]));
def(lg('setsSkyMorning', [[0, '#6FB2FF'], [0.55, '#BFE2FF'], [0.85, '#FFE3C4'], [1, '#FFD3A8']]));
def(lg('setsSkyEve', [[0, '#4B3FA8'], [0.45, '#D9679A'], [0.8, '#FF9F63'], [1, '#FFD487']]));
def(lg('setsSkyNight', [[0, '#0B0C33'], [0.65, '#1F2768'], [1, '#34408E']]));
def(lg('setsSkyDawn', [[0, '#7D8CE0'], [0.45, '#D7A4D8'], [0.8, '#FFC2A8'], [1, '#FFE2B8']]));
def(lg('setsSkyDusk', [[0, '#1E1048'], [0.45, '#4E2483'], [0.78, '#9A43A6'], [1, '#E07AB0']]));
const SKY = { day: 'setsSkyDay', morning: 'setsSkyMorning', evening: 'setsSkyEve', sunset: 'setsSkyEve', night: 'setsSkyNight', dawn: 'setsSkyDawn', dusk: 'setsSkyDusk' };
// light / glow
def(rg('setsGlowGreen', [[0, '#7DFFB8', 0.55], [0.35, '#3DFF9A', 0.2], [1, '#3DFF9A', 0]]));
def(rg('setsGlowWarm', [[0, '#FFE9A8', 0.7], [0.4, '#FFD27A', 0.24], [1, '#FFC860', 0]]));
def(rg('setsGlowWhite', [[0, '#FFFFFF', 0.85], [0.45, '#FFFFFF', 0.25], [1, '#FFFFFF', 0]]));
def(rg('setsGlowBlue', [[0, '#A8DCFF', 0.5], [0.45, '#7FC0FF', 0.16], [1, '#7FC0FF', 0]]));
def(rg('setsGlowViolet', [[0, '#E6B8FF', 0.6], [0.4, '#B06BFF', 0.2], [1, '#B06BFF', 0]]));
def(rg('setsGlowGold', [[0, '#FFF3B8', 0.75], [0.4, '#FFD34D', 0.26], [1, '#FFC12E', 0]]));
// night pool: transparent core, dark rim. Used on a 40x40 rect scaled so 1 unit = r/1.6 px (see darkPool)
def(rg('setsDarkPool', [[0, '#0B0826', 0], [0.03, '#0B0826', 0.12], [0.08, '#0B0826', 0.5], [0.17, '#0B0826', 0.76], [1, '#07051A', 0.86]]));
def(lg('setsShine', [[0, '#FFFFFF', 0.28], [0.45, '#FFFFFF', 0]], 1, 1));
def(lg('setsBeam', [[0, '#FFF4C8', 0.55], [1, '#FFF4C8', 0]]));
def('<pattern id="setsScan" width="8" height="6" patternUnits="userSpaceOnUse"><rect width="8" height="2" fill="#000" opacity="0.28"/></pattern>');
def('<pattern id="setsDust" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="6" cy="9" r="1.6" fill="#FFFFFF" opacity="0.55"/><circle cx="31" cy="4" r="1.1" fill="#FFFFFF" opacity="0.45"/><circle cx="20" cy="27" r="2.2" fill="#EDE6D0" opacity="0.55"/><circle cx="40" cy="36" r="1.3" fill="#FFFFFF" opacity="0.5"/><circle cx="9" cy="40" r="1" fill="#FFFFFF" opacity="0.4"/><path d="M26 16 l7 2" stroke="#FFFFFF" stroke-width="1.4" opacity="0.45"/></pattern>');

// ---------------------------------------------------------------- small shared pieces
// glowing spot (radial gradient circle). id: setsGlowGreen | Warm | White | Blue | Violet | Gold
const glowSpot = (x, y, r, id = 'setsGlowWarm', op = 1) => (op > 0.003 ? CI(x, y, r, { fill: `url(#${id})`, opacity: f(clamp(op, 0, 1)) }) : '');
// night darkness everywhere except a pool of light around (x, y); r ~ where it is half dark
const darkPool = (x, y, r = 300, op = 1) => G(R(-20, -20, 40, 40, 0, { fill: 'url(#setsDarkPool)' }), tr(x, y, r / 1.6), op < 1 ? { opacity: f(op) } : undefined);

function sparkle(x, y, r, color = '#FFE14D', w) {
  const d = `M${f(x)} ${f(y - r)} Q${f(x + r * 0.18)} ${f(y - r * 0.18)} ${f(x + r)} ${f(y)} Q${f(x + r * 0.18)} ${f(y + r * 0.18)} ${f(x)} ${f(y + r)} Q${f(x - r * 0.18)} ${f(y + r * 0.18)} ${f(x - r)} ${f(y)} Q${f(x - r * 0.18)} ${f(y - r * 0.18)} ${f(x)} ${f(y - r)} Z`;
  return P(d, { fill: color, stroke: LINE, 'stroke-width': w ?? Math.max(2, r * 0.12), 'stroke-linejoin': 'round' });
}
function starD(cx, cy, Ro, ri = Ro * 0.48, n = 5, rot = -90) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180, rr = i % 2 ? ri : Ro;
    p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return S.roundedPath(p, Ro * 0.1);
}
// several outlined circles merged into one silhouette (outline only on the outside): 2 elements
function blob(circles, fill, w = 6) {
  const d = circles.map(([x, y, r]) => circD(x, y, r)).join(' ');
  return P(d, { fill: LINE, stroke: LINE, 'stroke-width': w * 2, 'stroke-linejoin': 'round' }) + P(d, { fill });
}
const CLOUD_D = 'M-110 20 C-142 20 -142 -22 -104 -24 C-104 -62 -56 -68 -38 -42 C-28 -86 42 -86 48 -42 C72 -64 114 -48 106 -16 C142 -14 142 20 110 20 Z';
function cloud(x, y, s = 1, col = '#FFFFFF', shade = '#D4ECFF') {
  return G(P(CLOUD_D, { fill: col }) + P('M-118 8 Q0 34 118 8 L110 20 L-110 20 Z', { fill: shade }), tr(x, y, s));
}
function moon(x, y, r, col = '#FFF3C4') {
  return glowSpot(x, y, r * 3.2, 'setsGlowWhite', 0.35) + P(`M${f(x)} ${f(y - r)} A${f(r)} ${f(r)} 0 1 0 ${f(x)} ${f(y + r)} A${f(r * 0.72)} ${f(r)} 0 1 1 ${f(x)} ${f(y - r)} Z`, ol(col, Math.max(3, r * 0.08)));
}
function sun(x, y, r, col = '#FFE45C') {
  return glowSpot(x, y, r * 3, 'setsGlowWarm', 0.9) + CI(x, y, r, { fill: col, stroke: '#FFB42E', 'stroke-width': r * 0.12 });
}
// sky with decor around (cx, cy) inside a w x h window-sized region (the gradient covers everything)
function sky(t, time = 'day', cx = 960, cy = 300, w = 1920, h = 700, opts = {}) {
  let o = cover(`url(#${SKY[time] || SKY.day})`);
  const x0 = cx - w / 2, y0 = cy - h / 2;
  if (time === 'night') {
    let d = '';
    for (let i = 0; i < Math.round(opts.stars ?? clamp(w * h / 9000, 8, 46)); i++) {
      const x = x0 + hash(i * 3.3 + 1) * w, y = y0 + hash(i * 7.9 + 2) * h * 0.85;
      const r = 1.6 + hash(i * 1.7) * 2.2 + 0.8 * Math.sin(t * 2.3 + i * 1.9);
      d += circD(x, y, Math.max(0.6, r));
    }
    o += P(d, { fill: '#FFFFFF', opacity: 0.85 });
    if (opts.moon !== false) o += moon(x0 + w * (opts.moonX ?? 0.72), y0 + h * (opts.moonY ?? 0.24), Math.min(w, h) * 0.075);
  } else if (time !== 'dusk') {
    const eve = time === 'evening' || time === 'sunset' || time === 'dawn';
    if (opts.sun !== false) {
      if (eve) o += sun(x0 + w * (opts.sunX ?? 0.7), y0 + h * (opts.sunY ?? 0.82), Math.min(w, h) * 0.09, '#FFE9A0');
      else o += sun(x0 + w * (opts.sunX ?? 0.8), y0 + h * (opts.sunY ?? 0.16), Math.min(w, h) * 0.07);
    }
    const cl = eve ? '#FFE3EC' : '#FFFFFF', sh = eve ? '#F4AFC8' : '#CFE8FF';
    const n = opts.clouds ?? 3;
    for (let i = 0; i < n; i++) {
      const sp = 6 + hash(i * 4.1) * 8;
      const x = x0 + md(hash(i * 2.7) * w + t * sp, w + 300) - 150, y = y0 + h * (0.12 + 0.5 * hash(i * 9.3));
      o += cloud(x, y, (0.35 + 0.4 * hash(i * 5.5)) * Math.min(1.4, w / 600), cl, sh);
    }
  }
  return o;
}
// cartoon tree: trunk + merged canopy; origin = trunk base
function tree(x, y, s = 1, opts = {}) {
  const c = opts.col || '#4CB65A', c2 = opts.hi || '#7CD978', trunk = opts.trunk || '#8A5A33';
  const sw = opts.sway || 0;
  let o = P(`M-22 0 L-14 -200 Q0 -220 14 -200 L22 0 Z`, ol(trunk, 6)) + P('M-4 -30 L-2 -170', ln(6, '#A8743F', 0.8));
  o += P('M-6 -150 L-60 -230 M6 -170 L52 -250', ln(14, LINE)) + P('M-6 -150 L-60 -230 M6 -170 L52 -250', ln(7, trunk));
  o += G(blob([[0, -300, 120], [-100, -250, 86], [100, -250, 90], [-40, -380, 86], [60, -370, 80]], c, 6) +
    P(circD(-50, -330, 40) + circD(40, -400, 26) + circD(-110, -262, 22), { fill: c2, opacity: 0.85 }), `rotate(${f(sw)} 0 -200)`);
  return G(o, tr(x, y, s));
}
// sticky note (Mom's). lines: string ('\n' splits) or array
function stickyNote(x, y, rot = 0, lines = '', opts = {}) {
  const w = opts.w || 70, col = opts.col || '#FFE45C', size = opts.size || Math.round(w * 0.19);
  const L = Array.isArray(lines) ? lines : String(lines).split('\n');
  let o = P(`M${-w / 2} ${-w / 2} H${w / 2} V${w / 2 - 12} L${w / 2 - 12} ${w / 2} H${-w / 2} Z`, ol(col, opts.sw ?? 3));
  o += P(`M${w / 2} ${w / 2 - 12} L${w / 2 - 12} ${w / 2} L${w / 2 - 10} ${w / 2 - 10} Z`, { fill: mix(col, '#000000', 0.18), stroke: LINE, 'stroke-width': 2, 'stroke-linejoin': 'round' });
  o += R(-w / 2, -w / 2, w, w * 0.16, 0, { fill: '#000', opacity: 0.07 });
  L.forEach((s, i) => { o += TF(s, 0, -((L.length - 1) * size * 0.58) + i * size * 1.16 + size * 0.36, size, opts.ink || '#3A2A55'); });
  return G(o, tr(x, y, opts.s || 1, rot));
}
const MOM_NOTES = ['CLEAN\nROOM', 'HOME-\nWORK', 'WHY', 'MILK!', 'FEED\nCAT', 'NO CATS\nON TABLE', 'DAD:\nUNMUTE', 'BE\nNICE', 'TRASH\nDAY', 'NO', 'DRINK\nWATER', 'TODAY.', 'SOCKS?', 'LOVE\nYOU', 'STOP', 'OFFICIAL', 'BED\n9PM', 'NOT\nTHAT', 'ASK\nMOM', 'WIPE\nIT', 'EAT\nVEG', 'SHOES\nOFF', 'HUG\nGRANNY', 'NO\nRUNNING'];
const NOTE_COLS = ['#FFE45C', '#FFE45C', '#FFE45C', '#FF9EC4', '#9FF0A8', '#9FE0FF', '#FFE45C'];
// screen content: svg centred on (0,0) of the box, or fn(w, h)
const screenOf = (inner, w, h) => (typeof inner === 'function' ? inner(w, h) : inner || '');
// fit a full 1920x1080 frame (e.g. another set) into a w x h box centred on (0,0)
const frameIn = (svg, w, h) => G(svg, `translate(${f(-w / 2)} ${f(-h / 2)}) scale(${f(w / 1920)} ${f(h / 1080)})`);
function makeSet(layersFn) {
  const fn = (t = 0, opts = {}) => { const L = layersFn(t, opts); return (L.bg || '') + (L.mid || '') + (L.front || '') + (L.fg || '') + (L.light || ''); };
  fn.layers = layersFn;
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
// visible world-x range of a parallax layer (for culling long streets)
function visX(cam = {}, k = 1, pad = 400) {
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, cx = (cam.x || 0) * k;
  return [fx + cx - fx / z - pad, fx + cx + (1920 - fx) / z + pad];
}
// one-point perspective helper: point at depth k toward vanishing point (vx, vy)
const pk = (vx, vy, x, y, k) => [vx + (x - vx) * k, vy + (y - vy) * k];
// perspective floor boards: horizontal seams that get wider toward the camera + staggered joints (2 paths)
function floorBoards(y0, y1, x0, x1, n, col, seed = 1, joints = true, w = 3.5, op = 0.7) {
  let d = '', dj = '';
  let prev = y0;
  for (let i = 1; i <= n; i++) {
    const u = i / n, y = y0 + (y1 - y0) * u * u * 0.6 + (y1 - y0) * u * 0.4;
    d += `M${x0} ${f(y)} L${x1} ${f(y)} `;
    if (joints) {
      const len = 160 + 260 * u;
      for (let x = x0 + hash(i * 3.1 + seed) * len; x < x1; x += len * (0.8 + 0.5 * hash(x * 0.01 + i))) dj += `M${f(x)} ${f(prev + 2)} L${f(x)} ${f(y - 2)} `;
    }
    prev = y;
  }
  return P(d, ln(w, col, op)) + (dj ? P(dj, ln(w * 0.85, col, op * 0.8)) : '');
}
// floating dust motes (day: in a sunbeam; night: green magic)
function motes(t, n, x0, y0, w, h, col, op = 0.8, seed = 1, rise = 18) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const ph = hash(i * 7.3 + seed);
    const x = x0 + md(hash(i * 3.1 + seed) * w + Math.sin(t * 0.7 + i) * 26 + t * 6, w);
    const y = y0 + md(hash(i * 5.7 + seed) * h - t * rise * (0.6 + ph), h);
    const r = 1.6 + 2.6 * hash(i * 1.9 + seed) * (0.7 + 0.3 * Math.sin(t * 2 + i));
    d += circD(x, y, r);
  }
  return P(d, { fill: col, opacity: f(op) });
}

// "DO NOT TYPE" hazard sticker (yellow/black), centred on (x, y)
function dntSticker(x, y, rot = 0, s = 1, opts = {}) {
  const w = 156, h = 32, a = -w / 2, b = w / 2;
  let o = R(a, -h / 2, w, h, 4, ol(opts.faded ? '#F2D57A' : '#FFD21F', 3));
  o += P(`M${a} ${-h / 2 + 12} L${a + 12} ${-h / 2} L${a + 19} ${-h / 2} L${a} ${h / 2 - 13} Z M${a + 6} ${h / 2} L${a + 22} ${-h / 2 + 16} L${a + 22} ${-h / 2 + 23} L${a + 13} ${h / 2} Z ` +
    `M${b} ${h / 2 - 12} L${b - 12} ${h / 2} L${b - 19} ${h / 2} L${b} ${-h / 2 + 13} Z M${b - 6} ${-h / 2} L${b - 22} ${h / 2 - 16} L${b - 22} ${h / 2 - 23} L${b - 13} ${-h / 2} Z`, { fill: LINE });
  o += T('DO NOT TYPE', 0, 7, 17, LINE, { 'letter-spacing': 0.5 });
  o += P(`M${b - 34} ${-h / 2} L${b - 22} ${-h / 2} L${b - 34} ${-h / 2 + 10} Z`, { fill: '#FFF6C8', stroke: LINE, 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
  return G(o, tr(x, y, s, rot));
}

// ================================================================= 2. THE MAGICAL OLD LAPTOP (prop)
// laptop(x, y, s, screen, opts): origin = bottom centre of the base's front edge. A chunky late-90s beige notebook,
// dusty, with an old "DO NOT TYPE" sticker on the palm rest and a cobweb on the lid.
// Screen box (local, s = 1): 400 x 300 centred on (0, -296) = LAPTOP_SCREEN; `screen` = svg centred on (0,0) of that
// box or fn(w, h) (e.g. adminScreen(t, {...})). With no screen: a black screen with a blinking green cursor.
// opts: { glow 0..1 (eerie green light around it + spill on the deck), off (dark screen), lid 0..1 (1 open, 0 closed),
//   back (seen from BEHIND: lid back with sticker, green rim light when glow — for shots over the screen toward the hero),
//   dust 0..1 (default 1), rot, t (for the glow pulse / cursor) }
// Overall size at s = 1: 588 wide, 478 tall (open). Typical: held by the hero s .35..45, on a bed/table s .34.
const LAPTOP_SCREEN = { w: 400, h: 300, cx: 0, cy: -296 };
def('<clipPath id="setsClipLapScr"><rect x="-200" y="-150" width="400" height="300" rx="8"/></clipPath>');
def('<pattern id="setsOldKeys" width="24" height="15" patternUnits="userSpaceOnUse"><rect width="24" height="15" fill="#8C846C"/><rect x="1.5" y="1.5" width="21" height="11" rx="2.5" fill="#E9E2CB"/><rect x="3" y="2.5" width="18" height="4" rx="2" fill="#FFFFFF" opacity="0.45"/></pattern>');
def(lg('setsLapBody', [[0, '#D3CAB0'], [1, '#B3AA8E']]));
def(lg('setsLapDeck', [[0, '#C9C0A4'], [1, '#DED6BE']]));
function laptop(x, y, s = 1, screen = '', opts = {}) {
  const lid = clamp(opts.lid ?? 1, 0, 1), glow = bool01(opts.glow), dust = bool01(opts.dust, 1), t = opts.t || 0;
  const pulse = 0.88 + 0.12 * Math.sin(t * 3.1);
  const BODY = 'url(#setsLapBody)', LO = '#A0977A', DK = '#776F58';
  let o = '';
  if (glow > 0) o += glowSpot(0, -270, 640, 'setsGlowGreen', glow * pulse);
  const cobweb = (cx, cy, sx = 1) => P(`M${cx} ${cy} l${-62 * sx} 8 M${cx} ${cy} l${-46 * sx} 38 M${cx} ${cy} l${-10 * sx} 58 M${cx - 24 * sx} ${cy + 3} q${-6 * sx} 14 ${10 * sx} 20 q${12 * sx} -4 ${8 * sx} 24 M${cx - 44 * sx} ${cy + 6} q${-6 * sx} 22 ${16 * sx} 30 q${18 * sx} 2 ${20 * sx} 26`, ln(1.8, '#FFFFFF', 0.75 * dust));
  if (opts.back) {
    // lid seen from behind (the screen faces away); the base hides behind it
    o += R(-282, -16, 564, 16, 6, ol(LO, 5));
    o += R(-262, -372, 524, 362, 26, ol(BODY, 7)) + R(-244, -354, 488, 326, 18, { fill: 'none', stroke: '#E9E2CB', 'stroke-width': 4, opacity: 0.6 });
    o += G(P('M-34 10 L-40 -26 L-18 -8 L0 -34 L18 -8 L40 -26 L34 10 Z', ol('#C9B87A', 4)) + R(-36, 10, 72, 12, 4, ol('#C9B87A', 3)), 'translate(0 -214)');
    o += TF('PANEL-98', 0, -160, 26, '#8C846C');
    o += dntSticker(-120, -86, -8, 1.15) + G(R(-36, -26, 72, 52, 8, ol('#3DA8FF', 3)) + TF('v1.0', 0, 8, 20, '#FFFFFF'), tr(170, -300, 1, 9));
    if (dust > 0) o += R(-262, -372, 524, 362, 26, { fill: 'url(#setsDust)', opacity: f(dust) }) + cobweb(258, -366);
    if (glow > 0) o += R(-268, -378, 536, 374, 30, { fill: 'none', stroke: '#7DFFB8', 'stroke-width': 10, opacity: f(0.75 * glow * pulse) }) + R(-282, -392, 564, 402, 40, { fill: 'none', stroke: '#3DFF9A', 'stroke-width': 18, opacity: f(0.25 * glow * pulse) });
    return G(o, tr(x, y, s, opts.rot || 0));
  }
  // ---- base / deck
  const deckD = 'M-250 -112 L250 -112 L292 -22 L-292 -22 Z';
  o += P(deckD, ol('url(#setsLapDeck)', 6));
  o += R(-294, -26, 588, 26, 9, ol(LO, 6)) + R(-280, -20, 140, 6, 3, { fill: DK, opacity: 0.5 });
  o += P('M-226 -104 L226 -104 L244 -62 L-244 -62 Z', { fill: 'url(#setsOldKeys)', stroke: LINE, 'stroke-width': 3.5, 'stroke-linejoin': 'round' });
  o += CI(0, -70, 5.5, ol('#E0402E', 2));
  o += R(-50, -56, 100, 22, 5, ol('#B6AD92', 3)) + R(-50, -32, 48, 7, 3, ol(LO, 2)) + R(2, -32, 48, 7, 3, ol(LO, 2));
  o += CI(206, -13, 4.5, { fill: glow > 0 || !opts.off ? '#5DFFA8' : '#5A5440', stroke: LINE, 'stroke-width': 1.5 }) + CI(226, -13, 4.5, { fill: '#FFB13B', stroke: LINE, 'stroke-width': 1.5, opacity: 0.8 });
  o += dntSticker(-168, -42, -5, 0.88, { faded: true });
  // ---- lid
  if (lid < 0.14) {
    // closed: the lid's back lies on the deck
    o += P('M-254 -128 L254 -128 L290 -34 L-290 -34 Z', ol(BODY, 6)) + R(-292, -38, 584, 14, 6, ol(LO, 4));
    o += dntSticker(-60, -80, -4, 1.1) + G(P('M-24 8 L-28 -18 L-12 -6 L0 -24 L12 -6 L28 -18 L24 8 Z', ol('#C9B87A', 3)), 'translate(170 -84) scale(0.9 0.6)');
    if (dust > 0) o += P('M-254 -128 L254 -128 L290 -34 L-290 -34 Z', { fill: 'url(#setsDust)', opacity: f(dust) });
    if (glow > 0) o += R(-300, -44, 600, 10, 5, { fill: '#7DFFB8', opacity: f(0.7 * glow * pulse) });
  } else {
    // lid y -478..-104; dark inset around the screen (screen x ±200, y -446..-146); beige chin with the brand
    const lidD = 'M-264 -452 Q-264 -478 -238 -478 L238 -478 Q264 -478 264 -452 L264 -104 L-264 -104 Z';
    let L = P(lidD, ol(BODY, 7)) + R(-250, -464, 500, 350, 16, { fill: 'none', stroke: '#E9E2CB', 'stroke-width': 3, opacity: 0.55 });
    L += R(-214, -460, 428, 330, 12, { fill: '#2A2722' });
    let scr;
    if (opts.off) scr = R(-200, -150, 400, 300, 8, { fill: '#121416' }) + P('M-170 -150 L-90 -150 L-190 60 L-200 60 L-200 -110 Z', { fill: '#FFFFFF', opacity: 0.06 });
    else {
      const content = screen ? screenOf(screen, 400, 300)
        : R(-200, -150, 400, 300, 0, { fill: '#050807' }) + (Math.floor(t * 2.2) % 2 ? '' : R(-176, -126, 16, 26, 2, { fill: '#3DFF9A' }));
      scr = G(R(-200, -150, 400, 300, 0, { fill: '#050807' }) + content, null, { 'clip-path': 'url(#setsClipLapScr)' }) + R(-200, -150, 400, 300, 8, { fill: 'url(#setsShine)' });
    }
    if (dust > 0) scr += R(-200, -150, 400, 300, 8, { fill: 'url(#setsDust)', opacity: f(dust * 0.22) });
    L += G(scr, 'translate(0 -296)') + R(-200, -446, 400, 300, 8, ln(4, '#0A0B0C'));
    if (glow > 0 && !opts.off) L += R(-204, -450, 408, 308, 10, { fill: 'none', stroke: '#7DFFB8', 'stroke-width': 4, opacity: f(0.6 * glow * pulse) });
    // chin: tiny crown badge + brand + LEDs
    L += G(P('M-12 4 L-14 -9 L-6 -3 L0 -12 L6 -3 L14 -9 L12 4 Z', ol('#C9B87A', 2)), 'translate(-120 -116)') + TF('PANEL-98', -100, -110, 16, '#8C846C', { 'text-anchor': 'start' });
    L += CI(186, -116, 4.5, { fill: glow > 0 ? '#5DFFA8' : '#4A4638', stroke: LINE, 'stroke-width': 1.5 }) + CI(204, -116, 4.5, { fill: '#4A4638', stroke: LINE, 'stroke-width': 1.5 });
    if (dust > 0) L += P(lidD + ' M-214 -460 L214 -460 L214 -130 L-214 -130 Z', { fill: 'url(#setsDust)', opacity: f(dust * 0.9), 'fill-rule': 'evenodd' }) + cobweb(258, -472);
    o += lid < 1 ? G(L, `translate(0 -104) scale(1 ${f(lid)}) translate(0 104)`) : L;
    o += R(-250, -110, 26, 12, 4, ol('#8C846C', 3)) + R(224, -110, 26, 12, 4, ol('#8C846C', 3));
  }
  if (dust > 0) o += P(deckD, { fill: 'url(#setsDust)', opacity: f(dust * 0.8) });
  if (glow > 0 && lid >= 0.14) o += P(deckD, { fill: '#3DFF9A', opacity: f(0.16 * glow * pulse) }) + P('M-250 -112 L250 -112', ln(5, '#9DFFD0', 0.7 * glow));
  return G(o, tr(x, y, s, opts.rot || 0));
}

// ---------------------------------------------------------------- the admin panel UI (screen content)
// adminScreen(t, opts) returns fn(w, h) => svg for any screen box (laptop, phone, a giant sky window, frameIn...).
// Laid out on a 400 x 300 design box scaled to fit (background fills the whole w x h).
// opts: { lines: [...] (strings or {text, col}; auto colours: ';cmd' white, 'denied'/'ERROR' red, 'Warning' amber, else green;
//   the last ~7 lines are shown), typed (text at the prompt), cursor (default true), title ('ADMIN PANEL v1.0'),
//   battery (number % -> icon top-right, red <= 5), commands (true: the 9 help chips fill the log area),
//   glitch 0..1 (slices jump), welcome:false (no default lines) }
const ADMIN_CMDS = [';fly', ';speed', ';size', ';jail', ';tp', ';god', ';noclip', ';freeze', ';kick'];
function adminScreen(t = 0, opts = {}) {
  return (w = 400, h = 300) => {
    const k = Math.min(w / 400, h / 300);
    let o = R(-w / 2, -h / 2, w, h, 0, { fill: '#040706' }) + E(0, 0, w * 0.62, h * 0.6, { fill: '#0B2A1C', opacity: 0.55 });
    let c = R(-200, -150, 400, 38, 0, { fill: '#0C1C14' }) + P('M-200 -112 L200 -112', ln(2, '#3DFF9A', 0.5));
    c += G(P('M-11 5 L-13 -8 L-5 -2 L0 -11 L5 -2 L13 -8 L11 5 Z', { fill: '#FFD34D' }), 'translate(-180 -132)');
    c += T(opts.title || 'ADMIN PANEL v1.0', -160, -123, 21, '#3DFF9A', { 'text-anchor': 'start', 'letter-spacing': 1 });
    if (opts.battery !== undefined && opts.battery !== null) {
      const b = clamp(opts.battery, 0, 100), low = b <= 5, col = low ? '#FF4D5E' : '#3DFF9A';
      const blink = low && Math.floor(t * 3) % 2 === 0;
      c += R(138, -140, 40, 18, 4, { fill: 'none', stroke: col, 'stroke-width': 2.5 }) + R(178, -134, 4, 6, 1, { fill: col }) + R(141, -137, Math.max(2, 34 * b / 100), 12, 2, { fill: col, opacity: blink ? 0.3 : 1 });
      c += TF(`${Math.round(b)}%`, 132, -126, 14, col, { 'text-anchor': 'end' });
    } else c += CI(150, -131, 5, { fill: '#FF5A5A' }) + CI(166, -131, 5, { fill: '#FFC23A' }) + CI(182, -131, 5, { fill: '#3DFF9A' });
    if (opts.commands) {
      ADMIN_CMDS.forEach((cmd, i) => {
        const cx = -126 + (i % 3) * 126, cy = -70 + Math.floor(i / 3) * 56;
        c += R(cx - 56, cy - 20, 112, 40, 10, { fill: '#0F2A1E', stroke: '#3DFF9A', 'stroke-width': 2 }) + TF(cmd, cx, cy + 8, 21, '#EAFFF3');
      });
    } else {
      const lines = opts.lines ?? (opts.welcome === false ? [] : ['Admin panel loaded.', 'Welcome... you.']);
      const shown = lines.slice(-7);
      shown.forEach((l, i) => {
        const txt = typeof l === 'string' ? l : l.text;
        const col = (typeof l === 'object' && l.col) || (/^;/.test(txt) ? '#F2F7FF' : /denied|ERROR|kicked/i.test(txt) ? '#FF4D5E' : /^warning/i.test(txt) ? '#FFB13B' : '#3DFF9A');
        const gx = opts.glitch ? (hash(i * 3 + Math.floor(t * 18)) - 0.5) * 30 * opts.glitch * (hash(i + Math.floor(t * 9)) > 0.6 ? 1 : 0) : 0;
        c += TF((/^;/.test(txt) ? '[you]: ' : '') + txt, -182 + gx, -82 + i * 27, 18, col, { 'text-anchor': 'start' });
      });
    }
    // prompt line
    const typed = opts.typed || '';
    c += R(-190, 106, 380, 32, 8, { fill: '#0C1C14', stroke: '#1E5A3C', 'stroke-width': 2 }) + TF('>', -178, 128, 19, '#3DFF9A', { 'text-anchor': 'start' });
    c += TF(typed, -160, 128, 18, '#F2F7FF', { 'text-anchor': 'start' });
    if (opts.cursor !== false && Math.floor(t * 2.4) % 2 === 0) c += R(-158 + typed.length * 9.6, 112, 10, 20, 2, { fill: '#3DFF9A' });
    o += G(c, `scale(${f(k)})`);
    o += R(-w / 2, -h / 2, w, h, 0, { fill: 'url(#setsScan)', opacity: 0.5 });
    if (opts.glitch > 0 && hash(Math.floor(t * 14)) < opts.glitch * 0.6) o += R(-w / 2, -h / 2 + hash(Math.floor(t * 14) + 3) * h, w, h * 0.06, 0, { fill: '#3DFF9A', opacity: 0.35 });
    return o;
  };
}

// ================================================================= 1. HERO ROOM — your bedroom
// Flat front view, wall/floor seam y 790; ceiling plane visible at the top: the CEILING LINE is y 100 — when he
// bonks his head, the top of his hair touches y ~96 (hero s .5 -> feet y ~572; SPOTS.heroRoom.ceiling).
// Window at left (glass x 150..560, y 200..560; through it opts.time), desk centre (top y 628) with a monitor turned
// toward the window — the password sticky note sits on its bezel (SPOTS.heroRoom.note, readable when zoomed ~3x),
// game posters over the bed at right. Bed: mattress top y 690, pillow at right; to put him to bed draw the rig with
// SPOTS.heroRoom.bed.lie ({x, y, s, rot 90}: head on the pillow) between layers.mid and layers.front (blanket).
// Sitting on the bed edge: hips y ~700, feet y ~860. Stand line y 990 (FLOOR.heroRoom).
// opts: { time 'day'|'evening'|'night', laptop (screen svg|fn: puts the magic laptop on the bed), laptopAt 'bed'|'desk'|false,
//   laptopOff, glow (laptop glow 0..1, default 1 at night), monitor (svg|fn for the 200x132 monitor screen), monitorOff,
//   note (sticky lines, default ['PASSWORD:', 'pancake', '123']), notes 0..1 (Mom's notes appear), floatDust 0..1, lamp,
//   bonk 0..1 (time since he hit the ceiling: dent, cracks + falling plaster at opts.bonkX, default 1400) }
// layers.front = blanket + laptop on the bed; layers.light = evening tint / night darkness lit by the laptop (+ glowing
// ceiling stars, dust motes) — draw it after the characters.
const HR = { ceil: 100, base: 790, win: { x0: 150, y0: 200, x1: 560, y1: 560 }, desk: { x0: 586, x1: 1086, top: 680 }, mon: { x: 862, y: 670, s: 0.92 }, bed: 716 };
const HR_LAP = { bed: { x: 1390, y: 724, s: 0.34 }, desk: { x: 760, y: 678, s: 0.3 } };
def(lg('setsHRCeil', [[0, '#DDBF92'], [1, '#FBE9C6']]));
def(lg('setsHRWall', [[0, '#FFE7AE'], [1, '#FFD487']]));
def('<pattern id="setsHRPix" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M14 10 h6 v6 h-6 Z M46 42 h6 v6 h-6 Z" fill="#F2B95A" opacity="0.55"/><path d="M44 12 h4 v4 h-4 Z M12 46 h4 v4 h-4 Z" fill="#FFFFFF" opacity="0.5"/></pattern>');
def(lg('setsHRFloor', [[0, '#C98450'], [1, '#B06B3A']]));
def('<pattern id="setsHRQuilt" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#FFFFFF" opacity="0.1"/><rect x="28" y="28" width="28" height="28" fill="#FFFFFF" opacity="0.1"/><path d="M10 14 h8 v8 h-8 Z" fill="#FFD34D" opacity="0.5"/></pattern>');
def('<pattern id="setsKeysDark" width="16" height="10" patternUnits="userSpaceOnUse"><rect width="16" height="10" fill="#22252E"/><rect x="1.5" y="1.5" width="13" height="7" rx="2" fill="#454B5C"/></pattern>');
def('<clipPath id="setsClipMon"><path d="M-98 -150 L100 -162 L100 -18 L-98 -26 Z"/></clipPath>');

// game posters (original games)
function gamePoster(kind, x, y, w, h, rot = 0) {
  let o = R(-w / 2 + 6, -h / 2 + 8, w, h, 6, { fill: '#000', opacity: 0.12 });
  if (kind === 'obby') {
    o += R(-w / 2, -h / 2, w, h, 6, ol('#7A45E6', 5)) + R(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 3, { fill: '#9C6BFF' });
    o += R(-w / 2 + 10, h / 2 - 70, w - 20, 60, 0, { fill: '#FF6A2E' }) + P(`M${-w / 2 + 10} ${h / 2 - 70} q20 -14 40 0 t40 0 t40 0 t40 0 t40 0`, ln(5, '#FFD34D'));
    o += R(-70, h / 2 - 108, 50, 18, 4, ol('#5CDB6B', 3)) + R(20, h / 2 - 150, 50, 18, 4, ol('#5CDB6B', 3));
    o += G(R(-14, -34, 28, 28, 5, ol('#FFFFFF', 3)) + R(-12, -6, 24, 30, 4, ol('#FF4D5E', 3)) + P('M-12 0 L-30 -14 M12 0 L30 -18', ln(6, LINE)), 'translate(0 22) rotate(-12)');
    o += T('OBBY', 0, -h / 2 + 52, 40, '#FFE14D', OUTX(7)) + T('LEGENDS', 0, -h / 2 + 88, 30, '#FFFFFF', OUTX(6));
  } else if (kind === 'tower') {
    o += R(-w / 2, -h / 2, w, h, 6, ol('#2A9DE0', 5)) + R(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 3, { fill: '#58C2FF' });
    const cols = ['#FF5A5A', '#FFB13B', '#FFE14D', '#5CDB6B', '#B06BFF'];
    for (let i = 0; i < 5; i++) o += R(-36 + Math.sin(i * 1.7) * 14, h / 2 - 50 - i * 36, 72, 34, 5, ol(cols[i], 3.5));
    o += T('TOWER', 0, -h / 2 + 48, 36, '#FFFFFF', OUTX(7)) + T('TUMBLE', 0, -h / 2 + 82, 30, '#FFE14D', OUTX(6));
  } else {
    o += R(-w / 2, -h / 2, w, h, 6, ol('#FF8A2A', 5)) + R(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 3, { fill: '#FFB04A' });
    o += P(`M${-w / 2 + 10} ${h / 2 - 50} L${w / 2 - 10} ${h / 2 - 80} L${w / 2 - 10} ${h / 2 - 10} L${-w / 2 + 10} ${h / 2 - 10} Z`, { fill: '#5A5F78' });
    o += G(R(-42, -18, 84, 26, 8, ol('#3DA8FF', 3)) + R(-18, -36, 30, 20, 5, ol('#BFF0FF', 3)) + CI(-26, 10, 11, ol('#2A2A33', 3)) + CI(28, 10, 11, ol('#2A2A33', 3)), 'translate(0 26) rotate(-8)');
    o += T('KART', 0, -h / 2 + 46, 38, '#FFFFFF', OUTX(7)) + T('CRASH 3', 0, -h / 2 + 78, 26, '#2A2246');
  }
  o += R(-12, -h / 2 - 8, 24, 16, 2, { fill: '#FFF4C8', opacity: 0.9, transform: 'rotate(-6)' });
  return G(o, tr(x, y, 1, rot));
}

function heroRoomLayers(t, opts = {}) {
  const time = opts.time || 'day', nite = time === 'night', eve = time === 'evening';
  const W = HR.win;
  const laptopAt = opts.laptopAt !== undefined ? opts.laptopAt : opts.laptop !== undefined ? 'bed' : false;
  const notes = bool01(opts.notes);
  // ---- bg: through the window
  let bg = sky(t, time, (W.x0 + W.x1) / 2, (W.y0 + W.y1) / 2, W.x1 - W.x0, W.y1 - W.y0, { stars: 18, moonX: 0.74, moonY: 0.26, sunX: 0.8, sunY: eve ? 0.72 : 0.2, clouds: 2 });
  const tc = nite ? '#1E3B52' : eve ? '#6F8A52' : '#4CB65A';
  bg += P('M120 600 L120 470 L300 380 L480 470 L480 600 Z', ol(nite ? '#2C2E5E' : eve ? '#C76A5A' : '#E2654E', 5)) + R(250, 480, 70, 60, 6, ol(nite ? '#FFD86B' : '#BFF0FF', 4));
  bg += tree(560, 640, 1.05, { col: tc, hi: nite ? '#2A5068' : eve ? '#8FA866' : '#7CD978', trunk: nite ? '#3A2A3A' : '#8A5A33', sway: Math.sin(t * 0.9) * 1.5 });
  bg += P('M100 300 Q360 340 620 296', ln(3, nite ? '#4A4E80' : '#3A3F55', 0.7));
  // ---- mid
  let m = '';
  // ceiling plane + glow-in-the-dark stars + flush lamp
  m += R(XL, YT, XR - XL, HR.ceil - YT, 0, { fill: 'url(#setsHRCeil)' });
  m += P(`M0 ${HR.ceil} L-260 -40 M480 ${HR.ceil} L410 -40 M1440 ${HR.ceil} L1510 -40 M1920 ${HR.ceil} L2180 -40`, ln(3, '#D2B07E', 0.6));
  const STARS = [[180, 52, 13], [330, 78, 9], [690, 40, 12], [1250, 66, 10], [1420, 34, 14], [1640, 74, 9], [1820, 44, 12]];
  m += P(STARS.map(([x, y, r]) => starD(x, y, r)).join(' '), { fill: '#EAF5BF', stroke: '#C9C79A', 'stroke-width': 2 });
  m += E(1000, 44, 96, 26, ol('#FFF7E2', 5)) + P('M904 44 Q1000 92 1096 44', ol('#FFF0C8', 5)) + E(1000, 46, 30, 8, { fill: '#FFFFFF', opacity: 0.7 });
  // bonk: a dent + cracks in the ceiling and plaster dust falling (opts.bonk 0..1 = time since the hit, opts.bonkX)
  const bonk = bool01(opts.bonk);
  if (bonk > 0) {
    const bx = opts.bonkX ?? 1400, by = HR.ceil - 6, k = ease.out(clamp(bonk * 4, 0, 1));
    let cr = '';
    for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + 0.9 * (i / 6)), L = (40 + 50 * hash(i * 2.7)) * k; cr += `M${bx} ${by} l${f(Math.cos(a) * L * 0.6)} ${f(Math.sin(a) * L * 0.25)} l${f(Math.cos(a + 0.3) * L * 0.4)} ${f(Math.sin(a + 0.3) * L * 0.18)} `; }
    m += E(bx, by - 4, 46 * k, 9 * k, { fill: '#C9A878', opacity: 0.7 }) + P(cr, ln(3.5, '#8A6A40'));
    let du = '';
    for (let i = 0; i < 10; i++) { const u = clamp(bonk * 1.4 - hash(i) * 0.3, 0, 1); if (u <= 0 || u >= 1) continue; du += circD(bx + (hash(i * 3.1) - 0.5) * 120 + Math.sin(u * 6 + i) * 12, by + 10 + u * 420, 3 + 4 * hash(i * 5.3)); }
    if (du) m += P(du, { fill: '#F4E6C8', stroke: '#C9A878', 'stroke-width': 1.5, opacity: f(1 - bonk * 0.8) });
  }
  // wall with the window hole
  const wallD = `M${XL} ${HR.ceil} H${XR} V${HR.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: 'url(#setsHRWall)', 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#setsHRPix)', 'fill-rule': 'evenodd' });
  m += band(HR.ceil - 6, HR.ceil + 16, '#FFF6E2') + P(`M${XL} ${HR.ceil - 6} H${XR} M${XL} ${HR.ceil + 16} H${XR}`, ln(4, LINE, 0.85));
  // racing stripe + lower wall
  m += band(598, 630, '#FF6A3D') + band(630, 644, '#FFC23A') + band(644, HR.base, '#FBC677') + P(`M${XL} 598 H${XR} M${XL} 644 H${XR}`, ln(3.5, LINE, 0.8));
  m += band(HR.base - 22, HR.base + 2, '#FFF6E2') + P(`M${XL} ${HR.base - 22} H${XR}`, ln(4, LINE, 0.8));
  // window frame, mullions, sill, curtains
  m += P(`M${W.x0 - 22} ${W.y0 - 22} H${W.x1 + 22} V${W.y1 + 6} H${W.x0 - 22} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: '#FFF8EC', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 });
  m += R(351, W.y0, 14, W.y1 - W.y0, 3, ol('#FFF8EC', 4)) + R(W.x0, 374, W.x1 - W.x0, 14, 3, ol('#FFF8EC', 4));
  m += P(`M${W.x0 + 26} ${W.y0 + 150} L${W.x0 + 120} ${W.y0 + 16} L${W.x0 + 160} ${W.y0 + 16} L${W.x0 + 66} ${W.y0 + 150} Z M${W.x0 + 240} ${W.y0 + 330} L${W.x0 + 320} ${W.y0 + 196} L${W.x0 + 340} ${W.y0 + 196} L${W.x0 + 260} ${W.y0 + 330} Z`, { fill: '#FFFFFF', opacity: nite ? 0.08 : 0.32 });
  m += R(W.x0 - 36, W.y1 + 2, W.x1 - W.x0 + 72, 24, 6, ol('#FFF8EC', 5));
  m += R(W.x0 - 70, W.y0 - 52, W.x1 - W.x0 + 140, 13, 6, ol('#5A3A2A', 4)) + CI(W.x0 - 74, W.y0 - 46, 11, ol('#FFC23A', 3.5)) + CI(W.x1 + 74, W.y0 - 46, 11, ol('#FFC23A', 3.5));
  const cs = Math.sin(t * 1.1) * 5;
  for (const [cx, d] of [[W.x0 - 30, 1], [W.x1 + 30, -1]]) {
    m += P(`M${cx - 52} ${W.y0 - 46} L${cx + 52} ${W.y0 - 46} Q${cx + 36 * d + 26} ${W.y0 + 190} ${cx + 44 * d + cs} ${W.y1 + 70} Q${cx} ${W.y1 + 86} ${cx - 44 * d + cs} ${W.y1 + 70} Q${cx - 30} ${W.y0 + 190} ${cx - 52} ${W.y0 - 46} Z`, ol('#3567D6', 6));
    m += P(`M${cx - 16} ${W.y0 - 38} Q${cx - 8} ${W.y0 + 190} ${cx + cs} ${W.y1 + 62} M${cx + 20} ${W.y0 - 38} Q${cx + 26} ${W.y0 + 190} ${cx + 26 * d + cs} ${W.y1 + 60}`, ln(5, '#244CA8'));
    m += P(`M${cx - 40 * d} ${W.y0 - 30} Q${cx - 30 * d} ${W.y0 + 100} ${cx - 36 * d} ${W.y0 + 230}`, ln(6, '#6F97F0', 0.7));
  }
  // day: soft light shaft + bright patch on the floor
  if (!nite) {
    const k = eve ? 0.6 : 1;
    m += poly([[W.x0 + 10, W.y0 + 10], [W.x1 - 10, W.y0 + 10], [880, 940], [330, 940]], { fill: 'url(#setsBeam)', opacity: f(0.35 * k) });
  }
  // floor
  m += R(XL, HR.base, XR - XL, YB - HR.base, 0, { fill: 'url(#setsHRFloor)' }) + floorBoards(HR.base, 1180, XL, XR, 9, '#8E5530', 3);
  if (!nite) m += poly([[300, 830], [820, 830], [900, 930], [250, 930]], { fill: '#FFE7B0', opacity: f(eve ? 0.12 : 0.2) });
  // rug (gamepad colours)
  m += E(860, 912, 470, 62, ol('#4E7FE0', 5)) + E(860, 910, 400, 46, { fill: 'none', stroke: '#8FB4FF', 'stroke-width': 8, 'stroke-dasharray': '26 14' });
  m += P(circD(1150, 900, 14) , ol('#5CDB6B', 3)) + CI(1186, 912, 14, ol('#FF4D5E', 3)) + CI(1114, 912, 14, ol('#3DA8FF', 3)) + CI(1150, 926, 14, ol('#FFD21F', 3));
  // laundry pile + backpack (left) + Mom's note
  m += P('M40 846 Q60 790 120 800 Q150 760 200 784 Q250 770 270 812 Q300 820 296 850 Z', ol('#3A6FD0', 5)) + P('M90 806 Q130 790 170 812 L200 846 L120 846 Z', ol('#5CDB6B', 4)) + P('M214 790 Q236 776 262 792 L250 840 L222 838 Z', ol('#FFFFFF', 4)) + P('M226 800 L250 806 M224 814 L248 820 M224 828 L248 834', ln(3, '#FF4D5E'));
  m += P('M-20 840 Q-30 700 40 690 Q90 690 96 760 L100 846 Z', ol('#FF8A2A', 5)) + R(0, 760, 66, 50, 10, ol('#E86F1E', 4)) + P('M10 700 Q30 660 66 700', ln(7, LINE));
  m += stickyNote(250, 690, -7, 'CLEAN\nROOM', { w: 76 });
  // shelf over the desk: participation trophy, game cases, cactus
  m += R(650, 318, 380, 16, 4, ol('#B9764A', 4)) + P('M680 334 L680 356 L702 334 M1000 334 L1000 356 L978 334', ln(6, '#7E4A2A'));
  m += G(P('M-22 -58 Q-22 -26 0 -22 Q22 -26 22 -58 Z', ol('#FFC23A', 4)) + P('M-22 -52 Q-38 -52 -34 -38 Q-30 -30 -18 -32 M22 -52 Q38 -52 34 -38 Q30 -30 18 -32', ln(4)) + R(-6, -22, 12, 10, 2, ol('#FFC23A', 3)) + R(-18, -12, 36, 12, 3, ol('#7E4A2A', 3)) + P('M10 -40 L22 -4 L16 -6 L12 2 Z', ol('#3DA8FF', 2)), 'translate(706 318)');
  m += R(752, 286, 18, 32, 3, ol('#FF4D5E', 3)) + R(772, 280, 18, 38, 3, ol('#3DA8FF', 3)) + R(792, 290, 18, 28, 3, ol('#5CDB6B', 3)) + R(812, 284, 18, 34, 3, ol('#FFC23A', 3));
  m += P('M900 318 L904 290 L936 290 L940 318 Z', ol('#E8603C', 4)) + R(910, 254, 20, 40, 10, ol('#5CB85A', 3.5)) + P('M910 272 L898 270 L898 256 M930 268 L942 262', ln(4, '#5CB85A'));
  m += G(R(-20, -40, 40, 40, 6, ol('#C9D1DD', 3.5)) + CI(-8, -26, 5, { fill: '#3DA8FF' }) + CI(8, -26, 5, { fill: '#3DA8FF' }) + R(-10, -12, 20, 4, 2, { fill: LINE }) + P('M0 -40 L0 -52', ln(3)) + CI(0, -54, 4, ol('#FF4D5E', 2)), 'translate(984 318)');
  // posters over the bed
  m += gamePoster('obby', 1268, 320, 200, 270, -3) + gamePoster('tower', 1510, 300, 210, 280, 2) + gamePoster('kart', 1720, 330, 170, 230, 4);
  // ---- desk (top y 680, feet y 814)
  const D = HR.desk, dh = 814 - D.top - 20;
  m += R(D.x0 + 18, D.top + 20, 160, dh, 8, ol('#C98A52', 5)) + R(D.x0 + 30, D.top + 32, 136, dh / 2 - 18, 6, ol('#D99A5C', 3.5)) + R(D.x0 + 30, D.top + 24 + dh / 2, 136, dh / 2 - 18, 6, ol('#D99A5C', 3.5));
  m += R(D.x0 + 86, D.top + 26 + dh / 4, 24, 8, 4, ol('#FFC23A', 2)) + R(D.x0 + 86, D.top + 18 + dh * 0.75, 24, 8, 4, ol('#FFC23A', 2));
  m += R(D.x1 - 40, D.top + 20, 22, dh, 5, ol('#C98A52', 5));
  m += R(D.x0, D.top - 12, D.x1 - D.x0, 16, 5, ol('#E8AE6E', 4)) + R(D.x0 - 4, D.top, D.x1 - D.x0 + 8, 22, 5, ol('#D99A5C', 5));
  // desk lamp (left)
  {
    const on = opts.lamp ?? eve;
    let l = E(0, 0, 30, 8, ol('#2A2D38', 4)) + P('M0 -4 L-16 -84 L28 -116', ln(13, LINE)) + P('M0 -4 L-16 -84 L28 -116', ln(6, '#3A3F4E')) + CI(-16, -84, 6, ol('#FFC23A', 2.5));
    l += G(P('M-18 -12 L18 -12 L30 18 L-30 18 Z', ol('#FF6A3D', 4)) + E(0, 19, 30, 6, ol(on ? '#FFF4B8' : '#E9D9A8', 3)), 'translate(36 -106) rotate(-30)');
    if (on) l += P('M38 -92 L130 22 L40 22 L14 -86 Z', { fill: '#FFF2B0', opacity: 0.2 });
    m += G(l, `translate(${D.x0 + 36} ${D.top - 10})`);
  }
  // keyboard, controller, mug of pencils, soda, mouse
  m += P(`M752 ${D.top - 10} L938 ${D.top - 10} L946 ${D.top + 2} L744 ${D.top + 2} Z`, { fill: 'url(#setsKeysDark)', stroke: LINE, 'stroke-width': 3 });
  m += E(980, D.top - 6, 14, 8, ol('#2A2D38', 3)) + E(978, D.top - 9, 5, 3, { fill: '#FF4D5E' });
  m += G(P('M-26 -2 Q-34 -22 -18 -24 L18 -24 Q34 -22 26 -2 Q18 6 10 -4 L-10 -4 Q-18 6 -26 -2 Z', ol('#3A3F4E', 3)) + CI(14, -16, 3, { fill: '#FF4D5E' }) + CI(20, -12, 3, { fill: '#5CDB6B' }) + P('M-18 -14 h8 M-14 -18 v8', ln(2.5, '#FFFFFF')), `translate(700 ${D.top - 6})`);
  m += R(1022, D.top - 54, 30, 44, 6, ol('#FF6A3D', 4)) + R(1024, D.top - 40, 26, 10, 0, { fill: '#FFFFFF', opacity: 0.6 }) + P(`M1030 ${D.top - 54} L1026 ${D.top - 80} M1040 ${D.top - 54} L1048 ${D.top - 76} M1046 ${D.top - 54} L1040 ${D.top - 84}`, ln(4, '#3DA8FF')) + P(`M1030 ${D.top - 54} L1026 ${D.top - 80}`, ln(4, '#FFC23A'));
  // monitor (3/4, turned toward the window) with the password note
  {
    let mon = P('M-116 -164 L114 -180 L114 -6 L-116 -14 Z', ol('#2A2D38', 6)) + P('M114 -180 L130 -172 L130 -10 L114 -6 Z', ol('#1B1D25', 5));
    mon += R(-14, -12, 26, 16, 3, ol('#2A2D38', 4)) + E(0, 6, 62, 9, ol('#2A2D38', 4));
    let scr;
    if (opts.monitorOff || (nite && opts.monitor === undefined)) scr = P('M-98 -150 L100 -162 L100 -18 L-98 -26 Z', { fill: '#14161E' }) + P('M-80 -150 L-30 -152 L-96 -60 Z', { fill: '#FFFFFF', opacity: 0.07 });
    else {
      const inner = opts.monitor !== undefined ? screenOf(opts.monitor, 200, 132)
        : R(-100, -66, 200, 132, 0, { fill: '#58B8FF' }) + P('M-100 30 Q-40 0 10 26 Q60 6 100 24 L100 66 L-100 66 Z', { fill: '#4CC35A' }) + CI(56, -36, 16, { fill: '#FFE45C' }) +
          R(-88, -54, 22, 20, 4, ol('#FFD34D', 2)) + R(-88, -24, 22, 20, 4, ol('#FF6A3D', 2)) + R(-88, 6, 22, 20, 4, ol('#B06BFF', 2)) + R(-100, 52, 200, 14, 0, { fill: '#1E2333', opacity: 0.85 }) + R(-96, 55, 10, 8, 2, { fill: '#3DA8FF' });
      scr = G(G(inner, 'translate(1 -90)'), null, { 'clip-path': 'url(#setsClipMon)' }) + P('M-98 -150 L100 -162 L100 -18 L-98 -26 Z', { fill: 'url(#setsShine)' });
    }
    mon += scr + P('M-98 -150 L100 -162 L100 -18 L-98 -26 Z', ln(3.5, '#0B0C10'));
    mon += stickyNote(76, -38, -7, opts.note ?? ['PASSWORD:', 'pancake', '123'], { w: 72, size: 12, col: '#FFE45C' });
    m += G(mon, tr(HR.mon.x, HR.mon.y, HR.mon.s));
  }
  // gaming chair (side view, facing the desk)
  m += P('M1046 738 L1046 790', ln(16, LINE)) + P('M1046 738 L1046 790', ln(8, '#6A6F80'));
  m += P('M990 812 L1046 790 L1102 812 M1046 790 L1046 816', ln(13, LINE)) + P('M990 812 L1046 790 L1102 812 M1046 790 L1046 816', ln(6, '#3A3F4E')) + CI(990, 816, 8, ol('#2A2D38', 3)) + CI(1102, 816, 8, ol('#2A2D38', 3)) + CI(1046, 820, 8, ol('#2A2D38', 3));
  m += R(970, 714, 146, 28, 12, ol('#D8262E', 5)) + R(980, 718, 116, 8, 4, { fill: '#FF6A6A', opacity: 0.7 });
  m += G(R(-26, -190, 56, 200, 24, ol('#D8262E', 5)) + R(-12, -176, 28, 172, 12, { fill: '#2A2D38' }) + R(-20, -184, 44, 34, 14, ol('#2A2D38', 3)), 'translate(1108 734) rotate(8)');
  // ---- bed (headboard right, mattress top y 716)
  const by = HR.bed;
  m += R(1786, by - 230, 84, 374, 18, ol('#B9764A', 6)) + R(1800, by - 212, 56, 150, 12, { fill: '#D99A5C' }) + CI(1828, by - 230, 22, ol('#B9764A', 5));
  m += R(1118, by - 96, 62, 240, 16, ol('#B9764A', 6)) + R(1130, by - 80, 38, 90, 10, { fill: '#D99A5C' });
  m += R(1150, by + 52, 664, 46, 10, ol('#A8693F', 5)) + R(1162, by + 96, 24, 38, 4, ol('#7E4A2A', 4)) + R(1774, by + 96, 24, 38, 4, ol('#7E4A2A', 4));
  m += R(1166, by - 12, 630, 76, 22, ol('#EEF3FF', 5)) + R(1176, by + 46, 610, 12, 6, { fill: '#C9D6F2' });
  m += P(`M1610 ${by} Q1606 ${by - 60} 1660 ${by - 64} L1742 ${by - 64} Q1778 ${by - 60} 1774 ${by} Q1742 ${by + 10} 1690 ${by + 8} Q1630 ${by + 10} 1610 ${by} Z`, ol('#FFFFFF', 5)) + P(`M1630 ${by - 14} Q1690 ${by} 1758 ${by - 16}`, ln(4, '#BFD0F2'));
  m += R(1240, by + 102, 90, 30, 6, ol('#E86F1E', 4)) + P(`M1340 ${by + 132} Q1350 ${by + 108} 1380 ${by + 110} L1412 ${by + 116} L1414 ${by + 132} Z`, ol('#FFFFFF', 4)) + P(`M1352 ${by + 124} L1408 ${by + 124}`, ln(3, '#FF4D5E'));
  // Mom's sticky notes, everywhere (opts.notes ramps 0..1)
  if (notes > 0) {
    const SP = [[470, 260, 8], [1600, 520, -6], [930, 400, 4], [1150, 470, -10], [120, 620, 6], [1460, 560, 9], [640, 520, -4], [1880, 400, 7], [760, 220, -8], [1330, 160, 5], [400, 740, -5], [1700, 140, -9], [80, 300, 3], [1040, 260, 10], [1220, 640, -3], [580, 380, 6]];
    const n = notes * SP.length;
    SP.forEach(([x, y, r], i) => {
      const k = clamp(n - i, 0, 1);
      if (k > 0) m += G(stickyNote(0, 0, r, MOM_NOTES[i % MOM_NOTES.length], { w: 70, col: NOTE_COLS[i % NOTE_COLS.length] }), `translate(${x} ${y}) scale(${f(ease.outBack(k))})`);
    });
  }
  // ---- front: blanket + laptop on the bed
  let fr = '';
  const bl = `M1150 ${by - 14} Q1380 ${by - 28} 1606 ${by - 14} L1620 ${by + 122} Q1580 ${by + 138} 1540 ${by + 122} Q1490 ${by + 142} 1440 ${by + 122} Q1390 ${by + 140} 1340 ${by + 122} Q1290 ${by + 140} 1240 ${by + 122} Q1190 ${by + 136} 1146 ${by + 120} Z`;
  fr += P(bl, ol('#2F5FC4', 6)) + P(bl, { fill: 'url(#setsHRQuilt)' });
  fr += P(`M1150 ${by - 14} Q1380 ${by - 28} 1606 ${by - 14} L1608 ${by + 10} Q1380 ${by - 4} 1150 ${by + 10} Z`, ol('#4F80E8', 4)) + P(`M1260 ${by + 24} Q1270 ${by + 70} 1256 ${by + 116} M1500 ${by + 22} Q1510 ${by + 70} 1500 ${by + 118}`, ln(4, '#234A9E', 0.8));
  let lap = '';
  if (laptopAt) {
    const L = HR_LAP[laptopAt] || HR_LAP.bed;
    const lapOff = !!opts.laptopOff;
    const g = opts.glow ?? (nite && !lapOff ? 1 : 0);
    lap = laptop(L.x, L.y, L.s, opts.laptop, { glow: g, off: lapOff, t });
    if (laptopAt === 'bed') fr += lap; else m += lap;
  }
  // ---- light
  let light = '';
  const lap0 = laptopAt ? (HR_LAP[laptopAt] || HR_LAP.bed) : null;
  const lapLit = lap0 && !opts.laptopOff;
  if (nite) {
    if (lapLit) light += darkPool(lap0.x, lap0.y - 296 * lap0.s, 300) + glowSpot(lap0.x, lap0.y - 100, 520, 'setsGlowGreen', 0.55 * (0.9 + 0.1 * Math.sin(t * 3.1)));
    else light += darkPool(355, 420, 280);
    light += glowSpot(355, 380, 300, 'setsGlowBlue', 0.45);
    if (opts.lamp) light += glowSpot(HR.desk.x0 + 80, HR.desk.top - 60, 320, 'setsGlowWarm', 0.7);
    light += P(STARS.map(([x, y, r]) => starD(x, y, r)).join(' '), { fill: '#D7FF8A', opacity: 0.9 }) + STARS.map(([x, y, r]) => glowSpot(x, y, r * 3.4, 'setsGlowGreen', 0.6)).join('');
  } else if (eve) light += cover('#FF7A3D', { opacity: 0.1 });
  const dustK = bool01(opts.floatDust);
  if (dustK > 0) {
    if (nite && lap0) light += motes(t, 26, lap0.x - 380, lap0.y - 520, 760, 560, '#9DFFC8', 0.85 * dustK, 3, 22);
    else light += motes(t, 24, 260, 230, 560, 640, '#FFF4C8', 0.8 * dustK, 5, 10);
  }
  return { bg, mid: m, front: fr, fg: '', light };
}
const heroRoom = makeSet(heroRoomLayers);

// ================================================================= 3. KITCHEN
// Retro family kitchen (butter-yellow gingham walls, coral cabinets, an aqua fridge). Flat front view; ceiling line
// y 74 (the pancake stack reaches it at opts.pancakes = 400); wall/floor seam y 790; counter top y 592.
// Left: window to the backyard over the sink; the breakfast TABLE in front-left (layers.front, top y ~808).
// Centre: the cream stove — frying pan with ONE pancake on the front-left burner (SPOTS.kitchen.pan); Granny stands
// at SPOTS.kitchen.stove. Right of it: the counter with the pancake stack (SPOTS.kitchen.stack). Right: the fridge
// (x 1320..1640; door hinge on the right edge) and the back door with a cat flap.
// opts: { time 'day'|'evening'|'night' (window), pancakes 0..400 (stack height; 400 = up to the ceiling), wind 0..1
//   (Granny's speed: curtains + notes flap, papers and streaks fly left->right, lamp swings, stack wobbles),
//   notes 0..1 (Mom's sticky notes appear everywhere; the fridge always has 4), fridgeOpen 0..1 (door swings open,
//   interior light on), panCake:false (empty pan), steam (default true) }
// layers.front = the table + the fridge door (so a hero teleported INSIDE the fridge — SPOTS.kitchen.fridge.inside,
// s .34 — is hidden when the door is closed). Stand line y 990 (FLOOR.kitchen).
const KC = { ceil: 74, base: 790, top: 592, win: { x0: 170, y0: 176, x1: 580, y1: 462 }, stove: { x0: 680, x1: 980 }, fr: { x0: 1320, x1: 1640, top: 140, split: 330, base: 806 }, stack: { x: 1140, base: 590 }, table: { x0: 110, x1: 650, top: 808 } };
def(lg('setsCalm', [[0, '#FFF0D6', 0], [0.25, '#FFF0D6', 0.32], [1, '#FFF0D6', 0.42]]));
def(lg('setsKCWall', [[0, '#FFF0BC'], [1, '#FFE08E']]));
def('<pattern id="setsKCGing" width="56" height="56" patternUnits="userSpaceOnUse"><rect width="28" height="56" fill="#FFFFFF" opacity="0.22"/><rect width="56" height="28" fill="#FFFFFF" opacity="0.22"/><rect width="28" height="28" fill="#F7C55A" opacity="0.14"/></pattern>');
def('<pattern id="setsKCSubway" width="80" height="40" patternUnits="userSpaceOnUse"><rect width="80" height="40" fill="#E2D6BC"/><rect x="2" y="2" width="76" height="16" rx="4" fill="#FFFAEE"/><rect x="-38" y="22" width="76" height="16" rx="4" fill="#FFFAEE"/><rect x="42" y="22" width="76" height="16" rx="4" fill="#FFFAEE"/><rect x="6" y="4" width="30" height="4" rx="2" fill="#FFFFFF"/></pattern>');
def('<pattern id="setsKCCloth" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#FFFFFF"/><rect width="20" height="40" fill="#F25C54" opacity="0.55"/><rect width="40" height="20" fill="#F25C54" opacity="0.55"/></pattern>');
def('<pattern id="setsPancakes" width="64" height="12" patternUnits="userSpaceOnUse" y="2"><rect width="64" height="12" fill="#F4B85E"/><rect y="9" width="64" height="3" fill="#B86E2C"/><rect y="0" width="64" height="2.5" fill="#FFD994"/></pattern>');
def(lg('setsKCFridge', [[0, '#A6E6F0'], [0.5, '#8ED8E6'], [1, '#74C6D8']], 1, 0));
def(lg('setsKCInside', [[0, '#F4FCFF'], [1, '#D2EEF8']]));
def(lg('setsKCSteel', [[0, '#E7ECF2'], [0.5, '#C2CAD6'], [1, '#9AA4B4']], 1, 0));

function catClock(x, y, s, t) {
  const tail = Math.sin(t * 3.2) * 18, eye = Math.sin(t * 3.2) * 5;
  let o = P(`M0 70 Q${f(tail * 0.6)} 110 ${f(tail)} 150`, ln(14, LINE)) + P(`M0 70 Q${f(tail * 0.6)} 110 ${f(tail)} 150`, ln(7, '#F28C28'));
  o += R(-36, -20, 72, 100, 30, ol('#F28C28', 5)) + CI(0, 36, 25, ol('#FFF6E2', 3.5));
  o += P(`M0 36 L0 18 M0 36 L${f(12 * Math.cos(t * 0.1))} ${f(36 + 12 * Math.sin(t * 0.1))}`, ln(3));
  o += P('M-38 -40 L-34 -70 L-14 -52 Z M38 -40 L34 -70 L14 -52 Z', ol('#F28C28', 4)) + E(0, -36, 42, 32, ol('#F28C28', 5));
  o += E(-15, -40, 10, 11, ol('#FFFFFF', 2.5)) + E(15, -40, 10, 11, ol('#FFFFFF', 2.5)) + CI(-15 + eye, -40, 4.5, { fill: LINE }) + CI(15 + eye, -40, 4.5, { fill: LINE });
  o += P('M-6 -26 Q0 -20 6 -26', ln(3)) + P('M-4 -30 L4 -30 L0 -26 Z', { fill: '#FF8FA3' }) + R(-26, 4, 52, 8, 4, { fill: '#F9B25A' });
  return G(o, tr(x, y, s));
}
// the pancake stack on a plate: base (x, y) = plate rim centre; h px tall; lean = top offset px
function pancakeStack(x, y, h, opts = {}) {
  const r = 64, lean = opts.lean || 0;
  let o = E(0, 6, 92, 16, ol('#FFFFFF', 5)) + E(0, 2, 70, 9, { fill: '#E9EEF6' });
  if (h > 0.5) {
    let L = '', Rr = '';
    const n = Math.max(1, Math.round(h / 12));
    for (let i = 0; i < n; i++) {
      const y0 = -i * (h / n), y1 = -(i + 1) * (h / n), bul = 4 + 3 * hash(i * 1.7);
      L += ` Q${f(-r - bul)} ${f((y0 + y1) / 2)} ${f(-r)} ${f(y1)}`;
      Rr = ` Q${f(r + bul)} ${f((y0 + y1) / 2)} ${f(r)} ${f(y0)}` + Rr;
    }
    const d = `M${-r} 0${L} L${r} ${f(-h)}${Rr.replace(/^ /, ' ')} Z`;
    let st = P(d, ol('#F4B85E', 5)) + P(d, { fill: 'url(#setsPancakes)' });
    st += E(0, -h, r, 11, ol('#FFD38A', 4)) + R(-16, -h - 18, 32, 18, 4, ol('#FFF2A8', 3)) + R(-12, -h - 16, 12, 5, 2, { fill: '#FFFFFF' });
    st += P(`M-30 ${f(-h + 4)} Q-40 ${f(-h + 30)} -36 ${f(-h + 46)} Q-30 ${f(-h + 54)} -26 ${f(-h + 40)} Q-22 ${f(-h + 20)} -14 ${f(-h + 8)} Z M22 ${f(-h + 6)} Q28 ${f(-h + 22)} 30 ${f(-h + 30)} Q36 ${f(-h + 36)} 38 ${f(-h + 24)} L36 ${f(-h + 4)} Z`, { fill: '#B9561E', stroke: LINE, 'stroke-width': 3, 'stroke-linejoin': 'round' });
    o += lean ? G(st, `skewX(${f(Math.atan2(lean, h) * -57.3)})`) : st;
  }
  return G(o, tr(x, y, opts.s || 1));
}
function fridgeItems(x0, x1, shelf, floor) {
  // milk + cake in the bottom compartment (room for the hero between them), jars/eggs/ketchup on the shelf
  let o = '';
  o += G(R(-26, -120, 52, 120, 4, ol('#FFFFFF', 4)) + P('M-26 -120 L0 -146 L26 -120 Z', ol('#FFFFFF', 4)) + R(-8, -152, 16, 10, 2, ol('#3DA8FF', 3)) + R(-26, -86, 52, 30, 0, { fill: '#3DA8FF' }) + TF('MILK', 0, -64, 15, '#FFFFFF'), `translate(${x0 + 36} ${floor})`);
  o += G(E(0, 0, 52, 9, ol('#FFFFFF', 3)) + R(-40, -58, 80, 56, 12, ol('#FFB3CF', 4)) + P('M-40 -46 Q-30 -36 -20 -46 Q-10 -36 0 -46 Q10 -36 20 -46 Q30 -36 40 -46', ln(4, '#FFFFFF')) + CI(0, -66, 9, ol('#E8243C', 3)) + P('M0 -75 Q4 -86 12 -88', ln(2.5)), `translate(${x1 - 52} ${floor})`);
  o += G(R(-18, -64, 36, 64, 6, ol('#E8243C', 3.5)) + R(-8, -78, 16, 16, 3, ol('#FFFFFF', 3)) + R(-18, -40, 36, 14, 0, { fill: '#FFFFFF', opacity: 0.8 }), `translate(${x0 + 34} ${shelf})`);
  o += G(R(-24, -54, 48, 54, 8, ol('#C9F2B0', 3.5)) + R(-26, -62, 52, 12, 4, ol('#E8B43A', 3)) + E(-6, -26, 7, 12, { fill: '#5CB85A' }) + E(8, -22, 7, 12, { fill: '#4CA84A' }), `translate(${x0 + 96} ${shelf})`);
  o += G(R(-46, -22, 92, 22, 4, ol('#D9B88A', 3.5)) + [-30, -10, 10, 30].map((ex) => E(ex, -24, 9, 11, ol('#FFF6E2', 2.5))).join(''), `translate(${(x0 + x1) / 2 + 40} ${shelf})`);
  return o;
}

function kitchenLayers(t, opts = {}) {
  const time = opts.time || 'day', nite = time === 'night', eve = time === 'evening';
  const wind = bool01(opts.wind), notes = bool01(opts.notes), open = bool01(opts.fridgeOpen);
  const W = KC.win, F = KC.fr, ST = KC.stove;
  const flap = (i, amp = 1) => wind > 0 ? Math.sin(t * 23 + i * 1.7) * 18 * wind * amp : 0;
  // ---- bg: backyard
  let bg = sky(t, time, (W.x0 + W.x1) / 2, (W.y0 + W.y1) / 2 - 20, W.x1 - W.x0, W.y1 - W.y0, { clouds: 2, stars: 16, sunX: 0.85, sunY: eve ? 0.6 : 0.2 });
  const gcol = nite ? '#1F3A3A' : eve ? '#8CAA5E' : '#79D46A';
  bg += tree(470, 520, 0.8, { col: nite ? '#1C3646' : eve ? '#6F8A52' : '#4CB65A', hi: nite ? '#284C60' : '#7CD978', trunk: nite ? '#3A2A3A' : '#8A5A33', sway: Math.sin(t * 0.9) * 1.5 + wind * 6 });
  let fence = '';
  for (let x = 140; x < 620; x += 40) fence += `M${x} 470 L${x} 408 L${x + 15} 394 L${x + 30} 408 L${x + 30} 470 Z `;
  bg += P(fence, ol(nite ? '#5A6098' : '#FFFFFF', 4)) + R(120, 440, 520, 12, 0, { fill: nite ? '#3A3F70' : '#E8E8F0' }) + R(100, 462, 560, 60, 0, { fill: gcol });
  bg += G(R(-4, 0, 8, 70, 2, ol('#8A5A33', 3)) + P('M-28 2 L0 -22 L28 2 Z', ol('#E8603C', 3)) + R(-20, 0, 40, 30, 4, ol('#FFC23A', 3)) + CI(0, 14, 6, { fill: LINE }), 'translate(300 400)');
  // ---- mid
  let m = '';
  m += R(XL, YT, XR - XL, KC.ceil - YT, 0, { fill: '#F6E7C4' }) + band(KC.ceil - 8, KC.ceil + 14, '#FFFFFF') + P(`M${XL} ${KC.ceil - 8} H${XR} M${XL} ${KC.ceil + 14} H${XR}`, ln(4, LINE, 0.85));
  const wallD = `M${XL} ${KC.ceil + 14} H${XR} V${KC.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`;
  m += P(wallD, { fill: 'url(#setsKCWall)', 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#setsKCGing)', 'fill-rule': 'evenodd' });
  // backsplash band
  m += R(XL, 478, 1330 - XL, KC.top - 478, 0, { fill: 'url(#setsKCSubway)' }) + P(`M${XL} 478 H1310`, ln(4, LINE, 0.6));
  // window frame + cafe curtains
  m += P(`M${W.x0 - 20} ${W.y0 - 20} H${W.x1 + 20} V${W.y1 + 8} H${W.x0 - 20} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: '#FFFFFF', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 });
  m += R(368, W.y0, 14, W.y1 - W.y0, 3, ol('#FFFFFF', 4)) + P(`M${W.x0 + 30} ${W.y0 + 140} L${W.x0 + 110} ${W.y0 + 12} L${W.x0 + 150} ${W.y0 + 12} L${W.x0 + 70} ${W.y0 + 140} Z`, { fill: '#FFFFFF', opacity: nite ? 0.08 : 0.3 });
  m += R(W.x0 - 34, W.y1 + 4, W.x1 - W.x0 + 68, 20, 6, ol('#FFFFFF', 5));
  // valance (scalloped) + cafe curtains on a rod (blown by the wind)
  let val = `M${W.x0 - 30} ${W.y0 - 30} H${W.x1 + 30} V${W.y0 + 22}`;
  for (let x = W.x1 + 30; x > W.x0 - 30; x -= 47) val += ` Q${x - 23} ${W.y0 + 48} ${x - 47} ${W.y0 + 22}`;
  m += P(val + ' Z', ol('url(#setsKCCloth)', 5));
  m += R(W.x0 - 26, 366, W.x1 - W.x0 + 52, 8, 4, ol('#C98A52', 3));
  for (const [x0, x1] of [[W.x0 - 10, 372], [378, W.x1 + 10]]) {
    const bl = wind * 100, sw = Math.sin(t * 1.3 + x0) * 4 + flap(x0, 0.4);
    const d = `M${x0} 370 L${x1} 370 L${f(x1 + bl + sw)} ${f(W.y1 + 2 - bl * 0.5)} Q${f((x0 + x1) / 2 + bl + sw)} ${f(W.y1 + 22 - bl * 0.4)} ${f(x0 + bl * 0.8 + sw)} ${f(W.y1 + 2 - bl * 0.3)} Z`;
    m += P(d, ol('url(#setsKCCloth)', 4));
  }
  // upper cabinet (left), shelf + cat clock (right of the hood)
  m += R(-60, 150, 200, 266, 10, ol('#F2784B', 6)) + R(-40, 170, 160, 226, 8, ol('#F58D64', 3.5)) + CI(110, 380, 8, ol('#FFF2C8', 3));
  m += R(1000, 396, 300, 14, 4, ol('#C98A52', 4)) + P('M1020 410 L1020 430 L1040 410 M1280 410 L1280 430 L1260 410', ln(5, '#8A5530'));
  m += R(1016, 342, 40, 54, 8, ol('#FFF6E2', 3.5)) + R(1012, 336, 48, 12, 4, ol('#3DA8FF', 3)) + TF('FLOUR', 1036, 376, 10, '#3A2A55');
  m += R(1068, 352, 36, 44, 8, ol('#FFF6E2', 3.5)) + R(1064, 346, 44, 10, 4, ol('#F2784B', 3)) + TF('SUGAR', 1086, 380, 9, '#3A2A55');
  m += R(1214, 330, 22, 66, 4, ol('#5CB85A', 3)) + R(1238, 324, 22, 72, 4, ol('#FFC23A', 3)) + R(1262, 336, 22, 60, 4, ol('#E8243C', 3));
  m += catClock(1250, 214, 0.9, t);
  // range hood + chimney
  m += R(785, KC.ceil + 10, 110, 190, 0, ol('url(#setsKCSteel)', 5)) + P('M700 340 L980 340 L930 262 L750 262 Z', ol('url(#setsKCSteel)', 6)) + R(694, 336, 292, 16, 4, ol('#AEB7C6', 4));
  // lower cabinets + counter
  const cab = (x0, x1) => {
    let o = R(x0, KC.top + 22, x1 - x0, 186, 6, ol('#F2784B', 6)) + R(x0, KC.top + 196, x1 - x0, 16, 0, { fill: '#C9563A' });
    const n = Math.max(1, Math.round((x1 - x0) / 150)), w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const cx = x0 + i * w;
      o += R(cx + 10, KC.top + 32, w - 20, 36, 6, ol('#F58D64', 3)) + R(cx + w / 2 - 14, KC.top + 46, 28, 8, 4, ol('#FFF2C8', 2));
      o += R(cx + 10, KC.top + 76, w - 20, 112, 8, ol('#F58D64', 3)) + CI(cx + (i % 2 ? 26 : w - 26), KC.top + 104, 6.5, ol('#FFF2C8', 2.5));
    }
    o += R(x0 - 10, KC.top - 4, x1 - x0 + 20, 16, 4, ol('#F2C48A', 4)) + R(x0 - 12, KC.top + 8, x1 - x0 + 24, 18, 4, ol('#D99A5C', 4));
    return o;
  };
  m += cab(-60, ST.x0 - 4) + cab(ST.x1 + 4, F.x0 - 14);
  // sink + faucet + dish rack
  m += E(375, KC.top + 2, 96, 12, ol('#C2CAD6', 4)) + E(375, KC.top + 2, 82, 7, { fill: '#8A94A6' });
  m += P(`M375 ${KC.top - 4} L375 ${KC.top - 62} Q375 ${KC.top - 84} 400 ${KC.top - 84} L418 ${KC.top - 84} L418 ${KC.top - 70}`, ln(15, LINE)) + P(`M375 ${KC.top - 4} L375 ${KC.top - 62} Q375 ${KC.top - 84} 400 ${KC.top - 84} L418 ${KC.top - 84} L418 ${KC.top - 70}`, ln(8, '#DCE3EC'));
  m += R(486, KC.top - 54, 120, 50, 6, { fill: 'none', stroke: '#9AA4B4', 'stroke-width': 4 }) + E(512, KC.top - 40, 12, 36, ol('#FFFFFF', 3)) + E(540, KC.top - 40, 12, 36, ol('#9FE0FF', 3)) + E(568, KC.top - 40, 12, 36, ol('#FFFFFF', 3));
  // stove
  m += R(ST.x0 + 6, 488, ST.x1 - ST.x0 - 12, 104, 10, ol('#FFF3DD', 6)) + R(ST.x0 + 100, 504, 100, 40, 6, ol('#2A2D38', 3.5)) + TF('7:42', (ST.x0 + ST.x1) / 2, 532, 22, '#5DFFA8');
  for (const kx of [ST.x0 + 40, ST.x0 + 76, ST.x1 - 76, ST.x1 - 40]) m += CI(kx, 528, 12, ol('#F2784B', 3.5)) + P(`M${kx} 528 L${kx} 518`, ln(3));
  m += R(ST.x0, KC.top - 6, ST.x1 - ST.x0, 18, 5, ol('#2A2D38', 5)) + R(ST.x0, KC.top + 10, ST.x1 - ST.x0, 200, 10, ol('#FFF3DD', 6));
  m += R(ST.x0 + 30, KC.top + 54, ST.x1 - ST.x0 - 60, 118, 12, ol('#2A2D38', 5)) + R(ST.x0 + 46, KC.top + 68, ST.x1 - ST.x0 - 92, 90, 8, { fill: '#3A3F4E' }) + R(ST.x0 + 56, KC.top + 74, 80, 12, 6, { fill: '#FFFFFF', opacity: 0.18 });
  m += R(ST.x0 + 40, KC.top + 30, ST.x1 - ST.x0 - 80, 14, 7, ol('url(#setsKCSteel)', 3.5));
  // dish towel on the handle (flaps)
  { const fl = flap(3) * 2; m += P(`M${ST.x0 + 190} ${KC.top + 36} L${ST.x0 + 238} ${KC.top + 36} L${f(ST.x0 + 240 + fl)} ${KC.top + 118} L${f(ST.x0 + 192 + fl)} ${KC.top + 118} Z`, ol('#3DA8FF', 4)) + P(`M${f(ST.x0 + 192 + fl * 0.8)} ${KC.top + 96} L${f(ST.x0 + 240 + fl * 0.8)} ${KC.top + 96}`, ln(4, '#FFFFFF')); }
  m += E(ST.x1 - 80, KC.top - 4, 40, 8, { fill: '#5A5F78' }) + E(ST.x1 - 80, KC.top - 6, 30, 5, { fill: '#2A2D38' });
  // frying pan + one pancake + steam
  {
    const px = 772, py = KC.top - 8;
    let pan = P(`M${px - 70} ${py - 6} L${px - 168} ${py - 22}`, ln(16, LINE)) + P(`M${px - 70} ${py - 6} L${px - 168} ${py - 22}`, ln(9, '#3A2A2A'));
    pan += P(`M${px - 72} ${py - 14} Q${px - 70} ${py + 12} ${px} ${py + 12} Q${px + 70} ${py + 12} ${px + 72} ${py - 14} Z`, ol('#2A2D38', 5)) + E(px, py - 14, 72, 14, ol('#3A3F4E', 5)) + E(px, py - 14, 60, 9, { fill: '#1E2028' });
    if (opts.panCake !== false) pan += E(px, py - 18, 44, 9, ol('#F4B85E', 3.5)) + E(px - 8, py - 21, 22, 3.5, { fill: '#FFD994' });
    m += pan;
    if (opts.steam !== false) {
      let st = '';
      for (let i = 0; i < 3; i++) {
        const ph = md(t * 0.55 + i / 3, 1), sx = px - 26 + i * 26, bend = wind * 160 * ph;
        st += P(`M${sx} ${py - 26} Q${f(sx - 14 + bend * 0.4)} ${f(py - 26 - 50 * ph)} ${f(sx + 6 + bend)} ${f(py - 30 - 110 * ph)}`, ln(7, '#FFFFFF', f(0.55 * (1 - ph))));
      }
      m += st;
    }
  }
  // the pancake stack (opts.pancakes 0..400)
  {
    const n = clamp(opts.pancakes ?? 0, 0, 400), maxH = KC.stack.base - KC.ceil - 26;
    const h = n <= 0 ? 0 : Math.min(maxH, n * 10, 40 + (maxH - 40) * n / 400);
    const lean = wind > 0 ? Math.sin(t * 6.5) * 26 * wind * Math.min(1, h / 300) : 0;
    m += pancakeStack(KC.stack.x, KC.stack.base, h, { lean });
  }
  // fridge body (doors in layers.front)
  m += R(F.x0, F.top, F.x1 - F.x0, F.base - F.top, 44, ol('#5FB4C8', 7));
  if (open > 0) {
    // interior (lit)
    m += R(F.x0 + 16, F.split + 12, F.x1 - F.x0 - 32, F.base - F.split - 30, 8, ol('url(#setsKCInside)', 4));
    m += glowSpot((F.x0 + F.x1) / 2, F.split + 40, 200, 'setsGlowWhite', 0.8 * open) + R(F.x0 + 16, 470, F.x1 - F.x0 - 32, 10, 3, { fill: '#BFE8F5', stroke: '#7FB8CC', 'stroke-width': 3 });
    m += fridgeItems(F.x0 + 22, F.x1 - 22, 470, F.base - 22);
    m += R(F.x0 + 16, F.base - 26, F.x1 - F.x0 - 32, 10, 3, { fill: '#BFE8F5' });
  }
  m += R(F.x0 + 8, F.base - 10, F.x1 - F.x0 - 16, 22, 6, ol('#4A5068', 4));
  // freezer door (always shut)
  m += P(`M${F.x0} ${F.split} L${F.x0} ${F.top + 44} Q${F.x0} ${F.top} ${F.x0 + 44} ${F.top} L${F.x1 - 44} ${F.top} Q${F.x1} ${F.top} ${F.x1} ${F.top + 44} L${F.x1} ${F.split} Z`, ol('url(#setsKCFridge)', 6));
  m += R(F.x0 + 18, F.top + 40, 14, 120, 7, ol('url(#setsKCSteel)', 3.5)) + R(F.x0 + 40, F.top + 14, 200, 10, 5, { fill: '#FFFFFF', opacity: 0.35 });
  m += G(R(-40, -12, 80, 24, 12, ol('url(#setsKCSteel)', 3)) + TF('FROSTY', 0, 6, 15, '#4A5068'), `translate(${(F.x0 + F.x1) / 2} ${F.top + 30})`);
  // back door with window + cat flap
  m += R(1700, 270, 220, 530, 8, ol('#FFF6E2', 6)) + R(1722, 296, 176, 200, 6, ol('#9FD8FF', 4)) + P('M1810 296 L1810 496 M1722 396 L1898 396', ln(8, '#FFF6E2')) + R(1722, 296, 176, 200, 6, ln(4));
  m += R(1726, 540, 168, 160, 8, { fill: 'none', stroke: '#E8D9B8', 'stroke-width': 5 }) + CI(1720 + 176, 560, 9, ol('#FFC23A', 3));
  m += R(1772, 718, 76, 60, 10, ol('#E8D9B8', 4)) + R(1778, 724, 64, 48, 8, { fill: '#C9B88A' }) + G(TF('PANCAKE', 0, 0, 11, '#6A5A3A'), 'translate(1810 754)');
  // floor: perspective checker (one path)
  m += band(KC.base, YB, '#FFF0D6');
  {
    const vx = 960, vy = 300, rows = [KC.base, 812, 838, 870, 910, 958, 1018, 1092, 1190, 1320];
    const X = (xs, y) => vx + (xs - vx) * (y - vy) / (KC.base - vy);
    let d = '';
    for (let r = 0; r < rows.length - 1; r++) for (let c = -14; c < 34; c++) {
      if ((r + c) % 2) continue;
      const a = c * 70 - 30, b = a + 70, y0 = rows[r], y1 = rows[r + 1];
      d += quad([[X(a, y0), y0], [X(b, y0), y0], [X(b, y1), y1], [X(a, y1), y1]]);
    }
    m += P(d, { fill: '#F4AE78' }) + R(XL, KC.base - 2, XR - XL, 6, 0, { fill: '#C9763A', opacity: 0.5 }) + R(XL, 930, XR - XL, YB - 930, 0, { fill: 'url(#setsCalm)' });
  }
  if (!nite) m += poly([[W.x0 + 10, W.y1], [W.x1 - 10, W.y1], [W.x1 + 220, 1040], [W.x0 + 40, 1040]], { fill: 'url(#setsBeam)', opacity: eve ? 0.18 : 0.3 });
  if (open > 0) m += E((F.x0 + F.x1) / 2 - 20, 880, 300 * open, 50, { fill: '#E9FBFF', opacity: f(0.35 * open) });
  // chairs behind the table (backs)
  for (const cx of [230, 530]) m += R(cx - 60, 640, 120, 170, 22, ol('#3DA8D8', 5)) + R(cx - 42, 658, 84, 60, 14, { fill: '#7FCBEB' }) + R(cx - 50, 724, 100, 12, 6, { fill: '#2C8AB8' });
  // ---- Mom's notes (the fridge always has some)
  const FRIDGE_NOTES = [[F.x0 + 80, F.split + 70, -6, 'MILK!'], [F.x0 + 210, F.split + 120, 5, 'NO CATS\nON TABLE'], [F.x0 + 110, F.split + 230, 4, 'FEED\nCAT'], [F.x0 + 240, F.top + 110, -4, 'WHY']];
  const SPN = [[60, 260, -6], [900, 300, 5], [1140, 450, -8], [500, 540, 6], [1460, 90 + 60, 3], [760, 660, -4], [1820, 340, 8], [300, 690, 7], [1060, 690, -6], [640, 220, 4], [1180, 560, 10], [100, 660, -9], [840, 110, -3], [1780, 600, 5], [1230, 300, -5], [430, 300, 8], [1590, 720, -7], [720, 400, 6], [180, 520, 4], [1880, 160, -6], [960, 420, 9], [350, 120, -4], [1640, 260, 6], [1010, 140, -8]];
  const noteAt = (x, y, r, txt, i, k = 1) => {
    if (k <= 0) return '';
    const lift = wind > 0.55 && hash(i * 4.3) < (wind - 0.55) * 1.6;
    let dx = 0, dy = 0, rr = r + flap(i);
    if (lift) { const ph = md(t * 1.6 + hash(i * 2.1), 1); dx = ph * 1400; dy = -ph * 300 + Math.sin(ph * 9) * 40; rr += ph * 700; }
    return G(stickyNote(0, 0, rr, txt, { w: 70, col: NOTE_COLS[i % NOTE_COLS.length] }), `translate(${f(x + dx)} ${f(y + dy)}) scale(${f(ease.outBack(k))})`);
  };
  let fridgeNotes = '';
  FRIDGE_NOTES.forEach(([x, y, r, txt], i) => {
    if (i < 3) fridgeNotes += noteAt(x, y, r, txt, i);
    else m += noteAt(x, y, r, txt, i);
  });
  // magnets + kid drawing on the fridge door
  fridgeNotes += G(R(-50, -40, 100, 80, 3, ol('#FFFFFF', 3)) + CI(-20, -6, 12, ol('#FF8A2A', 2.5)) + R(-28, 6, 16, 24, 2, ol('#E8243C', 2)) + CI(16, -2, 10, ol('#FFE0C0', 2)) + R(10, 8, 12, 22, 2, ol('#3DA8FF', 2)) + CI(30, -30, 8, { fill: '#FFD34D' }) + CI(0, -38, 6, ol('#FF4D5E', 2)), `translate(${F.x0 + 230} ${F.split + 290}) rotate(3)`);
  if (notes > 0) {
    const n = notes * SPN.length;
    SPN.forEach(([x, y, r], i) => { m += noteAt(x, y, r, MOM_NOTES[(i + 3) % MOM_NOTES.length], i + 4, clamp(n - i, 0, 1)); });
  }
  // ---- front: table + fridge door
  let fr = '';
  {
    const T0 = KC.table;
    fr += R(T0.x0 + 30, T0.top + 30, 20, 130, 4, ol('#B9764A', 4)) + R(T0.x1 - 50, T0.top + 30, 20, 130, 4, ol('#B9764A', 4));
    let cl = `M${T0.x0 - 14} ${T0.top - 6} L${T0.x1 + 14} ${T0.top - 6} L${T0.x1 + 22} ${T0.top + 74}`;
    for (let x = T0.x1 + 22; x > T0.x0 - 22; x -= 56) cl += ` Q${x - 28} ${T0.top + 92 + flap(x, 0.3)} ${x - 56} ${T0.top + 74}`;
    fr += P(cl + ' Z', ol('url(#setsKCCloth)', 5)) + P(`M${T0.x0 - 14} ${T0.top - 6} L${T0.x1 + 14} ${T0.top - 6} L${T0.x1 + 10} ${T0.top + 8} L${T0.x0 - 10} ${T0.top + 8} Z`, { fill: '#000', opacity: 0.08 });
    // syrup, fruit bowl, milk glass, Dad's mug
    fr += G(R(-18, -66, 36, 66, 10, ol('#B9561E', 4)) + R(-10, -86, 20, 22, 4, ol('#E8243C', 3)) + R(-18, -44, 36, 18, 0, { fill: '#FFF2C8', opacity: 0.8 }), `translate(${T0.x0 + 90} ${T0.top - 4})`);
    fr += G(P('M-56 -30 Q-56 0 0 0 Q56 0 56 -30 Z', ol('#3DA8D8', 4)) + CI(-26, -36, 18, ol('#FF4D5E', 3)) + CI(4, -42, 18, ol('#FFC23A', 3)) + CI(30, -34, 16, ol('#5CB85A', 3)) + P('M4 -60 Q10 -70 18 -70', ln(3)), `translate(${T0.x0 + 250} ${T0.top - 4})`);
    fr += G(R(-16, -56, 32, 56, 6, ol('#FFFFFF', 3.5)) + R(-12, -40, 24, 36, 4, { fill: '#F4F6FF' }), `translate(${T0.x0 + 380} ${T0.top - 4})`);
    fr += G(R(-22, -44, 44, 44, 8, ol('#2A2D38', 3.5)) + P('M22 -34 Q38 -30 22 -14', ln(5)) + TF('#1', 0, -16, 16, '#FFC23A'), `translate(${T0.x0 + 460} ${T0.top - 4})`);
  }
  // fridge door: hinge on the right edge; opens toward the camera
  {
    const th = open * 112 * Math.PI / 180, c = Math.cos(th), sn = Math.sin(th);
    const hx0 = F.x1, w = F.x1 - F.x0, top = F.split, bot = F.base - 12;
    const xf = hx0 - w * c, grow = 0.12 * sn * (bot - top);
    const doorFront = (inner) => {
      // the outer face (visible while the door is less than 90 degrees open)
      if (c <= 0.02) return '';
      const sx = c;
      let o = R(F.x0, top, w, bot - top, 30, ol('url(#setsKCFridge)', 6)) + R(F.x0 + 18, top + 40, 14, 170, 7, ol('url(#setsKCSteel)', 3.5)) + R(F.x0 + 44, top + 14, 220, 10, 5, { fill: '#FFFFFF', opacity: 0.32 });
      o += inner;
      const cy = (top + bot) / 2;
      return G(o, `translate(${f(hx0)} ${f(cy)}) scale(${f(sx)} ${f(1 + 0.12 * sn)}) translate(${f(-hx0)} ${f(-cy)})`);
    };
    if (open <= 0) fr += R(F.x0, top, w, bot - top, 30, ol('url(#setsKCFridge)', 6)) + R(F.x0 + 18, top + 40, 14, 170, 7, ol('url(#setsKCSteel)', 3.5)) + R(F.x0 + 44, top + 14, 220, 10, 5, { fill: '#FFFFFF', opacity: 0.32 }) + fridgeNotes;
    else {
      // door edge (thickness) + inner face with door shelves past 90 degrees
      const edge = 26 * sn;
      if (c > 0.02) {
        fr += doorFront(fridgeNotes);
        fr += poly([[xf, top - grow * 0.5], [xf - edge, top - grow * 0.3], [xf - edge, bot + grow * 0.3], [xf, bot + grow * 0.5]], ol('#5FB4C8', 4));
      } else {
        const iw = -c * w;
        fr += poly([[hx0, top], [hx0 + iw, top - grow * 0.6], [hx0 + iw, bot + grow * 0.6], [hx0, bot]], ol('#EAF6FA', 6));
        for (let i = 0; i < 3; i++) {
          const yy = lerp(top, bot, 0.3 + i * 0.25);
          fr += P(`M${hx0 + 6} ${f(yy)} L${f(hx0 + iw - 6)} ${f(yy + (i - 1) * 4)}`, ln(8, '#BFE0EA')) + R(hx0 + 14, yy - 46, Math.max(8, iw * 0.22), 44, 5, ol(['#FFE45C', '#E8243C', '#9FF0A8'][i], 3)) + R(hx0 + 18 + iw * 0.3, yy - 56, Math.max(8, iw * 0.2), 54, 5, ol(['#FFFFFF', '#FFB13B', '#3DA8FF'][i], 3));
        }
        fr += poly([[hx0 + iw, top - grow * 0.6], [hx0 + iw + edge * 0.5, top - grow * 0.5], [hx0 + iw + edge * 0.5, bot + grow * 0.5], [hx0 + iw, bot + grow * 0.6]], ol('#5FB4C8', 4));
      }
    }
  }
  // ---- wind fx: streaks, flying papers, swinging lamp
  let fg = '';
  {
    const sw = wind > 0 ? Math.sin(t * 9) * 26 * wind : Math.sin(t * 1.2) * 2;
    let l = P('M0 0 L0 150', ln(4, '#3A3F4E')) + P('M-60 210 L-34 150 L34 150 L60 210 Z', ol('#F2784B', 5)) + E(0, 210, 60, 10, ol('#FFF4B8', 4)) + R(-10, 140, 20, 12, 3, ol('#3A3F4E', 3));
    m += G(l, `translate(380 ${KC.ceil + 14}) rotate(${f(sw)})`);
  }
  if (wind > 0) {
    let d = '';
    for (let i = 0; i < 12; i++) {
      const y = 140 + hash(i * 3.7) * 780, len = 260 + hash(i * 1.3) * 420;
      const x = md(t * 2600 * (0.7 + 0.6 * hash(i * 5.1)) + hash(i * 9.1) * 3000, 3200) - 700;
      d += `M${f(x)} ${f(y)} L${f(x + len)} ${f(y)} `;
    }
    fg += P(d, ln(9, '#FFFFFF', 0.55 * wind));
    for (let i = 0; i < 7; i++) {
      const ph = md(t * (0.9 + 0.5 * hash(i * 3.3)) + hash(i * 7.7), 1);
      const x = -200 + ph * 2400, y = 200 + hash(i * 2.9) * 600 + Math.sin(ph * 12 + i) * 60;
      fg += G(R(-30, -38, 60, 76, 3, ol(i % 3 ? '#FFFFFF' : '#FFE45C', 3)) + P('M-18 -18 H18 M-18 -4 H14 M-18 10 H16', ln(3, '#9AA4B4')), tr(x, y, 0.9, ph * 900 + i * 40), { opacity: f(clamp(wind * 1.4, 0, 1)) });
    }
  }
  let light = '';
  if (nite) light = darkPool(380, 420, 520, 0.85) + glowSpot(380, 300, 360, 'setsGlowWarm', 0.5) + glowSpot((F.x0 + F.x1) / 2, 560, 380, 'setsGlowBlue', 0.8 * open);
  else if (eve) light = cover('#FF7A3D', { opacity: 0.09 });
  return { bg, mid: m, front: fr, fg, light };
}
const kitchen = makeSet(kitchenLayers);

// ---------------------------------------------------------------- 3b. inside the fridge (close-up)
// fridgeInside(t, opts): the camera looks into the open fridge. Glass shelf y 488; the hero stands squeezed in the
// bottom compartment between the milk and the cake: SPOTS.fridgeInside.hero {x 960, y 984, s .5} (hair touches the
// shelf). opts: { dark 0..1 (door closed: the light goes off; layers.light darkens everything incl. the hero —
//   a thin light line stays at the door seal), cake 0..1 (eaten: 0 whole .. 1 crumbs), chill (cold mist, default true) }
// layers.front = shelf lip + the crisper drawer (bottom, calm) — draw after the hero.
def(lg('setsFrInWall', [[0, '#FFFFFF'], [0.5, '#E6F6FD'], [1, '#C9E6F2']]));
def(lg('setsFrInSide', [[0, '#B6DCEA'], [1, '#DDF2FA']], 1, 0));
function fridgeInsideLayers(t, opts = {}) {
  const dark = bool01(opts.dark), eaten = bool01(opts.cake);
  const SH = 488;
  let m = cover('#CDE9F4') + R(160, -40, 1600, 1160, 0, { fill: 'url(#setsFrInWall)' });
  // side walls in perspective + shelf rails
  m += poly([[-200, -200], [160, 60], [160, 1000], [-200, 1300]], { fill: 'url(#setsFrInSide)', stroke: LINE, 'stroke-width': 6 }) + poly([[2120, -200], [1760, 60], [1760, 1000], [2120, 1300]], { fill: 'url(#setsFrInSide)', stroke: LINE, 'stroke-width': 6 });
  m += P('M0 300 L160 330 M0 720 L160 700 M1920 300 L1760 330 M1920 720 L1760 700', ln(10, '#9FC6D6'));
  m += P('M160 60 L1760 60', ln(5, LINE, 0.5)) + glowSpot(960, 40, 520, 'setsGlowWhite', 0.9) + R(890, 24, 140, 30, 12, ol('#FFFFFF', 4));
  m += P('M300 140 L300 440 M1620 140 L1620 440', ln(6, '#D9EEF6'));
  // top compartment: ketchup, pickles, eggs, butter, Dad's leftovers
  m += G(R(-40, -150, 80, 150, 16, ol('#E8243C', 5)) + R(-20, -186, 40, 40, 8, ol('#FFFFFF', 4)) + R(-40, -96, 80, 34, 0, { fill: '#FFFFFF', opacity: 0.85 }) + TF('KETCHUP', 0, -73, 15, '#E8243C'), `translate(400 ${SH})`);
  m += G(R(-60, -170, 120, 170, 18, ol('#CFF5B0', 5)) + R(-66, -190, 132, 30, 8, ol('#E8B43A', 4)) + E(-20, -80, 16, 40, ol('#5CB85A', 3)) + E(22, -96, 16, 40, ol('#4CA84A', 3)) + E(0, -40, 14, 30, ol('#6CC86A', 3)), `translate(620 ${SH})`);
  m += G(R(-120, -50, 240, 50, 8, ol('#D9B88A', 5)) + [-84, -28, 28, 84].map((ex) => E(ex, -56, 22, 26, ol('#FFF6E2', 4))).join(''), `translate(940 ${SH})`);
  m += G(R(-110, -110, 220, 110, 14, ol('#FFFFFF', 5)) + R(-110, -110, 220, 26, 10, ol('#3DA8D8', 4)) + stickyNote(30, -50, 6, "DAD'S.\nDO NOT\nEAT.", { w: 86, size: 15 }), `translate(1300 ${SH})`);
  m += G(R(-56, -40, 112, 40, 6, ol('#FFF2A8', 4)) + R(-56, -40, 112, 12, 4, { fill: '#FFFFFF', opacity: 0.6 }), `translate(1560 ${SH})`);
  // bottom compartment: milk (left) — room for the hero — cake (right)
  m += G(R(-90, -340, 180, 340, 8, ol('#FFFFFF', 6)) + P('M-90 -340 L0 -400 L90 -340 Z', ol('#FFFFFF', 6)) + R(-30, -414, 60, 30, 6, ol('#3DA8FF', 4)) +
    R(-90, -250, 180, 110, 0, { fill: '#3DA8FF' }) + T('MILK', 0, -180, 56, '#FFFFFF', OUTX(6)) + P('M-60 -310 q14 -16 30 0 q-6 18 -30 0 Z M30 -100 q20 -14 36 4 q-14 20 -36 -4 Z', { fill: LINE, opacity: 0.85 }), 'translate(470 984)');
  {
    let c = E(0, 0, 200, 30, ol('#FFFFFF', 6)) + E(0, -6, 170, 18, { fill: '#EEF3FF' });
    const cw = 150, chh = 190, xr = cw - 2 * cw * eaten;   // eaten from the right: xr = where the cut face is
    if (xr > -cw + 8) {
      c += P(`M${-cw} -10 L${-cw} ${-chh + 20} Q${-cw} ${-chh - 10} ${-cw + 30} ${-chh - 10} L${f(Math.min(xr, cw - 30))} ${-chh - 10} ${xr >= cw - 1 ? `Q${cw} ${-chh - 10} ${cw} ${-chh + 20}` : `L${f(xr)} ${-chh - 10}`} L${f(xr)} -10 Z`, ol('#FFB3CF', 6));
      c += P(`M${-cw} ${-chh * 0.55 - 10} L${f(xr)} ${-chh * 0.55 - 10}`, ln(18, '#FFFFFF'));
      let drip = `M${-cw + 4} ${-chh + 6}`;
      for (let x = -cw + 4; x < xr - 30; x += 46) drip += ` Q${x + 12} ${-chh + 40} ${x + 23} ${-chh + 14} Q${x + 34} ${-chh + 30} ${x + 46} ${-chh + 6}`;
      c += P(drip, ln(9, '#FFFFFF'));
      if (xr < cw - 1) c += R(xr - 26, -chh - 10, 26, chh, 0, { fill: '#F7D9A8', stroke: LINE, 'stroke-width': 5 }) + P(`M${f(xr - 26)} ${-chh * 0.55 - 10} L${f(xr)} ${-chh * 0.55 - 10} M${f(xr - 26)} ${-chh * 0.25} L${f(xr)} ${-chh * 0.25}`, ln(12, '#FFFFFF'));
      if (eaten < 0.35) c += CI(-30, -chh - 30, 22, ol('#E8243C', 4)) + P(`M-30 ${-chh - 52} Q-20 ${-chh - 80} 0 ${-chh - 82}`, ln(4));
    }
    if (eaten > 0) c += P(`M${f(cw - 40)} -10 l12 -10 l8 10 Z M${f(cw - 90)} -12 l10 -8 l8 8 Z M${f(cw - 10)} -6 l8 -8 l6 8 Z`, { fill: '#F7D9A8', stroke: LINE, 'stroke-width': 3, opacity: f(Math.min(1, eaten * 3)) });
    m += G(c, 'translate(1450 984)');
  }
  // front: shelf lip + crisper drawer
  let fr = R(150, SH - 4, 1620, 22, 6, { fill: '#BFE8F5', stroke: LINE, 'stroke-width': 5, opacity: 0.92 }) + R(170, SH, 1580, 6, 3, { fill: '#FFFFFF', opacity: 0.8 });
  fr += R(140, 984, 1640, 220, 18, { fill: '#DFF4FA', stroke: LINE, 'stroke-width': 6, opacity: 0.94 }) + R(860, 1000, 200, 26, 13, ol('#BFE0EA', 4));
  fr += P('M260 1060 Q300 1010 340 1060 M420 1070 Q470 1000 520 1070 M1400 1060 l40 -50 l20 10 l-40 50 Z M1500 1066 l40 -50 l20 10 l-40 50 Z', { fill: '#9FDA8A', opacity: 0.6, stroke: '#5CA84A', 'stroke-width': 4 });
  let light = '';
  if (opts.chill !== false) light += motes(t, 18, 200, 100, 1520, 900, '#FFFFFF', 0.55, 7, 12);
  if (dark > 0) light += cover('#04060E', { opacity: f(0.94 * dark) }) + (dark > 0.5 ? R(1748, 80, 8, 900, 4, { fill: '#BFEFFF', opacity: f(0.7 * (dark - 0.5) * 2) }) : '');
  return { bg: '', mid: m, front: fr, fg: '', light };
}
const fridgeInside = makeSet(fridgeInsideLayers);

// ================================================================= 10. VIDEO CALL (Dad's meetings)
// videoCall(x, y, w, h, t, opts): a video-call app window CENTRED on (x, y), w x h (any size; default 960x600).
// Big stage tile = the boss; a strip of 3 small tiles at right: Dad's self view ("Dave"), Kevin (cat filter), Linda
// (camera off); toolbar at the bottom (mic, camera, share, LEAVE).
// opts: { boss (svg|fn(w,h) replaces the default boss bust), bossFace 'bored'|'amazed'|'confused', mouth 0..1 (boss talks),
//   speaking (green ring on the boss tile; default when mouth > 0), self (svg|fn for Dad's tile), selfSky (Dad's tile
//   shows open sky + a tree top: he's outside!), muted (red mic + "You're muted" bubble; 0..1 pops it), title, timer,
//   frozen (the intern's tile spins), tiles: [names of the 3 side tiles] }
def(lg('setsVcOffice', [[0, '#E6EEF8'], [1, '#C9D6E6']]));
def(lg('setsVcSky', [[0, '#5DB2FF'], [1, '#D6F0FF']]));
function bossBust(t, opts = {}) {
  return (w, h) => {
    const k = Math.max(w / 400, h / 300);
    const face = opts.bossFace || 'bored', mo = clamp(opts.mouth || 0, 0, 1);
    let o = R(-w / 2, -h / 2, w, h, 0, { fill: 'url(#setsVcOffice)' });
    let b = R(-190, -130, 120, 150, 6, ol('#FFFFFF', 4)) + P('M-186 -110 H-74 M-186 -86 H-74 M-186 -62 H-74 M-186 -38 H-74 M-186 -14 H-74', ln(5, '#B9C6D8'));
    b += R(96, -120, 90, 66, 4, ol('#FFE45C', 3)) + T('TEAM', 141, -90, 20, '#3A2A55') + T('WORK', 141, -66, 20, '#3A2A55');
    b += P('M150 150 L162 60 L206 60 L218 150 Z', ol('#E8603C', 4)) + P('M184 60 Q160 10 176 -20 M184 60 Q196 0 222 -10 M184 60 Q212 30 230 34', ln(10, '#4CB65A'));
    b += P('M-170 160 Q-170 64 -64 54 L64 54 Q170 64 170 160 Z', ol('#2E3A5A', 5)) + P('M-40 56 L0 118 L40 56 Z', ol('#FFFFFF', 4)) + P('M-11 64 L11 64 L15 124 L0 140 L-15 124 Z', ol('#D8262E', 3));
    b += R(-26, 30, 52, 32, 6, ol('#EDBE92', 4));
    b += R(-76, -118, 152, 156, 30, ol('#F2C9A0', 5)) + R(-84, -72, 26, 64, 10, ol('#C3C8D2', 3.5)) + R(58, -72, 26, 64, 10, ol('#C3C8D2', 3.5)) + P('M-60 -112 Q0 -126 60 -112', ln(5, '#E2B286'));
    const brow = face === 'amazed' ? -16 : face === 'confused' ? -8 : 0;
    b += P(`M-52 ${-58 + brow} L-18 ${-54 + brow} M18 ${-54 + (face === 'confused' ? 8 : brow)} L52 ${-58 + (face === 'confused' ? 12 : brow)}`, ln(8, '#8A8F9C'));
    if (face === 'amazed') b += E(-34, -30, 15, 18, ol('#FFFFFF', 3.5)) + E(34, -30, 15, 18, ol('#FFFFFF', 3.5)) + CI(-34, -28, 6, { fill: LINE }) + CI(34, -28, 6, { fill: LINE });
    else b += E(-34, -30, 15, 14, ol('#FFFFFF', 3.5)) + E(34, -30, 15, 14, ol('#FFFFFF', 3.5)) + CI(-32, -28, 5, { fill: LINE }) + CI(36, -28, 5, { fill: LINE }) + P('M-50 -34 L-18 -34 M18 -34 L50 -34', ln(6, '#F2C9A0')) + P('M-50 -32 L-18 -32 M18 -32 L50 -32', ln(3.5));
    b += R(-56, -40, 44, 26, 8, { fill: 'none', stroke: LINE, 'stroke-width': 3.5 }) + R(12, -40, 44, 26, 8, { fill: 'none', stroke: LINE, 'stroke-width': 3.5 }) + P('M-12 -28 L12 -28', ln(3.5));
    const mh = face === 'amazed' ? 10 + mo * 10 : mo * 14;
    b += mh > 1 ? E(0, 16, 16 + (face === 'amazed' ? 6 : 0), mh, ol('#7A2A3A', 3.5)) : P(face === 'confused' ? 'M-16 18 Q-8 12 0 18 Q8 24 16 16' : 'M-16 18 L16 18', ln(4));
    b += P('M-42 4 Q-22 -8 0 2 Q22 -8 42 4 Q22 14 0 8 Q-22 14 -42 4 Z', ol('#A3A9B6', 3.5));
    b += G(R(-24, -40, 48, 46, 8, ol('#FFFFFF', 4)) + P('M24 -30 Q44 -26 24 -10', ln(5)) + TF('BOSS', 0, -12, 14, '#2E3A5A'), 'translate(150 96)');
    o += G(b, `translate(0 ${f(h * 0.06)}) scale(${f(k)})`);
    return o;
  };
}
function vcAvatar(w, h, name, col) {
  const r = Math.min(w, h) * 0.22;
  return R(-w / 2, -h / 2, w, h, 0, { fill: '#2A3042' }) + CI(0, -h * 0.05, r, ol(col, Math.max(2, r * 0.06))) + T(name[0], 0, -h * 0.05 + r * 0.38, r * 1.1, '#FFFFFF');
}
function videoCall(x, y, w = 960, h = 600, t = 0, opts = {}) {
  const k = Math.min(w / 960, h / 600), x0 = -w / 2, y0 = -h / 2;
  const bar = 46 * k, tool = 76 * k, pad = 12 * k, side = Math.max(120 * k, w * 0.25);
  const lw = Math.max(2, 5 * k);
  let o = R(x0 + 8 * k, y0 + 12 * k, w, h, 22 * k, { fill: '#000', opacity: 0.25 }) + R(x0, y0, w, h, 22 * k, ol('#161A26', lw * 1.3));
  o += R(x0, y0, w, bar, 22 * k, { fill: '#262B3B' }) + R(x0, y0 + bar - 12 * k, w, 12 * k, 0, { fill: '#262B3B' });
  o += CI(x0 + 26 * k, y0 + bar / 2, 7 * k, { fill: '#FF5A5A' }) + CI(x0 + 48 * k, y0 + bar / 2, 7 * k, { fill: '#FFC23A' }) + CI(x0 + 70 * k, y0 + bar / 2, 7 * k, { fill: '#3DFF9A' });
  o += TF(opts.title || 'Weekly Sync', 0, y0 + bar * 0.66, 22 * k, '#E9EDF5');
  o += CI(x0 + w - 120 * k, y0 + bar / 2, 7 * k, { fill: '#FF3B4E', opacity: Math.floor(t * 1.5) % 2 ? 0.4 : 1 }) + TF(`REC ${opts.timer || '47:12'}`, x0 + w - 106 * k, y0 + bar * 0.66, 18 * k, '#C9D1E0', { 'text-anchor': 'start' });
  const tile = (tx, ty, tw, th, content, label, ring) => {
    const id = S.uid('setsVc');
    let tt = S.clipDef(id, R(tx, ty, tw, th, 12 * k));
    tt += G(G(screenOf(content, tw, th), `translate(${f(tx + tw / 2)} ${f(ty + th / 2)})`), null, { 'clip-path': `url(#${id})` });
    tt += R(tx, ty, tw, th, 12 * k, { fill: 'none', stroke: ring ? '#3DFF9A' : '#3A4258', 'stroke-width': ring ? lw * 1.2 : lw * 0.6 });
    const lwid = (label.length * 10 + 26) * k;
    tt += R(tx + 8 * k, ty + th - 34 * k, lwid, 26 * k, 8 * k, { fill: '#000', opacity: 0.55 }) + TF(label, tx + 20 * k, ty + th - 15 * k, 16 * k, '#FFFFFF', { 'text-anchor': 'start' });
    return tt;
  };
  const sx = x0 + pad, sy = y0 + bar + pad, sw = w - side - pad * 3, sh = h - bar - tool - pad * 2;
  const speaking = opts.speaking ?? (opts.mouth > 0.05);
  o += tile(sx, sy, sw, sh, opts.boss ?? bossBust(t, opts), 'Mr. Grayson (Host)', speaking);
  const names = opts.tiles || ['Dave', 'Kevin', 'Linda'];
  const th = (sh - pad * 2) / 3, tx = x0 + w - side - pad;
  const selfC = opts.self ?? ((tw, tH) => (opts.selfSky
    ? R(-tw / 2, -tH / 2, tw, tH, 0, { fill: 'url(#setsVcSky)' }) + cloud(-tw * 0.2, -tH * 0.2, tw / 600, '#FFFFFF', '#D4ECFF') + blob([[-tw * 0.3, tH * 0.5, tH * 0.35], [0, tH * 0.55, tH * 0.32], [tw * 0.3, tH * 0.5, tH * 0.36]], '#4CB65A', 3) + CI(0, -tH * 0.02, tH * 0.2, ol('#E8D2B8', 2)) + T('D', 0, tH * 0.07, tH * 0.22, '#5A4A3A')
    : vcAvatar(tw, tH, names[0], '#5A8BFF')));
  const kevin = (tw, tH) => R(-tw / 2, -tH / 2, tw, tH, 0, { fill: '#F2E2C8' }) + G(P('M-40 -26 L-30 -62 L-10 -36 Z M40 -26 L30 -62 L10 -36 Z', ol('#9AA0AE', 3)) + E(0, -4, 46, 40, ol('#B9BEC9', 3)) + CI(-15, -10, 6, { fill: LINE }) + CI(15, -10, 6, { fill: LINE }) + P('M-4 4 L4 4 L0 9 Z', { fill: '#FF8FA3' }) + P('M-20 8 L-48 4 M-20 14 L-46 18 M20 8 L48 4 M20 14 L46 18', ln(2.5)), `scale(${f(tH / 140)})`);
  o += tile(tx, sy, side, th, selfC, opts.selfSky ? 'Dave (outside?)' : names[0], false);
  o += tile(tx, sy + th + pad, side, th, kevin, names[1], false);
  o += tile(tx, sy + (th + pad) * 2, side, th, (tw, tH) => vcAvatar(tw, tH, names[2], '#FF8A5B') + (opts.frozen ? '' : ''), names[2], false);
  // toolbar
  const ty = y0 + h - tool / 2 - 4 * k;
  const btn = (bx, ic, col = '#3A4258') => G(CI(0, 0, 24 * k, { fill: col }) + ic, `translate(${f(bx)} ${f(ty)})`);
  const muted = bool01(opts.muted);
  const mic = R(-6 * k, -14 * k, 12 * k, 20 * k, 6 * k, { fill: '#FFFFFF' }) + P(`M${f(-11 * k)} ${f(-2 * k)} Q${f(-11 * k)} ${f(12 * k)} 0 ${f(12 * k)} Q${f(11 * k)} ${f(12 * k)} ${f(11 * k)} ${f(-2 * k)} M0 ${f(12 * k)} L0 ${f(17 * k)}`, ln(3 * k, '#FFFFFF'));
  o += btn(-120 * k, mic + (muted > 0 ? P(`M${f(-14 * k)} ${f(-14 * k)} L${f(14 * k)} ${f(14 * k)}`, ln(4 * k, '#FF3B4E')) : ''), muted > 0 ? '#5A2030' : '#3A4258');
  o += btn(-60 * k, R(-14 * k, -9 * k, 20 * k, 18 * k, 4 * k, { fill: '#FFFFFF' }) + P(`M${f(6 * k)} ${f(-4 * k)} L${f(14 * k)} ${f(-9 * k)} L${f(14 * k)} ${f(9 * k)} L${f(6 * k)} ${f(4 * k)} Z`, { fill: '#FFFFFF' }));
  o += btn(0, R(-13 * k, -9 * k, 26 * k, 18 * k, 3 * k, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3 * k }) + P(`M0 ${f(4 * k)} L0 ${f(-5 * k)} M${f(-5 * k)} 0 L0 ${f(-5 * k)} L${f(5 * k)} 0`, ln(2.5 * k, '#FFFFFF')));
  o += btn(60 * k, CI(-5 * k, -4 * k, 6 * k, { fill: '#FFFFFF' }) + CI(7 * k, -2 * k, 5 * k, { fill: '#FFFFFF' }) + P(`M${f(-14 * k)} ${f(12 * k)} Q${f(-5 * k)} ${f(-2 * k)} ${f(4 * k)} ${f(12 * k)} Z`, { fill: '#FFFFFF' }));
  o += G(R(-56 * k, -20 * k, 112 * k, 40 * k, 20 * k, { fill: '#FF3B4E' }) + TF('LEAVE', 0, 7 * k, 19 * k, '#FFFFFF'), `translate(${f(w / 2 - 90 * k)} ${f(ty)})`);
  if (muted > 0) {
    const sc = ease.outBack(clamp(muted, 0, 1));
    o += G(R(-118, -96, 236, 56, 16, ol('#FFFFFF', 4)) + P('M-12 -42 L0 -26 L12 -42 Z', ol('#FFFFFF', 4)) + R(-12, -46, 24, 8, 0, { fill: '#FFFFFF' }) + TF("You're muted", 0, -60, 28, '#E8243C'), `translate(${f(-120 * k)} ${f(ty)}) scale(${f(sc * k * 1.2)})`);
  }
  return G(o, tr(x, y));
}

// ================================================================= 4. LIVING ROOM — Dad's work-from-home corner
// Flat front view, wall/floor seam y 790. Left: a big OPEN casement window (opening x 100..500, y 150..590, sill y 590)
// — Dad floats from his chair up and out through it (SPOTS.livingRoom.window.exit = a point just outside); through it
// the backyard and the top of a big tree. Under it Dad's desk (top y 668) with his laptop on the video call (screen
// turned toward his chair), mug, lamp, papers; office chair at x 640 (Dad sits: SPOTS.livingRoom.dadChair).
// Centre: the teal couch (seat top y 742; seated characters between layers.mid and layers.front; lying on it:
// SPOTS.livingRoom.couch.lie). Right: the TV on a console (3/4, facing the couch), the cat bed in front of it, and a
// doorway down an absurdly LONG hall to the kitchen, with the fridge tiny at the far end (SPOTS.livingRoom.fridgeFar).
// opts: { time 'day'|'evening'|'night', call (true = default boss call; svg|fn(w,h) for Dad's laptop screen, 300x190;
//   false = laptop shows a spreadsheet), callOpts (passed to videoCall when call is true), tv (svg|fn 220x130), tvOff,
//   windowOpen (default true), curtains 0..1 (breeze), lamp (desk lamp on; default evening/night), catBed:false }
// Stand line y 990 (FLOOR.livingRoom).
const LR = { base: 790, win: { x0: 100, y0: 150, x1: 500, y1: 590 }, desk: { x0: 80, x1: 560, top: 668 }, chair: { x: 650 }, couch: { x0: 740, x1: 1320, seat: 742 }, door: { x0: 1650, x1: 1880, y0: 250 } };
def(lg('setsLRWall', [[0, '#FFC9A6'], [1, '#F7B48E']]));
def('<pattern id="setsLRLat" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M45 6 L84 45 L45 84 L6 45 Z" fill="none" stroke="#F2A27E" stroke-width="3" opacity="0.7"/><circle cx="45" cy="45" r="4" fill="#FFFFFF" opacity="0.45"/></pattern>');
def(lg('setsLRFloor', [[0, '#D9944F'], [1, '#B8743A']]));
def(lg('setsLRHall', [[0, '#E39A72'], [1, '#B66A48']], 1, 0));
def('<clipPath id="setsClipLRDoor"><path d="M1650 800 L1650 360 Q1650 250 1765 250 Q1880 250 1880 360 L1880 800 Z"/></clipPath>');
function livingLayers(t, opts = {}) {
  const time = opts.time || 'day', nite = time === 'night', eve = time === 'evening';
  const W = LR.win, D = LR.desk, C = LR.couch;
  const breeze = bool01(opts.curtains), winOpen = opts.windowOpen !== false;
  const lampOn = opts.lamp ?? (nite || eve);
  // ---- bg: backyard through the window
  let bg = sky(t, time, (W.x0 + W.x1) / 2, (W.y0 + W.y1) / 2 - 60, W.x1 - W.x0 + 100, W.y1 - W.y0, { clouds: 3, stars: 20, sunX: 0.78, sunY: eve ? 0.7 : 0.18 });
  bg += P('M20 520 L20 420 L170 330 L320 420 L320 520 Z', ol(nite ? '#2C2E5E' : eve ? '#B9706A' : '#A8B6E8', 5)) + R(130, 420, 70, 56, 6, ol(nite ? '#FFD86B' : '#E9F6FF', 4));
  let fence = '';
  for (let x = 40; x < 600; x += 40) fence += `M${x} 600 L${x} 520 L${x + 15} 506 L${x + 30} 520 L${x + 30} 600 Z `;
  bg += P(fence, ol(nite ? '#5A6098' : '#FFFFFF', 4)) + R(20, 590, 600, 60, 0, { fill: nite ? '#1F3A3A' : eve ? '#8CAA5E' : '#79D46A' });
  bg += tree(330, 760, 1.2, { col: nite ? '#1C3646' : eve ? '#6F8A52' : '#3FA650', hi: nite ? '#284C60' : '#6CCB6A', trunk: nite ? '#3A2A3A' : '#8A5A33', sway: Math.sin(t * 0.8) * 1.2 });
  if (winOpen) {
    // casement sashes swung outward (seen inside the opening, near the jambs)
    for (const [x, d] of [[W.x0, 1], [W.x1, -1]]) {
      const sw = 62 + Math.sin(t * 0.9 + x) * 4 * (1 + breeze);
      bg += poly([[x, W.y0], [x + d * sw, W.y0 + 34], [x + d * sw, W.y1 - 34], [x, W.y1]], { fill: '#BFE6FF', 'fill-opacity': 0.55, stroke: LINE, 'stroke-width': 5 });
      bg += P(`M${x + d * 8} ${W.y0 + 10} L${x + d * (sw - 8)} ${W.y0 + 40} L${x + d * (sw - 8)} ${W.y1 - 40} L${x + d * 8} ${W.y1 - 10} Z`, ln(6, '#FFFFFF', 0.9)) + P(`M${x + d * sw * 0.3} ${W.y0 + 120} L${x + d * sw * 0.7} ${W.y0 + 70}`, ln(5, '#FFFFFF', 0.7));
    }
  }
  // ---- mid
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${LR.base} H${XL} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z M1650 800 L1650 360 Q1650 250 1765 250 Q1880 250 1880 360 L1880 800 Z`;
  // doorway: the endless hall to the kitchen
  {
    let h = R(1600, 200, 330, 640, 0, { fill: '#C27852' });
    const vx = 1765, vy = 520;
    h += poly([[1650, 800], [1880, 800], [vx + 18, vy + 26], [vx - 18, vy + 26]], { fill: '#B8743A' }) + poly([[1650, 250], [1880, 250], [vx + 18, vy - 30], [vx - 18, vy - 30]], { fill: '#F2D9C0' });
    h += poly([[1650, 250], [vx - 18, vy - 30], [vx - 18, vy + 26], [1650, 800]], { fill: 'url(#setsLRHall)' }) + poly([[1880, 250], [vx + 18, vy - 30], [vx + 18, vy + 26], [1880, 800]], { fill: '#C9805A' });
    let d = '';
    for (const k of [0.62, 0.38, 0.22, 0.12]) { const x = lerp(vx - 18, 1650, k), x2 = lerp(vx + 18, 1880, k); d += `M${f(x)} ${f(lerp(vy + 26, 800, k))} L${f(x2)} ${f(lerp(vy + 26, 800, k))} `; }
    h += P(d, ln(2.5, '#8A5530', 0.7));
    for (const k of [0.55, 0.3, 0.16]) { const x = lerp(vx - 18, 1650, k), yt = lerp(vy - 30, 250, k), yb = lerp(vy + 26, 800, k); h += poly([[x, yt + (yb - yt) * 0.25], [x + 30 * k, yt + (yb - yt) * 0.27], [x + 30 * k, yb], [x, yb]], { fill: '#8A5530', opacity: 0.7 }); }
    for (const k of [0.5, 0.25]) h += glowSpot(vx, lerp(vy - 30, 250, k) + 6, 40 * k + 10, 'setsGlowWarm', 0.9);
    h += R(vx - 18, vy - 30, 36, 56, 0, { fill: '#FFE7A6' }) + R(vx - 6, vy - 18, 12, 40, 3, { fill: '#8ED8E6', stroke: LINE, 'stroke-width': 1.5 }) + glowSpot(vx, vy, 40, 'setsGlowWhite', 0.7);
    m += G(h, null, { 'clip-path': 'url(#setsClipLRDoor)' });
  }
  m += P(wallD, { fill: 'url(#setsLRWall)', 'fill-rule': 'evenodd' }) + P(wallD, { fill: 'url(#setsLRLat)', 'fill-rule': 'evenodd' });
  m += band(70, 84, '#FFF4E6') + P(`M${XL} 70 H${XR} M${XL} 84 H${XR}`, ln(3.5, LINE, 0.7));
  // lower wall: wood wainscot
  m += P(`M${XL} 600 H1650 V${LR.base} H${XL} Z M1880 600 H${XR} V${LR.base} H1880 Z`, { fill: '#E08E66' });
  let pan = '';
  for (let x = -40; x < 1640; x += 150) pan += `M${x + 14} 622 h122 v148 h-122 Z `;
  m += P(pan, { fill: 'none', stroke: '#F2A57E', 'stroke-width': 5 }) + R(XL, 590, XR - XL, 18, 4, ol('#FFF4E6', 4)) + R(XL, LR.base - 20, XR - XL, 22, 0, ol('#FFF4E6', 4));
  // door frame (arch)
  m += P('M1630 800 L1630 360 Q1630 230 1765 230 Q1900 230 1900 360 L1900 800 L1880 800 L1880 360 Q1880 250 1765 250 Q1650 250 1650 360 L1650 800 Z', ol('#FFF4E6', 5));
  // window frame + sill + sheer curtains
  m += P(`M${W.x0 - 22} ${W.y0 - 22} H${W.x1 + 22} V${W.y1 + 6} H${W.x0 - 22} Z M${W.x0} ${W.y0} V${W.y1} H${W.x1} V${W.y0} Z`, { fill: '#FFF8EE', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 });
  if (!winOpen) m += R(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0, 0, { fill: '#BFE6FF', opacity: 0.35 }) + R(296, W.y0, 10, W.y1 - W.y0, 2, ol('#FFF8EE', 3));
  m += R(W.x0 - 34, W.y1 + 2, W.x1 - W.x0 + 68, 22, 6, ol('#FFF8EE', 5));
  m += R(W.x0 - 60, W.y0 - 50, W.x1 - W.x0 + 120, 12, 6, ol('#8A5530', 4));
  for (const [cx, d] of [[W.x0 - 20, 1], [W.x1 + 20, -1]]) {
    const bil = Math.sin(t * 1.6 + cx) * (8 + 40 * breeze) + breeze * 50 * d;
    m += P(`M${cx - 40} ${W.y0 - 44} L${cx + 40} ${W.y0 - 44} Q${f(cx + 30 + bil * 0.6)} ${W.y0 + 200} ${f(cx + 36 * d + bil)} ${W.y1 + 60} L${f(cx - 36 * d + bil * 0.8)} ${W.y1 + 66} Q${f(cx - 30 + bil * 0.3)} ${W.y0 + 200} ${cx - 40} ${W.y0 - 44} Z`, { fill: '#FFFFFF', opacity: 0.72, stroke: '#D9C6B8', 'stroke-width': 3 });
  }
  // wall gallery over the couch: family portrait + Granny 90 + Pancake + clock
  {
    let g = R(-140, -96, 280, 192, 8, ol('#C98A52', 6)) + R(-124, -80, 248, 160, 4, { fill: '#BFE6FF' }) + R(-124, 30, 248, 50, 0, { fill: '#8ED17A' });
    const head = (x, y, col, hair) => R(x - 22, y - 22, 44, 44, 9, ol(col, 3)) + hair;
    g += head(-80, -6, '#F2D3B8', R(-102, -30, 44, 12, 5, ol('#F2F2F2', 2.5)) + CI(-80, -32, 12, ol('#F2F2F2', 2.5)));
    g += head(-28, -14, '#F2D3B8', R(-54, -24, 8, 18, 3, { fill: '#C3C8D2' }) + R(-10, -24, 8, 18, 3, { fill: '#C3C8D2' }) + R(-44, -20, 32, 9, 3, { fill: 'none', stroke: LINE, 'stroke-width': 2.5 }));
    g += head(26, -14, '#F2D3B8', R(2, -40, 48, 16, 6, ol('#8A4A2A', 2.5)) + P('M48 -36 Q64 -30 58 -10', ln(7, '#8A4A2A')));
    g += head(80, 2, '#FFFFFF', R(56, -24, 48, 20, 8, ol('#B84B02', 2.5)));
    g += E(0, 58, 30, 16, ol('#F28C28', 3)) + P('M-22 48 L-26 36 L-14 44 Z M22 48 L26 36 L14 44 Z', ol('#F28C28', 2.5));
    m += G(g, 'translate(1030 300)');
    m += G(R(-62, -78, 124, 156, 8, ol('#FFF4E6', 5)) + R(-50, -66, 100, 132, 3, { fill: '#FFC2D6' }) + R(-30, 0, 60, 36, 6, ol('#FFFFFF', 3)) + R(-30, -6, 60, 10, 4, { fill: '#FF8FA3' }) + T('90', 0, -24, 40, '#E8243C', OUTX(5)) + P('M-14 -6 L-14 -16 M0 -6 L0 -18 M14 -6 L14 -16', ln(3, '#FFC23A')), 'translate(800 290) rotate(-3)');
    m += G(R(-56, -66, 112, 132, 8, ol('#FFF4E6', 5)) + R(-44, -54, 88, 108, 3, { fill: '#9FD8FF' }) + E(0, 26, 34, 22, ol('#F28C28', 3)) + E(0, -2, 26, 22, ol('#F28C28', 3)) + P('M-22 -12 L-24 -32 L-10 -20 Z M22 -12 L24 -32 L10 -20 Z', ol('#F28C28', 2.5)) + P('M-10 -2 Q-6 2 -2 -2 M2 -2 Q6 2 10 -2', ln(2.5)), 'translate(1250 300) rotate(4)');
    const hr = ((t / 3600) * 360 + 300) % 360, mn = ((t / 60) * 360 + 40) % 360;
    m += CI(1030, 140, 40, ol('#FFF8EE', 5)) + P(`M1030 140 L${f(1030 + Math.sin(hr * Math.PI / 180) * 18)} ${f(140 - Math.cos(hr * Math.PI / 180) * 18)} M1030 140 L${f(1030 + Math.sin(mn * Math.PI / 180) * 28)} ${f(140 - Math.cos(mn * Math.PI / 180) * 28)}`, ln(4.5)) + CI(1030, 140, 4, { fill: '#E8603C' });
  }
  // floor + rug
  m += R(XL, LR.base, XR - XL, YB - LR.base, 0, { fill: 'url(#setsLRFloor)' }) + floorBoards(LR.base, 1180, XL, XR, 9, '#93582C', 9);
  m += E(1030, 924, 520, 64, ol('#F2B640', 5)) + E(1030, 922, 440, 46, { fill: 'none', stroke: '#FFE08A', 'stroke-width': 9, 'stroke-dasharray': '4 18' }) + E(1030, 922, 300, 26, { fill: '#E9A32E' });
  // ---- Dad's desk under the window
  m += R(D.x0 + 20, D.top + 20, 22, 812 - D.top - 20, 5, ol('#8A5530', 5)) + R(D.x1 - 190, D.top + 20, 170, 812 - D.top - 20, 6, ol('#A86B3C', 5)) + R(D.x1 - 178, D.top + 34, 146, 52, 5, ol('#BF7F48', 3)) + R(D.x1 - 178, D.top + 94, 146, 40, 5, ol('#BF7F48', 3));
  m += R(D.x0 - 6, D.top - 10, D.x1 - D.x0 + 12, 14, 4, ol('#C98A52', 4)) + R(D.x0 - 10, D.top + 2, D.x1 - D.x0 + 20, 20, 5, ol('#A86B3C', 5));
  // lamp, mug, papers, plant, sticky note
  {
    let l = E(0, 0, 32, 9, ol('#2E3A5A', 4)) + P('M0 -4 L-20 -96 L24 -132', ln(13, LINE)) + P('M0 -4 L-20 -96 L24 -132', ln(6, '#2E3A5A'));
    l += G(P('M-20 -12 L20 -12 L32 18 L-32 18 Z', ol('#FFC23A', 4)) + E(0, 19, 32, 6, ol(lampOn ? '#FFF4B8' : '#E9D9A8', 3)), 'translate(34 -122) rotate(-28)');
    if (lampOn) l += P('M38 -104 L140 18 L40 18 L12 -98 Z', { fill: '#FFF2B0', opacity: 0.22 });
    m += G(l, `translate(${D.x0 + 50} ${D.top - 10})`);
  }
  m += G(R(-22, -48, 44, 48, 8, ol('#FFFFFF', 3.5)) + P('M22 -38 Q40 -34 22 -14', ln(5)) + TF('#1 DAD', 0, -18, 11, '#E8243C') + P('M-8 -54 Q-14 -66 -6 -76 M6 -54 Q0 -68 8 -78', ln(3, '#FFFFFF', 0.8)), `translate(${D.x0 + 150} ${D.top - 8})`);
  m += P(`M${D.x0 + 196} ${D.top - 8} l70 -6 l6 -14 l-70 6 Z`, ol('#FFFFFF', 3)) + P(`M${D.x0 + 200} ${D.top - 22} l70 -4 l4 -12 l-70 4 Z`, ol('#F4F6FF', 3));
  m += stickyNote(D.x0 + 120, D.top - 160, 6, 'UNMUTE!', { w: 66, size: 12 });
  // Dad's laptop (3/4, screen turned toward his chair at right)
  {
    const lx = D.x0 + 380, ly = D.top - 10;
    let lp = P('M-120 0 L96 -10 L130 4 L-86 16 Z', ol('#C9D1DD', 4)) + P('M-104 4 L90 -5 L106 2 L-88 12 Z', { fill: '#2A2D38', opacity: 0.7 });
    const scrIn = opts.call === false ? (w, h) => R(-w / 2, -h / 2, w, h, 0, { fill: '#FFFFFF' }) + P(Array.from({ length: 8 }, (_, i) => `M${-w / 2} ${-h / 2 + 20 + i * 22} H${w / 2}`).join(' ') + Array.from({ length: 5 }, (_, i) => ` M${-w / 2 + 50 + i * 60} ${-h / 2} V${h / 2}`).join(''), ln(2, '#B9C6D8')) + R(-w / 2, -h / 2, w, 20, 0, { fill: '#3DBA6A' })
      : opts.call === undefined || opts.call === true ? (w, h) => videoCall(0, 0, w, h, t, { ...(opts.callOpts || {}) }) : opts.call;
    let lid = R(-150, -190, 300, 190, 10, ol('#C9D1DD', 5)) + G(G(R(-140, -95, 280, 176, 0, { fill: '#1B1F2C' }) + G(screenOf(scrIn, 300, 190), 'scale(0.933 0.926)'), null, { 'clip-path': 'url(#setsClipDadLap)' }), 'translate(0 -95)');
    lid += R(-140, -183, 280, 176, 6, { fill: 'url(#setsShine)' });
    lp = G(lid, 'matrix(0.74 0.06 0 1 6 -2)') + lp;
    m += G(lp, tr(lx, ly));
  }
  // office chair (side view, facing the desk / left)
  {
    const cx = LR.chair.x;
    m += P(`M${cx} 744 L${cx} 790`, ln(16, LINE)) + P(`M${cx} 744 L${cx} 790`, ln(8, '#8A93A6'));
    m += P(`M${cx - 54} 812 L${cx} 790 L${cx + 54} 812 M${cx} 790 L${cx} 816`, ln(13, LINE)) + P(`M${cx - 54} 812 L${cx} 790 L${cx + 54} 812 M${cx} 790 L${cx} 816`, ln(6, '#3A3F4E')) + CI(cx - 54, 816, 8, ol('#2A2D38', 3)) + CI(cx + 54, 816, 8, ol('#2A2D38', 3)) + CI(cx, 820, 8, ol('#2A2D38', 3));
    m += R(cx - 72, 718, 140, 28, 12, ol('#2E3A5A', 5)) + G(R(-24, -180, 52, 190, 22, ol('#2E3A5A', 5)) + R(-12, -166, 28, 120, 10, { fill: '#4A5A86' }), `translate(${cx + 60} 738) rotate(7)`);
  }
  // couch back + cushions
  m += R(C.x0, 540, C.x1 - C.x0, 220, 40, ol('#2F9A84', 7));
  for (let i = 0; i < 3; i++) m += R(C.x0 + 24 + i * 184, 562, 172, 168, 32, ol('#3BB096', 6)) + P(`M${C.x0 + 50 + i * 184} 588 Q${C.x0 + 110 + i * 184} 574 ${C.x0 + 170 + i * 184} 588`, ln(5, '#6ED2B8', 0.8));
  m += R(C.x0 + 16, 712, C.x1 - C.x0 - 32, 50, 18, ol('#43BC9F', 6));
  m += G(R(-56, -56, 112, 112, 26, ol('#FFC23A', 6)) + P('M-36 -14 L36 -14 M-36 14 L36 14', ln(6, '#F29E1A')), `translate(${C.x0 + 92} 660) rotate(-10)`) + G(R(-52, -52, 104, 104, 26, ol('#FF8A5B', 6)) + CI(0, 0, 18, { fill: '#FFF4E6' }), `translate(${C.x1 - 90} 664) rotate(9)`);
  // TV on its console (3/4, facing the couch)
  {
    const tvx = 1488;
    m += R(1356, 700, 260, 112, 10, ol('#8A5530', 5)) + R(1372, 716, 110, 80, 6, ol('#A86B3C', 3.5)) + R(1490, 716, 110, 80, 6, ol('#A86B3C', 3.5)) + R(1370, 810, 18, 14, 3, ol('#5A3A20', 3)) + R(1584, 810, 18, 14, 3, ol('#5A3A20', 3));
    m += R(tvx - 26, 672, 52, 30, 5, ol('#2A2D38', 4));
    const tvOn = !opts.tvOff;
    const inner = tvOn ? (opts.tv !== undefined ? screenOf(opts.tv, 220, 130) : R(-110, -65, 220, 130, 0, { fill: '#3DA8D8' }) + P('M-110 40 Q-50 20 0 40 Q50 60 110 34 L110 65 L-110 65 Z', { fill: '#2A7AB8' }) + G(P('M-30 0 Q0 -26 30 0 Q0 26 -30 0 Z M30 0 L48 -14 L48 14 Z', ol('#FFC23A', 3)) + CI(-14, -4, 4, { fill: LINE }), `translate(${f(Math.sin(t * 0.8) * 40)} ${f(Math.sin(t * 1.7) * 8 - 10)})`) + CI(-70, -30, 6, { fill: '#FFFFFF', opacity: 0.6 }) + CI(60, -40, 4, { fill: '#FFFFFF', opacity: 0.6 })) : R(-110, -65, 220, 130, 0, { fill: '#12141A' });
    let tv = R(-130, -84, 260, 168, 12, ol('#1C1F28', 6)) + G(G(R(-110, -65, 220, 130, 0, { fill: '#123' }) + inner, null, { 'clip-path': 'url(#setsClipLRTv)' }), '') + R(-110, -65, 220, 130, 6, { fill: 'url(#setsShine)' }) + R(-110, -65, 220, 130, 6, ln(3.5, '#0A0B0C'));
    m += G(tv, `translate(${tvx} 586) matrix(0.82 -0.07 0 1 0 0)`) + P(`M${tvx + 107} 520 L${tvx + 124} 526 L${tvx + 124} 662 L${tvx + 107} 670 Z`, ol('#12141A', 4));
    if (tvOn) m += CI(tvx - 96, 664, 4, { fill: '#46FF8A' });
  }
  // cat bed
  if (opts.catBed !== false) m += E(1480, 900, 116, 36, ol('#5A8BFF', 6)) + E(1480, 890, 92, 22, ol('#3A6BE0', 4)) + E(1480, 894, 84, 16, { fill: '#BFD6FF' }) + TF('PANCAKE', 1480, 932, 15, '#FFFFFF', { opacity: 0.85 });
  // ---- front: couch front + arms + coffee table
  let fr = R(C.x0 + 6, 750, C.x1 - C.x0 - 12, 140, 26, ol('#2F9A84', 7)) + R(C.x0 + 26, 760, C.x1 - C.x0 - 52, 30, 14, { fill: '#43BC9F' }) + P(`M${(C.x0 + C.x1) / 2} 768 L${(C.x0 + C.x1) / 2} 884`, ln(5, '#24806C'));
  for (const ax of [C.x0 - 34, C.x1 - 56]) fr += R(ax, 630, 90, 262, 34, ol('#3BB096', 7)) + R(ax + 6, 636, 78, 36, 18, { fill: '#6ED2B8', opacity: 0.7 });
  fr += R(C.x0 + 20, 888, 24, 16, 4, ol('#5A3A20', 3)) + R(C.x1 - 44, 888, 24, 16, 4, ol('#5A3A20', 3));
  fr += R(860, 956, 22, 50, 6, ol('#8A5530', 4)) + R(1178, 956, 22, 50, 6, ol('#8A5530', 4)) + R(830, 924, 400, 38, 14, ol('#B87A44', 6)) + R(842, 928, 376, 10, 5, { fill: '#D99A5C' });
  fr += P('M900 924 Q900 890 940 888 Q980 890 980 924 Z', ol('#E8243C', 4)) + CI(918, 890, 9, ol('#FFE08A', 2.5)) + CI(940, 884, 10, ol('#FFE08A', 2.5)) + CI(962, 890, 9, ol('#FFE08A', 2.5));
  fr += G(R(-40, -9, 80, 18, 6, ol('#2A2D38', 4)) + CI(-20, 0, 3, { fill: '#FF3B4E' }) + CI(0, 0, 3, { fill: '#9AA3B2' }), 'translate(1060 918) rotate(-8)') + G(R(-48, -10, 96, 20, 3, ol('#FFFFFF', 3)) + TF('WFH WEEKLY', 0, 5, 11, '#2E3A5A'), 'translate(1150 916) rotate(4)');
  // ---- light
  let light = '';
  if (nite) light = darkPool(D.x0 + 200, D.top - 60, 340) + glowSpot(D.x0 + 120, D.top - 40, 300, 'setsGlowWarm', lampOn ? 0.55 : 0) + glowSpot(1488, 586, 260, 'setsGlowBlue', opts.tvOff ? 0 : 0.6) + glowSpot(D.x0 + 380, D.top - 100, 200, 'setsGlowBlue', 0.4);
  else if (eve) light = cover('#FF7A3D', { opacity: 0.1 }) + glowSpot(D.x0 + 120, D.top - 40, 260, 'setsGlowWarm', lampOn ? 0.4 : 0);
  return { bg, mid: m, front: fr, fg: '', light };
}
def('<clipPath id="setsClipDadLap"><rect x="-140" y="-88" width="280" height="176" rx="6"/></clipPath>');
def('<clipPath id="setsClipLRTv"><rect x="-110" y="-65" width="220" height="130" rx="6"/></clipPath>');
const livingRoom = makeSet(livingLayers);

// ================================================================= 5. THE FAMILY HOUSE + exterior
// house(x, y, s, opts): origin = bottom centre of the foundation. At s = 1: 800 wide, ~920 tall (roof peak y -900),
// door 270 tall (x ±58). Mustard siding, white trim, teal roof, red door with Mom's sticky note. Upstairs left = YOUR
// window (orange curtains + a poster), upstairs right = the parents' window, round attic window in the gable.
// opts: { time 'day'|'evening'|'night' (night/evening: warm lit windows + porch light), lit (force windows lit),
//   uprooted 0..1 (a clump of dirt, roots, a pipe and a worm hangs under the foundation — for the giant cat lifting it),
//   tilt (deg, around the base centre), tail (true or phase: Pancake's orange tail curls out of the parents' window),
//   notes (default true: the note on the door) }
// For the cat gag: draw house(...) on the cat's back yourself, or use houseExterior({ lift }) which raises it.
def('<pattern id="setsSiding" width="200" height="34" patternUnits="userSpaceOnUse"><rect width="200" height="34" fill="#F6C65B"/><rect y="28" width="200" height="6" fill="#D9A23E"/><rect y="0" width="200" height="4" fill="#FFE29A"/></pattern>');
def('<pattern id="setsShingles" width="64" height="28" patternUnits="userSpaceOnUse"><rect width="64" height="28" fill="#2F7290"/><rect y="12" width="64" height="2.5" fill="#1F5168"/><rect y="25.5" width="64" height="2.5" fill="#1F5168"/><rect x="20" y="0" width="2.5" height="13" fill="#1F5168"/><rect x="52" y="14" width="2.5" height="13" fill="#1F5168"/><rect y="2" width="64" height="3" fill="#4A93B2" opacity="0.6"/></pattern>');
def(lg('setsGlass', [[0, '#CFF0FF'], [1, '#8FCBEF']]));
def(lg('setsGlassLit', [[0, '#FFF2B0'], [1, '#FFC860']]));
function houseWin(x0, y0, w, h, lit, extra = '') {
  let o = R(x0 - 12, y0 - 12, w + 24, h + 24, 6, ol('#FFFFFF', 5)) + R(x0, y0, w, h, 3, { fill: lit ? 'url(#setsGlassLit)' : 'url(#setsGlass)' });
  o += extra;
  if (!lit) o += P(`M${x0 + w * 0.12} ${y0 + h * 0.8} L${x0 + w * 0.5} ${y0 + h * 0.1} L${x0 + w * 0.7} ${y0 + h * 0.1} L${x0 + w * 0.32} ${y0 + h * 0.8} Z`, { fill: '#FFFFFF', opacity: 0.55 });
  o += P(`M${x0 + w / 2} ${y0} V${y0 + h} M${x0} ${y0 + h / 2} H${x0 + w}`, ln(9, '#FFFFFF')) + R(x0, y0, w, h, 3, ln(4));
  o += R(x0 - 20, y0 + h + 10, w + 40, 16, 4, ol('#FFFFFF', 4));
  return o;
}
function house(x, y, s = 1, opts = {}) {
  const time = opts.time || 'day', lit = opts.lit ?? (time === 'night' || time === 'evening');
  const up = bool01(opts.uprooted);
  let o = '';
  // dirt clump under the foundation (uprooted)
  if (up > 0) {
    const d = 150 * up;
    o += P(`M-380 -4 Q-390 ${f(d * 0.6)} -300 ${f(d * 0.9)} Q-180 ${f(d * 1.25)} -40 ${f(d)} Q80 ${f(d * 1.3)} 200 ${f(d * 0.95)} Q330 ${f(d * 1.1)} 370 ${f(d * 0.5)} L380 -4 Z`, ol('#8A5A3A', 6));
    o += P(`M-300 ${f(d * 0.4)} q30 ${f(d * 0.2)} 10 ${f(d * 0.5)} M-100 ${f(d * 0.6)} q-20 ${f(d * 0.4)} 14 ${f(d * 0.7)} q10 20 -10 40 M120 ${f(d * 0.5)} q24 ${f(d * 0.3)} 0 ${f(d * 0.6)} M280 ${f(d * 0.3)} q20 ${f(d * 0.3)} -6 ${f(d * 0.55)}`, ln(6, '#5A3A20'));
    o += R(-30, f(d * 0.3), 26, f(d * 0.9), 4, ol('#B9C2CF', 4)) + P(`M60 ${f(d * 0.7)} q14 -10 24 4 q10 14 22 0`, ln(9, '#FF9AB0')) + P(`M60 ${f(d * 0.7)} q14 -10 24 4 q10 14 22 0`, ln(3, '#D9667E'));
    o += P(`M-380 -2 q20 -16 34 0 q16 -18 30 0 M300 -2 q16 -16 30 0 q18 -18 40 2`, { fill: '#5CB85A', stroke: LINE, 'stroke-width': 3 });
    o += CI(-220, f(d * 0.5), 12, ol('#A8A3B4', 3)) + CI(150, f(d * 0.75), 16, ol('#A8A3B4', 3));
  }
  // chimney (behind the roof)
  o += R(210, -900, 74, 260, 4, ol('#C8553D', 6)) + R(200, -918, 94, 26, 4, ol('#A8432F', 5)) + P('M222 -860 H272 M222 -820 H272 M222 -780 H272', ln(3, '#A8432F'));
  // walls
  o += R(-370, -40, 740, 40, 4, ol('#A7A3B8', 5)) + P('M-360 -20 H360', ln(3, '#8A86A0', 0.7));
  o += R(-350, -384, 700, 344, 0, { fill: 'url(#setsSiding)', stroke: LINE, 'stroke-width': 6 });
  o += R(-334, -650, 668, 274, 0, { fill: 'url(#setsSiding)', stroke: LINE, 'stroke-width': 6 });
  o += R(-360, -394, 720, 20, 4, ol('#FFFFFF', 5));
  o += R(-350, -384, 700, 30, 0, { fill: '#000', opacity: 0.08 }) + R(-334, -650, 668, 40, 0, { fill: '#000', opacity: 0.1 });
  // gable roof + attic window
  o += P('M-420 -632 L0 -930 L420 -632 L392 -604 L0 -880 L-392 -604 Z', ol('#FFFFFF', 6));
  o += P('M-392 -604 L0 -880 L392 -604 L334 -604 L334 -650 L-334 -650 L-334 -604 Z', { fill: 'url(#setsSiding)', stroke: LINE, 'stroke-width': 5 });
  o += P('M-460 -616 L0 -950 L460 -616 L430 -596 L0 -906 L-430 -596 Z', ol('url(#setsShingles)', 6)) + P('M-400 -630 L0 -920', ln(6, '#7FC0DA', 0.6));
  o += CI(0, -740, 46, ol('#FFFFFF', 5)) + CI(0, -740, 34, { fill: lit ? 'url(#setsGlassLit)' : 'url(#setsGlass)', stroke: LINE, 'stroke-width': 4 }) + P('M0 -774 V-706 M-34 -740 H34', ln(6, '#FFFFFF'));
  // upstairs windows: YOUR room (left: orange curtains + poster) / parents (right)
  const curt = (x0, y0, w, h, col) => P(`M${x0} ${y0} L${x0 + w * 0.28} ${y0} Q${x0 + w * 0.18} ${y0 + h * 0.5} ${x0 + w * 0.24} ${y0 + h} L${x0} ${y0 + h} Z M${x0 + w} ${y0} L${x0 + w * 0.72} ${y0} Q${x0 + w * 0.82} ${y0 + h * 0.5} ${x0 + w * 0.76} ${y0 + h} L${x0 + w} ${y0 + h} Z`, { fill: col, stroke: LINE, 'stroke-width': 3 });
  o += houseWin(-280, -590, 170, 150, lit, R(-236, -560, 50, 66, 3, { fill: '#9C6BFF', stroke: LINE, 'stroke-width': 2.5 }) + curt(-280, -590, 170, 150, '#3567D6'));
  o += houseWin(110, -590, 170, 150, lit, curt(110, -590, 170, 150, '#FF9EC4'));
  // ground floor windows with shutters + flower boxes
  for (const wx of [-300, 140]) {
    o += R(wx - 40, -320, 30, 190, 4, ol('#2F7290', 4)) + R(wx + 170, -320, 30, 190, 4, ol('#2F7290', 4)) + P(`M${wx - 34} -290 H${wx - 16} M${wx - 34} -250 H${wx - 16} M${wx - 34} -210 H${wx - 16} M${wx + 176} -290 H${wx + 194} M${wx + 176} -250 H${wx + 194} M${wx + 176} -210 H${wx + 194}`, ln(3, '#1F5168'));
    o += houseWin(wx, -310, 160, 170, lit);
    o += R(wx - 6, -110, 172, 34, 6, ol('#C8553D', 4)) + CI(wx + 20, -116, 13, ol('#FF6FA8', 3)) + CI(wx + 54, -120, 12, ol('#FFE14D', 3)) + CI(wx + 90, -116, 13, ol('#FFFFFF', 3)) + CI(wx + 126, -120, 12, ol('#FF6FA8', 3));
  }
  // porch roof + door + steps
  o += R(-58, -306, 116, 270, 10, ol('#E2463A', 6)) + R(-44, -290, 88, 96, 8, ol('#F26A5A', 3.5)) + R(-44, -178, 88, 120, 8, ol('#F26A5A', 3.5));
  o += CI(0, -250, 24, ol(lit ? '#FFE9A0' : '#BFE6FF', 4)) + CI(36, -160, 7, ol('#FFC23A', 3));
  if (opts.notes !== false) o += stickyNote(-10, -130, -6, 'WIPE\nFEET', { w: 52, size: 10 });
  o += P('M-130 -324 L130 -324 L150 -296 L-150 -296 Z', ol('#FFFFFF', 5)) + R(-140, -296, 14, 260, 3, ol('#FFFFFF', 4)) + R(126, -296, 14, 260, 3, ol('#FFFFFF', 4));
  o += R(-90, -40, 180, 20, 4, ol('#C9C5D6', 4)) + R(-110, -20, 220, 20, 4, ol('#B6B2C6', 4));
  o += CI(-102, -260, 10, ol(lit ? '#FFF2B0' : '#F2F2F2', 3));
  if (lit) o += glowSpot(-102, -260, 120, 'setsGlowWarm', 0.8);
  // Pancake's tail out of the parents' window
  if (opts.tail) {
    const ph = typeof opts.tail === 'number' ? opts.tail : 0;
    const sw = Math.sin(ph * 2.4) * 40;
    const d = `M260 -470 Q380 -460 ${f(420 + sw * 0.3)} -380 Q${f(450 + sw)} -300 ${f(400 + sw)} -250`;
    o += P(d, ln(66, LINE)) + P(d, ln(54, '#F28C28')) + P(d, { fill: 'none', stroke: '#C9651A', 'stroke-width': 54, 'stroke-dasharray': '16 30', 'stroke-linecap': 'butt' });
  }
  return G(o, tr(x, y, s, opts.tilt || 0));
}

// houseExterior(t, opts): the family's house on a suburban street, wide shot. House at x 760 (base y 800, s .85).
// Front lawn y 760..915, sidewalk y 915..960, curb + road below (calm). Neighbour's yard at right: a swimming pool
// behind a low picket fence (SPOTS.houseExterior.pool = water centre, rx/ry) — Dad's splash; a big tree at left.
// Characters: this is a WIDE shot — the hero is ~s .3 on the sidewalk (FLOOR.houseExterior 945), ~s .24 at the door.
// opts: { time 'day'|'evening'|'night', lift 0..1 (the giant cat lifts the house: it rises ~640 px, tilts, dirt hangs
//   under it; a pit stays in the lawn — draw the cat between layers.mid and layers.front), tail (Pancake's tail),
//   house:false (no house: just the pit), splash 0..1 (Dad hits the pool: crown + droplets over life 0..1) }
// layers: bg (sky, far houses), mid (yards, pool, street, pit), front (= the house itself + its bushes), fg (''), light.
def('<pattern id="setsLawn" width="240" height="60" patternUnits="userSpaceOnUse"><rect width="120" height="60" fill="#FFFFFF" opacity="0.08"/></pattern>');
def(lg('setsPool', [[0, '#7FE6FF'], [1, '#2FA8E0']]));
def(lg('setsRoad', [[0, '#7A8296'], [1, '#666D80']]));
function houseExteriorLayers(t, opts = {}) {
  const time = opts.time || 'day', nite = time === 'night', eve = time === 'evening';
  const lift = bool01(opts.lift);
  let bg = sky(t, time, 960, 260, 1920, 520, { clouds: 4, stars: 40, sunX: 0.86, sunY: eve ? 0.8 : 0.18, moonX: 0.84, moonY: 0.2 });
  const far = nite ? '#2A2F66' : eve ? '#C9879A' : '#B9C9EC', farT = nite ? '#1C3646' : eve ? '#8C8A6A' : '#7FC08A';
  let fh = '';
  for (const [x, w, h] of [[-300, 260, 150], [40, 220, 130], [1180, 240, 140], [2000, 260, 150]]) fh += R(x, 700 - h, w, h, 0, { fill: far }) + P(`M${x - 20} ${700 - h} L${x + w / 2} ${700 - h - 80} L${x + w + 20} ${700 - h} Z`, { fill: mix(far, '#000000', 0.15) });
  bg += blob([[-200, 690, 90], [300, 700, 110], [520, 690, 80], [1100, 700, 100], [1500, 690, 90], [1900, 700, 120], [2300, 690, 100]], farT, 0) + fh;
  // ---- mid
  let m = '';
  const lawn = nite ? '#2E5A40' : eve ? '#8DB45E' : '#6CCB5F';
  m += band(700, 920, lawn) + band(700, 920, 'url(#setsLawn)');
  // neighbour houses (left partial, right with the pool)
  m += G(R(-280, -330, 560, 330, 0, ol(nite ? '#4A4F8A' : '#BFD4FF', 6)) + P('M-320 -320 L0 -560 L320 -320 Z', ol('#E8604A', 6)) + houseWin(-200, -260, 140, 150, nite) + houseWin(80, -260, 140, 150, nite), 'translate(-250 790) scale(0.85)');
  m += G(R(-300, -320, 600, 320, 0, ol(nite ? '#5A4A8A' : '#FFD6E6', 6)) + P('M-340 -310 L-280 -460 L280 -460 L340 -310 Z', ol('#8A5AD8', 6)) + houseWin(-220, -250, 140, 150, nite) + R(-30, -220, 80, 220, 8, ol('#3DA8D8', 5)) + houseWin(150, -250, 140, 150, nite), 'translate(1980 760) scale(0.8)');
  // pool (neighbour's yard)
  {
    const px = 1610, py = 850;
    m += P(`M${px - 250} ${py} Q${px - 250} ${py - 56} ${px - 160} ${py - 60} L${px + 160} ${py - 60} Q${px + 250} ${py - 56} ${px + 250} ${py} Q${px + 250} ${py + 56} ${px + 160} ${py + 60} L${px - 160} ${py + 60} Q${px - 250} ${py + 56} ${px - 250} ${py} Z`, ol('#EDF2F8', 6));
    m += P(`M${px - 222} ${py} Q${px - 222} ${py - 40} ${px - 150} ${py - 44} L${px + 150} ${py - 44} Q${px + 222} ${py - 40} ${px + 222} ${py} Q${px + 222} ${py + 40} ${px + 150} ${py + 44} L${px - 150} ${py + 44} Q${px - 222} ${py + 40} ${px - 222} ${py} Z`, { fill: 'url(#setsPool)', stroke: LINE, 'stroke-width': 4 });
    let rip = '';
    for (let i = 0; i < 6; i++) { const rx = px - 160 + hash(i * 3.1) * 320 + Math.sin(t * 1.5 + i) * 10, ry = py - 26 + hash(i * 5.3) * 50; rip += `M${f(rx - 22)} ${f(ry)} q11 -6 22 0 q11 6 22 0 `; }
    m += P(rip, ln(4, '#FFFFFF', 0.75));
    m += G(E(0, 0, 40, 16, ol('#FFE14D', 5)) + E(0, -2, 20, 7, { fill: '#2FA8E0' }) + CI(30, -18, 12, ol('#FFE14D', 4)) + P('M40 -18 L52 -15 L40 -12 Z', { fill: '#FF8A2A' }), `translate(${px + 90 + Math.sin(t * 0.7) * 20} ${py + Math.sin(t * 1.3) * 4})`);
    m += P(`M${px - 200} ${py - 50} L${px - 340} ${py - 70}`, ln(18, LINE)) + P(`M${px - 200} ${py - 50} L${px - 340} ${py - 70}`, ln(11, '#FFFFFF')) + R(px - 336, py - 70, 14, 50, 3, ol('#C9CED8', 3));
    m += P(`M${px + 200} ${py - 40} q12 -30 0 -50 M${px + 228} ${py - 40} q12 -30 0 -50`, ln(5, '#C9CED8'));
    const sp = bool01(opts.splash);
    if (sp > 0 && sp < 1) {
      const u = sp, cx = px - 40;
      m += E(cx, py, 60 + 160 * u, 12 + 30 * u, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(10 * (1 - u)), opacity: f(1 - u) });
      let dr = '';
      for (let i = 0; i < 14; i++) { const a = -Math.PI * (0.1 + 0.8 * hash(i * 2.3)), v = 260 + 300 * hash(i * 4.7); const dx = Math.cos(a) * v * u, dy = Math.sin(a) * v * u + 900 * u * u; dr += circD(cx + dx, py + dy, 9 * (1 - u * 0.5)); }
      m += P(dr, ol('#BFF0FF', 3)) + P(`M${cx - 80} ${py} Q${cx - 60} ${f(py - 160 * Math.sin(u * Math.PI))} ${cx - 30} ${py} Q${cx} ${f(py - 220 * Math.sin(u * Math.PI))} ${cx + 30} ${py} Q${cx + 60} ${f(py - 160 * Math.sin(u * Math.PI))} ${cx + 80} ${py} Z`, { fill: '#DDF6FF', stroke: LINE, 'stroke-width': 4, opacity: f(1 - u * 0.6) });
    }
  }
  // low picket fence along the neighbour's yard
  {
    let d = '';
    for (let x = 1300; x < 2700; x += 34) d += `M${x} 912 L${x} 862 L${x + 12} 850 L${x + 24} 862 L${x + 24} 912 Z `;
    m += R(1300, 872, 1400, 10, 0, ol('#FFFFFF', 3)) + P(d, ol(nite ? '#C9CEF0' : '#FFFFFF', 3.5));
  }
  // big tree (left), bushes, path, mailbox
  m += tree(250, 830, 1.4, { col: nite ? '#1C3646' : eve ? '#6F8A52' : '#3FA650', hi: nite ? '#284C60' : '#6CCB6A', trunk: nite ? '#3A2A3A' : '#8A5A33', sway: Math.sin(t * 0.8) * 1.2 });
  m += poly([[700, 800], [820, 800], [880, 916], [640, 916]], { fill: '#D9D2C2', stroke: LINE, 'stroke-width': 4 });
  let stones = '';
  for (let i = 0; i < 5; i++) { const y = 812 + i * 22, w = 50 + i * 8; stones += ellD(760 - w * 0.55, y, w * 0.4, 7) + ellD(760 + w * 0.55, y + 10, w * 0.4, 7); }
  m += P(stones, { fill: '#BDB4A0' });
  m += G(R(-6, -110, 12, 110, 3, ol('#8A5A33', 4)) + R(-40, -150, 80, 46, 20, ol('#3DA8D8', 5)) + R(-40, -130, 80, 26, 0, { fill: '#3DA8D8' }) + R(36, -150, 6, 34, 2, ol('#E8243C', 2)) + TF('742', 0, -112, 15, '#FFFFFF'), 'translate(1120 920)');
  // the pit left by a lifted house
  if (lift > 0) {
    const k = clamp(lift * 4, 0, 1);
    m += E(760, 800, 340 * k, 34 * k, ol('#5A3A20', 6)) + E(760, 806, 300 * k, 22 * k, { fill: '#2A1A10' }) + P(`M${760 - 360 * k} 806 q20 -24 46 -6 q16 -20 40 0 M${760 + 300 * k} 804 q20 -24 46 -6 q16 -20 40 4`, { fill: '#8A5A3A', stroke: LINE, 'stroke-width': 4 });
  }
  // sidewalk, curb, road (calm)
  m += band(915, 962, '#E6E2EE') + P(Array.from({ length: 24 }, (_, i) => `M${-400 + i * 140} 915 L${-430 + i * 140} 962`).join(' '), ln(3, '#C9C3D6')) + band(962, 976, '#C3BFD0') + band(976, YB, 'url(#setsRoad)');
  m += P(`M${XL} 915 H${XR} M${XL} 962 H${XR} M${XL} 976 H${XR}`, ln(4, LINE, 0.6));
  // ---- the house (lifted)
  let hs = '';
  if (opts.house !== false) {
    const hy = 800 - lift * 640 + (lift > 0 ? Math.sin(t * 2.2) * 8 * lift : 0);
    hs = house(760, hy, 0.85, { time, uprooted: lift > 0 ? clamp(lift * 3, 0, 1) : 0, tilt: lift * (6 + Math.sin(t * 1.6) * 3), tail: opts.tail ? t : false });
    const bc = nite ? '#24563A' : eve ? '#5E9A4E' : '#3FA650';
    if (lift <= 0) hs += blob([[440, 790, 34], [480, 772, 40], [520, 792, 30]], bc, 5) + blob([[1000, 792, 30], [1040, 772, 40], [1080, 790, 34]], bc, 5) + P(circD(470, 768, 9) + circD(1050, 770, 9), { fill: '#FFFFFF', opacity: 0.25 });
  }
  let light = '';
  if (nite) light = cover('#0B0E36', { opacity: 0.3 });
  else if (eve) light = cover('#FF7A3D', { opacity: 0.08 });
  return { bg, mid: m, front: hs, fg: '', light };
}
const houseExterior = makeSet(houseExteriorLayers);

// ================================================================= 6. STREETS
// pigeon(x, y, s, t, opts): origin = feet. Side view facing LEFT (opts.flip faces right). ~130 px tall at s = 1.
// opts: { state 'idle'|'peck'|'walk'|'steal'|'fly', sandwich (in its beak; default true for 'steal'), lift px (fly) }
function pigeon(x, y, s = 1, t = 0, opts = {}) {
  const st = opts.state || 'idle';
  const peck = st === 'peck' ? Math.max(0, Math.sin(t * 9)) : st === 'idle' ? Math.max(0, Math.sin(t * 2.2)) * 0.2 : 0;
  const bob = st === 'walk' ? Math.abs(Math.sin(t * 10)) * 5 : 0;
  const fly = st === 'fly', lift = fly ? (opts.lift ?? 0) : 0;
  let o = E(0, 0, 44, 7, { fill: '#000', opacity: fly ? 0.08 : 0.16 });
  if (!fly) {
    const ph = st === 'walk' ? Math.sin(t * 10) * 10 : 0;
    o += P(`M-8 -24 L${f(-10 + ph)} 0 M-20 0 L${f(-2 + ph)} 0 M10 -24 L${f(10 - ph)} 0 M2 0 L${f(18 - ph)} 0`, ln(5, '#E8708A'));
  } else o += P('M-6 -26 L-14 -12 M10 -26 L6 -12', ln(5, '#E8708A'));
  let body = P('M-44 -66 Q-62 -32 -26 -20 Q18 -12 54 -32 L92 -46 L84 -58 Q62 -54 46 -66 Q8 -90 -44 -66 Z', ol('#A3ACC0', 4.5));
  body += P('M60 -36 L90 -46 L84 -56 L66 -52 Z', { fill: '#4A5068' }) + P('M-30 -26 Q10 -18 44 -34', ln(4, '#C9D0DC', 0.8));
  if (fly) {
    const fl = Math.sin(t * 22);
    body += P(`M-6 -64 Q22 ${f(-110 - 60 * fl)} 64 ${f(-100 - 80 * fl)} Q40 -66 26 -58 Z`, ol('#C3CAD8', 4)) + P(`M10 ${f(-82 - 20 * fl)} L40 ${f(-90 - 40 * fl)}`, ln(4, '#4A5068'));
  } else body += P('M-14 -68 Q30 -80 66 -50 Q32 -40 -8 -46 Z', ol('#C3CAD8', 4)) + P('M14 -64 L22 -50 M30 -62 L38 -50', ln(5, '#4A5068'));
  const hy = -92 + peck * 58, hx = -50 - peck * 14;
  let head = P(`M-30 -64 Q-40 -80 ${f(hx + 4)} ${f(hy + 8)}`, ln(28, LINE)) + P(`M-30 -64 Q-40 -80 ${f(hx + 4)} ${f(hy + 8)}`, ln(20, '#6FB89E')) + P(`M-28 -60 Q-36 -72 ${f(hx + 8)} ${f(hy + 16)}`, ln(8, '#A07ACB', 0.85));
  head += CI(hx, hy, 19, ol('#8E98AE', 4.5)) + CI(hx - 6, hy - 4, 6.5, ol('#FF9A3D', 2)) + CI(hx - 7, hy - 4, 2.6, { fill: LINE });
  head += P(`M${f(hx - 16)} ${f(hy + 1)} L${f(hx - 34)} ${f(hy + 6)} L${f(hx - 16)} ${f(hy + 9)} Z`, ol('#4A4E5C', 2.5)) + E(hx - 15, hy - 1, 4, 3, { fill: '#FFFFFF' });
  if (opts.sandwich ?? st === 'steal') head += G(P('M0 0 L50 -10 L46 30 Z', ol('#F4D9A0', 3)) + P('M4 6 L46 -2', ln(5, '#5CB85A')) + P('M8 12 L44 8', ln(5, '#E8243C')) + P('M0 0 L50 -10', ln(4, '#E2B870')), `translate(${f(hx - 58)} ${f(hy + 2)}) rotate(-10)`);
  o += G(body + head, `translate(0 ${f(-bob)})`);
  return G(o, `translate(${f(x)} ${f(y - lift)}) scale(${f(opts.flip ? -s : s)} ${f(s)})`);
}
function mailbox(x, y, s = 1, col = '#3DA8D8', flag = true) {
  let o = R(-8, -150, 16, 150, 3, ol('#8A5A33', 4)) + P('M-46 -150 L-46 -196 Q-46 -224 0 -224 Q46 -224 46 -196 L46 -150 Z', ol(col, 5)) + R(-50, -154, 100, 10, 4, ol(mix(col, '#000000', 0.2), 3));
  o += R(42, flag ? -232 : -190, 8, 46, 2, ol('#E8243C', 2.5)) + (flag ? R(42, -232, 26, 16, 2, ol('#E8243C', 2.5)) : '') + P('M-30 -206 Q0 -216 30 -206', ln(4, '#FFFFFF', 0.5));
  return G(o, tr(x, y, s));
}
function lampPost(x, y, s = 1, opts = {}) {
  const on = opts.on ?? 0, col = opts.col || '#2E3550', glow = opts.glow || 'setsGlowWarm';
  let o = R(-9, -420, 18, 420, 4, ol(col, 5)) + R(-26, -18, 52, 20, 4, ol(col, 5)) + P('M0 -412 Q0 -450 50 -450', ln(14, LINE)) + P('M0 -412 Q0 -450 50 -450', ln(7, col));
  o += P('M28 -456 L72 -456 L82 -426 L18 -426 Z', ol(col, 5)) + R(24, -430, 52, 10, 4, { fill: on > 0.05 ? '#FFF4B8' : '#B9B4C8', stroke: LINE, 'stroke-width': 3 });
  if (on > 0.02) o += glowSpot(50, -420, 170, glow, on) + P('M24 -420 L76 -420 L150 0 L-50 0 Z', { fill: opts.beam || '#FFF2B0', opacity: f(0.12 * on) });
  return G(o, tr(x, y, s));
}
function suburbHouse(x, y, s, i, pal) {
  const [wall, roof, door] = pal[i % pal.length];
  const w = 380 + 80 * hash(i * 2.3), h = 230 + 60 * hash(i * 3.1), flat = hash(i * 7.7) > 0.72;
  let o = R(-w / 2, -h, w, h, 4, ol(wall, 6)) + R(w / 2 - 28, -h + 6, 22, h - 12, 3, { fill: '#000', opacity: 0.07 });
  if (flat) o += R(-w / 2 - 16, -h - 30, w + 32, 36, 8, ol(roof, 6));
  else o += P(`M${-w / 2 - 30} ${-h + 10} L0 ${-h - h * 0.62} L${w / 2 + 30} ${-h + 10} Z`, ol(roof, 6)) + CI(0, -h - h * 0.26, 18, ol('#FFF6E2', 4));
  const wy = -h + 50;
  o += houseWin(-w / 2 + 40, wy, 90, 84, pal.lit) + houseWin(w / 2 - 130, wy, 90, 84, pal.lit);
  o += R(-34, -150, 68, 150, 8, ol(door, 5)) + CI(20, -76, 5, { fill: '#FFC23A', stroke: LINE, 'stroke-width': 2 });
  return G(o, tr(x, y, s));
}
const STREET_PAL = [['#FFD6E6', '#E8506E', '#3DA8D8'], ['#CFE3FF', '#4A63E8', '#E8243C'], ['#D9F5C9', '#2FA37A', '#8A5AD8'], ['#FFE6B0', '#F28A2E', '#2F7290'], ['#E8D6FF', '#8A4FD8', '#FFC23A'], ['#FFD1B0', '#C8553D', '#3FA650']];

// street(t, cam, opts): the suburban MORNING street YOU walk along to school (long: world x -1200..7200, walk right).
// cam = { x, y, zoom } (K.camKeys): layers get parallax (sky 0, hills .2, houses .55, sidewalk 1, branches 1.25).
// Sidewalk stand line y 940 (FLOOR.street, hero s .5); mailboxes stand at the lawn edge (y 884) every 640 px,
// lamp posts every 1280, a hydrant. Road below y 975 (calm, captions).
// opts: { time 'morning'|'day'|'evening', pigeon: { x, state, sandwich, lift, flip } | false (default x 1500 idle) }
// street.layers(t, cam, opts) -> { bg, mid, fg } (already transformed by the camera).
function streetLayers(t, cam = {}, opts = {}) {
  const time = opts.time || 'morning', eve = time === 'evening';
  let bg = sky(t, time, 960, 300, 1920, 600, { clouds: 4, sunX: 0.2, sunY: time === 'morning' ? 0.62 : eve ? 0.8 : 0.18 });
  // far hills + trees (k .2)
  const [h0, h1] = visX(cam, 0.2, 600);
  let far = '';
  const hc = eve ? '#B98AA8' : '#9ED6A0', hc2 = eve ? '#9A6E92' : '#7FC08A';
  let blobs = [];
  for (let i = Math.floor(h0 / 260); i * 260 < h1; i++) blobs.push([i * 260 + hash(i * 1.3) * 80, 640 - hash(i * 2.1) * 40, 110 + 50 * hash(i * 4.4)]);
  far += blob(blobs, hc, 0) + R(h0, 630, h1 - h0, 130, 0, { fill: hc });
  let trees = [];
  for (let i = Math.floor(h0 / 180); i * 180 < h1; i++) trees.push([i * 180 + hash(i * 5.1) * 60, 690 - hash(i * 3.7) * 20, 60 + 30 * hash(i * 6.2)]);
  far += blob(trees, hc2, 0);
  // houses (k .55)
  const [x0, x1] = visX(cam, 0.55, 500);
  let hs = R(x0, 700, x1 - x0, 500, 0, { fill: eve ? '#8DB45E' : '#79D46A' });
  for (let i = Math.floor((x0 + 300) / 620); i * 620 - 300 < x1; i++) {
    const hx = i * 620 - 300 + hash(i * 9.3) * 60;
    hs += suburbHouse(hx, 760, 0.62, ((i % 6) + 6) % 6, STREET_PAL);
    hs += blob([[hx - 160, 760, 30], [hx - 120, 748, 36], [hx + 140, 756, 30], [hx + 176, 746, 34]], '#3FA650', 4);
    if (hash(i * 4.9) > 0.5) hs += tree(hx + 300, 770, 0.62, { col: '#4CB65A', hi: '#7CD978' });
  }
  hs += R(x0, 760, x1 - x0, 440, 0, { fill: eve ? '#8DB45E' : '#6CCB5F' });
  // front strip (k 1): lawn edge, mailboxes, sidewalk, road
  const [m0, m1] = visX(cam, 1, 400);
  const bw = (y0, y1, fill) => R(m0, y0, m1 - m0, y1 - y0, 0, { fill });
  let m = bw(800, 884, eve ? '#86AE58' : '#62C258') + bw(800, 884, 'url(#setsLawn)');
  m += bw(884, 968, '#E9E5F0') + bw(968, 980, '#C3BFD0') + bw(980, YB + 400, 'url(#setsRoad)');
  let joints = '';
  for (let x = Math.floor(m0 / 150) * 150; x < m1; x += 150) joints += `M${x} 884 L${x - 30} 968 `;
  m += P(joints, ln(3, '#C9C3D6')) + P(`M${f(m0)} 884 H${f(m1)} M${f(m0)} 968 H${f(m1)} M${f(m0)} 980 H${f(m1)}`, ln(4, LINE, 0.55));
  const MBC = ['#3DA8D8', '#E8243C', '#2E3550', '#5CB85A', '#FFC23A'];
  for (let i = Math.floor(m0 / 640); i * 640 < m1; i++) {
    const x = i * 640 + 120;
    m += mailbox(x, 888, 0.95, MBC[((i % 5) + 5) % 5], hash(i * 3.3) > 0.4);
    if (i % 2 === 0) m += lampPost(x + 320, 890, 0.95, { on: eve ? 0.8 : 0 });
    if (((i % 5) + 5) % 5 === 3) m += G(R(-22, -60, 44, 54, 10, ol('#E8243C', 4)) + R(-30, -66, 60, 14, 6, ol('#E8243C', 4)) + CI(0, -36, 9, ol('#FFC23A', 3)) + R(-12, -6, 24, 8, 2, ol('#C81E30', 3)), `translate(${x + 200} 900)`);
    if (((i % 4) + 4) % 4 === 1) m += G(R(-34, -104, 68, 104, 8, ol('#3FA650', 4)) + R(-38, -112, 76, 16, 6, ol('#2F8A40', 4)) + P('M-14 -80 h28', ln(4, '#2F8A40')), `translate(${x + 460} 892)`);
  }
  const pg = opts.pigeon === false ? null : { x: 1500, state: 'idle', ...(opts.pigeon || {}) };
  if (pg) m += pigeon(pg.x, 944, pg.s ?? 1.2, t, pg);
  // fg: branches hanging in from the top (k 1.25)
  const [f0, f1] = visX(cam, 1.25, 600);
  let fg = '';
  for (let i = Math.floor(f0 / 2300); i * 2300 < f1; i++) {
    const bx = i * 2300 + 400;
    fg += P(`M${bx - 300} -60 Q${bx - 100} 30 ${bx + 120} 60`, ln(26, LINE)) + P(`M${bx - 300} -60 Q${bx - 100} 30 ${bx + 120} 60`, ln(16, '#8A5A33')) + blob([[bx - 120, 40, 70], [bx, 70, 80], [bx + 120, 50, 64], [bx + 40, -10, 70]], '#3FA650', 6) + P(circD(bx - 40, 30, 24) + circD(bx + 90, 40, 16), { fill: '#7CD978', opacity: 0.8 });
  }
  return { bg: bg + layer(far, cam, 0.2), mid: layer(hs, cam, 0.55) + layer(m, cam, 1), fg: layer(fg, cam, 1.25) };
}
const street = (t = 0, cam = {}, opts = {}) => { const L = streetLayers(t, cam, opts); return L.bg + L.mid + L.fg; };
street.layers = streetLayers;

// streetSign(x, y, s, t, opts): green street sign on a pole, origin = pole base, ~560 px tall at s = 1.
// opts: { text ('SERVER STREET'), text2 (cross blade, 'PING AVE'; false = none), flicker 0..1 (the letters glitch like loading) }
function streetSign(x, y, s = 1, t = 0, opts = {}) {
  const txt = opts.text || 'SERVER STREET', txt2 = opts.text2 === undefined ? 'PING AVE' : opts.text2, fl = opts.flicker ?? 0;
  let o = R(-10, -560, 20, 560, 4, ol('#5A6070', 5)) + R(-22, -16, 44, 18, 4, ol('#5A6070', 4)) + CI(0, -566, 12, ol('#5A6070', 4));
  if (txt2) o += G(R(-60, -26, 120, 52, 8, ol('#1E8A4E', 5)) + R(-52, -18, 104, 36, 5, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3 }) + T(txt2, 0, 9, 22, '#FFFFFF'), 'translate(0 -458) scale(0.85 1)');
  const glitch = fl > 0 && hash(Math.floor(t * 9)) < fl * 0.5;
  let blade = R(-220, -40, 440, 80, 10, ol('#1E8A4E', 6)) + R(-208, -28, 416, 56, 6, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4 });
  const fs = Math.min(48, 380 / (txt.length * 0.56));
  blade += T(txt, glitch ? 6 : 0, fs * 0.36, fs, '#FFFFFF', { 'letter-spacing': 2 });
  if (glitch) blade += T(txt, -6, fs * 0.36, fs, '#3DFF9A', { opacity: 0.6, 'letter-spacing': 2 }) + R(-208, -6 + hash(Math.floor(t * 9) + 1) * 20, 416, 8, 0, { fill: '#B06BFF', opacity: 0.7 });
  o += G(blade, 'translate(0 -520)');
  return G(o, tr(x, y, s));
}
// tumbleweed(x, y, s, t, opts): origin = ground contact; rolls with opts.rot (deg) or by x
function tumbleweed(x, y, s = 1, opts = {}) {
  const r = 70, rot = opts.rot ?? x * 0.9;
  let d = '';
  for (let i = 0; i < 7; i++) { const a = i * 0.9; d += ellD(Math.cos(a) * 14, Math.sin(a) * 10, r * (0.6 + 0.3 * hash(i)), r * (0.35 + 0.25 * hash(i * 2))); }
  return G(E(0, 4, 60, 9, { fill: '#000', opacity: 0.18 }) + G(P(d, { fill: 'none', stroke: LINE, 'stroke-width': 9 }) + P(d, { fill: 'none', stroke: '#B9925A', 'stroke-width': 4.5 }), `translate(0 ${-r}) rotate(${f(rot)})`), tr(x, y, s));
}

// serverStreet(t, cam, opts): the street that shouldn't exist. Violet dusk, a row of IDENTICAL houses whose windows
// blink like server LEDs, cables with data pulses, flickering lamps that "load" (spinner dots), low mist.
// The "SERVER ST" sign stands at world x 380 (SPOTS.serverStreet.sign); the garage sale glows at x 2600 (sale:false
// hides it) — cut to garageSale(t) for the close set. Stand line y 940 (FLOOR.serverStreet). Long: x -1200..4800.
// opts: { flicker 0..1 (default 1), sale (default true), cam parallax as street() }.  serverStreet.layers -> { bg, mid, fg }
def(lg('setsMist', [[0, '#C9A8FF', 0], [0.5, '#C9A8FF', 0.35], [1, '#E6D2FF', 0.55]]));
function serverStreetLayers(t, cam = {}, opts = {}) {
  const fl = opts.flicker ?? 1;
  let bg = sky(t, 'dusk', 960, 300, 1920, 600);
  let st = '';
  for (let i = 0; i < 30; i++) st += circD(hash(i * 3.1) * 2400 - 240, hash(i * 7.3) * 420, 1.5 + hash(i) * 2);
  bg += P(st, { fill: '#FFFFFF', opacity: 0.6 }) + glowSpot(1460, 210, 260, 'setsGlowViolet', 0.6) + CI(1460, 210, 70, ol('#F4E8FF', 5)) + P(circD(1432, 190, 12) + circD(1482, 236, 9) + circD(1490, 180, 6), { fill: '#DCCBF4' });
  // far: identical rooftops row (k .25)
  const [h0, h1] = visX(cam, 0.25, 600);
  let far = R(h0, 640, h1 - h0, 360, 0, { fill: '#3A2470' });
  for (let i = Math.floor(h0 / 200); i * 200 < h1; i++) { const x = i * 200; far += P(`M${x} 650 L${x} 590 L${x + 80} 540 L${x + 160} 590 L${x + 160} 650 Z`, { fill: '#2E1C5C' }) + R(x + 66, 600, 18, 14, 2, { fill: hash(i + Math.floor(t * 2)) > 0.5 ? '#3DFF9A' : '#4A2E86' }); }
  // houses (k .55): the SAME house over and over, LED windows
  const [x0, x1] = visX(cam, 0.55, 500);
  let hs = R(x0, 700, x1 - x0, 500, 0, { fill: '#3E2A78' });
  for (let i = Math.floor((x0 + 300) / 640); i * 640 - 300 < x1; i++) {
    const hx = i * 640 - 300;
    let h = R(-200, -260, 400, 260, 4, ol('#5A4A9A', 6)) + P('M-232 -250 L0 -420 L232 -250 Z', ol('#2E2466', 6)) + CI(0, -322, 18, ol('#1E1640', 4));
    for (const wx of [-150, 60]) {
      h += R(wx, -210, 90, 84, 4, ol('#1A1238', 5));
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const on = hash(i * 31 + wx + r * 7 + c * 3 + Math.floor(t * (3 + hash(i + r) * 4))) > 0.4;
        h += R(wx + 10 + c * 20, -198 + r * 24, 12, 8, 2, { fill: on ? (hash(r + c + i) > 0.7 ? '#FFB13B' : '#3DFF9A') : '#2E2466' });
      }
    }
    h += R(-34, -150, 68, 150, 6, ol('#2E2466', 5)) + CI(20, -76, 5, { fill: '#3DFF9A' }) + P('M120 -420 L120 -480 M100 -470 L140 -470 M106 -456 L134 -456', ln(5, '#1E1640'));
    hs += G(h, tr(hx, 770, 0.62));
    hs += tree(hx + 290, 780, 0.55, { col: '#3A2E7A', hi: '#5A4AA8', trunk: '#2A1E4A' });
  }
  // cables with data pulses
  let cab = '', pul = '';
  for (let i = Math.floor((x0 + 300) / 640) - 1; i * 640 - 300 < x1 + 640; i++) {
    const a = i * 640 - 300 + 74, b = a + 640;
    cab += `M${a} 470 Q${a + 320} 540 ${b} 470 `;
    const u = md(t * 0.45 + hash(i * 3.3), 1), px = lerp(a, b, u), py = 470 + Math.sin(u * Math.PI) * 52;
    pul += circD(px, py, 6);
  }
  hs += P(cab, ln(4, '#1E1640')) + P(pul, { fill: '#7DFFB8' });
  hs += R(x0, 760, x1 - x0, 440, 0, { fill: '#4A3A8A' });
  // front strip (k 1)
  const [m0, m1] = visX(cam, 1, 400);
  const bw = (y0, y1, fill) => R(m0, y0, m1 - m0, y1 - y0, 0, { fill });
  let m = bw(800, 884, '#3E2E7E') + bw(884, 968, '#6A5AA8') + bw(968, 980, '#54468E') + bw(980, YB + 400, '#2E2458');
  let joints = '';
  for (let x = Math.floor(m0 / 150) * 150; x < m1; x += 150) joints += `M${x} 884 L${x - 30} 968 `;
  m += P(joints, ln(3, '#5A4A98')) + P(`M${f(m0)} 884 H${f(m1)} M${f(m0)} 968 H${f(m1)}`, ln(4, LINE, 0.6));
  for (let i = Math.floor(m0 / 900); i * 900 < m1; i++) {
    const x = i * 900 + 700;
    // flickering "loading" lamp
    const ph = t * 1.4 + i * 0.7, flick = fl > 0 ? (hash(Math.floor(t * 12) + i * 7) < 0.18 * fl ? 0.15 : 0.6 + 0.4 * Math.sin(ph * 3)) : 0.9;
    m += lampPost(x, 890, 1, { on: flick, col: '#1E1640', glow: 'setsGlowViolet', beam: '#E6D2FF' });
    let dots = '';
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, on = md(Math.floor(ph * 8) - k, 8) < 3; if (on) dots += circD(x + 50 + Math.cos(a) * 17, 890 - 404 + Math.sin(a) * 17, 4.5); }
    m += P(dots, { fill: '#F4E8FF', opacity: 0.9 });
  }
  const SX = 380;
  m += streetSign(SX, 892, 0.82, t, { flicker: fl * 0.6 });
  if (opts.sale !== false) {
    const gx = 2600;
    m += G(R(-6, -170, 12, 170, 3, ol('#8A5A33', 4)) + G(R(-90, -50, 180, 92, 6, ol('#D9B47A', 5)) + T('GARAGE', 0, -10, 34, '#3A2A55') + T('SALE →', 0, 26, 32, '#E8243C'), 'translate(0 -170) rotate(-4)'), `translate(${gx - 300} 892)`);
    m += glowSpot(gx + 200, 720, 300, 'setsGlowWarm', 0.7);
  }
  // mist (fg-ish but in mid so characters stand in it)
  const mist = R(m0 - 400, 760, m1 - m0 + 800, 220, 0, { fill: 'url(#setsMist)', opacity: 0.55 + 0.1 * Math.sin(t * 0.7) });
  return { bg: bg + layer(far, cam, 0.25), mid: layer(hs, cam, 0.55) + layer(m + mist, cam, 1), fg: '' };
}
const serverStreet = (t = 0, cam = {}, opts = {}) => { const L = serverStreetLayers(t, cam, opts); return L.bg + L.mid + L.fg; };
serverStreet.layers = serverStreetLayers;

// ---------------------------------------------------------------- the garage sale (close set on Server Street)
// garageSale(t, opts): an open garage glowing under bare bulbs at violet dusk; two folding tables of odd junk.
// Left table (top y 700): a bubbling LAVA LAMP, cassettes, a rotary phone, a snow globe with a tiny server inside.
// Right table (top y 690): THE LAPTOP on a doily with a "$1" tag (SPOTS.garageSale.laptop), the stuffed owl on a
// perch. The tiny OLD MAN stands behind the right table (SPOTS.garageSale.oldman; layers.front = table skirts).
// opts: { gone 0..1 (the whole sale vanishes in a pixel shimmer — bulbs, then junk, then the garage + house: at 1 an
//   empty lawn), tumble 0..1 (tumbleweed position across the frame; default rolls by t once gone > .6),
//   laptop:false (already sold), glow (laptop glow, default .5) }
// Stand line y 965 on the driveway (FLOOR.garageSale).
def(lg('setsGarageIn', [[0, '#3A2A2A'], [1, '#5A3E30']]));
def(lg('setsDrive', [[0, '#8A7EA8'], [1, '#6A5E8C']]));
function vanish(svg, k, box, seed = 1) {
  if (k <= 0) return svg;
  if (k >= 1) return '';
  const [x, y, w, h] = box;
  const jx = (hash(seed + Math.floor(k * 30)) - 0.5) * 30 * k;
  let px = '';
  for (let i = 0; i < 16; i++) {
    const u = hash(seed * 3 + i * 1.7), v = hash(seed * 5 + i * 2.9), sz = 14 + 22 * hash(i * 4.1 + seed);
    const yy = y + v * h - k * 220 * (0.5 + u);
    px += `M${f(x + u * w)} ${f(yy)} h${f(sz)} v${f(sz)} h${f(-sz)} Z `;
  }
  return G(svg, `translate(${f(jx)} 0)`, { opacity: f(1 - k) }) + P(px, { fill: '#F1DDFF', opacity: f(Math.sin(k * Math.PI) * 0.9) });
}
function lavaLamp(x, y, s, t) {
  let o = P('M-18 0 L-30 -40 L30 -40 L18 0 Z', ol('#C9B87A', 4)) + P('M-30 -40 L-22 -150 L22 -150 L30 -40 Z', ol('#FF6FA8', 4)) + P('M-22 -150 L-14 -176 L14 -176 L22 -150 Z', ol('#C9B87A', 4));
  for (let i = 0; i < 3; i++) { const ph = md(t * 0.22 + i / 3, 1); o += E(Math.sin(t + i * 2) * 6, -50 - ph * 90, 10 - 3 * Math.sin(ph * Math.PI * 2), 12 + 4 * Math.sin(ph * Math.PI), { fill: '#FFE14D' }); }
  return glowSpot(x, y - 90 * s, 130 * s, 'setsGlowWarm', 0.55) + G(o, tr(x, y, s));
}
function stuffedOwl(x, y, s, t) {
  const look = Math.sin(t * 0.5) > 0.6 ? 6 : 0;
  let o = R(-50, -6, 100, 12, 4, ol('#8A5A33', 4)) + R(-6, -6, 12, 40, 3, ol('#8A5A33', 3));
  o += E(0, -80, 52, 76, ol('#9A6A3E', 5)) + E(0, -62, 34, 48, { fill: '#D9B88A' }) + P('M-24 -50 l8 8 l8 -8 M0 -40 l8 8 l8 -8 M-12 -28 l8 8 l8 -8', ln(3, '#9A6A3E'));
  o += P('M-46 -140 L-30 -118 L-16 -144 Z M46 -140 L30 -118 L16 -144 Z', ol('#9A6A3E', 4));
  o += CI(-20, -112, 20, ol('#FFE14D', 4)) + CI(20, -112, 20, ol('#FFE14D', 4)) + CI(-20 + look, -112, 9, { fill: LINE }) + CI(20 + look, -112, 9, { fill: LINE }) + CI(-17 + look, -115, 3, { fill: '#FFFFFF' }) + CI(23 + look, -115, 3, { fill: '#FFFFFF' });
  o += P('M-6 -96 L6 -96 L0 -84 Z', ol('#FFB13B', 2.5)) + P('M-40 -60 Q-60 -30 -36 0 M40 -60 Q60 -30 36 0', ln(6, '#7A4A2A'));
  return G(o, tr(x, y, s));
}
function garageSaleLayers(t, opts = {}) {
  const gone = bool01(opts.gone);
  const gk = (a, b) => clamp((gone - a) / (b - a), 0, 1);
  // bg: dusk + identical silhouettes
  let bg = sky(t, 'dusk', 960, 260, 1920, 520) + glowSpot(320, 180, 220, 'setsGlowViolet', 0.5) + CI(320, 180, 54, ol('#F4E8FF', 4));
  let sil = '';
  for (let i = -1; i < 7; i++) sil += `M${i * 340} 640 L${i * 340} 560 L${i * 340 + 120} 480 L${i * 340 + 240} 560 L${i * 340 + 240} 640 Z `;
  bg += P(sil, { fill: '#2E1C5C' }) + band(630, 760, '#33226A');
  // mid: lawn (always), house + garage + driveway (vanish)
  let m = band(700, YB, '#4E3E8E') + band(700, YB, 'url(#setsLawn)');
  let H = '';
  H += R(1320, 260, 620, 470, 0, ol('#6A5AA8', 6)) + P('M1290 270 L1630 90 L1970 270 Z', ol('#2E2466', 6)) + houseWin(1440, 360, 130, 130, true, '') + R(1690, 470, 110, 260, 8, ol('#2E2466', 5)) + CI(1772, 600, 6, { fill: '#FFC23A' });
  H += R(360, 300, 960, 430, 0, ol('#6A5AA8', 6)) + P('M330 310 L840 170 L1350 310 Z', ol('#2E2466', 6)) + R(420, 350, 840, 380, 6, ol('url(#setsGarageIn)', 6));
  H += R(430, 360, 820, 46, 4, ol('#8A7EA8', 4)) + P('M440 384 H1240', ln(3, '#6A5E8C'));
  // garage interior: shelves with boxes, a bike, hanging bulb
  H += R(450, 470, 280, 12, 3, ol('#8A5A33', 3)) + R(460, 430, 70, 40, 4, ol('#D9B47A', 3)) + R(540, 440, 90, 30, 4, ol('#C9A46A', 3)) + R(640, 426, 60, 44, 4, ol('#D9B47A', 3));
  H += R(950, 470, 280, 12, 3, ol('#8A5A33', 3)) + R(970, 424, 60, 46, 4, ol('#C9A46A', 3)) + TF('XMAS', 1000, 452, 12, '#8A3A2A') + R(1050, 440, 120, 30, 4, ol('#D9B47A', 3));
  H += G(CI(-60, 0, 40, ln(7)) + CI(60, 0, 40, ln(7)) + P('M-60 0 L-10 -50 L40 -50 L60 0 M-10 -50 L0 0', ln(6, '#E8243C')), 'translate(840 540) scale(0.9)');
  m += vanish(H, gk(0.35, 0.95), [360, 170, 1600, 560], 3);
  const drive = poly([[430, 730], [1250, 730], [1600, 1300], [80, 1300]], { fill: 'url(#setsDrive)', stroke: LINE, 'stroke-width': 5 }) + P('M840 740 L840 1300', ln(4, '#5A4E7C', 0.6));
  m += vanish(drive, gk(0.4, 1), [80, 730, 1520, 300], 4);
  // tables + junk
  let J = '';
  const table = (x0, x1, top) => R(x0, top - 10, x1 - x0, 18, 4, ol('#E9E4F2', 4)) + P(`M${x0 + 20} ${top + 8} L${x0 + 60} ${top + 170} M${x1 - 20} ${top + 8} L${x1 - 60} ${top + 170}`, ln(8, '#5A5070'));
  J += table(200, 640, 700) + table(760, 1280, 690);
  J += lavaLamp(270, 690, 0.95, t);
  J += G([['#FF6FA8', 0], ['#3DA8FF', -14], ['#FFE14D', -28], ['#5CDB6B', -42]].map(([c, dy]) => R(-34, dy - 14, 68, 14, 2, ol(c, 3)) + R(-18, dy - 11, 36, 8, 2, { fill: '#2A2D38' })).join(''), 'translate(370 692)');
  J += G(P('M-40 0 L-30 -36 L30 -36 L40 0 Z', ol('#E8243C', 4)) + CI(0, -22, 16, ol('#F4E8FF', 3)) + P('M-36 -40 Q0 -64 36 -40', ln(10, LINE)) + P('M-36 -40 Q0 -64 36 -40', ln(5, '#E8243C')), 'translate(470 692)');
  J += G(E(0, 0, 30, 8, ol('#8A5A33', 3)) + CI(0, -34, 32, { fill: '#DDEBFF', 'fill-opacity': 0.7, stroke: LINE, 'stroke-width': 4 }) + R(-10, -48, 20, 34, 3, ol('#2A2D38', 2.5)) + CI(-4, -40, 2, { fill: '#3DFF9A' }) + CI(4, -32, 2, { fill: '#FFB13B' }), 'translate(570 692)');
  J += G(R(-46, -22, 92, 22, 3, ol('#2A2D38', 3)) + TF('VHS', 0, -6, 13, '#FFFFFF'), 'translate(560 734) rotate(8)');
  // right table: doily + laptop + $1 tag, candle, owl
  J += E(1000, 690, 120, 14, { fill: '#FFFFFF', opacity: 0.9, stroke: '#D9D2E6', 'stroke-width': 3, 'stroke-dasharray': '6 5' });
  if (opts.laptop !== false) J += laptop(1000, 692, 0.36, '', { off: true, glow: opts.glow ?? 0.5, t, dust: 1 }) + G(R(-26, -16, 52, 32, 4, ol('#FFF2C8', 3)) + T('$1', 0, 10, 24, '#E8243C') + P('M-26 0 L-50 -18', ln(2)), 'translate(1130 650) rotate(10)');
  J += G(R(-8, -40, 16, 40, 3, ol('#F4E8FF', 3)) + P(`M0 -40 Q${f(-6 + Math.sin(t * 9) * 3)} -54 0 -64 Q6 -54 0 -40 Z`, ol('#FFB13B', 2)), 'translate(860 690)') + glowSpot(860, 630, 60, 'setsGlowWarm', 0.8);
  J += stuffedOwl(1210, 680, 0.95, t);
  // ground junk: FREE box, coat rack, old TV, sign
  J += G(R(-70, -70, 140, 70, 4, ol('#D9B47A', 4)) + P('M-70 -70 L-90 -96 M70 -70 L90 -94', ln(5, '#C9A46A')) + T('FREE', 0, -26, 30, '#3A2A55') + P('M-30 -70 Q-20 -100 0 -96 Q16 -92 20 -70', { fill: '#FFE14D', stroke: LINE, 'stroke-width': 3 }), 'translate(130 880)');
  J += G(R(-60, -110, 120, 100, 14, ol('#5A5070', 5)) + R(-48, -98, 80, 76, 8, { fill: '#9A9AB8' }) + P(Array.from({ length: 5 }, (_, i) => `M-44 ${-92 + i * 15 + (Math.floor(t * 12) % 3) * 3} h${f(50 + 20 * hash(i + Math.floor(t * 12)))}`).join(' '), ln(3, '#FFFFFF', 0.7)) + CI(46, -80, 6, ol('#C9B87A', 2)) + CI(46, -56, 6, ol('#C9B87A', 2)) + P('M-40 -10 L-50 6 M40 -10 L50 6', ln(5)), 'translate(1460 900)');
  J += G(R(-4, -230, 8, 230, 3, ol('#8A5A33', 3)) + P('M-40 -220 L40 -220 M-30 -230 L-40 -210 M30 -230 L40 -210', ln(5, '#8A5A33')) + P('M-36 -214 Q-50 -120 -40 -60 L36 -60 Q50 -120 36 -214 Z', ol('#5CB85A', 4)) + P('M-36 -150 H36', ln(3, '#3A8A3A')), 'translate(1680 900)');
  J += G(R(-6, -200, 12, 200, 3, ol('#8A5A33', 4)) + G(R(-120, -60, 240, 110, 8, ol('#D9B47A', 5)) + T('GARAGE SALE', 0, -14, 34, '#3A2A55') + TF('NO REFUNDS. NO QUESTIONS.', 0, 26, 17, '#E8243C'), 'translate(0 -200) rotate(-3)'), 'translate(1810 920)');
  m += vanish(J, gk(0.12, 0.62), [100, 480, 1800, 450], 7);
  // bulbs strung overhead (flicker)
  let B = P('M300 330 Q760 430 1220 330 Q1580 420 1900 340', ln(4, '#1E1640'));
  for (let i = 0; i < 9; i++) {
    const u = i / 8, bx = lerp(320, 1880, u), by = (u < 0.58 ? 330 + Math.sin((u / 0.58) * Math.PI) * 82 : 330 + Math.sin(((u - 0.58) / 0.42) * Math.PI) * 74) + 10;
    const on = hash(Math.floor(t * 10) + i * 13) > 0.1 ? 1 : 0.2;
    B += glowSpot(bx, by + 18, 90, 'setsGlowWarm', 0.65 * on) + P(`M${f(bx)} ${f(by - 10)} L${f(bx)} ${f(by + 4)}`, ln(4, '#1E1640')) + E(bx, by + 18, 11, 14, ol(on > 0.5 ? '#FFF4B8' : '#8A8098', 3));
  }
  m += vanish(B, gk(0, 0.4), [300, 300, 1600, 160], 11);
  // tumbleweed (after it is gone)
  if (gone >= 0.92 || opts.tumble !== undefined) {
    const u = opts.tumble ?? md(t * 0.16, 1);
    const tx = lerp(-200, 2200, u), ty = 930 - Math.abs(Math.sin(u * 22)) * 40;
    m += tumbleweed(tx, ty, 1, { rot: tx * 0.8 });
  }
  // front: table skirts (cloths)
  const skirt = 'M760 692 L1280 692 L1296 852 Q1244 868 1192 852 Q1140 870 1088 852 Q1036 870 984 852 Q932 870 880 852 Q820 868 744 852 Z';
  let fr = P(skirt, ol('#E8E0F4', 5)) + P(skirt, { fill: 'url(#setsKCCloth)', opacity: 0.45 }) + P('M840 700 Q850 780 836 850 M1180 700 Q1192 780 1184 850', ln(4, '#B9AED0', 0.8));
  fr = vanish(fr, gk(0.12, 0.62), [740, 690, 560, 180], 9);
  const light = cover('#3A1E7A', { opacity: 0.12 });
  return { bg, mid: m, front: fr, fg: '', light };
}
const garageSale = makeSet(garageSaleLayers);

// ================================================================= 7. SCHOOL — Maple Hill Middle School (sky blue + school yellow)
def('<pattern id="setsVCT" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#E3E9F1"/><rect width="60" height="60" fill="#D3DCE8"/><rect x="60" y="60" width="60" height="60" fill="#D3DCE8"/><circle cx="18" cy="22" r="2" fill="#B9C4D4"/><circle cx="84" cy="40" r="1.6" fill="#FFFFFF"/><circle cx="44" cy="92" r="1.8" fill="#B9C4D4"/><circle cx="100" cy="104" r="1.5" fill="#FFFFFF"/></pattern>');
def('<pattern id="setsCinder" width="120" height="60" patternUnits="userSpaceOnUse"><rect width="120" height="60" fill="#C9DCEE"/><rect x="2" y="2" width="116" height="26" rx="3" fill="#E4F0FB"/><rect x="-58" y="32" width="116" height="26" rx="3" fill="#E4F0FB"/><rect x="62" y="32" width="116" height="26" rx="3" fill="#E4F0FB"/></pattern>');
def('<pattern id="setsLockers" x="0" y="330" width="96" height="460" patternUnits="userSpaceOnUse"><rect width="96" height="460" fill="#24507E"/><rect x="2" y="0" width="92" height="452" rx="4" fill="#3E8FE0"/><rect x="2" y="0" width="10" height="452" fill="#6FB2F2" opacity="0.6"/><rect x="18" y="26" width="60" height="6" rx="3" fill="#24507E"/><rect x="18" y="40" width="60" height="6" rx="3" fill="#24507E"/><rect x="18" y="54" width="60" height="6" rx="3" fill="#24507E"/><rect x="30" y="90" width="36" height="20" rx="3" fill="#DDEBFF"/><rect x="70" y="200" width="12" height="44" rx="5" fill="#C9D3E2" stroke="#151515" stroke-width="2.5"/><rect x="18" y="384" width="60" height="6" rx="3" fill="#24507E"/><rect x="18" y="398" width="60" height="6" rx="3" fill="#24507E"/><rect x="0" y="452" width="96" height="8" fill="#1B3A5C"/></pattern>');
def(lg('setsSchoolWall', [[0, '#D9F0FF'], [1, '#B6DEFA']]));
def(lg('setsGymFloor', [[0, '#EDBE72'], [1, '#D49A4A']]));
def('<pattern id="setsMats" width="160" height="160" patternUnits="userSpaceOnUse"><rect width="160" height="160" fill="#3E7FD0"/><rect x="0" width="6" height="160" fill="#2A5FA8"/><rect x="10" y="8" width="140" height="10" rx="5" fill="#6FA8EC" opacity="0.6"/></pattern>');
def('<pattern id="setsBrick" width="80" height="40" patternUnits="userSpaceOnUse"><rect width="80" height="40" fill="#B9583E"/><rect x="2" y="2" width="76" height="16" rx="2" fill="#D46E4E"/><rect x="-38" y="22" width="76" height="16" rx="2" fill="#D46E4E"/><rect x="42" y="22" width="76" height="16" rx="2" fill="#D46E4E"/></pattern>');
def('<pattern id="setsChain" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M0 14 L14 0 L28 14 L14 28 Z" fill="none" stroke="#9AA4B8" stroke-width="2.5"/></pattern>');
def('<pattern id="setsCarpet" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#5E7396"/><circle cx="12" cy="14" r="2" fill="#7488AA"/><circle cx="42" cy="36" r="2" fill="#4E6386"/><circle cx="26" cy="50" r="1.6" fill="#7488AA"/></pattern>');
def('<pattern id="setsPanel" width="70" height="300" patternUnits="userSpaceOnUse"><rect width="70" height="300" fill="#B9824E"/><rect x="0" width="4" height="300" fill="#8A5A30"/><rect x="10" y="20" width="4" height="260" fill="#CF9A62" opacity="0.6"/></pattern>');
def(lg('setsChalk', [[0, '#2F6E52'], [1, '#245A42']]));
def('<pattern id="setsWinRow" width="200" height="150" patternUnits="userSpaceOnUse"><rect x="30" y="20" width="140" height="100" rx="6" fill="#FFFFFF"/><rect x="40" y="30" width="120" height="80" rx="3" fill="#9FD8FF"/><path d="M100 30 V110 M40 70 H160" stroke="#FFFFFF" stroke-width="6"/><path d="M52 98 L92 38 L108 38 L68 98 Z" fill="#FFFFFF" opacity="0.4"/></pattern>');

// school wall decor helpers
function schoolPoster(kind, x, y, rot = 0, s = 1) {
  let o = '';
  const W = 200, H = 150;
  if (kind === 'kind') o = R(-W / 2, -H / 2, W, H, 6, ol('#FFE14D', 5)) + T('BE KIND', 0, -10, 44, '#E8243C', OUTX(6)) + P('M-30 26 Q0 54 30 26', ln(8)) + CI(-40, 30, 8, { fill: '#FF8FA3' }) + CI(40, 30, 8, { fill: '#FF8FA3' });
  else if (kind === 'science') o = R(-W / 2, -H / 2, W, H, 6, ol('#7FE0C9', 5)) + T('SCIENCE', 0, -24, 34, '#2A2246') + T('FAIR FRI!', 0, 12, 30, '#E8243C') + P('M-40 54 L-28 30 L-16 54 Z M10 54 Q24 26 38 54', ol('#FFFFFF', 3));
  else if (kind === 'chess') o = R(-W / 2, -H / 2, W, H, 6, ol('#FFFFFF', 5)) + T('CHESS', 0, -20, 38, '#2A2246') + T('CLUB', 0, 16, 32, '#3E8FE0') + P('M-14 60 L-14 34 Q-24 24 -10 18 L10 18 Q24 24 14 34 L14 60 Z', ol('#2A2246', 3));
  else if (kind === 'spirit') o = R(-W / 2, -H / 2, W, H, 6, ol('#3E8FE0', 5)) + T('GO', 0, -10, 46, '#FFE14D', OUTX(6)) + T('MOOSE!', 0, 40, 38, '#FFFFFF', OUTX(6));
  else if (kind === 'hamster') o = R(-W / 2, -H / 2, W, H, 6, ol('#FFF2C8', 5)) + T('LOST:', 0, -30, 30, '#E8243C') + T('HAMSTER', 0, 2, 30, '#2A2246') + E(0, 40, 24, 16, ol('#E8B87A', 3)) + CI(-8, 36, 2.5, { fill: LINE }) + TF('answers to "Kevin"', 0, 70, 13, '#5A4A3A');
  else if (kind === 'math') o = R(-W / 2, -H / 2, W, H, 6, ol('#B06BFF', 5)) + T('MATH IS', 0, -22, 32, '#FFFFFF', OUTX(5)) + T('EVERYWHERE', 0, 12, 26, '#FFE14D', OUTX(5)) + TF('π  √  ÷  ∞', 0, 52, 26, '#FFFFFF');
  else if (kind === 'rules') o = R(-W / 2, -H / 2, W, H, 6, ol('#2A2246', 5)) + T('RULES', 0, -30, 34, '#FFE14D') + T('ARE COOL', 0, 4, 30, '#FFFFFF') + R(-60, 30, 120, 26, 4, ol('#FFC93C', 3)) + P('M-50 30 v10 M-30 30 v14 M-10 30 v10 M10 30 v14 M30 30 v10 M50 30 v14', ln(2.5)) + R(-34, 20, 30, 14, 5, { fill: LINE }) + R(4, 20, 30, 14, 5, { fill: LINE });
  return G(o, tr(x, y, s, rot));
}
function schoolClock(x, y, r, t) {
  const hr = ((t / 3600) * 360 + 300) % 360, mn = ((t / 60) * 360) % 360;
  return CI(x, y, r, ol('#FFFFFF', 6)) + CI(x, y, r * 0.82, ln(3, '#D0D8E4')) + P(`M${x} ${y} L${f(x + Math.sin(hr * Math.PI / 180) * r * 0.45)} ${f(y - Math.cos(hr * Math.PI / 180) * r * 0.45)} M${x} ${y} L${f(x + Math.sin(mn * Math.PI / 180) * r * 0.7)} ${f(y - Math.cos(mn * Math.PI / 180) * r * 0.7)}`, ln(5)) + CI(x, y, 4, { fill: '#E8243C' });
}
// lunch tray prop: tray(x, y, s, opts) origin = centre. opts: { cookies 0..2, empty, milk:false }
function tray(x, y, s = 1, opts = {}) {
  const ck = opts.cookies ?? 2;
  let o = R(-130, -60, 260, 120, 18, ol('#FF9A3D', 5)) + R(-118, -48, 116, 96, 12, { fill: '#F27F22' }) + R(8, -48, 110, 44, 10, { fill: '#F27F22' }) + R(8, 4, 52, 44, 10, { fill: '#F27F22' }) + R(66, 4, 52, 44, 10, { fill: '#F27F22' });
  if (!opts.empty) {
    o += P('M-100 10 Q-104 -30 -60 -36 Q-20 -30 -24 10 Z', ol('#FFF4D6', 3)) + E(-62, -14, 16, 6, { fill: '#FFE08A' });
    o += P(circD(30, -30, 7) + circD(46, -24, 7) + circD(62, -32, 7) + circD(80, -26, 7) + circD(96, -34, 7), ol('#5CB85A', 2));
    o += R(16, 12, 36, 30, 6, ol('#7FD8FF', 3)) + R(22, 16, 10, 8, 3, { fill: '#FFFFFF', opacity: 0.6 });
    for (let i = 0; i < ck; i++) o += CI(80 + i * 22, 26 - i * 6, 16, ol('#C9884A', 3)) + P(`M${74 + i * 22} ${22 - i * 6} h2 M${86 + i * 22} ${30 - i * 6} h2`, ln(4, '#5A3A20'));
  }
  if (opts.milk !== false) o += G(R(-18, -44, 36, 44, 3, ol('#FFFFFF', 3)) + P('M-18 -44 L0 -60 L18 -44 Z', ol('#FFFFFF', 3)) + R(-18, -30, 36, 12, 0, { fill: '#3DA8FF' }), 'translate(-112 -20) scale(0.8)');
  return G(o, tr(x, y, s, opts.rot || 0));
}

// ---------------------------------------------------------------- 7a. CAFETERIA
// The lunch line runs left->right along the serving counter at right (counter top y 736); kids stand in line on the
// FLOOR (y 990) facing right: SPOTS.cafeteria.line[0] is the FRONT of the line (x 1700), then every 190 px to the left.
// The lunch lady stands behind the counter (SPOTS.cafeteria.lunchLady; layers.front = counter front + sneeze guard).
// Left: a long table with kids' seats (SPOTS.cafeteria.seats, hips y 770, layers.front hides their legs), trays on it.
// opts: { menu: ['TODAY', 'MYSTERY TACOS', 'PEAS · JELLO'] , trays (default true), steam (default true) }
def(lg('setsSteel', [[0, '#F2F5FA'], [0.5, '#C9D1DE'], [1, '#A3ADBF']]));
function cafeteriaLayers(t, opts = {}) {
  let bg = sky(t, 'day', 360, 300, 560, 320, { clouds: 2 });
  bg += tree(240, 560, 0.8, { col: '#4CB65A', hi: '#7CD978' }) + tree(520, 580, 0.7, { col: '#3FA650', hi: '#6CCB6A' }) + R(0, 460, 700, 200, 0, { fill: '#79D46A' });
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V790 H${XL} Z M80 150 V470 H640 V150 Z`;
  m += P(wallD, { fill: 'url(#setsSchoolWall)', 'fill-rule': 'evenodd' });
  m += band(560, 790, '#7FD3C3') + P(Array.from({ length: 70 }, (_, i) => `M${-700 + i * 50} 560 V790`).join(' ') + ' M-760 620 H2680 M-760 680 H2680 M-760 740 H2680', ln(2.5, '#5FB8A8')) + band(548, 566, '#FFC93C') + P(`M${XL} 548 H${XR} M${XL} 566 H${XR}`, ln(3.5, LINE, 0.7));
  // windows (3 panes)
  m += P('M60 130 H660 V490 H60 Z M80 150 V470 H640 V150 Z', { fill: '#FFFFFF', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 }) + P('M266 150 V470 M452 150 V470', ln(16, '#FFFFFF'));
  m += P('M266 150 V470 M452 150 V470', ln(4, LINE, 0.4)) + P('M100 300 L170 170 L200 170 L130 300 Z M300 330 L370 200 L390 200 L320 330 Z', { fill: '#FFFFFF', opacity: 0.3 }) + R(50, 486, 620, 20, 5, ol('#FFFFFF', 5));
  // banner + clock + menu board
  m += G(P('M-230 -40 L230 -40 L210 0 L230 40 L-230 40 L-210 0 Z', ol('#5CB85A', 5)) + T('EAT YOUR GREENS!', 0, 14, 40, '#FFFFFF', OUTX(6)), 'translate(960 110)');
  m += schoolClock(760, 330, 52, t);
  const menu = opts.menu || ["TODAY'S LUNCH", 'MYSTERY TACOS', 'PEAS · JELLO · MILK'];
  m += R(1080, 190, 560, 190, 12, ol('#2A2D38', 6)) + R(1092, 202, 536, 166, 8, { fill: '#1B1E28' }) + menu.map((l, i) => TF(l, 1360, 248 + i * 48, i ? 34 : 26, i === 1 ? '#FFE14D' : '#FFFFFF')).join('');
  m += P('M1150 190 L1170 150 M1570 190 L1550 150', ln(4, '#5A6070')) + CI(1170, 148, 6, { fill: '#5A6070' }) + CI(1550, 148, 6, { fill: '#5A6070' });
  m += G(R(-60, -70, 120, 140, 10, ol('#FF8FA3', 4)) + T('MILK', 0, -26, 30, '#FFFFFF', OUTX(5)) + TF('does a', 0, 6, 18, '#2A2246') + TF('body good?', 0, 30, 18, '#2A2246'), 'translate(1780 280) rotate(4)');
  // back wall of the kitchen behind the counter (pass-through)
  m += R(820, 430, 1140, 120, 0, { fill: '#E9EEF5', stroke: LINE, 'stroke-width': 5 }) + R(840, 448, 1100, 84, 6, { fill: '#2A2D38' }) + R(860, 470, 140, 40, 6, ol('#C9D1DE', 3)) + E(1500, 500, 70, 22, ol('#A3ADBF', 3));
  // floor
  m += R(XL, 790, XR - XL, YB - 790, 0, { fill: 'url(#setsVCT)' }) + R(XL, 790, XR - XL, 30, 0, { fill: '#000', opacity: 0.06 }) + R(XL, 940, XR - XL, YB - 940, 0, { fill: '#E3E9F1', opacity: 0.35 });
  // trash can
  m += G(P('M-44 0 L-52 -150 L52 -150 L44 0 Z', ol('#3E8FE0', 5)) + R(-58, -170, 116, 26, 10, ol('#2E6FB8', 5)) + TF('THANK YOU', 0, -100, 16, '#FFFFFF') + P('M-24 -60 V-20 M0 -60 V-20 M24 -60 V-20', ln(4, '#2E6FB8')), 'translate(764 834)');
  // long table (seats behind it) — table front in layers.front
  m += R(40, 690, 640, 10, 4, { fill: '#B9C4D4' });
  // ---- front: counter + sneeze guard + rail, table
  let fr = '';
  // food wells on the counter (visible through the guard)
  const pans = [['#FFF4D6', 'mash'], ['#5CB85A', 'peas'], ['#9A5A3A', 'meat'], ['#FF4D7A', 'jello'], ['#FFC93C', 'pizza']];
  const CT = 736;   // counter top
  let foods = '';
  pans.forEach(([c, k], i) => {
    const px = 900 + i * 180, py = CT - 30;
    foods += R(px, py, 150, 34, 6, ol('#C9D1DE', 4)) + P(`M${px + 10} ${py + 6} Q${px + 75} ${k === 'jello' ? py - 30 : py - 14} ${px + 140} ${py + 6} Z`, ol(c, 3));
    if (k === 'peas') foods += P(circD(px + 50, py - 4, 6) + circD(px + 70, py - 8, 6) + circD(px + 90, py - 4, 6), { fill: '#7FD06A' });
    if (k === 'jello') foods += P(`M${px + 40} ${py - 16} l20 -10 l20 10 M${px + 80} ${py - 12} l18 -8 l18 8`, ln(3, '#FFFFFF', 0.7));
    if (k === 'meat') foods += P(`M${px + 30} ${py - 4} q15 -14 30 0 q15 -14 30 0 q15 -14 30 0`, ln(4, '#6A3A20'));
    if (opts.steam !== false) { const ph = md(t * 0.6 + i * 0.3, 1); foods += P(`M${px + 75} ${py - 20} q${f(-10 + ph * 20)} -30 0 ${f(-40 - ph * 40)}`, ln(5, '#FFFFFF', f(0.5 * (1 - ph)))); }
  });
  fr += foods;
  fr += R(820, CT, 1140, 24, 6, ol('url(#setsSteel)', 5)) + R(810, CT + 22, 1160, 150, 4, ol('#9FB3CC', 6)) + R(810, CT + 22, 1160, 150, 4, { fill: 'url(#setsSteel)', opacity: 0.5 });
  for (let i = 0; i < 6; i++) fr += R(840 + i * 190, CT + 66, 160, 96, 8, { fill: 'none', stroke: '#8296B4', 'stroke-width': 4 });
  fr += R(800, CT + 32, 1180, 22, 6, ol('#C9D1DE', 4)) + P(`M820 ${CT + 42} H1960`, ln(3, '#FFFFFF', 0.7));
  // sneeze guard glass
  fr += P(`M840 ${CT - 8} L860 ${CT - 124} L1940 ${CT - 124} L1920 ${CT - 8} Z`, { fill: '#DDF4FF', opacity: 0.35, stroke: LINE, 'stroke-width': 4 }) + P(`M880 ${CT - 26} L896 ${CT - 104} M1300 ${CT - 26} L1314 ${CT - 104}`, ln(5, '#FFFFFF', 0.6)) + P(`M850 ${CT - 8} L860 ${CT - 124} M1930 ${CT - 8} L1940 ${CT - 124}`, ln(6, '#8A93A6'));
  // cash register at the end
  fr += G(R(-70, -70, 140, 70, 8, ol('#2E6FB8', 5)) + R(-56, -60, 70, 30, 4, { fill: '#BFF0FF' }) + TF('$2.50', -21, -38, 16, '#2A2246') + R(24, -60, 36, 44, 4, { fill: 'url(#setsKeysDark)' }), `translate(1860 ${CT})`);
  // the table + benches
  fr += R(30, 700, 660, 26, 6, ol('#C9D3E2', 5)) + R(40, 726, 640, 14, 4, { fill: '#9AA4B8' }) + P('M80 740 L60 860 M640 740 L660 860', ln(9, '#6A7488'));
  fr += R(20, 820, 680, 22, 6, ol('#3E8FE0', 4)) + P('M60 842 L60 880 M660 842 L660 880', ln(8, '#6A7488'));
  if (opts.trays !== false) fr += tray(160, 690, 0.55, { cookies: 1 }) + tray(400, 690, 0.55, { cookies: 2 }) + tray(600, 690, 0.55, { empty: true, milk: false });
  return { bg, mid: m, front: fr, fg: '', light: '' };
}
const cafeteria = makeSet(cafeteriaLayers);

// ---------------------------------------------------------------- 7b. GYM
// Wooden floor with court lines and painted running lanes (y 846..904), blue wall mats at the back (y 640..800) =
// the TEAM-PICK WALL: kids line up against it (SPOTS.gym.pickLine, feet y 828, s .42). Bleachers at right (rows:
// SPOTS.gym.bleachers). Hoop on the back wall (rim SPOTS.gym.hoop), scoreboard (opts.scoreboard), climbing rope,
// caged ceiling lights. Captains / the coach stand on the FLOOR line y 990.
// opts: { scoreboard: ['HOME', '00', 'GUEST', '00'] or a single string (e.g. 'MILE 0:00.3'), track (default true),
//   cones (default true), rope (default true) }
function gymLayers(t, opts = {}) {
  let m = cover('url(#setsCinder)') + R(XL, YT, XR - XL, 70 - YT, 0, { fill: '#5A6A86' }) + P(Array.from({ length: 30 }, (_, i) => `M${-700 + i * 120} 70 L${-700 + i * 120 - 40} -200`).join(' '), ln(8, '#46546E'));
  m += band(62, 78, '#FFC93C');
  // caged lights
  for (const lx of [240, 720, 1200, 1680]) m += P(`M${lx} 70 V96`, ln(4)) + P(`M${lx - 46} 96 L${lx + 46} 96 L${lx + 34} 128 L${lx - 34} 128 Z`, ol('#C9D1DE', 4)) + E(lx, 130, 34, 8, { fill: '#FFF8D6', stroke: LINE, 'stroke-width': 3 }) + glowSpot(lx, 150, 120, 'setsGlowWhite', 0.5);
  // high windows
  for (let i = 0; i < 6; i++) m += R(140 + i * 290, 160, 240, 90, 6, ol('#9FD8FF', 5)) + P(`M${260 + i * 290} 160 V250 M${140 + i * 290} 205 H${380 + i * 290}`, ln(5, '#FFFFFF'));
  // banners
  m += G(P('M-110 0 L110 0 L110 100 L0 140 L-110 100 Z', ol('#3E8FE0', 5)) + T('GO', 0, 50, 40, '#FFE14D', OUTX(5)) + T('MOOSE!', 0, 92, 34, '#FFFFFF', OUTX(5)), 'translate(1100 290)');
  m += G(R(-150, -36, 300, 72, 8, ol('#FFC93C', 5)) + T('CHAMPIONS', 0, -2, 32, '#2A2246') + TF('dodgeball · 1998', 0, 24, 18, '#2A2246'), 'translate(250 330)');
  // wall mats (team-pick wall) + floor seam
  m += R(XL, 640, 1160 - XL, 160, 0, { fill: 'url(#setsMats)', stroke: LINE, 'stroke-width': 5 }) + band(796, 806, '#2A3A5A');
  // hoop on the wall
  m += R(510, 380, 20, 260, 0, { fill: '#8A93A6', stroke: LINE, 'stroke-width': 4 }) + R(420, 210, 200, 140, 8, ol('#FFFFFF', 6)) + R(480, 270, 80, 60, 3, { fill: 'none', stroke: '#FF6A2E', 'stroke-width': 6 });
  m += R(508, 350, 24, 22, 3, ol('#8A93A6', 3)) + E(520, 380, 54, 12, { fill: 'none', stroke: '#FF6A2E', 'stroke-width': 8 }) + P('M470 384 L486 450 L554 450 L570 384 M490 384 L500 450 M520 386 L520 450 M550 384 L540 450 M480 412 H560', ln(3, '#FFFFFF'));
  // scoreboard
  {
    let sb = R(-190, -80, 380, 160, 12, ol('#1B1E28', 6)) + R(-178, -68, 356, 136, 8, { fill: '#10131C' });
    const v = opts.scoreboard;
    if (typeof v === 'string') sb += T(v, 0, 22, v.length > 9 ? 48 : 64, '#FF4D3A');
    else { const [a, b, c, d] = v || ['HOME', '00', 'GUEST', '00']; sb += TF(a, -90, -36, 22, '#FFE14D') + TF(c, 90, -36, 22, '#FFE14D') + T(b, -90, 40, 66, '#FF4D3A') + T(d, 90, 40, 66, '#FF4D3A') + P('M0 -60 V60', ln(3, '#3A3F4E')); }
    m += G(sb, 'translate(1580 380) scale(0.9)');
  }
  // climbing rope
  if (opts.rope !== false) { const sw = Math.sin(t * 0.9) * 10; m += P(`M880 70 Q${880 + sw * 0.5} 360 ${880 + sw} 620`, ln(16, LINE)) + P(`M880 70 Q${880 + sw * 0.5} 360 ${880 + sw} 620`, ln(9, '#E8C27A')) + P(`M880 70 Q${880 + sw * 0.5} 360 ${880 + sw} 620`, { fill: 'none', stroke: '#C9A060', 'stroke-width': 9, 'stroke-dasharray': '6 10' }) + E(880 + sw, 626, 12, 16, ol('#E8C27A', 4)); }
  // bleachers (right)
  const BL = [{ y: 560, x0: 1180 }, { y: 620, x0: 1160 }, { y: 680, x0: 1140 }, { y: 740, x0: 1120 }];
  m += R(1180, 500, XR - 1180, 300, 0, { fill: '#5A4A3A' });
  BL.forEach(({ y, x0 }) => { m += R(x0, y, XR - x0, 22, 4, ol('#E8B86A', 4)) + R(x0, y + 22, XR - x0, 38, 0, { fill: '#7A5A3A', stroke: LINE, 'stroke-width': 3 }) + P(`M${x0} ${y + 4} H${XR}`, ln(3, '#FFE0A8', 0.7)); });
  m += R(1100, 800, XR - 1100, 8, 0, { fill: '#3A2A20' });
  // floor + court lines + track lanes
  m += R(XL, 806, XR - XL, YB - 806, 0, { fill: 'url(#setsGymFloor)' }) + floorBoards(806, 1200, XL, XR, 10, '#B9823E', 5, true, 3, 0.55);
  m += P('M430 806 L404 842 M610 806 L636 842', ln(7, '#FFFFFF', 0.95)) + P('M1500 806 L1560 1100', ln(7, '#FFFFFF', 0.9)) + E(1530, 960, 240, 40, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 7 });
  m += P('M-760 820 H2680', ln(7, '#3E8FE0', 0.9));
  if (opts.track !== false) {
    m += R(XL, 846, XR - XL, 58, 0, { fill: '#D9573A', opacity: 0.88 }) + P(`M${XL} 846 H${XR} M${XL} 875 H${XR} M${XL} 904 H${XR}`, ln(5, '#FFFFFF')) + T('1', 200, 870, 22, '#FFFFFF') + T('2', 200, 900, 26, '#FFFFFF') + P('M240 846 L232 904', ln(6, '#FFFFFF'));
  }
  if (opts.cones !== false) for (const cx of [140, 1780]) m += G(P('M-20 0 L-6 -48 L6 -48 L20 0 Z', ol('#FF8A2A', 4)) + R(-26, -4, 52, 8, 3, ol('#FF8A2A', 3)) + P('M-12 -24 H12', ln(6, '#FFFFFF')), `translate(${cx} 880)`);
  m += R(XL, 950, XR - XL, YB - 950, 0, { fill: '#EDBE72', opacity: 0.3 });
  return { bg: '', mid: m, front: '', fg: '', light: '' };
}
const gym = makeSet(gymLayers);

// ---------------------------------------------------------------- 7c. HALLWAY (long, parallax)
// hallway(t, cam, opts): lockers (y 330..782) along a sky-blue wall, posters above them, classroom doors every
// 1600 px (SPOTS.hallway.doors), a trophy case and a water fountain; caged fluorescent lights on the ceiling (y < 60);
// glossy tile floor. FLOOR.hallway 960 (crowds: stand kids between y 900 and 1000, smaller further back).
// Long: world x -1200..6800. opts: { posters (default true), doorOpen (index of an open door) }
// hallway.layers(t, cam, opts) -> { bg, mid, fg } (fg: spirit-week banners hanging from the ceiling, k 1.15).
function hallwayLayers(t, cam = {}, opts = {}) {
  const [m0, m1] = visX(cam, 1, 400);
  const bw = (y0, y1, fill) => R(m0, y0, m1 - m0, y1 - y0, 0, { fill });
  let m = bw(YT, 60, '#E6EEF8') + bw(54, 70, '#FFFFFF') + bw(70, 790, 'url(#setsSchoolWall)') + bw(300, 330, '#FFC93C') + P(`M${f(m0)} 300 H${f(m1)} M${f(m0)} 330 H${f(m1)}`, ln(3.5, LINE, 0.7));
  for (let x = Math.floor(m0 / 400) * 400; x < m1; x += 400) m += R(x + 100, 20, 200, 30, 6, ol('#FFFFFF', 4)) + glowSpot(x + 200, 50, 150, 'setsGlowWhite', 0.5);
  // segments of lockers between features
  const SEG = 1600;
  for (let i = Math.floor((m0 - 400) / SEG); i * SEG < m1 + 400; i++) {
    const sx = i * SEG, kind = ((i % 4) + 4) % 4;
    // feature at sx..sx+260
    if (kind === 0 || kind === 2) {
      const open = opts.doorOpen === i;
      m += R(sx - 10, 270, 280, 520, 6, ol('#FFFFFF', 5)) + (open ? R(sx + 10, 290, 240, 500, 4, { fill: '#2A3A5A' }) + P(`M${sx + 10} 290 L${sx + 120} 320 L${sx + 120} 770 L${sx + 10} 790 Z`, ol('#C98A52', 5)) : R(sx + 10, 290, 240, 500, 4, ol('#C98A52', 5)) + R(sx + 40, 330, 90, 150, 6, ol('#BFE6FF', 4)) + CI(sx + 220, 560, 10, ol('#FFC93C', 3)));
      m += G(R(-60, -22, 120, 44, 6, ol('#2A2246', 4)) + T(`ROOM ${12 + i}`, 0, 12, 24, '#FFFFFF'), `translate(${sx + 130} 240)`);
    } else if (kind === 1) {
      m += R(sx, 380, 260, 330, 8, ol('#8A5A33', 6)) + R(sx + 14, 394, 232, 302, 4, { fill: '#DDF4FF', opacity: 0.7 }) + P(`M${sx + 14} 500 H${sx + 246} M${sx + 14} 600 H${sx + 246}`, ln(5, '#8A5A33'));
      m += G(P('M-22 -58 Q-22 -26 0 -22 Q22 -26 22 -58 Z', ol('#FFC23A', 4)) + R(-6, -22, 12, 10, 2, ol('#FFC23A', 3)) + R(-18, -12, 36, 12, 3, ol('#7E4A2A', 3)), `translate(${sx + 70} 500)`) + G(P('M-26 -70 Q-26 -30 0 -26 Q26 -30 26 -70 Z', ol('#C9D1DD', 4)) + R(-20, -16, 40, 16, 3, ol('#7E4A2A', 3)), `translate(${sx + 170} 500)`) + CI(sx + 130, 570, 26, ol('#FF6A2E', 4)) + P(`M${sx + 104} 570 H${sx + 156} M${sx + 130} 544 V596`, ln(3));
      m += TF('TROPHIES', sx + 130, 680, 22, '#5A3A20');
    } else {
      m += R(sx + 60, 560, 140, 90, 12, ol('#C9D1DE', 5)) + R(sx + 76, 548, 108, 22, 8, ol('#E6EEF8', 4)) + P(`M${sx + 130} 548 Q${sx + 150} 520 ${sx + 166} 540`, ln(5, '#7FD8FF')) + R(sx + 110, 650, 40, 140, 4, ol('#A3ADBF', 4));
      m += R(sx + 20, 360, 220, 150, 6, ol('#C98A52', 5)) + R(sx + 30, 370, 200, 130, 3, { fill: '#E8C890' }) + stickyNote(sx + 80, 420, -6, 'TRYOUTS\nTODAY', { w: 74, col: '#9FE0FF' }) + stickyNote(sx + 170, 440, 5, 'BAKE\nSALE!', { w: 70, col: '#FF9EC4' });
    }
    // lockers from sx+300 to sx+SEG-40
    m += R(sx + 300, 330, SEG - 340, 460, 0, { fill: 'url(#setsLockers)', stroke: LINE, 'stroke-width': 5 }) + R(sx + 300, 318, SEG - 340, 14, 3, ol('#24507E', 3));
    if (opts.posters !== false) {
      const PK = ['kind', 'science', 'chess', 'spirit', 'hamster', 'math'];
      for (let j = 0; j < 3; j++) m += schoolPoster(PK[(((i * 3 + j) % 6) + 6) % 6], sx + 500 + j * 420, 180, (hash(i * 7 + j) - 0.5) * 8, 0.85);
    }
  }
  m += bw(790, YB, 'url(#setsVCT)') + bw(782, 796, '#2A3A5A') + R(m0, 940, m1 - m0, YB - 940, 0, { fill: '#E3E9F1', opacity: 0.35 });
  let refl = '';
  for (let x = Math.floor(m0 / 400) * 400; x < m1; x += 400) refl += `M${x + 120} 820 L${x + 280} 820 L${x + 330} 900 L${x + 70} 900 Z `;
  m += P(refl, { fill: '#FFFFFF', opacity: 0.25 });
  // fg: spirit banners
  const [f0, f1] = visX(cam, 1.15, 600);
  let fg = '';
  for (let i = Math.floor(f0 / 2400); i * 2400 < f1; i++) {
    const bx = i * 2400 + 900;
    fg += P(`M${bx - 300} -40 Q${bx} 30 ${bx + 300} -40`, ln(4, '#5A6070')) + G(P('M-160 0 L160 0 L160 80 L-160 80 Z', ol('#FFC93C', 5)) + T('SPIRIT WEEK!', 0, 54, 40, '#3E8FE0'), `translate(${bx} -14)`);
  }
  return { bg: '', mid: layer(m, cam, 1), fg: layer(fg, cam, 1.15) };
}
const hallway = (t = 0, cam = {}, opts = {}) => { const L = hallwayLayers(t, cam, opts); return L.bg + L.mid + L.fg; };
hallway.layers = hallwayLayers;

// ---------------------------------------------------------------- 7d. PRINCIPAL'S OFFICE
// The principal sits behind the big desk (SPOTS.principalOffice.principal; layers.front = desk front + nameplate)
// with his coffee mug. The BACK WALL is the one YOU noclip through: opts.hole 0..1 opens a hero-shaped hole (cracks
// first, then the hole; the hallway lockers show through it) at opts.holeX (default 1360) — the hole's feet sit on
// the wall base y 792 at hole scale .44 (SPOTS.principalOffice.hole). opts.floorHole 0..1: a ragged hole in the floor
// (he falls through it: SPOTS.principalOffice.floorHole). Stand line y 990. opts: { hole, holeX, floorHole, steam }
const HERO_HOLE = [[-100, 0], [-112, -300], [-176, -250], [-150, -530], [-62, -545], [-152, -566], [-240, -650], [-236, -790], [-196, -905], [-110, -955], [110, -955], [196, -905], [236, -790], [240, -650], [152, -566], [62, -545], [150, -530], [176, -250], [112, -300], [100, 0], [12, 0], [10, -262], [-10, -262], [-12, 0]];
const heroHoleD = (s, k = 1, ox = 0, oy = 0) => S.roundedPath(HERO_HOLE.map(([x, y]) => [ox + x * s * k + hash(x + y) * 4, oy + y * s * k + hash(y - x) * 4]), 14 * s * k);
function principalLayers(t, opts = {}) {
  const hole = bool01(opts.hole), hx = opts.holeX ?? 1360, hs = 0.44;
  const fh = bool01(opts.floorHole);
  // bg: hallway behind the wall (seen through the hole) + the window view
  let bg = sky(t, 'day', 300, 300, 400, 330, { clouds: 2, sunX: 0.8, sunY: 0.2 }) + tree(330, 560, 0.7, { col: '#4CB65A', hi: '#7CD978' });
  let m = '';
  const holeK = clamp((hole - 0.25) / 0.75, 0, 1);
  let wallD = `M${XL} ${YT} H${XR} V792 H${XL} Z M120 150 V470 H480 V150 Z`;
  const holeD = holeK > 0 ? heroHoleD(hs, ease.outBack(holeK), hx, 792) : '';
  m += P(wallD, { fill: '#D9ECC9', 'fill-rule': 'evenodd' });
  // wood paneling (lower wall) with the same hole
  let panD = `M${XL} 520 H${XR} V792 H${XL} Z`;
  m += P(panD, { fill: 'url(#setsPanel)', 'fill-rule': 'evenodd' }) + band(508, 526, '#8A5A30') + P(`M${XL} 508 H${XR}`, ln(3.5, LINE, 0.7));
  // window with blinds
  m += P('M100 130 H500 V490 H100 Z M120 150 V470 H480 V150 Z', { fill: '#FFFFFF', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 });
  let bl = '';
  for (let y = 158; y < 360; y += 22) bl += `M120 ${y} H480 `;
  m += P(bl, ln(10, '#F4F1E6')) + P(bl, ln(2, '#C9C2AC')) + R(110, 360, 380, 16, 4, ol('#F4F1E6', 3)) + P('M300 150 V360', ln(2, '#8A8070')) + R(90, 486, 420, 18, 5, ol('#FFFFFF', 4));
  // diplomas + crest + poster
  for (const [dx, dy, r] of [[620, 230, -2], [800, 216, 2], [980, 236, -1]]) m += G(R(-70, -54, 140, 108, 6, ol('#2A2246', 5)) + R(-58, -42, 116, 84, 3, { fill: '#FFF8E6' }) + P('M-40 -20 H40 M-40 -2 H40 M-30 14 H30', ln(3, '#C9B88A')) + CI(30, 28, 10, ol('#E8243C', 2.5)), tr(dx, dy, 1, r));
  m += G(P('M-80 -90 L80 -90 L80 20 Q80 80 0 110 Q-80 80 -80 20 Z', ol('#3E8FE0', 6)) + P('M-60 -70 L60 -70 L60 16 Q60 62 0 86 Q-60 62 -60 16 Z', { fill: '#FFC93C' }) + T('MH', 0, 10, 54, '#3E8FE0') + G(R(-110, -18, 220, 36, 8, ol('#FFFFFF', 4)) + T('MAPLE HILL', 0, 10, 24, '#2A2246'), 'translate(0 128)'), 'translate(1160 230)');
  m += schoolPoster('rules', 1700, 250, 3, 1.1);
  // bookshelf + filing cabinet + plant
  m += R(1560, 380, 300, 412, 6, ol('#8A5A30', 6)) + [470, 570, 670].map((y) => R(1574, y, 272, 10, 2, { fill: '#5A3A20' })).join('');
  [[1580, 470, '#E8243C', 66], [1610, 470, '#3E8FE0', 58], [1640, 470, '#FFC93C', 70], [1700, 470, '#5CB85A', 62], [1730, 470, '#B06BFF', 66], [1590, 570, '#2A2246', 70], [1622, 570, '#FF8A2A', 60], [1654, 570, '#3E8FE0', 66], [1760, 670, '#E8243C', 64], [1600, 670, '#FFC93C', 58], [1630, 670, '#5CB85A', 70]].forEach(([x, y, c, h]) => { m += R(x, y - h, 26, h, 3, ol(c, 3)); });
  m += R(180, 600, 170, 192, 6, ol('#9AA4B8', 5)) + R(196, 616, 138, 76, 4, ol('#B9C2D2', 3)) + R(196, 702, 138, 76, 4, ol('#B9C2D2', 3)) + R(240, 646, 50, 10, 4, ol('#5A6070', 2)) + R(240, 732, 50, 10, 4, ol('#5A6070', 2));
  m += G(P('M-34 0 L-40 -60 L40 -60 L34 0 Z', ol('#C8553D', 4)) + P('M0 -60 Q-40 -120 -20 -170 M0 -60 Q20 -140 50 -150 M0 -60 Q-10 -110 -60 -110', ln(10, '#5C9A4A')) + P(circD(-20, -170, 14) + circD(50, -150, 14) + circD(-60, -110, 12), { fill: '#5C9A4A', stroke: LINE, 'stroke-width': 3 }), 'translate(470 790)');
  // the principal's chair (behind the desk)
  m += R(600, 470, 200, 250, 40, ol('#5A2A2A', 6)) + R(626, 494, 148, 160, 30, { fill: '#7A3A3A' }) + P('M640 520 V630 M700 510 V640 M760 520 V630', ln(4, '#5A2A2A'));
  // hole: cracks + rim + debris
  if (hole > 0) {
    const ck = clamp(hole / 0.4, 0, 1);
    let cr = '';
    for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.05 + 0.9 * (i / 8)) , L = (90 + 90 * hash(i * 3.3)) * ck, r0 = 120; const x0 = hx + Math.cos(a) * r0 * 1.1, y0 = 792 - 220 + Math.sin(a) * r0 * 1.6; cr += `M${f(x0)} ${f(y0)} l${f(Math.cos(a + 0.4) * L * 0.5)} ${f(Math.sin(a + 0.4) * L * 0.5)} l${f(Math.cos(a - 0.2) * L * 0.5)} ${f(Math.sin(a - 0.2) * L * 0.5)} `; }
    m += P(cr, ln(4, '#4A5A3A', 0.8));
    if (holeK > 0) {
      const hd = holeD, id = S.uid('setsHole');
      // the hallway seen through the hole (lockers), with the wall's thickness on the inner edge
      const thru = R(hx - 260, 300, 520, 520, 0, { fill: 'url(#setsSchoolWall)' }) + R(hx - 260, 330, 520, 20, 0, { fill: '#FFC93C' }) + R(hx - 260, 350, 520, 440, 0, { fill: 'url(#setsLockers)' }) + R(hx - 260, 780, 520, 40, 0, { fill: '#D3DCE8' }) + P(hd, { fill: 'none', stroke: '#8A7A5A', 'stroke-width': 26 }) + P(hd, { fill: 'none', stroke: '#5A4A3A', 'stroke-width': 10 });
      m += S.clipDef(id, P(hd)) + G(thru, null, { 'clip-path': `url(#${id})` });
      m += P(hd, { fill: 'none', stroke: LINE, 'stroke-width': 7 }) + P(hd, { fill: 'none', stroke: '#E9DCC0', 'stroke-width': 3, transform: 'translate(-4 -3)' });
      m += P(`M${hx - 140} 800 l20 -16 l18 12 Z M${hx + 110} 800 l16 -20 l20 14 Z M${hx - 60} 806 l12 -10 l12 8 Z M${hx + 40} 808 l14 -12 l10 10 Z`, ol('#C9B88A', 3));
    }
  }
  // floor (carpet) + floor hole
  m += R(XL, 792, XR - XL, YB - 792, 0, { fill: 'url(#setsCarpet)' }) + band(788, 798, '#5A3A20');
  if (fh > 0) {
    const k = ease.outBack(fh), x = 1360, y = 970;
    let d = `M${x - 150 * k} ${y}`;
    for (let i = 1; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI * 2, r = (1 + (hash(i * 3.1) - 0.5) * 0.25) * k; d += ` L${f(x + Math.cos(a) * 150 * r)} ${f(y + Math.sin(a) * 36 * r)}`; }
    m += P(d + ' Z', { fill: '#0E0A1A', stroke: LINE, 'stroke-width': 6 }) + P(`M${x - 150 * k} ${y} Q${x} ${y + 18 * k} ${x + 150 * k} ${y}`, ln(10, '#2A3A5A', 0.7));
  }
  // ---- front: the desk
  let fr = R(360, 690, 700, 26, 6, ol('#A86B3C', 6)) + R(380, 716, 660, 220, 6, ol('#8A5530', 6)) + R(410, 740, 600, 170, 10, { fill: 'none', stroke: '#A86B3C', 'stroke-width': 6 }) + R(380, 930, 30, 18, 3, ol('#5A3A20', 3)) + R(1010, 930, 30, 18, 3, ol('#5A3A20', 3));
  fr += G(P('M-80 0 L-70 -30 L70 -30 L80 0 Z', ol('#2A2246', 4)) + T('PRINCIPAL', 0, -8, 22, '#FFC93C'), 'translate(710 690)');
  fr += G(R(-30, -60, 60, 60, 10, ol('#FFFFFF', 4)) + P('M30 -46 Q54 -42 30 -18', ln(6)) + TF("WORLD'S", 0, -38, 10, '#2A2246') + TF('OKAYEST', 0, -24, 11, '#E8243C') + TF('PRINCIPAL', 0, -11, 9, '#2A2246'), 'translate(900 688)');
  if (opts.steam !== false) for (let i = 0; i < 2; i++) { const ph = md(t * 0.5 + i * 0.5, 1); fr += P(`M${890 + i * 18} 620 q${f(-8 + ph * 16)} -24 0 ${f(-34 - ph * 30)}`, ln(5, '#FFFFFF', f(0.6 * (1 - ph)))); }
  fr += P('M440 690 l90 -8 l4 -12 l-90 8 Z', ol('#FFFFFF', 3)) + P('M444 676 l90 -8 l4 -12 l-90 8 Z', ol('#F4F6FF', 3)) + G(R(-34, -24, 68, 24, 6, ol('#2A2D38', 3)) + P('M-28 -24 Q0 -44 28 -24', ln(8, LINE)) + P('M-28 -24 Q0 -44 28 -24', ln(4, '#2A2D38')), 'translate(1000 690)') + G(R(-14, -40, 28, 40, 4, ol('#3E8FE0', 3)) + P('M-6 -40 L-8 -58 M4 -40 L8 -56', ln(4, '#FFC93C')), 'translate(580 690)');
  return { bg, mid: m, front: fr, fg: '', light: '' };
}
const principalOffice = makeSet(principalLayers);

// ---------------------------------------------------------------- 7e. CLASSROOM (math test)
// Chalkboard (x 420..1500, y 150..520) with a MATH TEST (opts.board = array of lines to replace it). Two rows of
// student desks: back row tops y 768, middle row tops y 868 (seats: SPOTS.classroom.seats — draw seated kids, then
// layers.front = desk tops/fronts + test papers). YOUR desk: SPOTS.classroom.heroDesk. Teacher's desk at right.
// Stand line y 990 in front of the desks. opts: { board, test (papers on desks, default true), clock }
function classroomLayers(t, opts = {}) {
  let bg = sky(t, 'day', 180, 330, 260, 400, { clouds: 2, sunX: 0.8, sunY: 0.2 }) + tree(200, 600, 0.8, { col: '#4CB65A', hi: '#7CD978' });
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V790 H${XL} Z M60 140 V520 H300 V140 Z`;
  m += P(wallD, { fill: 'url(#setsSchoolWall)', 'fill-rule': 'evenodd' }) + band(560, 790, '#9FCDEB') + band(552, 566, '#FFC93C') + P(`M${XL} 552 H${XR} M${XL} 566 H${XR}`, ln(3, LINE, 0.6));
  m += P('M40 120 H320 V540 H40 Z M60 140 V520 H300 V140 Z', { fill: '#FFFFFF', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 6 }) + P('M180 140 V520 M60 330 H300', ln(10, '#FFFFFF')) + P('M180 140 V520 M60 330 H300', ln(3, LINE, 0.3));
  // chalkboard + math test
  m += R(400, 130, 1120, 410, 12, ol('#B9824E', 8)) + R(420, 150, 1080, 370, 6, { fill: 'url(#setsChalk)' }) + R(410, 520, 1100, 18, 4, ol('#B9824E', 4)) + R(560, 512, 60, 10, 3, { fill: '#FFFFFF' }) + R(640, 512, 40, 10, 3, { fill: '#FFE14D' });
  const chalk = (s, x, y, size, col = '#F4F7EE', a = 'start') => TF(s, x, y, size, col, { 'text-anchor': a, opacity: 0.92 });
  if (opts.board) opts.board.forEach((l, i) => { m += chalk(l, 960, 230 + i * 70, i ? 46 : 64, i ? '#F4F7EE' : '#FFE14D', 'middle'); });
  else {
    m += chalk('MATH TEST', 960, 214, 62, '#FFE14D', 'middle') + P('M770 228 H1150', ln(4, '#FFE14D', 0.8));
    m += chalk('1)  3x + 7 = 22', 470, 292, 40) + chalk('2)  ½ + ⅓ = ?', 470, 350, 40) + chalk('3)  x² = 144', 470, 408, 40) + chalk('4)  find the angle →', 470, 462, 34);
    m += P('M1150 440 L1440 440 L1300 290 Z', ln(5, '#F4F7EE', 0.9)) + chalk('?', 1200, 430, 34) + chalk('40°', 1290, 336, 28) + chalk('NO CALCULATORS!', 1300, 262, 30, '#FF9AA6', 'middle');
  }
  // clock, posters, flag-free alphabet strip
  m += schoolClock(1620, 200, 56, opts.clock ?? t) + schoolPoster('math', 1750, 380, 3, 0.95) + schoolPoster('kind', 1650, 520, -3, 0.7);
  m += G(R(-90, -110, 180, 220, 6, ol('#FFFFFF', 5)) + T('×', 0, -70, 40, '#3E8FE0') + P(Array.from({ length: 5 }, (_, i) => `M-70 ${-40 + i * 30} H70`).join(' '), ln(3, '#C9D3E2')) + TF('2×2=4', 0, -30, 18, '#2A2246') + TF('3×3=9', 0, 0, 18, '#2A2246') + TF('7×8=56', 0, 30, 18, '#2A2246') + TF('9×9=81', 0, 60, 18, '#2A2246'), 'translate(400 680) scale(0.8)');
  // teacher's desk (right) with an apple
  m += R(1560, 690, 320, 24, 6, ol('#A86B3C', 5)) + R(1576, 714, 288, 110, 6, ol('#8A5530', 5)) + CI(1620, 670, 20, ol('#E8243C', 4)) + P('M1620 650 Q1626 636 1640 636', ln(4, '#5CB85A')) + P('M1700 690 l90 -6 l4 -12 l-90 6 Z', ol('#FFFFFF', 3));
  m += R(XL, 790, XR - XL, YB - 790, 0, { fill: 'url(#setsVCT)' }) + R(XL, 940, XR - XL, YB - 940, 0, { fill: '#E3E9F1', opacity: 0.35 });
  // student desks: chair backs (mid) + desk tops/fronts (front)
  const BACK = [400, 760, 1120, 1480], MIDR = [220, 580, 940, 1300, 1660];
  let fr = '';
  const desk = (x, top, s, paper) => {
    let back = G(R(-60, -170, 120, 120, 18, ol('#3E8FE0', 5)) + R(-46, -156, 92, 40, 12, { fill: '#6FB2F2' }), tr(x, top, s));
    let front = G(R(-110, -8, 220, 22, 5, ol('#E8B86A', 4)) + R(-100, 14, 200, 70, 4, ol('#8A93A6', 4)) + P('M-90 84 L-96 130 M90 84 L96 130', ln(6, '#6A7488')) + (paper ? G(P('M-50 -10 L44 -14 L46 -2 L-48 2 Z', ol('#FFFFFF', 2.5)) + TF('TEST', -2, -4, 9, '#E8243C'), '') : ''), tr(x, top, s));
    return [back, front];
  };
  BACK.forEach((x) => { const [b, d] = desk(x, 768, 0.82, opts.test !== false); m += b; fr += d; });
  MIDR.forEach((x) => { const [b, d] = desk(x, 868, 1, opts.test !== false); m += b; fr += d; });
  return { bg, mid: m, front: fr, fg: '', light: '' };
}
const classroom = makeSet(classroomLayers);

// ---------------------------------------------------------------- 7f. SCHOOLYARD (empty, dawn / sunset)
// The school building behind a chain-link fence, blacktop with painted games, a basketball hoop on a pole (left), a
// bench (right). Brick's cage goes at SPOTS.schoolyard.cage (cage(x, y, .9, t, ...)). Long soft shadows at dawn/sunset.
// Stand line y 960. opts: { time 'dawn'|'day'|'sunset' (default 'dawn') }
def(lg('setsAsphalt', [[0, '#6E7488'], [1, '#585E72']]));
function schoolyardLayers(t, opts = {}) {
  const time = opts.time || 'dawn', low = time !== 'day';
  const tint = time === 'sunset' ? '#FF9A5A' : time === 'dawn' ? '#FFB8C8' : null;
  let bg = sky(t, time === 'dawn' ? 'dawn' : time === 'sunset' ? 'sunset' : 'day', 960, 240, 1920, 480, { clouds: 3, sunX: 0.85, sunY: low ? 0.78 : 0.2 });
  let m = '';
  // building
  m += R(240, 300, 1440, 470, 0, { fill: 'url(#setsBrick)', stroke: LINE, 'stroke-width': 6 }) + R(220, 280, 1480, 32, 6, ol('#E9E4D8', 5));
  m += R(260, 330, 1400, 300, 0, { fill: 'url(#setsWinRow)' }) + R(760, 210, 400, 100, 0, { fill: 'url(#setsBrick)', stroke: LINE, 'stroke-width': 6 }) + R(740, 196, 440, 24, 5, ol('#E9E4D8', 4));
  m += schoolClock(960, 260, 38, t);
  m += R(560, 304, 800, 56, 6, ol('#3E8FE0', 5)) + T('MAPLE HILL MIDDLE SCHOOL', 960, 344, 36, '#FFFFFF', { 'letter-spacing': 1 });
  m += R(840, 580, 240, 190, 4, ol('#3E8FE0', 5)) + P('M960 580 V770', ln(5)) + R(860, 600, 80, 70, 4, ol('#BFE6FF', 3)) + R(980, 600, 80, 70, 4, ol('#BFE6FF', 3)) + P('M800 580 L1120 580 L1100 548 L820 548 Z', ol('#E9E4D8', 5));
  if (tint) m += R(240, 300, 1440, 470, 0, { fill: tint, opacity: 0.18 });
  m += tree(140, 780, 1.1, { col: time === 'sunset' ? '#6F8A52' : '#4CB65A', hi: '#7CD978' }) + tree(1800, 780, 1, { col: time === 'sunset' ? '#6F8A52' : '#3FA650', hi: '#6CCB6A' });
  // chain-link fence
  m += R(XL, 640, XR - XL, 150, 0, { fill: 'url(#setsChain)' }) + band(636, 646, '#9AA4B8');
  for (let x = -600; x < 2600; x += 300) m += R(x - 6, 630, 12, 170, 3, ol('#8A93A6', 3));
  // blacktop + games
  m += R(XL, 790, XR - XL, YB - 790, 0, { fill: 'url(#setsAsphalt)' }) + band(788, 800, '#4A5064');
  m += P('M1250 840 L1650 840 L1720 930 L1180 930 Z M1450 840 L1450 930 M1215 885 L1685 885', ln(5, '#FFFFFF', 0.85));
  let hop = '';
  [[420, 850], [420, 880], [380, 912], [460, 912], [420, 946]].forEach(([x, y], i) => { hop += `M${x - 34} ${y - 14} h68 v28 h-68 Z `; });
  m += P(hop, ln(4, '#FFE14D', 0.85)) + E(900, 900, 160, 28, { fill: 'none', stroke: '#FF8FA3', 'stroke-width': 5, opacity: 0.8 });
  // hoop on a pole (left)
  m += R(232, 380, 22, 470, 4, ol('#8A93A6', 5)) + R(150, 340, 170, 110, 6, ol('#FFFFFF', 5)) + R(206, 382, 60, 44, 3, { fill: 'none', stroke: '#FF6A2E', 'stroke-width': 5 }) + E(236, 456, 42, 9, { fill: 'none', stroke: '#FF6A2E', 'stroke-width': 7 }) + P('M198 458 L210 506 L262 506 L274 458 M220 460 L226 506 M252 460 L246 506', ln(3, '#FFFFFF'));
  // bench (right)
  m += R(1560, 880, 240, 18, 4, ol('#C98A52', 4)) + R(1560, 846, 240, 16, 4, ol('#C98A52', 4)) + P('M1580 898 L1576 930 M1780 898 L1784 930', ln(8, '#5A6070'));
  m += CI(1120, 812, 22, ol('#FF8A2A', 4)) + P('M1100 812 H1140 M1120 790 V834', ln(2.5));
  // long shadows (dawn / sunset)
  if (low) { const dir = time === 'sunset' ? 1 : -1; m += poly([[232, 850], [254, 850], [254 + dir * 520, 940], [232 + dir * 520, 940]], { fill: '#1E1A3A', opacity: 0.25 }) + poly([[1560, 930], [1800, 930], [1800 + dir * 260, 970], [1560 + dir * 260, 970]], { fill: '#1E1A3A', opacity: 0.2 }); }
  let light = tint ? cover(tint, { opacity: 0.1 }) : '';
  light += motes(t, 8, 0, 600, 1920, 300, '#FFFFFF', 0.5, 4, 6);
  return { bg, mid: m, front: '', fg: '', light };
}
const schoolyard = makeSet(schoolyardLayers);

// ================================================================= 8. THE JAIL CAGE (command prop)
// cage(x, y, s, t, opts): origin = floor contact, bottom centre. At s = 1: 500 wide, 680 tall (fits Brick at ~s .55;
// for the hero s .5 use s .85). Glowing bars + a "JAILED" plate on two chains.
// opts: { drop 0..1 (0 = high above the frame; falls ACCELERATING, lands at .7, squash-bounce + dust to 1),
//   part 'back'|'front'|'all' (draw part:'back', then the prisoner, then part:'front'),
//   theme 'green' (YOUR command) | 'gold' (the Admin's), glow 0..1 (default 1), vanish 0..1 (un-jail: bars dissolve),
//   plate (text, default 'JAILED') }
function cage(x, y, s = 1, t = 0, opts = {}) {
  const part = opts.part || 'all', gold = opts.theme === 'gold', glow = opts.glow ?? 1, drop = opts.drop ?? 1, van = bool01(opts.vanish);
  const C = gold ? { bar: '#FFD34D', core: '#FFF6C8', frame: '#B88A1A', glow: 'setsGlowGold', text: '#FFE14D' } : { bar: '#3DFF9A', core: '#D4FFE8', frame: '#1E7A50', glow: 'setsGlowGreen', text: '#7DFFB8' };
  let dy = 0, sx = 1, sy = 1, dust = '';
  if (drop < 0.7) { const v = drop / 0.7; dy = -1500 * (1 - v * v); }
  else {
    const k = (drop - 0.7) / 0.3;
    sy = 1 - 0.16 * Math.sin(k * Math.PI * 2.2) * (1 - k); sx = 1 + (1 - sy) * 0.8;
    if (k < 0.8) { const u = k / 0.8; for (const d of [-1, 1]) for (let i = 0; i < 3; i++) dust += CI(d * (250 + u * 160 + i * 40), -20 - i * 14 - u * 30, (26 + i * 8) * (1 - u * 0.5), { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4, opacity: f(1 - u) }); }
  }
  const pulse = 0.85 + 0.15 * Math.sin(t * 4);
  const W = 240, H = 680, BX = 34, BY = -26;
  const barsD = (x0, x1, n, y0, y1, ox = 0, oy = 0) => { let d = ''; for (let i = 0; i < n; i++) { const bx = lerp(x0, x1, i / (n - 1)); d += `M${f(bx + ox)} ${f(y0 + oy)} L${f(bx + ox)} ${f(y1 + oy)} `; } return d; };
  const bars = (d, w) => P(d, ln(w + 9, LINE)) + P(d, ln(w + 14, C.bar, 0.25 * glow * pulse)) + P(d, ln(w, C.bar)) + P(d, ln(w * 0.35, C.core));
  let back = '', front = '';
  // back: floor glow, back bars, back frame
  back += E(0, 0, W + 90, 40, { fill: C.bar, opacity: f(0.22 * glow) }) + glowSpot(0, -H / 2, 520, C.glow, 0.45 * glow * pulse);
  back += bars(barsD(-W + 30, W - 30, 7, -H + 40, -10, BX, BY), 8);
  back += P(`M${-W + BX} ${-H + BY} H${W + BX} M${-W + BX} ${BY - 4} H${W + BX}`, ln(22, LINE)) + P(`M${-W + BX} ${-H + BY} H${W + BX} M${-W + BX} ${BY - 4} H${W + BX}`, ln(14, C.frame));
  // front: posts, front bars, top + bottom frames, plate
  front += bars(barsD(-W + 22, W - 22, 9, -H + 30, -6), 13);
  front += P(`M${-W} ${-H} L${-W + BX} ${-H + BY} M${W} ${-H} L${W + BX} ${-H + BY} M${W} 0 L${W + BX} ${BY}`, ln(24, LINE)) + P(`M${-W} ${-H} L${-W + BX} ${-H + BY} M${W} ${-H} L${W + BX} ${-H + BY} M${W} 0 L${W + BX} ${BY}`, ln(14, C.frame));
  front += R(-W - 14, -H - 20, 2 * W + 28, 42, 10, ol(C.frame, 6)) + R(-W - 6, -H - 14, 2 * W + 12, 8, 4, { fill: C.bar, opacity: 0.9 });
  front += R(-W - 14, -22, 2 * W + 28, 30, 8, ol(C.frame, 6)) + R(-W - 6, -18, 2 * W + 12, 6, 3, { fill: C.bar, opacity: 0.8 });
  front += R(-W - 20, -H - 20, 34, H + 28, 8, ol(C.frame, 6)) + R(W - 14, -H - 20, 34, H + 28, 8, ol(C.frame, 6));
  {
    const sw = Math.sin(t * 2.4) * 3;
    let pl = P('M-60 0 L-70 26 M60 0 L70 26', { fill: 'none', stroke: '#8A93A6', 'stroke-width': 5, 'stroke-dasharray': '7 4' });
    pl += R(-116, 24, 232, 66, 10, ol('#2A2D38', 6)) + R(-106, 33, 212, 48, 6, { fill: 'none', stroke: C.bar, 'stroke-width': 3 }) + T(opts.plate || 'JAILED', 0, 72, 40, C.text, { 'letter-spacing': 3 });
    front += G(pl, `translate(0 ${-H + 20}) rotate(${f(sw)} 0 0)`);
  }
  const tf = `translate(${f(x)} ${f(y)}) scale(${f(s * sx)} ${f(s * sy)}) translate(0 ${f(dy / s)})`;
  const wrap = (svg) => (van > 0 ? vanish(svg, van, [-W - 30, -H - 40, 2 * W + 90, H + 60], 21) : svg);
  if (part === 'back') return G(wrap(back), tf);
  if (part === 'front') return G(wrap(front), tf) + G(dust, tr(x, y, s));
  return G(wrap(back + front), tf) + G(dust, tr(x, y, s));
}

// ================================================================= 9. NEWS STUDIO (city in chaos behind the glass)
// A glass-walled studio high above the city: the big window (x 140..1780, y 90..650) shows the evening city; with
// opts.chaos 0..1 the chaos ramps in: people and a bus fly by, giant cats sit on the rooftops, Granny's fire trail
// streaks across, and at chaos > .6 a GIANT CAT PAW presses against the glass. opts.window (svg|fn(1640,560)) replaces
// the view entirely (e.g. frameIn(cityShot, w, h)). The anchor stands behind the curved desk: SPOTS.newsStudio.anchor
// (layers.front = desk). opts.ticker = scrolling BREAKING NEWS lower third (y 870..940 or opts.tickerY, in layers.fg);
// newsStudio.ticker(t, text, opts) draws only the ticker (screen-fixed, outside the camera). opts.logo (desk text).
def(lg('setsNewsSky', [[0, '#2A1A5A'], [0.5, '#7A3A8A'], [0.85, '#E0668A'], [1, '#FFA86A']]));
def('<pattern id="setsCityWin" width="40" height="48" patternUnits="userSpaceOnUse"><rect x="6" y="8" width="12" height="16" rx="2" fill="#FFE08A" opacity="0.9"/><rect x="24" y="8" width="12" height="16" rx="2" fill="#3A2A6A" opacity="0.7"/><rect x="6" y="30" width="12" height="16" rx="2" fill="#3A2A6A" opacity="0.7"/><rect x="24" y="30" width="12" height="16" rx="2" fill="#FFB8E0" opacity="0.8"/></pattern>');
def(lg('setsNewsFloor', [[0, '#1E2450'], [1, '#12162E']]));
function flyer(x, y, s, rot, col) {
  return G(R(-14, -60, 28, 26, 6, ol('#FFE0C0', 3)) + R(-16, -34, 32, 34, 5, ol(col, 3)) + P('M-16 -30 L-34 -50 M16 -30 L34 -50 M-8 0 L-14 26 M8 0 L14 26', ln(7, LINE)), tr(x, y, s, rot));
}
function newsTicker(t, text, opts = {}) {
  const y = opts.y ?? 870;
  let o = R(-10, y, 1940, 70, 0, { fill: '#10162A', opacity: 0.94 });
  const msg = `${text}   •   `, w = Math.max(400, msg.length * 21);
  const x0 = 380 - md(t * 200, w);
  let s = '';
  for (let x = x0; x < 1940; x += w) s += TF(msg, x, y + 48, 34, '#FFE14D', { 'text-anchor': 'start' });
  o += s + R(-10, y - 8, 370, 86, 0, { fill: '#E8243C' }) + T('BREAKING', 175, y + 52, 50, '#FFFFFF') + P(`M360 ${y - 8} L400 ${y - 8} L360 ${y + 78} Z`, { fill: '#E8243C' });
  o += R(1690, y - 46, 230, 40, 0, { fill: '#E8243C' }) + T('LIVE', 1790, y - 15, 30, '#FFFFFF') + CI(1730, y - 26, 8, { fill: '#FFFFFF', opacity: Math.floor(t * 2) % 2 ? 0.4 : 1 });
  return o;
}
function newsLayers(t, opts = {}) {
  const chaos = bool01(opts.chaos);
  const WX0 = 140, WX1 = 1780, WY0 = 90, WY1 = 650;
  // bg: the city
  let bg = '';
  if (opts.window !== undefined) bg = cover('#10142A') + G(screenOf(opts.window, WX1 - WX0, WY1 - WY0), `translate(${(WX0 + WX1) / 2} ${(WY0 + WY1) / 2})`);
  else {
    bg = cover('url(#setsNewsSky)');
    let st = '';
    for (let i = 0; i < 24; i++) st += circD(hash(i * 3.3) * 1920, hash(i * 6.1) * 260 + 20, 1.6 + hash(i) * 1.8);
    bg += P(st, { fill: '#FFFFFF', opacity: 0.7 }) + glowSpot(1500, 180, 180, 'setsGlowWhite', 0.4) + CI(1500, 180, 52, ol('#FFF3D6', 4));
    const B = [[60, 360, 160], [230, 300, 130], [370, 420, 120], [500, 250, 170], [680, 380, 120], [810, 300, 150], [970, 440, 110], [1090, 280, 160], [1260, 360, 120], [1390, 240, 170], [1570, 340, 140], [1720, 290, 160]];
    for (const [x, top, w] of B) bg += R(x, top, w, 700 - top, 4, { fill: '#2E2160', stroke: '#1E1440', 'stroke-width': 4 }) + R(x + 10, top + 14, w - 20, 680 - top, 0, { fill: 'url(#setsCityWin)' });
    bg += R(-200, 560, 2320, 200, 0, { fill: '#E0668A', opacity: 0.25 });
    if (chaos > 0) {
      // giant cats on rooftops (silhouettes with glowing eyes)
      const catSil = (cx, top, sc, k) => G(P('M-90 0 Q-100 -120 -60 -150 L-70 -210 L-30 -170 Q0 -180 30 -170 L70 -210 L60 -150 Q100 -120 90 0 Z', ol('#F28C28', 6)) + E(-30, -120, 12, 15, ol('#FFE14D', 3)) + E(30, -120, 12, 15, ol('#FFE14D', 3)) + E(-30, -118, 4, 11, { fill: LINE }) + E(30, -118, 4, 11, { fill: LINE }) + P('M90 -20 Q170 -40 150 -140', ln(30, LINE)) + P('M90 -20 Q170 -40 150 -140', ln(20, '#F28C28')), `translate(${cx} ${f(top + (1 - k) * 200)}) scale(${sc})`, { opacity: f(k) });
      bg += catSil(575, 254, 0.9, clamp(chaos * 2, 0, 1)) + catSil(1475, 244, 0.75, clamp(chaos * 2 - 0.3, 0, 1));
      // fire trail (Granny) arc
      const ft = clamp(chaos * 1.5 - 0.2, 0, 1);
      if (ft > 0) bg += P(`M${f(1900 - 1700 * ft)} 140 Q960 60 1900 220`, ln(26, '#FF8A2A', 0.5)) + P(`M${f(1900 - 1700 * ft)} 140 Q960 60 1900 220`, ln(10, '#FFE14D', 0.9));
      // flying people + a bus
      for (let i = 0; i < 6; i++) { const ph = md(t * (0.05 + 0.03 * hash(i)) + hash(i * 3.7), 1); if (hash(i * 9.1) < chaos) bg += flyer(lerp(100, 1800, ph), 200 + hash(i * 5.3) * 280 + Math.sin(t + i) * 20, 0.8 + 0.5 * hash(i * 2.2), (t * 40 + i * 60) % 360, ['#E8243C', '#3E8FE0', '#5CB85A', '#FFC93C', '#B06BFF', '#FF8A2A'][i]); }
      if (chaos > 0.3) { const bx = lerp(-300, 2200, md(t * 0.04, 1)); bg += G(R(-150, -60, 300, 110, 18, ol('#FFC93C', 6)) + [-110, -50, 10, 70].map((wx) => R(wx, -44, 46, 36, 6, ol('#BFE6FF', 3))).join('') + CI(-90, 50, 22, ol('#2A2D38', 4)) + CI(90, 50, 22, ol('#2A2D38', 4)) + T('SCHOOL', 0, 30, 24, '#2A2246'), `translate(${f(bx)} ${f(330 + Math.sin(t) * 30)}) rotate(${f(Math.sin(t * 0.7) * 12)}) scale(0.7)`); }
    }
  }
  // mid: studio walls, window frame, floor, lights
  let m = '';
  const wallD = `M${XL} ${YT} H${XR} V${YB} H${XL} Z M${WX0} ${WY0} V${WY1} H${WX1} V${WY0} Z`;
  m += P(wallD, { fill: '#1A1E3E', 'fill-rule': 'evenodd' });
  m += R(WX0 - 20, WY0 - 20, WX1 - WX0 + 40, WY1 - WY0 + 40, 10, { fill: 'none', stroke: '#2E3466', 'stroke-width': 30 }) + R(WX0 - 34, WY0 - 34, WX1 - WX0 + 68, WY1 - WY0 + 68, 14, ln(6));
  m += P([550, 960, 1370].map((x) => `M${x} ${WY0} V${WY1}`).join(' '), ln(26, '#2E3466')) + P([550, 960, 1370].map((x) => `M${x} ${WY0} V${WY1}`).join(' '), ln(4, LINE, 0.5));
  m += P(`M${WX0 + 60} ${WY1 - 40} L${WX0 + 260} ${WY0 + 30} L${WX0 + 320} ${WY0 + 30} L${WX0 + 120} ${WY1 - 40} Z M${1000} ${WY1 - 20} L${1180} ${WY0 + 50} L${1210} ${WY0 + 50} L${1030} ${WY1 - 20} Z`, { fill: '#FFFFFF', opacity: 0.07 });
  // giant paw on the glass
  if (chaos > 0.6 && opts.window === undefined) {
    const k = ease.outBack(clamp((chaos - 0.6) / 0.25, 0, 1));
    let paw = E(0, 0, 230, 190, ol('#F28C28', 7)) + E(0, 30, 120, 96, ol('#FF9AB0', 6)) + [[-150, -110], [-55, -170], [55, -170], [150, -110]].map(([px, py]) => E(px, py, 54, 64, ol('#FF9AB0', 5))).join('') + P('M-200 60 Q-150 40 -120 70 M200 60 Q150 40 120 70', ln(8, '#C9651A'));
    m += G(paw, `translate(1180 ${f(520 + (1 - k) * 400)}) rotate(-12) scale(${f(0.95 * k)})`);
  }
  // studio lights on a truss
  m += R(XL, 30, XR - XL, 18, 0, ol('#3A3F5E', 4));
  for (const lx of [330, 760, 1160, 1590]) m += P(`M${lx} 48 v24`, ln(6)) + P(`M${lx - 30} 72 L${lx + 30} 72 L${lx + 22} 110 L${lx - 22} 110 Z`, ol('#2A2D38', 4)) + E(lx, 112, 22, 6, { fill: '#FFF8D6' }) + P(`M${lx - 22} 112 L${lx + 22} 112 L${lx + 140} 700 L${lx - 140} 700 Z`, { fill: '#FFFFFF', opacity: 0.045 });
  // side screens with the logo
  for (const sx of [40, 1880]) m += R(sx - 70, 300, 140, 240, 10, ol('#10142A', 5)) + T('CN', sx, 410, 56, '#3E8FE0') + T('9', sx, 476, 64, '#FFC93C');
  m += R(XL, 700, XR - XL, YB - 700, 0, { fill: 'url(#setsNewsFloor)' }) + P(`M${XL} 700 H${XR}`, ln(5, '#3E4A8A'));
  m += E(960, 780, 700, 40, { fill: '#3E4A8A', opacity: 0.35 });
  if (chaos > 0) m += cover('#FF3B5C', { opacity: f(0.08 * chaos * (0.6 + 0.4 * Math.sin(t * 6))) });
  // front: anchor desk
  let fr = P('M360 800 Q960 750 1560 800 L1520 1030 L400 1030 Z', ol('#E9EDF5', 7)) + P('M380 832 Q960 784 1540 832', ln(8, '#E8243C')) + P('M400 990 Q960 950 1520 990', ln(4, '#AEB7C6', 0.6));
  fr += P('M340 792 Q960 740 1580 792 L1580 812 Q960 762 340 812 Z', ol('#3E4A8A', 6));
  if (!opts.ticker) fr += G(R(-130, -30, 260, 60, 16, ol('#3E8FE0', 5)) + T(opts.logo || 'CITY NEWS 9', 0, 12, 34, '#FFFFFF'), 'translate(960 890)');
  fr += R(1180, 762, 120, 26, 4, ol('#FFFFFF', 4)) + R(1192, 754, 120, 26, 4, ol('#F4F1E6', 4)) + G(R(-22, -48, 44, 48, 8, ol('#E8243C', 4)) + P('M22 -38 Q40 -32 22 -16', ln(5)), 'translate(640 780)');
  const fg = opts.ticker ? newsTicker(t, opts.ticker, { y: opts.tickerY }) : '';
  return { bg, mid: m, front: fr, fg, light: '' };
}
const newsStudio = makeSet(newsLayers);
newsStudio.ticker = newsTicker;

// <<SETS_APPEND>>

// ================================================================= floor lines + anchors
// FLOOR[set] = default stand line (characters' feet y) in the default 1920x1080 framing.
const FLOOR = {
  heroRoom: 990,       // stand line in front of the bed/desk (wall seam y 790; anything with feet y 860..1020 reads "on the floor")
  kitchen: 990,        // in front of the stove/counters (counter feet y 806; the table at front-left is layers.front)
  fridgeInside: 984,   // the hero squeezed between the milk and the cake (s .5)
  livingRoom: 990,     // in front of the couch (seated: SPOTS.livingRoom.couch.seats, feet y 905, draw layers.front after them)
  houseExterior: 945,  // the sidewalk — WIDE shot: hero ~s .3 here (lawn y 800..915 for s .22..28)
  street: 940,         // the sidewalk (hero s .5); world x -1200..7200
  serverStreet: 940,   // the sidewalk (hero s .5); sign at x 380, the sale at x 2600
  garageSale: 965,     // on the driveway in front of the tables
  cafeteria: 990,      // the lunch line (SPOTS.cafeteria.line[0] = front)
  gym: 990,            // captains / coach; the pick line is further back (SPOTS.gym.pickLine, feet y 828, s .42)
  hallway: 960,        // crowds between y 900 (s .42) and 1000 (s .52)
  principalOffice: 990,
  classroom: 990,      // in front of the desks (seated: SPOTS.classroom.seats)
  schoolyard: 960,
  newsStudio: 960,     // the anchor's feet (hidden by the desk; s .55)
};
const lapScreen = (L) => ({ cx: L.x, cy: L.y - 296 * L.s, w: 400 * L.s, h: 300 * L.s });
const SPOTS = {
  heroRoom: {
    ceiling: { y: HR.ceil, heroFeet: 572 },        // y of the ceiling line; hero s .5 with hair touching it has feet at y ~572
    window: HR.win, wallBase: HR.base,
    desk: { x0: HR.desk.x0, x1: HR.desk.x1, top: HR.desk.top },
    monitor: { x: HR.mon.x, y: HR.mon.y, screen: { cx: HR.mon.x + 1, cy: HR.mon.y - 90 * HR.mon.s, w: 200 * HR.mon.s, h: 132 * HR.mon.s } },
    note: { x: HR.mon.x + 76 * HR.mon.s, y: HR.mon.y - 38 * HR.mon.s },  // the password sticky note (zoom here for Zoe's line)
    chair: { x: 1040, seat: 716 },
    bed: { x0: 1166, x1: 1796, top: HR.bed, pillow: { x: 1692, y: HR.bed - 30 }, lie: { x: 1530, y: 888, s: 0.5, rot: 90 }, sit: { hip: HR.bed + 10, feet: 870, x0: 1200, x1: 1600 } },
    laptop: { bed: { ...HR_LAP.bed, screen: lapScreen(HR_LAP.bed) }, desk: { ...HR_LAP.desk, screen: lapScreen(HR_LAP.desk) } },
    laundry: { x: 170, y: 840 },
  },
  kitchen: {
    ceiling: KC.ceil, wallBase: KC.base, counterTop: KC.top, window: KC.win,
    stove: { x: (KC.stove.x0 + KC.stove.x1) / 2, y: 930, s: 0.5 },          // Granny at the stove (feet hidden by nothing: she stands in front)
    pan: { x: 772, y: KC.top - 22 },                                          // the pancake in the pan
    stack: { x: KC.stack.x, y: KC.stack.base, top: (n) => KC.stack.base - Math.min(KC.stack.base - KC.ceil - 26, n * 10, 40 + (KC.stack.base - KC.ceil - 66) * n / 400) },
    fridge: { x0: KC.fr.x0, x1: KC.fr.x1, top: KC.fr.top, doorTop: KC.fr.split, base: KC.fr.base, handle: { x: KC.fr.x0 + 25, y: 450 }, inside: { x: 1480, y: 784, s: 0.34 } },
    table: { x0: KC.table.x0, x1: KC.table.x1, top: KC.table.top, seats: [{ x: 230, hip: 790, s: 0.45 }, { x: 530, hip: 790, s: 0.45 }] },
    backDoor: { x: 1810, y: 800, catFlap: { x: 1810, y: 750 } },
  },
  fridgeInside: { hero: { x: 960, y: 984, s: 0.5 }, shelf: 488, milk: { x: 470, y: 984 }, cake: { x: 1450, y: 984 } },
  livingRoom: {
    wallBase: LR.base,
    // the open window: Dad floats up from the chair and out through it; once he is past the frame draw him between
    // layers.bg and layers.mid (he is outside the house). exit = a point in the opening at sill height.
    window: { ...LR.win, sill: LR.win.y1, exit: { x: 300, y: 560 } },
    desk: { x0: LR.desk.x0, x1: LR.desk.x1, top: LR.desk.top, laptop: { cx: LR.desk.x0 + 386, cy: LR.desk.top - 107, w: 207, h: 176 } },
    dadChair: { x: 640, seat: 722, feet: 812, s: 0.5 },          // Dad sits facing left (view 'side'), his laptop is at left
    couch: { x0: LR.couch.x0, x1: LR.couch.x1, seat: LR.couch.seat, seats: [{ x: 850, y: 905 }, { x: 1030, y: 905 }, { x: 1210, y: 905 }], lie: { x: 1040, y: 925, s: 0.5, rot: -90 } },
    tv: { cx: 1488, cy: 586, w: 180, h: 130 }, catBed: { x: 1480, y: 895 },
    door: { x0: LR.door.x0, x1: LR.door.x1, top: LR.door.y0 }, fridgeFar: { x: 1765, y: 522 },
    table: { x: 1030, top: 924 },
  },
  houseExterior: {
    house: { x: 760, y: 800, s: 0.85, liftPx: 640 },   // house(760, 800 - lift*640, .85): door at x 760, door bottom y 766
    door: { x: 760, y: 790, s: 0.22 }, yourWindow: { x: 760 - 195 * 0.85, y: 800 - 515 * 0.85 }, parentsWindow: { x: 760 + 195 * 0.85, y: 800 - 515 * 0.85 },
    pool: { x: 1610, y: 850, rx: 222, ry: 44, splashX: 1570 }, lawn: { y0: 800, y1: 915 }, sidewalk: 945, tree: { x: 250, y: 830 }, mailbox: { x: 1120, y: 920 },
  },
  street: { sidewalk: 940, lawnEdge: 884, mailboxes: { first: 120, every: 640, y: 888 }, pigeon: { x: 1500, y: 944, s: 1.2 }, worldX: [-1200, 7200] },
  serverStreet: { sidewalk: 940, sign: { x: 380, y: 892, s: 0.82 }, lamps: { first: 700, every: 900 }, saleSign: { x: 2300, y: 892 }, sale: { x: 2600 }, worldX: [-1200, 4800] },
  garageSale: {
    oldman: { x: 1110, y: 845, s: 0.42 },             // behind the right table (feet hidden: draw layers.front after him)
    laptop: { x: 1000, y: 692, s: 0.36, screen: { cx: 1000, cy: 692 - 296 * 0.36, w: 144, h: 108 } }, price: { x: 1130, y: 650 },
    lavaLamp: { x: 270, y: 690 }, owl: { x: 1210, y: 680 }, tables: [{ x0: 200, x1: 640, top: 700 }, { x0: 760, x1: 1280, top: 690 }],
    hero: { x: 560, y: 965, s: 0.5 }, tumbleY: 930,
  },
  cafeteria: {
    line: [1700, 1510, 1320, 1130, 940, 750].map((x) => ({ x, y: 990, s: 0.5 })),   // [0] = the FRONT of the line (face right: view 'side', flip)
    lunchLady: { x: 1380, y: 890, s: 0.5 },          // behind the counter: draw her before layers.front
    counterTop: 736, register: { x: 1860, y: 700 },
    seats: [150, 300, 450, 600].map((x) => ({ x, y: 850, s: 0.42 })),   // behind the table (legs hidden by layers.front)
    table: { x0: 30, x1: 690, top: 700 }, trays: [{ x: 160, y: 690, s: 0.55 }, { x: 400, y: 690, s: 0.55 }],
  },
  gym: {
    pickLine: [180, 300, 420, 540, 660, 780, 900, 1020].map((x) => ({ x, y: 828, s: 0.42 })),   // kids against the mats; the hero is last
    captains: [{ x: 640, y: 990, s: 0.5 }, { x: 1040, y: 990, s: 0.5 }], coach: { x: 300, y: 990, s: 0.52 },
    bleachers: [{ y: 560, x0: 1180 }, { y: 620, x0: 1160 }, { y: 680, x0: 1140 }, { y: 740, x0: 1120 }].map((r) => ({ ...r, s: 0.36 })),  // seat top y per row
    hoop: { x: 520, y: 380 }, scoreboard: { x: 1580, y: 380 }, lanes: [875, 904], rope: { x: 880, bottom: 626 },
  },
  hallway: { doors: { every: 6400, first: 0, also: 3200 }, lockers: { y0: 330, y1: 782 }, worldX: [-1200, 6800] },
  principalOffice: {
    principal: { x: 700, y: 900, s: 0.5 },           // behind the desk (sitting: hips ~y 760); draw before layers.front
    desk: { x0: 360, x1: 1060, top: 690 }, mug: { x: 900, y: 688 },
    hole: { x: 1360, y: 792, s: 0.44 },                // the hero-shaped hole in the back wall (feet on the wall base)
    floorHole: { x: 1360, y: 970 }, window: { x0: 120, y0: 150, x1: 480, y1: 470 },
  },
  classroom: {
    board: { x0: 420, y0: 150, x1: 1500, y1: 520 },
    seats: [...[400, 760, 1120, 1480].map((x) => ({ x, y: 860, s: 0.4, row: 'back' })), ...[220, 580, 940, 1300, 1660].map((x) => ({ x, y: 960, s: 0.48, row: 'mid' }))],
    heroDesk: { x: 940, y: 960, s: 0.48 }, deskTops: [768, 868], teacherDesk: { x: 1720, top: 690 },
  },
  schoolyard: { cage: { x: 1150, y: 940, s: 0.9 }, hoop: { x: 236, y: 456 }, bench: { x: 1680, seat: 846 }, door: { x: 960, y: 770 } },
  newsStudio: { anchor: { x: 960, y: 960, s: 0.55 }, deskTop: 776, window: { x0: 140, y0: 90, x1: 1780, y1: 650 }, paw: { x: 1180, y: 520 }, ticker: { y: 870 } },
};

const DEFS = `<defs>\n${DEF.join('\n')}\n</defs>`;

module.exports = {
  DEFS, FLOOR, SPOTS,
  heroRoom, laptop, adminScreen, kitchen, fridgeInside, livingRoom, videoCall, house, houseExterior, street, serverStreet, garageSale,
  cafeteria, gym, hallway, principalOffice, classroom, schoolyard, cage, newsStudio,
  // extras
  tray, schoolPoster, schoolClock, heroHoleD, newsTicker, pigeon, streetSign, tumbleweed, mailbox, lampPost, lavaLamp, stuffedOwl, vanish, pancakeStack, catClock, bossBust, stickyNote, dntSticker, frameIn, glowSpot, darkPool, sky, cloud, tree, sparkle, LAPTOP_SCREEN, ADMIN_CMDS, MOM_NOTES, camTf, mix,
};
