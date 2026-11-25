// Looks for "What If You Could See Everyone's STATS in Real Life?", built on looks .. looks6 the way looks6 built on looks5:
//  * hair: Mom's practical pixie + polka-dot bandana, Grandpa Lou's bald dome with white side tufts, Max's ginger curls and his
//    green dinosaur hood (teeth, googly eyes, spikes), Benji's striped bobble hat, Tank's square buzz cut, Mrs. Krump's tall grey
//    beehive (+ the red pen behind her ear), the lunch lady's hair-netted curls, Mrs. Wells' white curls under her flower hat
//  * outfits: the bakery apron, Mom's day-off stripes, Lou's cardigan with the big "79" patch, the dino onesie (belly, back
//    spikes, tail), Benji's oversized rocket hoodie, Tank's patched denim vest, Mrs. Krump's long cardigan, the hero's pajamas,
//    the lunch-lady uniform, Mrs. Wells' coat
//  * a bendable arm (pose.bendL / bendR: elbow angle, + folds the forearm up, − folds it across the body), fists, dino claws,
//    baggy sleeves, a bicep that bulges when flexing; legs with striped socks / high-waters, dino feet, untied laces, loafers
//  * face accessories: Benji's huge round glasses + braces, Lou's huge walrus moustache, Mom's tired eyes + flour smudge
//  * overlays used by cast.js (sunhat, hood-down collar, backpack, hero apron, sash...) and cheap flat "lite" humans for crowds
// dress7(design) swaps a dress6 design's body parts for the looks7 ones (unknown tops fall back to looks6/5/4)
// and adds the new accessories to the side and back views. Per-draw options go through STATE (set by cast.js, reset after).
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const L = require('./looks');
const L2 = require('./looks2');
const L3 = require('./looks3');
const L5 = require('./looks5');
const L6 = require('./looks6');
const { bentLimb } = require('./body');
const { f, clamp } = S;

const SW = C.lineW;
const LINE = C.line;
const outline = (fill, w = SW) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const lineOnly = (w = SW, color = LINE) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const P = (p) => `${f(p[0])} ${f(p[1])}`;
const poly = (pts, r = 6) => S.roundedPath(pts, r);
const mapPoly = (fn, pts, r) => poly(pts.map(fn), r);
const ID = (p) => p;
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const clipped = (d, fill, inner, w = SW) => {
  const id = S.uid('l7');
  return S.clipDef(id, S.path(d)) + S.path(d, { fill }) + (inner ? S.g(inner, null, { 'clip-path': `url(#${id})` }) : '') + (w ? S.path(d, outline('none', w)) : '');
};
const txt = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const hm = L5.hm;
const { puffs } = L3;
const { shadeHex, band } = L6;
const curlMarks = (pts, r, w = 4.5, col = LINE) => S.path(pts.map(([x, y, rr = r]) => `M${f(x - rr * 0.42)} ${f(y + 3)} Q${f(x)} ${f(y - rr * 0.55)} ${f(x + rr * 0.4)} ${f(y + 5)}`).join(' '), lineOnly(w, col));
const stitch = (col, w = 3.5, dash = '8 6') => ({ fill: 'none', stroke: col, 'stroke-width': w, 'stroke-dasharray': dash, 'stroke-linecap': 'round' });
const dotD = (x, y, r) => `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z `;
const starD = (x, y, r) => F.starPath(x, y, r, r * 0.45) + ' ';
function scatter(x0, x1, y0, y1, n, seed, fn) { let o = ''; for (let i = 0; i < n; i++) o += fn(x0 + hash(seed + i * 3.7) * (x1 - x0), y0 + hash(seed * 2 + i * 7.3) * (y1 - y0), i); return o; }
function ribs(x0, x1, y0, y1, gap, col, w = 3) { let d = ''; for (let x = x0; x <= x1; x += gap) d += `M${f(x)} ${f(y0)} L${f(x)} ${f(y1)} `; return S.path(d, lineOnly(w, col)); }
const hem = (B, W, col, h = 26) => S.rect(-W - 14, B - h, 2 * W + 28, h + 4, 0, { fill: col }) + S.path(`M${-W - 14} ${B - h} L${W + 14} ${B - h}`, lineOnly(4));

// per-draw options (set by cast.js around one draw call, then reset)
const STATE = { t: 0, flour: 0, tired: 0, glare: 0, hoodDown: false, laces: true };

// ====================================================================== HAIR
// Mom: a short practical pixie, side-swept fringe, a red polka-dot bandana knotted on top (c.band; none on her day off)
function bandana(map, c, view = 'front') {
  if (!c.band) return '';
  const dots = (pts) => S.path(pts.map(([x, y]) => dotD(x, y, 6.5)).join(''), { fill: c.bandDot || '#FFFFFF' });
  if (view === 'side') {
    const d = 'M-168 -860 Q-40 -1010 150 -930';
    const knot = S.g(S.path('M0 -16 Q34 -40 58 -18 Q40 4 0 4 Z M0 4 Q30 26 52 54 Q18 46 -6 18 Z', outline(c.band, 5)) + S.circle(0, -4, 17, outline(shadeHex(c.band, 0.85), 5)), 'translate(150 -926) rotate(20)');
    return band(d, 34, c.band) + dots([[-120, -900], [-60, -942], [0, -960], [60, -962], [110, -948]]) + knot;
  }
  if (view === 'back') {
    const d = 'M-164 -876 Q0 -1010 164 -876';
    const knot = S.g(S.path('M0 -16 Q34 -40 58 -18 Q40 4 0 4 Z M0 0 Q-30 -30 -54 -12 Q-36 10 0 6 Z M0 4 Q14 40 4 74 Q-8 46 -10 10 Z M4 4 Q30 30 40 66 Q14 50 0 10 Z', outline(c.band, 5)) + S.circle(0, -2, 17, outline(shadeHex(c.band, 0.85), 5)), 'translate(96 -946) rotate(-14)');
    return band(d, 34, c.band) + dots([[-120, -916], [-60, -950], [0, -962], [60, -950], [120, -916]]) + knot;
  }
  const a = map([-160, -872]), b = map([164, -878]), q = map([0, -1012]);
  const d = `M${P(a)} Q${P(q)} ${P(b)}`;
  let o = band(d, 34, c.band);
  const pts = [];
  for (const u of [0.1, 0.26, 0.42, 0.58, 0.74, 0.9]) {
    const x = (1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * q[0] + u * u * b[0], y = (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * q[1] + u * u * b[1];
    pts.push([x + (u * 7 % 2 ? 0 : 4), y - 2]);
  }
  o += dots(pts);
  const k = map([126, -948]);
  o += S.g(S.path('M0 -10 Q36 -46 62 -26 Q50 0 6 2 Z M-2 -6 Q-12 -50 8 -68 Q26 -44 10 -6 Z', outline(c.band, 5)) + S.path('M10 -14 Q36 -30 50 -24 M6 -14 Q4 -40 10 -54', lineOnly(3.5, shadeHex(c.band, 0.78))) + S.circle(0, -4, 17, outline(shadeHex(c.band, 0.85), 5)) + S.circle(-5, -9, 4, { fill: '#FFFFFF', opacity: 0.7 }), `translate(${P(k)}) rotate(16)`);
  return o;
}
function flourHair(map, k) {
  if (k <= 0.05) return '';
  return S.path(scatter(-110, 120, -980, -900, Math.round(4 + 5 * k), 17, (x, y) => dotD(...map([x, y]), 5 + 4 * hash(x))), { fill: '#FFFFFF', opacity: f(0.55 + 0.3 * k) });
}

// Grandpa Lou: bald dome (shine + forehead wrinkles), big ears, fluffy white side tufts
function louTuft(map, sx, c) {
  const cs = [[150, -808, 30], [170, -776, 30], [168, -738, 24], [146, -836, 22], [126, -846, 16]].map(([x, y, r]) => [...map([sx * x, y]), r]);
  return puffs(cs, c.hair, 6) + S.path(`M${P(map([sx * 160, -800]))} q${sx * 10} 12 ${sx * 4} 26`, lineOnly(4, c.hairShade));
}
function bigEar(x, y, sx, c, s = 1) {
  return S.g(S.path('M0 -44 Q34 -50 38 -4 Q40 40 4 46 Q-6 46 -6 30 L-6 -30 Q-6 -44 0 -44 Z', outline(c.skin, 6)) + S.path('M6 -24 Q24 -22 24 0 Q22 20 8 22', lineOnly(5, c.skinShade2 || shadeHex(c.skin, 0.8))), `translate(${f(x)} ${f(y)}) scale(${f(sx * s)} ${f(s)})`);
}

// Max: ginger curls (+ the hood lying behind his neck when the hood is down)
const MAX_CURLS = [[-136, -846, 32], [-104, -906, 38], [-46, -938, 40], [18, -944, 40], [80, -922, 38], [128, -868, 34], [-152, -796, 24], [152, -800, 24], [-74, -980, 32], [0, -996, 34], [64, -978, 30], [-150, -760, 18], [150, -762, 18]];

// the dinosaur hood: c.dino, c.dinoShade, c.dinoHi, c.belly (lining), c.spike, c.teeth
function dinoSpike(x, y, h, w, ang, col, sw = 6) {
  const d = `M${f(-w / 2)} 0 Q${f(-w * 0.34)} ${f(-h * 0.7)} 0 ${f(-h)} Q${f(w * 0.34)} ${f(-h * 0.7)} ${f(w / 2)} 0 Z`;
  return S.path(d, { ...outline(col, sw), transform: `translate(${f(x)} ${f(y)}) rotate(${f(ang)})` });
}
function googly(x, y, r, c, look = 0) {
  return S.circle(x, y, r + 10, outline(c.dino, 6)) + S.circle(x, y, r, outline('#FFFFFF', 5)) + S.circle(x + look * r * 0.3, y + r * 0.18, r * 0.5, { fill: LINE }) + S.circle(x + look * r * 0.3 - r * 0.18, y, r * 0.17, { fill: '#FFFFFF' });
}
const HOOD_OUT = [[-198, -566], [-206, -770], [-192, -906], [-142, -992], [-62, -1030], [62, -1030], [142, -992], [192, -906], [206, -770], [198, -566]];
const HOOD_IN = [[140, -572], [148, -786], [120, -842], [40, -858], [-40, -858], [-120, -842], [-148, -786], [-140, -572]];

// Benji's bobble hat: c.hat, c.hat2 (stripes), c.hatCuff, c.pom; messy dark tufts underneath
const BOBBLE = [[-160, -812], [-166, -880], [-148, -950], [-102, -1006], [-30, -1034], [30, -1034], [102, -1006], [148, -950], [166, -880], [160, -812]];
function messyTuft(map, sx, c) {
  const pts = [[152, -806], [174, -790], [160, -778], [182, -754], [158, -748], [168, -716], [144, -728], [136, -770]].map(([x, y]) => map([sx * x, y]));
  return S.path(poly(pts, 4), outline(c.hair, 6));
}
function pompom(x, y, r, col, shade) {
  const cs = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; cs.push([x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.46]); }
  cs.push([x, y, r * 0.7]);
  return puffs(cs, col, 6) + S.path(`M${f(x - r * 0.5)} ${f(y + 4)} q${f(r * 0.2)} ${f(-r * 0.3)} ${f(r * 0.4)} 0 M${f(x + r * 0.05)} ${f(y - r * 0.35)} q${f(r * 0.2)} ${f(-r * 0.2)} ${f(r * 0.36)} 0`, lineOnly(4, shade));
}

// Tank: square buzz cut with a stipple texture
const BUZZ_OUT = [[-148, -792], [-154, -884], [-128, -936], [-50, -956], [50, -956], [128, -936], [154, -884], [148, -792], [134, -800], [130, -846]];
const BUZZ_LINE = [[112, -856], [40, -864], [-40, -864], [-112, -856], [-130, -846], [-134, -800]];

// Mrs. Krump: the red pen behind her (screen-right) ear (the beehive is one tall hair silhouette: HIVE_OUT)
function redPen(x, y, rot, s = 1) {
  return S.g(S.rect(-12, -70, 24, 140, 9, outline('#E23A3A', 5)) + S.rect(-12, -70, 24, 44, 9, outline('#B82626', 5)) + S.path('M8 -60 L8 -10', lineOnly(5, '#E8E8F0')) + S.path('M-10 70 L0 96 L10 70 Z', outline('#F4E6D8', 4)) + S.path('M-3 88 L0 96 L3 88 Z', { fill: '#C82020' }),
    `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}

// the beehive (head space): an egg-shaped dome wrapped in rings, a little bow; view 'front' (behind the head) | 'side' | 'back'
function krumpHive(view, turn, c) {
  const m = view === 'front' ? hm(turn) : { hair: ID };
  const H = m.hair;
  const out = view === 'side'
    ? [[-130, -900], [-150, -1020], [-120, -1130], [-40, -1196], [70, -1196], [150, -1130], [176, -1020], [160, -900]]
    : [[-150, -900], [-158, -1010], [-150, -1090], [-110, -1162], [-40, -1196], [40, -1196], [110, -1162], [150, -1090], [158, -1010], [150, -900]];
  const d = poly(out.map(H), 26);
  let inner = '';
  inner += S.path(`M${P(H([-130, -1000]))} Q${P(H([-130, -1100]))} ${P(H([-60, -1160]))}`, lineOnly(18, c.hairHi));
  inner += S.path(`M${P(H([120, -1040]))} Q${P(H([160, -980]))} ${P(H([150, -900]))}`, lineOnly(26, c.hairShade));
  let rings = '';
  for (const [y, w] of [[-960, 160], [-1036, 162], [-1108, 146]]) rings += `M${P(H([-w, y + 14]))} Q${P(H([view === 'side' ? 20 : 0, y - 26]))} ${P(H([w, y + 14]))} `;
  inner += S.path(rings, lineOnly(5, c.hairShade)) + S.path(`M${P(H([-40, -1150]))} Q${P(H([20, -1186]))} ${P(H([70, -1150]))} Q${P(H([80, -1120]))} ${P(H([40, -1126]))}`, lineOnly(5, c.hairShade));
  let o = clipped(d, c.hair, inner, SW);
  if (view !== 'side') { const b = H([view === 'back' ? 112 : -112, -950]); o += S.g(S.path('M0 0 L-26 -16 L-26 16 Z M0 0 L26 -16 L26 16 Z', outline(c.hairBand || '#5A3A6A', 4)) + S.circle(0, 0, 8, outline(c.hairBand || '#5A3A6A', 4)), `translate(${P(b)}) rotate(${view === 'back' ? 20 : -20})`); }
  return o;
}
// the lunch lady: big auburn curls in a hairnet
const NET_CURLS = [[-140, -830, 34], [-110, -900, 42], [-46, -944, 44], [24, -950, 44], [92, -918, 42], [140, -850, 34], [-160, -770, 26], [160, -772, 26], [-70, -1000, 36], [10, -1012, 38], [80, -990, 34]];
function netOver(cs, col = '#FFFFFF') {
  const id = S.uid('net');
  const ring = (x, y, r) => `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
  let d = '';
  for (let x = -360; x <= 360; x += 46) d += `M${x} -1060 L${x + 260} -700 M${x} -1060 L${x - 260} -700 `;
  return S.clipDef(id, S.path(cs.map(([x, y, r]) => ring(x, y, r)).join(' '))) + S.g(S.path(d, { fill: 'none', stroke: col, 'stroke-width': 2.5, opacity: 0.45 }), null, { 'clip-path': `url(#${id})` });
}

Object.assign(L.HAIR, {
  momPixie: {
    browY: -798, nametagY: -1100,
    front: (hair, feat) => poly([...[[-150, -738], [-160, -862], [-122, -952], [-40, -992], [56, -990], [132, -956], [166, -876], [160, -752], [140, -764], [136, -832]].map(hair),
      ...[[118, -852], [70, -868], [24, -862], [-20, -846], [-62, -824], [-98, -806], [-122, -790], [-116, -812], [-134, -790], [-138, -744]].map(feat)], 10),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([40, -864]))} Q${P(hair([-10, -930]))} ${P(hair([-96, -958]))} M${P(feat([-30, -842]))} Q${P(hair([-90, -880]))} ${P(hair([-146, -872]))} M${P(feat([90, -862]))} Q${P(hair([120, -900]))} ${P(hair([150, -880]))}`, lineOnly(4.5, c.hairShade));
      if (shade) o += S.path(`M${P(hair([-100, -940]))} Q${P(hair([-30, -984]))} ${P(hair([50, -980]))}`, lineOnly(13, c.hairHi));
      return o;
    },
    over(hair, feat, c) { return bandana(hair, c) + flourHair(hair, STATE.flour); },
    side: () => poly([[-172, -800], [-152, -918], [-60, -990], [70, -986], [150, -926], [170, -800], [164, -716], [124, -704], [98, -780], [20, -820], [-70, -836], [-132, -828]], 14),
    sideOver: (c) => bandana(ID, c, 'side'),
    back: () => poly([[-160, -728], [-166, -870], [-112, -962], [0, -992], [112, -962], [166, -870], [160, -728], [110, -706], [40, -722], [-30, -706], [-100, -720]], 22),
    backOver: (c) => S.path('M-120 -740 Q-80 -860 -20 -960 M100 -730 Q70 -860 20 -960', lineOnly(4, c.hairShade)) + bandana(ID, c, 'back'),
  },

  louBald: {
    browY: -790, nametagY: -1010,
    behind(hair, feat, c) {
      let o = '';
      for (const sx of [-1, 1]) { const e = hair([sx * 142, -716]); o += bigEar(e[0], e[1], sx, c); }
      return o + louTuft(hair, -1, c) + louTuft(hair, 1, c);
    },
    front: () => null,
    over(hair, feat, c) {
      const a = hair([-104, -866]), b = hair([-40, -884]);
      let o = S.path(`M${P(a)} Q${f((a[0] + b[0]) / 2)} ${f(a[1] - 26)} ${P(b)}`, lineOnly(11, '#FFFFFF')) + S.ellipse(b[0] + 30, b[1] - 2, 11, 7, { fill: '#FFFFFF', opacity: 0.9 });
      const w = (y, k) => { const p = feat([-50 * k, y]), q = feat([50 * k, y]); return `M${P(p)} Q${f((p[0] + q[0]) / 2)} ${f(y - 8)} ${P(q)} `; };
      o += S.path(w(-842, 1) + w(-822, 0.75), lineOnly(4.5, c.skinShade2 || shadeHex(c.skin, 0.8)));
      return o;
    },
    side: () => null,
    sideOver(c) {
      const cs = [[100, -824, 28], [136, -806, 30], [158, -768, 28], [152, -726, 24], [120, -706, 20], [84, -790, 22], [118, -770, 26]];
      return puffs(cs, c.hair, 6) + S.path('M120 -820 q16 6 14 24 M150 -770 q10 10 4 26', lineOnly(4, c.hairShade)) + bigEar(18, -716, 1, c, 0.95) + S.path('M-110 -872 Q-60 -900 -14 -890', lineOnly(11, '#FFFFFF'));
    },
    back: () => null,
    backOver(c) {
      let o = '';
      for (const sx of [-1, 1]) o += bigEar(sx * 142, -716, sx, c, 0.9);
      const cs = [[-150, -796, 30], [-158, -752, 30], [-126, -718, 32], [-80, -702, 32], [-30, -696, 32], [24, -696, 32], [76, -702, 32], [124, -718, 32], [158, -752, 30], [150, -796, 30], [-100, -736, 30], [0, -726, 30], [100, -736, 30]];
      return o + puffs(cs, c.hair, 6) + S.path('M-120 -730 q20 10 40 0 M-20 -716 q20 10 40 0 M80 -730 q20 10 40 0', lineOnly(4, c.hairShade)) + S.path('M-70 -870 Q0 -900 60 -880', lineOnly(11, '#FFFFFF'));
    },
  },

  maxCurls: {
    browY: -836, nametagY: -1080,
    behind(hair, feat, c) {
      let o = S.path(mapPoly(hair, [[-158, -880], [158, -880], [166, -726], [140, -712], [-140, -712], [-166, -726]], 22), outline(c.hairShade));
      if (STATE.hoodDown && c.dino) o += hoodDownBehind(c, 'front', hair);
      return o;
    },
    front: () => null,
    over(hair, feat, c) {
      const cs = MAX_CURLS.map(([x, y, r]) => [...(Math.abs(x) > 130 ? hair([x, y]) : feat([x, y])), r]);
      const fc = feat([-26, -842]);
      return puffs(cs, c.hair) + curlMarks(cs.filter((_, i) => i % 2 === 0), 34, 4.5, c.hairShade) +
        S.path(`M${f(fc[0])} ${f(fc[1] - 20)} q-26 8 -20 34 q8 18 24 6`, lineOnly(12, LINE)) + S.path(`M${f(fc[0])} ${f(fc[1] - 20)} q-26 8 -20 34 q8 18 24 6`, lineOnly(6, c.hair));
    },
    side: () => poly([[-160, -846], [-120, -920], [40, -930], [150, -880], [166, -760], [120, -730], [60, -800], [-100, -850]], 16),
    sideBehind: (c) => (STATE.hoodDown && c.dino ? hoodDownBehind(c, 'side') : ''),
    sideOver(c) {
      const cs = [[-150, -862, 30], [-110, -920, 38], [-40, -962, 40], [40, -966, 40], [110, -930, 38], [150, -870, 34], [160, -800, 26], [140, -750, 20]];
      return puffs(cs, c.hair) + curlMarks(cs.filter((_, i) => i % 2 === 0), 36, 4.5, c.hairShade);
    },
    back: () => poly([[-156, -760], [-160, -880], [-100, -930], [100, -930], [160, -880], [156, -760], [0, -742]], 22),
    backOver(c) {
      const cs = [[-130, -900, 38], [-66, -944, 42], [0, -962, 42], [66, -944, 42], [130, -900, 38], [-150, -820, 30], [150, -820, 30], [-100, -760, 26], [0, -752, 28], [100, -760, 26], [-40, -996, 32], [40, -996, 32]];
      return puffs(cs, c.hair) + curlMarks(cs.filter((_, i) => i % 2 === 0), 38, 4.5, c.hairShade) + (STATE.hoodDown && c.dino ? hoodDownBack(c) : '');
    },
  },

  maxHood: {
    browY: -836, nametagY: -1160, fill: 'dino',
    behind(hair, feat, c) {
      return dinoSpike(...hair([-104, -996]), 58, 52, -30, c.spike) + dinoSpike(...hair([104, -996]), 58, 52, 30, c.spike) + dinoSpike(...hair([0, -1026]), 74, 62, 0, c.spike);
    },
    front: (hair, feat) => poly([...HOOD_OUT.map(hair), ...HOOD_IN.map(feat)], 26),
    details(hair, feat, c, shade) {
      let o = S.path('M' + HOOD_IN.map((p) => P(feat(p))).join(' L'), lineOnly(30, c.belly));
      if (shade) o += S.path(`M${P(hair([-160, -930]))} Q${P(hair([-90, -1016]))} ${P(hair([10, -1024]))}`, lineOnly(16, c.dinoHi)) + S.path(`M${P(hair([150, -700]))} L${P(hair([210, -700]))} L${P(hair([210, -560]))} L${P(hair([150, -560]))} Z`, { fill: c.dinoShade, opacity: 0.6 });
      o += S.path('M' + HOOD_IN.map((p) => P(feat(p))).join(' L'), lineOnly(4.5));
      return o;
    },
    over(hair, feat, c) {
      let o = '';
      // teeth hanging from the upper jaw (the hood brim)
      let d = '';
      for (let i = -2; i <= 2; i++) {
        const x = i * 40, y0 = -848 + Math.abs(i) * 7;
        const a = feat([x - 17, y0]), b = feat([x + 17, y0]), tp = feat([x, y0 + 38]);
        d += `M${P(a)} L${P(tp)} L${P(b)} Z `;
      }
      o += S.path(d, outline(c.teeth || '#FFFFFF', 4.5));
      // nostrils on the snout and two googly eyes on top
      for (const sx of [-1, 1]) { const n = feat([sx * 30, -890]); o += S.ellipse(n[0], n[1], 9, 6, { fill: c.dinoShade }); }
      for (const sx of [-1, 1]) { const e = hair([sx * 80, -1016]); o += googly(e[0], e[1], 32, c, sx * 0.35); }
      return o;
    },
    side: () => poly([[-198, -846], [-160, -956], [-60, -1030], [80, -1030], [180, -964], [218, -830], [212, -650], [184, -566], [70, -550], [-8, -558], [-36, -700], [-70, -812], [-150, -852]], 22),
    sideBehind: (c) => dinoSpike(40, -1030, 64, 50, -6, c.spike) + dinoSpike(132, -1000, 62, 48, 34, c.spike) + dinoSpike(196, -920, 56, 44, 64, c.spike) + dinoSpike(222, -820, 48, 40, 84, c.spike) + dinoSpike(220, -720, 40, 34, 96, c.spike),
    sideOver(c) {
      let d = '';
      for (const x of [-176, -136, -96]) d += `M${x - 16} -846 L${x} -810 L${x + 16} -846 Z `;
      let o = S.path(d, outline(c.teeth || '#FFFFFF', 4.5));
      o += S.path('M-198 -846 L-150 -852 L-70 -812 L-36 -700 L-8 -558', lineOnly(26, c.belly)) + S.path('M-198 -846 L-150 -852 L-70 -812 L-36 -700 L-8 -558', lineOnly(4.5));
      o += S.ellipse(-180, -880, 9, 6, { fill: c.dinoShade }) + googly(-40, -1034, 32, c, -0.6);
      return o;
    },
    back: () => poly([[-200, -566], [-208, -780], [-192, -920], [-130, -1010], [0, -1040], [130, -1010], [192, -920], [208, -780], [200, -566], [100, -550], [0, -546], [-100, -550]], 26),
    backOver(c) {
      let o = '';
      for (const [y, h] of [[-1010, 56], [-930, 48], [-850, 42], [-770, 36], [-690, 30]]) o += dinoSpike(0, y, h, h * 0.9, 0, c.spike, 5);
      for (const sx of [-1, 1]) o += S.circle(sx * 80, -1016, 42, outline(c.dino, 6));
      return o;
    },
  },

  benjiBobble: {
    browY: -790, nametagY: -1190, fill: 'hat',
    behind(hair, feat, c) { return messyTuft(hair, -1, c) + messyTuft(hair, 1, c); },
    front: (hair) => mapPoly(hair, BOBBLE, 14),
    details(hair, feat, c, shade) {
      let o = '';
      for (const [y0, y1] of [[-900, -930], [-968, -992]]) o += S.path(`M${P(hair([-200, y0]))} Q${P(hair([0, y0 - 14]))} ${P(hair([200, y0]))} L${P(hair([200, y1]))} Q${P(hair([0, y1 - 14]))} ${P(hair([-200, y1]))} Z`, { fill: c.hat2 });
      for (let x = -120; x <= 120; x += 40) o += S.path(`M${P(hair([x - 8, -872]))} l8 10 l8 -10 M${P(hair([x * 0.9 - 8, -948]))} l8 10 l8 -10`, lineOnly(3.5, shadeHex(c.hat, 0.8)));
      if (shade) o += S.path(`M${P(hair([-120, -950]))} Q${P(hair([-60, -1010]))} ${P(hair([10, -1020]))}`, lineOnly(14, '#FFFFFF55'));
      return o;
    },
    over(hair, feat, c) {
      let o = S.path(mapPoly(hair, [[-172, -876], [172, -876], [170, -804], [-170, -804]], 16), outline(c.hatCuff));
      let d = '';
      for (let x = -150; x <= 150; x += 20) d += `M${P(hair([x, -868]))} L${P(hair([x, -812]))} `;
      o += S.path(d, lineOnly(3.5, shadeHex(c.hatCuff, 0.82)));
      const p = hair([0, -1046]);
      o += pompom(p[0], p[1], 50, c.pom, shadeHex(c.pom, 0.8));
      const fl = feat([-50, -806]);
      o += S.path(`M${f(fl[0] - 16)} ${f(fl[1])} L${f(fl[0] - 26)} ${f(fl[1] + 30)} L${f(fl[0] - 4)} ${f(fl[1] + 12)} L${f(fl[0] + 6)} ${f(fl[1] + 34)} L${f(fl[0] + 18)} ${f(fl[1])} Z`, outline(c.hair, 5));
      return o;
    },
    side: () => poly([[-170, -812], [-176, -882], [-142, -980], [-40, -1034], [70, -1014], [140, -948], [164, -868], [166, -812]], 18),
    sideBehind: (c) => S.path(poly([[90, -806], [176, -790], [150, -770], [186, -740], [150, -738], [160, -700], [120, -720], [100, -760]], 4), outline(c.hair, 6)),
    sideOver(c) {
      const hd = poly([[-170, -812], [-176, -882], [-142, -980], [-40, -1034], [70, -1014], [140, -948], [164, -868], [166, -812]], 18);
      let o = clipped(hd, c.hat, S.path('M-220 -900 L220 -900 L220 -930 L-220 -930 Z M-220 -968 L220 -968 L220 -992 L-220 -992 Z', { fill: c.hat2 }) + S.path('M-120 -960 Q-60 -1016 10 -1026', lineOnly(14, '#FFFFFF55')), SW);
      o += S.path(poly([[-180, -880], [168, -880], [168, -806], [-180, -806]], 14), outline(c.hatCuff));
      o += pompom(-10, -1052, 46, c.pom, shadeHex(c.pom, 0.8));
      o += S.path(poly([[-166, -806], [-188, -770], [-160, -776], [-150, -748], [-136, -800]], 4), outline(c.hair, 5));
      return o;
    },
    back: () => poly(BOBBLE, 14),
    backOver(c) {
      let o = clipped(poly(BOBBLE, 14), c.hat, S.path('M-220 -900 L220 -900 L220 -930 L-220 -930 Z M-220 -968 L220 -968 L220 -992 L-220 -992 Z', { fill: c.hat2 }), SW);
      o += S.path(poly([[-172, -876], [172, -876], [170, -804], [-170, -804]], 16), outline(c.hatCuff)) + messyTuft(ID, -1, c) + messyTuft(ID, 1, c);
      o += S.path('M-160 -780 L-120 -740 L-80 -790 L-40 -736 L0 -786 L40 -736 L80 -790 L120 -740 L160 -780 L160 -804 L-160 -804 Z', outline(c.hair, 5));
      return o + pompom(0, -1046, 50, c.pom, shadeHex(c.pom, 0.8));
    },
  },

  tankBuzz: {
    browY: -808, nametagY: -1060,
    front: (hair, feat) => poly([...BUZZ_OUT.map(hair), ...BUZZ_LINE.map(feat)], 14),
    details(hair, feat, c, shade) {
      let o = S.path(scatter(-130, 130, -940, -870, 22, 5, (x, y) => dotD(...hair([x, y]), 4)), { fill: c.hairShade });
      if (shade) o += S.path(`M${P(hair([-110, -918]))} Q${P(hair([-40, -946]))} ${P(hair([50, -944]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-156, -850], [-150, -912], [-60, -952], [80, -950], [154, -900], [160, -760], [116, -740], [84, -830], [-100, -860]], 16),
    back: () => poly([[-152, -760], [-156, -884], [-110, -946], [110, -946], [156, -884], [152, -760], [80, -740], [0, -748], [-80, -740]], 22),
    backOver: (c) => S.path(scatter(-130, 130, -930, -780, 20, 9, (x, y) => dotD(x, y, 4)), { fill: c.hairShade }),
  },

  // the beehive itself is NOT part of the hair (it would blow up the head's volume-filter area): cast.js draws krumpHive() as an
  // unfiltered under-layer (front / side) or over-layer (back) on the teacher's design
  krumpHive: {
    browY: -804, nametagY: -1260,
    behind(hair, feat, c) { return S.path(mapPoly(hair, [[-162, -880], [162, -880], [166, -700], [140, -684], [-140, -684], [-166, -700]], 34), outline(c.hair)); },
    front: (hair, feat) => poly([...[[-158, -724], [-166, -866], [-150, -934], [-120, -970], [-50, -990], [50, -990], [120, -970], [150, -934], [166, -866], [158, -724], [136, -732], [134, -802]].map(hair), ...[[112, -848], [56, -880], [0, -888], [-56, -880], [-112, -848], [-134, -802], [-136, -732]].map(feat)], 22),
    details(hair, feat, c, shade) {
      let o = '';
      if (shade) o += S.path(`M${P(hair([-140, -870]))} Q${P(hair([-130, -950]))} ${P(hair([-60, -982]))}`, lineOnly(16, c.hairHi));
      o += S.path(`M${P(feat([-80, -870]))} Q${P(hair([-80, -930]))} ${P(hair([-60, -976]))} M${P(feat([0, -886]))} L${P(hair([0, -986]))} M${P(feat([80, -870]))} Q${P(hair([80, -930]))} ${P(hair([60, -976]))}`, lineOnly(4, c.hairShade));
      return o;
    },
    over(hair) {
      const p = hair([156, -786]);
      return redPen(p[0] + 4, p[1] - 4, -26, 0.92) + S.path(`M${P(hair([132, -850]))} Q${P(hair([172, -820]))} ${P(hair([150, -740]))}`, lineOnly(16, LINE)) + S.path(`M${P(hair([132, -850]))} Q${P(hair([172, -820]))} ${P(hair([150, -740]))}`, lineOnly(8, '#B8BCC8'));
    },
    side: () => poly([[-174, -806], [-150, -930], [-40, -984], [90, -966], [160, -884], [164, -712], [120, -698], [64, -780], [-90, -832], [-140, -824]], 22),
    sideOver: () => redPen(22, -790, -28, 0.92) + S.path('M0 -846 Q36 -830 30 -760', lineOnly(16, LINE)) + S.path('M0 -846 Q36 -830 30 -760', lineOnly(8, '#B8BCC8')),
    back: () => poly([[-162, -712], [-166, -872], [-96, -970], [96, -970], [166, -872], [162, -712], [80, -698], [0, -706], [-80, -698]], 28),
    backOver: (c) => S.path('M-110 -720 Q-60 -860 -10 -930 M110 -720 Q60 -860 10 -930', lineOnly(4, c.hairShade)) + redPen(-160, -790, 26, 0.9),
  },

  netCurls: {
    browY: -808, nametagY: -1130,
    behind(hair, feat, c) { return S.path(mapPoly(hair, [[-166, -880], [166, -880], [176, -700], [150, -680], [-150, -680], [-176, -700]], 30), outline(c.hairShade)); },
    front: () => null,
    over(hair, feat, c) {
      const cs = NET_CURLS.map(([x, y, r]) => [...(Math.abs(x) > 130 ? hair([x, y]) : feat([x, y])), r]);
      const p = hair([0, -1000]);
      return puffs(cs, c.hair) + curlMarks(cs.filter((_, i) => i % 2), 38, 4.5, c.hairShade) + netOver(cs) + S.path(`M${P(hair([-160, -800]))} Q${f(p[0])} ${f(p[1] - 120)} ${P(hair([160, -800]))}`, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 5, opacity: 0.8 });
    },
    side: () => poly([[-160, -846], [-120, -920], [40, -930], [150, -880], [176, -720], [120, -700], [60, -800], [-100, -850]], 16),
    sideOver(c) { const cs = [[-150, -862, 32], [-104, -930, 42], [-30, -976, 44], [56, -972, 44], [126, -926, 40], [164, -850, 36], [170, -770, 30]]; return puffs(cs, c.hair) + netOver(cs); },
    back: () => poly([[-166, -700], [-170, -880], [-100, -950], [100, -950], [170, -880], [166, -700], [0, -690]], 30),
    backOver(c) { const cs = [[-134, -880, 40], [-66, -940, 44], [0, -960, 44], [66, -940, 44], [134, -880, 40], [-150, -790, 32], [150, -790, 32], [-80, -740, 30], [0, -730, 32], [80, -740, 30]]; return puffs(cs, c.hair) + netOver(cs); },
  },

  // Mrs. Wells: white curls under a lilac cloche with a big flower (the "nice hat")
  wellsHat: {
    browY: -800, nametagY: -1200, fill: 'hat',
    behind(hair, feat, c) {
      const cs = [[-150, -800, 30], [-164, -754, 26], [-150, -712, 22], [150, -800, 30], [164, -754, 26], [150, -712, 22]].map(([x, y, r]) => [...hair([x, y]), r]);
      return puffs(cs, c.hair) + curlMarks(cs, 26, 4, c.hairShade);
    },
    front: (hair) => mapPoly(hair, [[-176, -836], [-174, -900], [-150, -980], [-90, -1036], [0, -1052], [90, -1036], [150, -980], [174, -900], [176, -836]], 20),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(hair([-180, -900]))} Q${P(hair([0, -924]))} ${P(hair([180, -900]))} L${P(hair([180, -872]))} Q${P(hair([0, -896]))} ${P(hair([-180, -872]))} Z`, { fill: c.hatBand });
      if (shade) o += S.path(`M${P(hair([-120, -990]))} Q${P(hair([-50, -1036]))} ${P(hair([30, -1040]))}`, lineOnly(14, '#FFFFFF66'));
      return o;
    },
    over(hair, feat, c) {
      const b = hair([0, -830]);
      let o = S.path(`M${f(b[0] - 220)} ${f(b[1] + 4)} Q${f(b[0])} ${f(b[1] - 40)} ${f(b[0] + 220)} ${f(b[1] + 4)} Q${f(b[0] + 230)} ${f(b[1] + 26)} ${f(b[0] + 196)} ${f(b[1] + 26)} Q${f(b[0])} ${f(b[1] - 6)} ${f(b[0] - 196)} ${f(b[1] + 26)} Q${f(b[0] - 230)} ${f(b[1] + 26)} ${f(b[0] - 220)} ${f(b[1] + 4)} Z`, outline(c.hat, 6));
      const fl = hair([118, -924]);
      o += S.path('M0 0 Q40 -120 10 -190 Q-6 -120 0 0 Z', { ...outline('#7FBF6A', 4.5), transform: `translate(${P(fl)}) rotate(28)` });
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - 1.2; o += S.ellipse(fl[0] + Math.cos(a) * 26, fl[1] + Math.sin(a) * 26, 22, 22, outline(c.flower || '#FF7FA8', 4.5)); }
      o += S.circle(fl[0], fl[1], 15, outline('#FFD23F', 4));
      return o;
    },
    side: () => poly([[-196, -830], [-176, -950], [-90, -1036], [30, -1050], [140, -1000], [190, -900], [196, -826]], 20),
    sideBehind: (c) => puffs([[120, -800, 30], [150, -754, 26], [132, -712, 22]], c.hair),
    sideOver(c) {
      let o = S.path('M-236 -826 Q0 -866 230 -826 Q236 -806 200 -806 Q0 -836 -206 -806 Q-240 -806 -236 -826 Z', outline(c.hat, 6)) + S.path('M-190 -880 Q0 -904 196 -880 L196 -856 Q0 -880 -190 -856 Z', { fill: c.hatBand });
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; o += S.ellipse(150 + Math.cos(a) * 24, -930 + Math.sin(a) * 24, 20, 20, outline(c.flower || '#FF7FA8', 4.5)); }
      return o + S.circle(150, -930, 14, outline('#FFD23F', 4));
    },
    back: () => poly([[-176, -836], [-174, -900], [-150, -980], [-90, -1036], [0, -1052], [90, -1036], [150, -980], [174, -900], [176, -836]], 20),
    backOver(c) {
      const cs = [[-140, -770, 30], [-80, -732, 30], [-20, -720, 32], [40, -722, 32], [96, -736, 30], [146, -772, 30]];
      return puffs(cs, c.hair) + curlMarks(cs, 28, 4, c.hairShade) + S.path('M-220 -830 Q0 -876 220 -830 Q230 -808 196 -808 Q0 -846 -196 -808 Q-230 -808 -220 -830 Z', outline(c.hat, 6)) + S.rect(-180, -900, 360, 26, 8, { fill: c.hatBand });
    },
  },
});

// the hood lying behind Max's neck when it is down (front: two green humps behind the shoulders with spikes + one googly eye)
function hoodDownBehind(c, view, map = ID) {
  if (view === 'side') return S.g(clipped('M-10 -600 Q40 -720 150 -700 Q230 -680 220 -580 Q160 -540 40 -556 Z', c.dino, S.path('M30 -640 Q100 -690 180 -660', lineOnly(16, c.belly))) + dinoSpike(160, -700, 40, 36, 30, c.spike) + dinoSpike(210, -650, 34, 30, 70, c.spike), null);
  const l = map([-150, -600]), r = map([150, -600]);
  let o = '';
  for (const [p, sx] of [[l, -1], [r, 1]]) o += S.path(`M${f(p[0] - sx * 40)} ${f(p[1] + 60)} Q${f(p[0] + sx * 60)} ${f(p[1] + 40)} ${f(p[0] + sx * 50)} ${f(p[1] - 40)} Q${f(p[0])} ${f(p[1] - 80)} ${f(p[0] - sx * 60)} ${f(p[1] - 40)} Z`, outline(c.dino, 6));
  o += dinoSpike(r[0] + 40, r[1] - 50, 40, 36, 40, c.spike) + dinoSpike(l[0] - 40, l[1] - 50, 40, 36, -40, c.spike);
  return o;
}
function hoodDownBack(c) {
  let o = clipped('M-170 -590 Q-180 -700 0 -712 Q180 -700 170 -590 Q160 -440 0 -420 Q-160 -440 -170 -590 Z', c.dino, S.path('M-120 -640 Q0 -690 120 -640', lineOnly(16, c.dinoHi)), 7);
  let d = '';
  for (let i = -3; i <= 3; i++) d += `M${i * 30 - 12} -440 L${i * 30} -${410 + Math.abs(i) * 4} L${i * 30 + 12} -440 Z `;
  o += S.path(d, outline('#FFFFFF', 4));
  for (const sx of [-1, 1]) o += googly(sx * 70, -600, 22, c, 0);
  return o + dinoSpike(0, -700, 50, 46, 0, c.spike) + dinoSpike(-80, -690, 40, 36, -24, c.spike) + dinoSpike(80, -690, 40, 36, 24, c.spike);
}

// ====================================================================== FACE ACCESSORIES (front view hook)
// Benji's huge round glasses (spec = { col, r, x, y }) and braces on every mouth that shows teeth
function bigSpecsFront(feat, at, dir, spec, glint = 0) {
  const col = spec.col || '#2A2A35', r0 = spec.r || 72;
  let o = '';
  const kNear = 1 - 0.04 * at, kFar = 1 - 0.3 * at;
  const ctr = [];
  for (const sx of [-1, 1]) {
    const k = (sx < 0) === (dir > 0) ? kNear : kFar;
    const [cx, cy] = feat([sx * (spec.x || 70), spec.y || -706]);
    ctr.push([cx, cy, r0 * k]);
    o += S.ellipse(cx, cy, r0 * k, r0, { fill: '#DDF4FF', 'fill-opacity': 0.22, stroke: LINE, 'stroke-width': 21 }) + S.ellipse(cx, cy, r0 * k, r0, { fill: 'none', stroke: col, 'stroke-width': 11 });
    o += S.path(`M${f(cx - r0 * k * 0.55)} ${f(cy + r0 * 0.2)} L${f(cx - r0 * k * 0.1)} ${f(cy - r0 * 0.5)} M${f(cx - r0 * k * 0.3)} ${f(cy + r0 * 0.42)} L${f(cx + r0 * k * 0.06)} ${f(cy - r0 * 0.12)}`, lineOnly(7, '#FFFFFFB0'));
    if (glint) o += S.ellipse(cx, cy, r0 * k - 8, r0 - 8, { fill: '#FFFFFF', opacity: f(0.85 * glint) });
  }
  const [a, b] = ctr;
  o += S.path(`M${f(a[0] + a[2] - 4)} ${f(a[1] - 10)} Q${f((a[0] + b[0]) / 2)} ${f(a[1] - 30)} ${f(b[0] - b[2] + 4)} ${f(b[1] - 10)}`, lineOnly(16, LINE)) + S.path(`M${f(a[0] + a[2] - 4)} ${f(a[1] - 10)} Q${f((a[0] + b[0]) / 2)} ${f(a[1] - 30)} ${f(b[0] - b[2] + 4)} ${f(b[1] - 10)}`, lineOnly(8, col));
  for (const [cx, cy, r] of [a]) o += S.path(`M${f(cx - r)} ${f(cy - 14)} L${f(cx - r - 30 * (1 - at))} ${f(cy - 20)}`, lineOnly(10, col));
  for (const [cx, cy, r] of [b]) o += S.path(`M${f(cx + r)} ${f(cy - 14)} L${f(cx + r + 30 * (1 - at))} ${f(cy - 20)}`, lineOnly(10, col));
  return o;
}
function bigSpecsSide(spec) {
  const col = spec.col || '#2A2A35', r = (spec.r || 72) * 0.9;
  return S.path('M-150 -720 L40 -730', lineOnly(16, LINE)) + S.path('M-150 -720 L40 -730', lineOnly(8, col)) +
    S.ellipse(-150, -712, r * 0.42, r, { fill: '#DDF4FF', 'fill-opacity': 0.25, stroke: LINE, 'stroke-width': 19 }) + S.ellipse(-150, -712, r * 0.42, r, { fill: 'none', stroke: col, 'stroke-width': 10 });
}
// braces: [top, bottom] of the upper-teeth band per mouth (mouth-local units) and the half width of the visible teeth
const BRACE = { grin: [-16, 2, 40], bigGrin: [-20, 4, 50], B: [-12, 3, 30], C: [-14, 0, 32], D: [-16, 0, 38], H: [-14, -4, 32], scream: [-40, -18, 30], teeth: [-18, 0, 44], G: [-8, 5, 16] };
function braces(mouth, m, sx, sy) {
  const g = BRACE[mouth];
  if (!g) return '';
  const y = m[1] + ((g[0] + g[1]) / 2) * sy, w = g[2] * sx;
  let d = '';
  for (let x = -w + 8; x <= w - 6; x += 17 * sx) d += `M${f(m[0] + x - 4)} ${f(y - 4)} h8 v8 h-8 Z `;
  return S.path(`M${f(m[0] - w)} ${f(y)} L${f(m[0] + w)} ${f(y)}`, { fill: 'none', stroke: '#9AA4B8', 'stroke-width': 4 }) + S.path(d, { fill: '#C9D2E0', stroke: '#6A7488', 'stroke-width': 1.5 });
}
// Mom: dark circles under tired eyes (k 0..1) + the flour smudge on her cheek
function eyeBags(feat, k, ex = 60, ey = -704, rx = 50) {
  let o = '';
  for (const sx of [-1, 1]) {
    const c = feat([sx * ex, ey + 66]);
    o += S.path(`M${f(c[0] - rx * 0.8)} ${f(c[1] - 8)} Q${f(c[0])} ${f(c[1] + 16)} ${f(c[0] + rx * 0.8)} ${f(c[1] - 8)}`, { fill: 'none', stroke: '#9A78C2', 'stroke-width': f(7 + 5 * k), 'stroke-linecap': 'round', opacity: f(0.45 + 0.4 * k) });
  }
  return o;
}
function flourSmudge(x, y, k = 1) {
  if (k <= 0) return '';
  return S.path(`M${f(x - 30)} ${f(y + 6)} Q${f(x - 18)} ${f(y - 16)} ${f(x + 10)} ${f(y - 12)} Q${f(x + 34)} ${f(y - 6)} ${f(x + 26)} ${f(y + 10)} Q${f(x)} ${f(y + 22)} ${f(x - 30)} ${f(y + 6)} Z`, { fill: '#FFFFFF', opacity: 0.92 }) +
    S.circle(x + 36, y - 20, 5, { fill: '#FFFFFF', opacity: 0.9 }) + S.circle(x - 34, y - 16, 4, { fill: '#FFFFFF', opacity: 0.85 }) + (k > 0.6 ? S.circle(x + 4, y + 26, 4, { fill: '#FFFFFF', opacity: 0.85 }) : '');
}
// Lou: a HUGE white walrus moustache (looks6 walrusFront, scaled out past the head)
const resolveLike = (style, face) => {
  const fr = F.resolveFace(face);
  const name = typeof face === 'string' ? face : face && face.name;
  const explicitMouth = face && typeof face === 'object' && face.mouth;
  if ((!name || name === 'neutral') && !explicitMouth && style.neutralMouth) fr.mouth = style.neutralMouth;
  return fr;
};
function mouthOf(style, face) { return resolveLike(style, face).mouth; }

const headAcc6 = L2.headAcc;
L2.headAcc = function headAcc(style, stage, hair, feat, fx) {
  let o = headAcc6(style, stage, hair, feat, fx);
  const a = style.acc || {}, c = style.col;
  const at = Math.abs(fx) / 40, dir = fx >= 0 ? 1 : -1;
  if (stage === 'top') {
    if (a.eyeBags) o += eyeBags(feat, STATE.tired, a.eyeBags.x, a.eyeBags.y, a.eyeBags.rx);
  } else if (stage === 'face') {
    if (a.hugeWalrus) o += L6.walrusFront(feat([0, -642]), c, a.hugeWalrus * (1 - 0.15 * at));
    if (a.flourCheek && STATE.flour > 0) { const p = feat([-88, -640]); o += flourSmudge(p[0], p[1], STATE.flour); }
    if (a.bigSpecs) o += bigSpecsFront(feat, at, dir, a.bigSpecs, STATE.glare);
    if (a.tankBandaid) { const p = feat([96, -650]); o += L5.bandaid(p[0], p[1], -28, 0.9); }
    if (a.glareSpecs && STATE.glare > 0) for (const sx of [-1, 1]) { const p = feat([sx * 62, -712]); o += S.path(`M${f(p[0] - 40)} ${f(p[1] + 20)} L${f(p[0] + 10)} ${f(p[1] - 36)} L${f(p[0] + 34)} ${f(p[1] - 36)} L${f(p[0] - 16)} ${f(p[1] + 20)} Z`, { fill: '#FFFFFF', opacity: f(0.85 * STATE.glare) }); }
  }
  return o;
};

// ====================================================================== OUTFITS (front, inside the torso clip)
const controllerD = (x, y, s = 1) => `M${f(x - 18 * s)} ${f(y - 8 * s)} h${f(36 * s)} q${f(10 * s)} 0 ${f(12 * s)} ${f(12 * s)} l${f(2 * s)} ${f(6 * s)} q0 ${f(6 * s)} ${f(-6 * s)} ${f(4 * s)} l${f(-8 * s)} ${f(-6 * s)} h${f(-36 * s)} l${f(-8 * s)} ${f(6 * s)} q${f(-6 * s)} ${f(2 * s)} ${f(-6 * s)} ${f(-4 * s)} l${f(2 * s)} ${f(-6 * s)} q${f(2 * s)} ${f(-12 * s)} ${f(12 * s)} ${f(-12 * s)} Z `;
function cupcake(x, y, s = 1) {
  return S.g(S.path('M-26 0 L26 0 L18 34 L-18 34 Z', outline('#F2B45C', 4)) + S.path('M-12 2 L-8 32 M0 2 L0 32 M12 2 L8 32', lineOnly(3, '#C98A3A')) +
    S.path('M-30 2 Q-36 -20 -14 -24 Q-10 -44 8 -40 Q26 -44 28 -22 Q40 -14 30 2 Z', outline('#FF9FC4', 4)) + S.circle(4, -46, 9, outline('#E8453C', 3.5)) + S.path('M6 -54 q6 -10 14 -10', lineOnly(3, '#3E8E3E')) +
    S.circle(-10, -14, 2.5, { fill: '#FFE14D' }) + S.circle(12, -20, 2.5, { fill: '#7FD3FF' }) + S.circle(-2, -6, 2.5, { fill: '#FFFFFF' }), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function rocket(x, y, s = 1) {
  return S.g(S.path('M0 -40 Q20 -20 18 20 L-18 20 Q-20 -20 0 -40 Z', outline('#FFFFFF', 4)) + S.circle(0, -6, 8, outline('#7FD3FF', 3)) +
    S.path('M-18 6 L-30 26 L-16 22 Z M18 6 L30 26 L16 22 Z', outline('#FF6B5A', 3.5)) + S.path('M-10 20 Q0 44 10 20 Z', outline('#FFC93C', 3.5)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function patch(kind, x, y, s, rot) {
  let o = '';
  if (kind === 'bolt') o = S.path('M8 -30 L-18 4 L0 4 L-8 30 L20 -6 L2 -6 Z', outline('#FFD23F', 4));
  else if (kind === 'square') o = S.rect(-22, -22, 44, 44, 4, outline('#D8453C', 4)) + S.path('M-14 -14 L14 14 M14 -14 L-14 14', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-dasharray': '5 4' });
  else if (kind === 'skull') o = S.path('M-18 4 Q-20 -24 0 -24 Q20 -24 18 4 L10 8 L10 16 L-10 16 L-10 8 Z', outline('#F4F1EA', 4)) + S.circle(-7, -6, 5, { fill: LINE }) + S.circle(7, -6, 5, { fill: LINE });
  else if (kind === 'heart') o = S.path(F.heartPath(0, 0, 18), outline('#FF6FA8', 4)) + S.path(F.heartPath(0, 0, 11), stitch('#FFFFFF', 2, '3 3'));
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}

function outfit7(style, t, shade, back, T, B, W) {
  const c = style.col;
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  const Wb = W - (style.taper || 0);
  let o = '';
  switch (style.top) {
    case 'bakerApron': {
      // T-shirt with a bib apron (stripes on the strap edges, cupcake patch, pocket with a whisk), flour dust
      if (!back) {
        o += S.path(`M${f(cx - 36 * k)} ${T - 6} Q${f(cx)} ${T + 30} ${f(cx + 36 * k)} ${T - 6} Z`, outline(c.skin, 5));
        for (const sx of [-1, 1]) o += band(`M${f(cx + sx * 44 * k)} ${T - 12} L${f(cx + sx * 58 * k)} -486`, 10, c.apron, 6);
        const bib = poly([[cx - 64 * k, -490], [cx + 64 * k, -490], [cx + 76 * k, B + 30], [cx - 76 * k, B + 30]], 10);
        o += clipped(bib, c.apron, S.path(poly([[cx - 54 * k, -480], [cx + 54 * k, -480], [cx + 66 * k, B + 30], [cx - 66 * k, B + 30]], 8), stitch(c.apronTrim)) + (shade ? S.rect(cx - 90, B - 30, 180, 40, 0, { fill: '#000', opacity: 0.06 }) : ''), 5.5);
        o += cupcake(cx, -430, 0.9 * k + 0.1);
        if (STATE.flour > 0) o += S.path(scatter(-60, 60, -480, -330, Math.round(3 + 6 * STATE.flour), 3, (x, y) => dotD(cx + x * k, y, 5 + 7 * hash(y))), { fill: '#FFFFFF', opacity: 0.75 });
      } else {
        o += band(`M-74 ${T - 10} L62 -340 M74 ${T - 10} L-62 -340`, 9, c.apron, 6);
      }
      o += hem(B, Wb, c.topShade, 18);
      break;
    }
    case 'momStripes': {
      let st = '';
      for (let y = T + 34; y < B; y += 38) st += `M${-W - 14} ${y} h${2 * W + 28} v16 h${-2 * W - 28} Z `;
      o += S.path(st, { fill: c.stripe });
      if (!back) {
        o += S.path(`M${f(cx - 56 * k)} ${T - 8} Q${f(cx)} ${T + 20} ${f(cx + 56 * k)} ${T - 8} Z`, outline(c.skin, 5));
        o += S.path(F.heartPath(cx + 52 * k, -470, 14), outline(c.accent || '#FF6B6B', 3.5));
      }
      o += hem(B, Wb, c.topShade, 16);
      break;
    }
    case 'louCardigan': {
      if (!back) {
        o += S.rect(cx - 42 * k, T - 10, 84 * k, B - T + 20, 0, { fill: c.shirt });
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 4} L${f(cx + sx * 44 * k)} ${T - 10} L${f(cx + sx * 34 * k)} ${T + 34} Z`, outline(c.collar, 4.5));
        o += S.path(`M${f(cx)} ${T + 20} L${f(cx)} ${B}`, lineOnly(3, c.shirtShade));
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 40 * k, T - 12], [cx + sx * 76 * k, T - 12], [cx + sx * 54 * k, B + 12], [cx + sx * 38 * k, B + 12]], 4), outline(c.topShade, 5));
        for (const y of [-470, -420, -370]) o += S.circle(cx - 46 * k, y, 8, outline(c.button, 3.5)) + S.path(`M${f(cx - 49 * k)} ${y - 2} l6 4`, lineOnly(2.5, LINE));
        o += ribs(-W, W, T + 50, B - 26, 20, c.topShade, 2.5);
        // the big felt "79" patch on his chest (his left = screen right)
        const px = cx + 46 * k;
        o += S.path(poly([[px - 30 * k, -508], [px + 30 * k, -508], [px + 30 * k, -424], [px - 30 * k, -424]], 14), outline(c.patch, 5)) + S.path(poly([[px - 23 * k, -501], [px + 23 * k, -501], [px + 23 * k, -431], [px - 23 * k, -431]], 10), stitch(shadeHex(c.patch, 0.8), 3, '6 5'));
        o += S.g(txt('79', 0, 0, 44, c.patchInk, { stroke: LINE, 'stroke-width': 6, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }), `translate(${f(px)} -450) scale(${f(k)} 1)`);
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 50 * k, -376], [cx + sx * 96 * k, -376], [cx + sx * 96 * k, -322], [cx + sx * 50 * k, -322]], 6), outline(c.topShade, 4.5));
      } else {
        o += ribs(-W, W, T + 10, B - 26, 20, c.topShade, 2.5);
        o += S.circle(0, -440, 58, outline(c.patch, 5)) + txt('79', 0, -418, 62, c.patchInk, { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
      }
      o += hem(B, Wb, c.topShade) + ribs(-Wb, Wb, B - 24, B, 12, shadeHex(c.topShade, 0.9));
      break;
    }
    case 'dinoOnesie': {
      if (!back) {
        o += clipped(`M${f(cx - 66 * k)} ${T + 30} Q${f(cx - 74 * k)} ${B + 40} ${f(cx)} ${B + 40} Q${f(cx + 74 * k)} ${B + 40} ${f(cx + 66 * k)} ${T + 30} Q${f(cx)} ${T + 6} ${f(cx - 66 * k)} ${T + 30} Z`, c.belly,
          S.path(`M${f(cx - 70)} -440 Q${f(cx)} -426 ${f(cx + 70)} -440 M${f(cx - 70)} -390 Q${f(cx)} -376 ${f(cx + 70)} -390 M${f(cx - 70)} -340 Q${f(cx)} -326 ${f(cx + 70)} -340`, lineOnly(4, c.bellyShade)), 5);
        o += S.path(`M${f(cx - 30 * k)} ${T - 6} Q${f(cx)} ${T + 22} ${f(cx + 30 * k)} ${T - 6} Z`, outline(c.skin, 5));
      } else {
        for (const [y, h] of [[T + 20, 44], [-440, 40], [-380, 36]]) o += dinoSpike(0, y + h, h, h * 0.9, 0, c.spike, 5);
      }
      break;
    }
    case 'benjiHoodie': {
      if (!back) {
        o += S.path(poly([[cx - 70 * k, -386], [cx + 70 * k, -386], [cx + 86 * k, -318], [cx - 86 * k, -318]], 14), outline(c.topShade, 5));
        o += rocket(cx - 2, -446, 0.9 * k);
        const ds = `M${f(cx - 22 * k)} ${T + 18} L${f(cx - 26 * k)} -440 M${f(cx + 22 * k)} ${T + 18} L${f(cx + 28 * k)} -452`;
        o += S.path(ds, lineOnly(5, '#FFFFFF')) + S.rect(cx - 32 * k, -446, 12, 18, 4, outline('#FFC93C', 3)) + S.rect(cx + 22 * k, -458, 12, 18, 4, outline('#FFC93C', 3));
      } else o += S.path(`M-90 ${T - 6} Q-96 ${T + 130} 0 ${T + 142} Q96 ${T + 130} 90 ${T - 6} Z`, outline(c.topShade, 5)) + S.path(`M-66 ${T + 10} Q0 ${T + 80} 66 ${T + 10}`, lineOnly(4, c.top));
      break;
    }
    case 'tankVest': {
      // T-shirt under an open denim vest with patches and frayed edges
      const vest = (sx) => poly([[sx * (W + 16), T - 14], [cx + sx * 50 * k, T - 14], [cx + sx * 26 * k, -420], [cx + sx * 30 * k, B + 14], [sx * (W + 16), B + 14]], 4);
      if (!back) {
        o += S.path(`M${f(cx - 40 * k)} ${T - 6} Q${f(cx)} ${T + 28} ${f(cx + 40 * k)} ${T - 6} Z`, outline(c.skin, 5));
        o += S.path(`M${f(cx - 40 * k)} ${T + 2} Q${f(cx)} ${T + 34} ${f(cx + 40 * k)} ${T + 2}`, lineOnly(7, c.shirtShade));
        for (const sx of [-1, 1]) o += clipped(vest(sx), c.vest, S.path(`M${f(cx + sx * 40 * k)} ${T} L${f(cx + sx * 20 * k)} -420 L${f(cx + sx * 24 * k)} ${B}`, stitch(c.vestStitch, 3, '7 5')) + S.path(poly([[cx + sx * 46 * k, -470], [cx + sx * 92 * k, -470], [cx + sx * 92 * k, -420], [cx + sx * 46 * k, -420]], 4), { ...outline(c.vestShade, 4) }), 5.5);
        o += patch('bolt', cx + 70 * k, -380, 0.95, 12) + patch('square', cx - 66 * k, -360, 0.85, -10) + patch('heart', cx - 70 * k, -476, 0.65, 8);
        for (const sx of [-1, 1]) o += S.circle(cx + sx * 34 * k, -450, 5, { fill: '#C9CED8', stroke: LINE, 'stroke-width': 2 });
      } else {
        o += S.path(poly([[-W - 16, T - 14], [W + 16, T - 14], [W + 16, B + 14], [-W - 16, B + 14]], 4), outline(c.vest, 5.5)) + S.path(`M-70 ${T + 30} L70 ${T + 30} M-70 -360 L70 -360`, stitch(c.vestStitch, 3, '7 5'));
        o += patch('skull', 0, -430, 1.5, 0) + patch('bolt', 60, -360, 0.8, -14);
      }
      // frayed bottom edge
      let fr = '';
      for (let x = -W - 10; x < W + 10; x += 14) fr += `M${x} ${B - 4} l4 14 `;
      o += S.path(fr, lineOnly(3, c.vestShade));
      break;
    }
    case 'krumpCardigan': {
      if (!back) {
        o += S.rect(cx - 40 * k, T - 10, 80 * k, B - T + 20, 0, { fill: c.shirt });
        // ruffled high neck + cameo brooch
        let ru = '';
        for (let i = -2; i <= 2; i++) ru += `M${f(cx + i * 15 * k - 9)} ${T + 6} a9 9 0 1 0 18 0 `;
        o += S.path(`M${f(cx - 40 * k)} ${T - 10} L${f(cx + 40 * k)} ${T - 10} L${f(cx + 40 * k)} ${T + 10} L${f(cx - 40 * k)} ${T + 10} Z`, { fill: c.shirt }) + S.path(ru, outline('#FFFFFF', 3.5));
        o += S.ellipse(cx, T + 40, 15, 19, outline('#E9C25A', 4)) + S.ellipse(cx, T + 40, 8, 11, { fill: '#F4E6F0' });
        for (const y of [-450, -400, -350]) o += S.circle(cx, y, 4.5, { fill: '#FFFFFF', stroke: c.shirtShade, 'stroke-width': 2 });
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 40 * k, T - 12], [cx + sx * 70 * k, T - 12], [cx + sx * 48 * k, B + 12], [cx + sx * 38 * k, B + 12]], 4), outline(c.topShade, 5));
        o += ribs(-W, W, T + 50, B, 22, c.topShade, 2.5);
      } else o += ribs(-W, W, T + 10, B, 22, c.topShade, 2.5);
      break;
    }
    case 'pjHero': {
      o += S.path(scatter(-W - 10, W + 10, T, B, 12, 7, (x, y, i) => (i % 3 === 0 ? controllerD(x, y, 0.8) : starD(x, y, 10))), { fill: c.pattern, opacity: 0.95 });
      if (!back) {
        o += S.path(`M${f(cx - 30 * k)} ${T - 8} L${f(cx)} ${T + 48} L${f(cx + 30 * k)} ${T - 8} Z`, { fill: c.skin });
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 50} L${f(cx + sx * 54 * k)} ${T - 10} L${f(cx + sx * 76 * k)} ${T - 10} L${f(cx + sx * 64 * k)} ${T + 30} L${f(cx + sx * 34 * k)} ${T + 30} Z`, outline(c.topShade, 4));
        o += S.path(`M${f(cx)} ${T + 50} L${f(cx)} ${B}`, lineOnly(4, c.piping));
        for (const y of [-440, -390, -340]) o += S.circle(cx - 9, y, 6, outline('#FFFFFF', 2.5));
      } else o += band(`M-56 ${T - 4} Q0 ${T + 22} 56 ${T - 4}`, 8, c.topShade);
      o += hem(B, Wb, c.topShade, 18);
      break;
    }
    case 'lunchUniform': {
      if (!back) {
        o += S.path(`M${f(cx - 36 * k)} ${T - 6} Q${f(cx)} ${T + 28} ${f(cx + 36 * k)} ${T - 6} Z`, outline(c.skin, 5));
        for (const sx of [-1, 1]) o += band(`M${f(cx + sx * 42 * k)} ${T - 12} L${f(cx + sx * 58 * k)} -478`, 9, c.apron, 6);
        o += clipped(poly([[cx - 70 * k, -482], [cx + 70 * k, -482], [cx + 80 * k, B + 30], [cx - 80 * k, B + 30]], 10), c.apron,
          S.ellipse(cx - 30 * k, -380, 22, 14, { fill: '#C9733A', opacity: 0.55 }) + S.ellipse(cx + 26 * k, -350, 12, 9, { fill: '#7FA83A', opacity: 0.5 }) + S.circle(cx + 40 * k, -420, 6, { fill: '#C9733A', opacity: 0.5 }), 5.5);
        o += S.rect(cx + 18 * k, -470, 52 * k, 26, 5, outline('#FFFFFF', 3.5)) + txt(c.tag || 'DOT', cx + 44 * k, -450, 20, '#E23A3A');
      } else o += band(`M-74 ${T - 10} L62 -340 M74 ${T - 10} L-62 -340`, 9, c.apron, 6);
      break;
    }
    case 'wellsCoat': {
      if (!back) {
        o += S.path(`M${f(cx - 30 * k)} ${T - 8} L${f(cx)} ${T + 50} L${f(cx + 30 * k)} ${T - 8} Z`, { fill: c.shirt });
        for (let i = -3; i <= 3; i++) o += S.circle(cx + i * 12 * k, T + 6 + Math.abs(i) * 6 + (i ? 0 : 6), 7, outline('#FFF8EE', 3));
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 6)} ${T + 56} L${f(cx + sx * 36 * k)} ${T - 10} L${f(cx + sx * 74 * k)} ${T - 10} L${f(cx + sx * 50 * k)} ${T + 74} Z`, outline(c.topShade, 4.5));
        for (const y of [-430, -370]) for (const sx of [-1, 1]) o += S.circle(cx + sx * 30 * k, y, 9, outline(c.button, 3.5));
      }
      o += hem(B, Wb, c.topShade, 0.01);
      break;
    }
    default: return null;
  }
  return o;
}
const TOPS7 = ['bakerApron', 'momStripes', 'louCardigan', 'dinoOnesie', 'benjiHoodie', 'tankVest', 'krumpCardigan', 'pjHero', 'lunchUniform', 'wellsCoat'];

function outfitSide7(style, x0, x1) {
  const c = style.col;
  let o = '';
  switch (style.top) {
    case 'bakerApron':
    case 'lunchUniform':
      o += S.path(poly([[x0 - 14, -492], [x0 + 20, -492], [x0 + 20, -290], [x0 - 14, -290]], 4), outline(c.apron, 5)) + band(`M${x0 + 12} -492 L${x1 - 20} -545`, 9, c.apron, 6) + band(`M${x0} -330 L${x1 + 10} -330`, 9, c.apron, 6);
      break;
    case 'momStripes': { let st = ''; for (let y = -499; y < -306; y += 38) st += `M${x0 - 10} ${y} h${x1 - x0 + 20} v16 h${x0 - x1 - 20} Z `; o += S.path(st, { fill: c.stripe }); break; }
    case 'louCardigan':
      o += S.path(`M${x0 - 10} -545 L${x0 + 24} -545 L${x0 + 4} -300 L${x0 - 10} -300 Z`, { fill: c.shirt }) + S.path(`M${x0 + 24} -545 L${x0 + 4} -300`, lineOnly(5)) + S.circle(x0 + 8, -470, 7, outline(c.button, 3)) + S.circle(x0 + 6, -410, 7, outline(c.button, 3));
      o += S.path(poly([[x0 + 24, -376], [x0 + 72, -376], [x0 + 72, -322], [x0 + 24, -322]], 6), outline(c.topShade, 4.5)) + hem(-306, 140, c.topShade);
      break;
    case 'dinoOnesie':
      o += S.path(`M${x0 - 10} -500 Q${x0 + 50} -480 ${x0 + 40} -380 Q${x0 + 40} -300 ${x0 - 10} -290 Z`, outline(c.belly, 5));
      break;
    case 'benjiHoodie':
      o += S.path(poly([[x0 - 10, -386], [x0 + 60, -386], [x0 + 60, -320], [x0 - 10, -320]], 12), outline(c.topShade, 5)) + S.path(`M${x1 - 80} -548 Q${x1 + 14} -540 ${x1 + 14} -450 Q${x1 - 30} -470 ${x1 - 70} -500 Z`, outline(c.topShade, 5));
      break;
    case 'tankVest':
      o += S.path(poly([[x0 + 10, -560], [x1 + 20, -560], [x1 + 20, -290], [x0 + 26, -290], [x0 + 6, -420]], 4), outline(c.vest, 5.5)) + S.path(`M${x0 + 20} -540 L${x0 + 14} -420 L${x0 + 30} -300`, stitch(c.vestStitch, 3, '7 5')) + patch('bolt', x1 - 20, -400, 0.8, 10);
      break;
    case 'krumpCardigan':
      o += S.path(`M${x0 - 10} -545 L${x0 + 24} -545 L${x0 + 4} -300 L${x0 - 10} -300 Z`, { fill: c.shirt }) + S.path(`M${x0 + 24} -545 L${x0 + 4} -300`, lineOnly(5)) + S.ellipse(x0 + 2, -496, 10, 13, outline('#E9C25A', 3.5));
      break;
    case 'pjHero':
      o += S.path(scatter(x0 - 10, x1 + 10, -540, -300, 6, 9, (x, y, i) => (i % 3 === 0 ? controllerD(x, y, 0.8) : starD(x, y, 10))), { fill: c.pattern }) + S.path(`M${x0 - 10} -548 L${x0 + 34} -548 L${x0 + 2} -490 Z`, outline(c.topShade, 4)) + hem(-306, 140, c.topShade, 18);
      break;
    case 'wellsCoat':
      o += S.path(`M${x0 - 10} -545 L${x0 + 30} -545 L${x0 + 8} -470 Z`, outline(c.topShade, 4.5)) + S.circle(x0 + 14, -420, 9, outline(c.button, 3.5)) + S.circle(x0 + 14, -360, 9, outline(c.button, 3.5));
      break;
    default: break;
  }
  return o;
}

// ====================================================================== LOWER GARMENTS (over the legs)
// style.ext7 = { kind: 'apron'|'longCard'|'skirt'|'hoodieHem'|'coat', top, len, flare, col, shade, trim, inner }
function ext7Front(style, t, shade, back) {
  const e = style.ext7, c = style.col;
  if (!e) return '';
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  const W = (style.torsoW || 100) - (style.taper || 0);
  const y0 = e.top ?? -330, y1 = y0 + e.len, wTop = W + 4, wBot = W + (e.flare || 0);
  if (e.kind === 'apron') {
    if (back) return '';
    const d = poly([[cx - 82 * k, y0], [cx + 82 * k, y0], [cx + (82 + e.flare) * k, y1], [cx - (82 + e.flare) * k, y1]], 12);
    let inner = S.path(poly([[cx - 72 * k, y0 + 6], [cx + 72 * k, y0 + 6], [cx + (72 + e.flare) * k, y1 - 10], [cx - (72 + e.flare) * k, y1 - 10]], 8), stitch(e.trim));
    inner += S.path(poly([[cx - 50 * k, y0 + 34], [cx + 50 * k, y0 + 34], [cx + 54 * k, y0 + 96], [cx - 54 * k, y0 + 96]], 8), outline(e.col, 4));
    if (e.whisk) inner += S.g(S.rect(-5, -10, 10, 46, 4, outline('#C98A4A', 3)) + S.path('M0 -10 Q-22 -50 0 -78 Q22 -50 0 -10 M0 -10 Q-8 -50 0 -78 Q8 -50 0 -10', lineOnly(4, '#9AA4B4')), `translate(${f(cx + 30 * k)} ${y0 + 70}) rotate(14)`);
    if (STATE.flour > 0) inner += S.path(scatter(-80, 80, y0 + 20, y1 - 20, Math.round(2 + 5 * STATE.flour), 11, (x, y) => dotD(cx + x * k, y, 5 + 8 * hash(x))), { fill: '#FFFFFF', opacity: 0.75 });
    if (shade) inner += S.rect(cx - 140, y1 - 24, 280, 30, 0, { fill: '#000', opacity: 0.08 });
    return clipped(d, e.col, inner, 5.5) + band(`M${-W - 8} ${y0 - 4} L${W + 8} ${y0 - 4}`, 10, e.col, 6);
  }
  if (e.kind === 'hoodieHem') {
    const d = poly([[-wTop - 6, y0], [wTop + 6, y0], [wBot + 6, y1], [-wBot - 6, y1]], 10);
    let inner = S.rect(-wBot - 20, y1 - 24, 2 * wBot + 40, 30, 0, { fill: e.shade }) + ribs(-wBot, wBot, y1 - 24, y1, 12, shadeHex(e.shade, 0.85), 3);
    if (!back) inner += S.path(poly([[cx - 76 * k, y0 - 10], [cx + 76 * k, y0 - 10], [cx + 80 * k, y0 + 30], [cx - 80 * k, y0 + 30]], 8), outline(e.shade, 4.5));
    return clipped(d, e.col, inner, 6);
  }
  if (e.kind === 'longCard' || e.kind === 'coat') {
    let o = '';
    if (!back) o += clipped(poly([[cx - 40 * k, y0], [cx + 40 * k, y0], [cx + 52 * k, y1 - 12], [cx - 52 * k, y1 - 12]], 6), e.inner || c.pants, S.path(`M${f(cx - 20)} ${y0 + 20} L${f(cx - 26)} ${y1}`, lineOnly(4, shadeHex(e.inner || c.pants, 0.8))), 5);
    for (const sx of back ? [0] : [-1, 1]) {
      const pts = sx === 0 ? [[-wTop, y0], [wTop, y0], [wBot, y1], [-wBot, y1]]
        : sx > 0 ? [[cx + 38 * k, y0], [wTop, y0], [wBot, y1], [cx + 50 * k, y1]] : [[-wTop, y0], [cx - 38 * k, y0], [cx - 50 * k, y1], [-wBot, y1]];
      const d = poly(pts, 10);
      let inner = e.kind === 'longCard' ? ribs(-wBot - 20, wBot + 20, y0, y1, 22, e.shade, 2.5) : '';
      inner += S.rect(-wBot - 20, y1 - 24, 2 * wBot + 40, 30, 0, { fill: e.shade }) + S.path(`M${-wBot - 20} ${y1 - 24} L${wBot + 20} ${y1 - 24}`, lineOnly(4));
      if (sx && !back) inner += S.path(poly([[cx + sx * 54 * k, y0 + 30], [cx + sx * 100 * k, y0 + 30], [cx + sx * 100 * k, y0 + 84], [cx + sx * 54 * k, y0 + 84]], 6), outline(e.shade, 4.5));
      if (shade) inner += S.rect(-wBot - 20, y0, 2 * wBot + 40, 22, 0, { fill: '#000', opacity: 0.1 });
      o += clipped(d, e.col, inner, 6);
    }
    if (!back && e.kind === 'coat') for (const y of [y0 + 40, y0 + 110]) o += S.circle(cx - 30 * k, y, 9, outline(c.button || '#FFFFFF', 3.5));
    return o;
  }
  // skirt
  const d = poly([[-wTop, y0], [wTop, y0], [wBot, y1], [-wBot, y1]], 14);
  let inner = '';
  for (const x of [-0.55, 0, 0.55]) inner += S.path(`M${f(cx + x * wTop * 0.8)} ${y0 + 10} L${f(cx + x * wBot * 0.92)} ${y1}`, lineOnly(4, e.shade));
  if (shade) inner += S.rect(-wBot - 10, y1 - 24, 2 * wBot + 20, 30, 0, { fill: '#000', opacity: 0.1 });
  return clipped(d, e.col, inner);
}
function ext7Side(style, x0, x1) {
  const e = style.ext7, c = style.col;
  if (!e) return '';
  const y0 = e.top ?? -330, y1 = y0 + e.len, fl = e.flare || 0;
  if (e.kind === 'apron') return S.path(poly([[x0 - 16, y0], [x0 + 18, y0], [x0 + 18 - fl * 0.4, y1], [x0 - 16 - fl * 0.6, y1]], 6), outline(e.col, 5));
  const d = poly([[x0 - 10, y0], [x1 + 10, y0], [x1 + fl * 0.7, y1], [x0 - fl * 0.6, y1]], 12);
  let inner = S.rect(x0 - fl - 20, y1 - 24, x1 - x0 + 2 * fl + 40, 30, 0, { fill: e.shade || c.topShade });
  if (e.kind === 'longCard') inner += ribs(x0 - fl, x1 + fl, y0, y1, 22, e.shade, 2.5);
  if (e.kind === 'hoodieHem') inner += S.path(poly([[x0 - 10, y0 - 10], [x0 + 60, y0 - 10], [x0 + 60, y0 + 30], [x0 - 10, y0 + 30]], 8), outline(e.shade, 4.5));
  return clipped(d, e.col, inner);
}

// ====================================================================== TORSO
function makeTorso7(style) {
  if (!TOPS7.includes(style.top)) return L6.makeTorso6(style);
  const c = style.col;
  const W = style.torsoW || 100, Wb = W - (style.taper || 0);
  return function torso(t, shade, back = false) {
    const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
    const cx = dir * at * 30, k = 1 - 0.12 * at;
    const T = -533, B = -306;
    let o = '';
    if (style.top === 'dinoOnesie' && !back) o += dinoTail(c, 'front', t);
    if (style.ext7 && style.ext7.under) o += ext7Front(style, t, shade, back);
    const id = S.uid('t7');
    const d = poly([[-W, T], [W, T], [Wb, B], [-Wb, B]], 16);
    let inner = outfit7(style, t, shade, back, T, B, W) || '';
    if (shade) {
      inner += S.rect(-Wb - 14, B - 26, 2 * Wb + 28, 30, 0, { fill: '#000', opacity: 0.1 });
      if (at > 0.02) inner += S.rect(dir > 0 ? -Wb - 14 : W - 34 * at, T - 10, 34 * at + 14, B - T + 20, 0, { fill: '#000', opacity: 0.22 });
    }
    o += S.clipDef(id, S.path(d)) + S.path(d, { fill: c.top }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    // hood lying round the neck (outside the clip; the head covers its middle)
    if (style.top === 'benjiHoodie' && !back) o += S.path(`M${f(cx - 132 * k)} ${T + 18} Q${f(cx - 150 * k)} ${T - 60} ${f(cx)} ${T - 68} Q${f(cx + 150 * k)} ${T - 60} ${f(cx + 132 * k)} ${T + 18} Q${f(cx)} ${T - 22} ${f(cx - 132 * k)} ${T + 18} Z`, outline(c.topShade, 5.5));
    if (style.ext7 && !style.ext7.under) o += ext7Front(style, t, shade, back);
    if (style.top === 'dinoOnesie' && back) o += dinoTail(c, 'back', 0);
    return o;
  };
}
function makeTorsoSide7(style) {
  if (!TOPS7.includes(style.top)) return L6.makeTorsoSide6(style);
  const c = style.col;
  const k = (style.torsoW || 100) / 100;
  const x0 = -62 * k, x1 = 70 * k + Math.max(0, -(style.taper || 0)) * 0.6;
  return function torsoSide(shade) {
    let o = '';
    if (style.top === 'dinoOnesie') o += dinoTail(c, 'side');
    if (style.ext7 && style.ext7.under) o += ext7Side(style, x0, x1);
    const td = S.roundedPath([[x0, -535], [x1, -535], [x1 + Math.max(0, -(style.taper || 0)) * 0.4, -305], [x0 - Math.max(0, -(style.taper || 0)) * 0.6, -305]], 16);
    const tid = S.uid('ts7');
    let inner = S.rect(x0 - 18, -545, 40, 260, 0, { fill: c.topShade || c.top, opacity: 0.6 }) + outfitSide7(style, x0, x1);
    if (shade) inner += S.rect(x0 - 10, -330, x1 - x0 + 30, 30, 0, { fill: '#000', opacity: 0.12 });
    o += S.clipDef(tid, S.path(td)) + S.path(td, { fill: c.top }) + S.g(inner, null, { 'clip-path': `url(#${tid})` }) + S.path(td, outline('none'));
    if (style.top === 'dinoOnesie') for (const [x, y, h, a] of [[x1 + 4, -500, 40, 80], [x1 + 6, -430, 36, 86], [x1 + 4, -360, 30, 92]]) o += dinoSpike(x, y, h, h * 0.9, a, c.spike, 5);
    if (style.top === 'benjiHoodie') o += S.path(`M${x0 + 30} -520 Q${x1 + 30} -610 ${x1 + 16} -500 Q${x1 - 20} -520 ${x0 + 30} -520 Z`, outline(c.topShade, 5));
    if (style.ext7 && !style.ext7.under) o += ext7Side(style, x0, x1);
    return o;
  };
}
// Max's tail (behind the legs, curling to one side in front view)
function dinoTail(c, view, t = 0) {
  const sp = c.spike;
  if (view === 'side') {
    let o = '';
    for (const [x, y, h, a] of [[110, -330, 36, 40], [170, -290, 32, 58], [220, -240, 26, 72]]) o += dinoSpike(x, y, h, h * 0.9, a, sp, 5);
    return o + clipped('M40 -380 Q170 -380 262 -226 Q272 -204 250 -210 Q150 -290 40 -290 Z', c.dino, S.path('M60 -300 Q170 -300 250 -214', lineOnly(14, c.belly)), 6);
  }
  if (view === 'back') {
    let o = clipped('M-56 -350 Q-50 -230 0 -130 Q10 -116 20 -130 Q50 -230 56 -350 Z', c.dino, S.path('M-30 -330 Q-20 -230 6 -150', lineOnly(12, c.dinoHi)), 6);
    for (const [y, h] of [[-300, 32], [-240, 28], [-186, 22]]) o += dinoSpike(0, y, h, h * 0.9, 0, sp, 5);
    return o;
  }
  const flip = t > 0.05 ? 'scale(-1 1)' : null;
  return S.g(clipped('M-40 -380 Q-170 -370 -246 -250 Q-256 -228 -232 -236 Q-150 -300 -40 -306 Z', c.dino, S.path('M-60 -320 Q-160 -320 -236 -240', lineOnly(12, c.belly)), 6) + dinoSpike(-150, -350, 32, 28, -40, sp, 5) + dinoSpike(-208, -306, 26, 24, -58, sp, 5), flip);
}

// ====================================================================== ARMS: elbow bend (pose.bendL/bendR), fists, claws, baggy sleeves, bicep bulge
// style: sleeve 'short'|'long'|'none'|'baggy', armW, fist, claws (colour), bicep, gloveCol, sleevePattern 'stars'
const EL_F = 134, EL_S = 124;
function armSeg(y0, y1, w0, w1, r0 = 17, r1 = 17) { return S.roundedPath([[-w0, y0, r0], [w0, y0, r0], [w1, y1, r1], [-w1, y1, r1]]); }
function makeArm7(style) {
  const c = style.col;
  const kw = style.armW || 1;
  const sc = c.sleeve || c.top;
  return function arm({ shade = true, dim = false, view = 'front', side = 1, pose = {} } = {}) {
    const sv = view === 'side';
    const hw0 = (sv ? 40 : 30) * kw, hw1 = 40 * kw, len = sv ? 248 : 268, el = sv ? EL_S : EL_F;
    const bend = clamp(+(side < 0 ? pose.bendL : pose.bendR) || 0, -175, 175);
    const sl = style.sleeve;
    const sleeveY = sl === 'long' ? (sv ? 206 : 226) : sl === 'baggy' ? len - 22 : sl === 'none' ? -40 : (sv ? 100 : 112);
    const hwE = (hw0 + hw1) / 2 + 2;
    // inner fill of one segment between y0 and y1 (sleeve up to sleeveY, cuff, glove, shade, dim)
    const fill = (y0, y1, wq) => {
      let inner = '';
      if (sl !== 'none' && sleeveY > y0) {
        inner += S.rect(-wq - 10, y0 - 30, 2 * wq + 20, Math.min(sleeveY, y1 + 40) - y0 + 30, 0, { fill: sc });
        if (style.sleevePattern === 'stars') inner += S.path(scatter(-wq, wq, Math.max(-10, y0), Math.min(sleeveY - 20, y1), 3, 5 + y0, (x, y, i) => (i % 2 ? starD(x, y, 10) : controllerD(x, y, 0.7))), { fill: c.pattern });
        if (sl === 'long' && sleeveY > y0 && sleeveY - 18 < y1 + 40) inner += S.rect(-wq - 10, sleeveY - 18, 2 * wq + 20, 18, 0, { fill: c.cuff || c.topShade || '#0003' }) + S.path(`M${-wq - 10} ${sleeveY - 18} L${wq + 10} ${sleeveY - 18}`, lineOnly(4.5));
        if (sleeveY < y1 + 30) inner += S.path(`M${-wq - 10} ${sleeveY} L${wq + 10} ${sleeveY}`, lineOnly(SW));
      }
      if (style.gloveCol && len - 52 < y1) inner += S.rect(-wq - 10, len - 52, 2 * wq + 20, 70, 0, { fill: style.gloveCol }) + S.path(`M${-wq - 10} ${len - 52} L${wq + 10} ${len - 52}`, lineOnly(4.5));
      if (shade) inner += S.rect((sv ? 22 : 20) * kw, y0 - 30, 24 * kw, y1 - y0 + 60, 0, { fill: '#000', opacity: 0.07 });
      if (dim) inner += S.rect(-wq - 20, y0 - 30, 2 * wq + 40, y1 - y0 + 60, 0, { fill: '#000', opacity: 0.14 });
      return inner;
    };
    let body = '';
    let tipTf = '';
    if (Math.abs(bend) < 2) {
      body = clipped(armSeg(-18, len, hw0, hw1), c.skin, fill(-18, len, hw1));
    } else {
      const fr = sv ? bend : -bend;   // front view: + folds the forearm up/out (rotate -B); side view: + folds forward
      const up = clipped(armSeg(-18, el + 30, hw0, hwE, 17, 30), c.skin, fill(-18, el + 30, hwE));
      const fore = clipped(armSeg(el - 30, len, hwE, hw1, 30, 17), c.skin, fill(el - 30, len, hw1));
      let bulge = '';
      if (style.bicep && bend > 40) {
        const k = clamp((bend - 40) / 60, 0, 1) * (style.bicep === true ? 1 : style.bicep);
        const bx = sv ? -hw0 : hw0;
        bulge = S.path(`M${f(bx * 0.9)} 0 Q${f(bx + Math.sign(bx) * 52 * k)} ${f(el * 0.5)} ${f(bx * 0.95)} ${f(el + 10)} Z`, outline(sl !== 'none' && sleeveY > el ? sc : c.skin, 6)) + S.path(`M${f(bx + Math.sign(bx) * 10 * k)} ${f(el * 0.3)} Q${f(bx + Math.sign(bx) * 30 * k)} ${f(el * 0.5)} ${f(bx + Math.sign(bx) * 14 * k)} ${f(el * 0.72)}`, lineOnly(5, '#FFFFFF88'));
      }
      tipTf = `rotate(${f(fr)} 0 ${el})`;
      body = up + bulge + S.g(fore, tipTf);
    }
    // hand-end extras in the forearm frame: baggy cuff, fist, claws
    let tip = '';
    if (sl === 'baggy') {
      const cd = S.roundedPath([[-hw1 - 12, sleeveY - 40], [hw1 + 12, sleeveY - 40], [hw1 + 14, sleeveY + 6], [-hw1 - 14, sleeveY + 6]], 12);
      tip += S.path(cd, outline(c.cuff || sc, 5.5)) + S.path(`M${-hw1} ${sleeveY - 26} L${hw1} ${sleeveY - 26} M${-hw1} ${sleeveY - 12} L${hw1} ${sleeveY - 12}`, lineOnly(3, shadeHex(c.cuff || sc, 0.82)));
      if (dim) tip += S.path(cd, { fill: '#000', opacity: 0.14 });
    }
    if (style.fist) {
      const fw = (sv ? 52 : 54) * kw, f0 = len - 76, f1 = len + 24;
      const fd = S.roundedPath([[-fw, f0], [fw, f0], [fw + 2, f1], [-fw - 2, f1]], 20);
      tip += clipped(fd, c.skin, (shade ? S.rect(fw * 0.35, f0 - 10, fw, 130, 0, { fill: c.skinShade, opacity: 0.8 }) : '') + (dim ? S.rect(-100, f0 - 10, 200, 150, 0, { fill: '#000', opacity: 0.14 }) : ''));
      tip += S.path(sv ? `M${-fw + 10} ${f1 - 30} L${-fw + 30} ${f1 - 30} M${-fw + 6} ${f1 - 58} L${-fw + 28} ${f1 - 58}` : `M${-fw * 0.34} ${f1 - 4} L${-fw * 0.34} ${f1 - 26} M${fw * 0.02} ${f1 - 4} L${fw * 0.02} ${f1 - 28} M${fw * 0.38} ${f1 - 4} L${fw * 0.38} ${f1 - 26} M${-fw + 10} ${f0 + 24} Q${-fw * 0.2} ${f0 + 40} ${fw * 0.2} ${f0 + 22}`, lineOnly(4.5, c.skinShade2 || shadeHex(c.skin, 0.72)));
    }
    if (style.claws) {
      let d = '';
      for (const x of sv ? [-30, -6] : [-24, 0, 24]) d += `M${x * kw - 9} ${len - 4} L${x * kw} ${len + 26} L${x * kw + 9} ${len - 4} Z `;
      tip += S.path(d, outline(style.claws, 4));
    }
    if (tip) body += tipTf ? S.g(tip, tipTf) : tip;
    return body;
  };
}

// ====================================================================== LEGS: socks (striped), high-waters, dino feet, untied laces, loafers, low heels
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul2 = (a, k) => [a[0] * k, a[1] * k];
function legBody7(style, J, wOut, wIn, shade, dim) {
  const c = style.col;
  const Lb = bentLimb(J, wOut, wIn, 24);
  const id = S.uid('lg7');
  let inner = '';
  if (style.pantsPattern === 'stars') inner += S.path(scatter(-140, 140, -40, 300, 8, 8, (x, y, i) => (i % 3 === 0 ? controllerD(x, y, 0.8) : starD(x, y, 10))), { fill: c.pattern });
  if (shade) {
    const a = add2(J.hip, mul2(Lb.u1, -40)), b = add2(J.hip, mul2(Lb.u1, 44)), wq = Math.max(wOut[0], wIn[0]) + 14;
    inner += S.path(`M${P(add2(a, mul2(Lb.n1, -wq)))} L${P(add2(a, mul2(Lb.n1, wq)))} L${P(add2(b, mul2(Lb.n1, wq)))} L${P(add2(b, mul2(Lb.n1, -wq)))} Z`, { fill: c.pantsShade });
  }
  const wc = Math.max(wOut[2], wIn[2]) + 14;
  const ankleBand = (from, to, col) => { const a = add2(J.ankle, mul2(Lb.u2, -from)), b = add2(J.ankle, mul2(Lb.u2, -to)); return S.path(`M${P(add2(a, mul2(Lb.n2, -wc)))} L${P(add2(a, mul2(Lb.n2, wc)))} L${P(add2(b, mul2(Lb.n2, wc)))} L${P(add2(b, mul2(Lb.n2, -wc)))} Z`, { fill: col }); };
  const sockH = style.sockH || 46;
  if (style.socks) {
    inner += ankleBand(sockH, -2, style.socks);
    if (style.sockStripe) for (let y = sockH - 12; y > 6; y -= 22) inner += ankleBand(y, y - 9, style.sockStripe);
  }
  if (style.cuffCol) inner += ankleBand(style.socks ? sockH + 34 : 40, style.socks ? sockH : -2, style.cuffCol);
  if (dim) inner += S.path(Lb.d, { fill: '#000', opacity: 0.25 });
  let o = S.clipDef(id, S.path(Lb.d)) + S.path(Lb.d, { fill: c.pants }) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  if (Lb.crease && !style.socks) o += S.path(Lb.crease, lineOnly(5));
  o += S.path(Lb.d, outline('none'));
  for (const [on, from] of [[style.socks, sockH], [style.cuffCol, style.socks ? sockH + 34 : 40], [style.cuffCol && style.socks, sockH]]) {
    if (!on) continue;
    const a = add2(J.ankle, mul2(Lb.u2, -from));
    o += S.path(`M${P(add2(a, mul2(Lb.n2, wOut[2] + 2)))} L${P(add2(a, mul2(Lb.n2, -wIn[2] - 2)))}`, lineOnly(5));
  }
  const cid = S.uid('cf7');
  const cut = S.clipDef(cid, S.el('rect', { x: -700, y: -1400, width: 1400, height: 1408, transform: `translate(${P(J.ankle)}) rotate(${f(J.foot)})` }));
  return cut + S.g(o, null, { 'clip-path': `url(#${cid})` });
}
function shoe7(style, { x0, x1, back, dim, shade, toeCx, side }) {
  const c = style.col;
  const kind = style.shoe || 'sneaker';
  const dimC = (col) => (dim ? shadeHex(col, 0.82) : col);
  const sole = dimC(c.sole);
  let s = '';
  if (kind === 'dinoFoot') {
    s += S.path(S.roundedPath([[x0 - 6, -24], [x1 + 6, -24], [x1 + 8, 42], [x0 - 8, 42]], 26), outline(dimC(c.dino || c.pants)));
    s += S.path(`M${x0 - 4} 30 L${x1 + 4} 30`, lineOnly(8, dimC(c.dinoShade || c.soleShade)));
    if (!back) { let d = ''; const xs = side ? [x0 - 6, x0 + 18] : [toeCx - 28, toeCx, toeCx + 28]; for (const x of xs) d += side ? `M${x + 4} 0 L${x - 26} 14 L${x + 4} 28 Z ` : `M${x - 10} 30 L${x} 54 L${x + 10} 30 Z `; s += S.path(d, outline('#FFFFFF', 4)); }
    return s;
  }
  if (kind === 'slipper') {
    s += S.path(S.roundedPath([[x0 - 4, -16], [x1 + 4, -16], [x1 + 4, 40], [x0 - 4, 40]], 22), outline(dimC(c.toe)));
    let fl = '';
    for (let x = x0 + 4; x < x1; x += 20) fl += `M${x} -14 a10 10 0 0 1 20 0 `;
    s += S.path(fl, { fill: dimC(c.toe), stroke: LINE, 'stroke-width': 4 }) + S.path(`M${x0 - 2} 28 L${x1 + 2} 28`, lineOnly(8, sole));
    return s;
  }
  if (kind === 'loafer' || kind === 'heel') {
    s += S.path(S.roundedPath([[x0, kind === 'heel' ? 2 : -6], [x1, kind === 'heel' ? 2 : -6], [x1, 34], [x0, 34]], 18), outline(sole));
    if (kind === 'heel') s += S.rect(side ? x1 - 30 : x0 + 2, 30, 26, 14, 3, outline(dimC(c.soleShade), 4));
    else s += S.rect(x0, 30, x1 - x0, 12, 4, outline(dimC(c.soleShade), 4));
    if (!back && kind === 'loafer') s += S.path(side ? `M${x0 + 20} -2 L${x0 + 70} -2` : `M${f(toeCx - 24)} 0 L${f(toeCx + 24)} 0`, lineOnly(6, dimC(c.toe)));
    if (!back) s += S.path(side ? `M${x0 + 14} 10 Q${x0 + 40} 0 ${x0 + 70} 8` : `M${f(toeCx - 22)} 12 Q${f(toeCx)} 2 ${f(toeCx + 22)} 12`, lineOnly(5, '#FFFFFF66'));
    return s;
  }
  if (kind === 'boot') {
    const up = side ? [[x0 + 60, -44], [x1, -44], [x1 + 4, 30], [x0 + 60, 30]] : [[x0 + 2, -44], [x0 + (x1 - x0) * 0.62, -44], [x0 + (x1 - x0) * 0.62, 30], [x0 + 2, 30]];
    s += S.path(S.roundedPath(up, 14), outline(sole));
    s += S.path(S.roundedPath([[x0 - 4, -8], [x1 + 4, -8], [x1 + 6, 30], [x0 - 6, 30]], 16), outline(sole));
    if (!back) s += S.path(side ? `M${x0 - 4} 12 A54 44 0 0 1 ${x0 + 90} 12 Z` : `M${f(toeCx - 48)} 12 A48 40 0 0 1 ${f(toeCx + 48)} 12 Z`, outline(dimC(c.toe)));
    s += S.rect(x0 - 6, 24, x1 - x0 + 12, 20, 7, outline(dimC(c.soleShade), 5));
    if (!back) s += S.path(side ? `M${x0 + 76} -34 l22 8 M${x0 + 76} -16 l22 8` : `M${f(x0 + 18)} -34 l30 8 M${f(x0 + 18)} -16 l30 8`, lineOnly(5, dimC(c.lace || '#E8D8B0')));
    return s;
  }
  // sneaker (default), optional untied laces
  const soleD = S.roundedPath([[x0, -4], [x1, -4], [x1, 42], [x0, 42]], 14);
  s += S.path(soleD, outline(sole));
  if (c.soleBand) s += S.rect(x0 + 2, 24, x1 - x0 - 4, 12, 4, { fill: dimC(c.soleBand) }) + S.path(soleD, outline('none'));
  if (shade) s += S.path(`M${x0 + 6} 32 L${x1 - 6} 32`, lineOnly(6, dimC(c.soleShade)));
  if (!back) {
    s += S.path(`M${f(toeCx - 42)} -2 A42 37 0 0 1 ${f(toeCx + 42)} -2 Z`, outline(dimC(c.toe)));
    if (c.toe !== c.sole) s += S.path(`M${f(toeCx - 22)} -18 Q${f(toeCx)} -30 ${f(toeCx + 22)} -18`, lineOnly(4.5, '#fff'));
    if (style.laces && STATE.laces) {
      const lc = c.lace || '#FFFFFF', lx = side ? x0 + 70 : toeCx + 6;
      const sw = Math.sin(STATE.t * 7 + (side ? 1 : 0)) * 6;
      const d = side ? `M${lx} -6 Q${lx - 24} 20 ${lx - 40 + sw} 40 M${lx + 10} -6 Q${lx + 24} 24 ${lx + 14 - sw} 46` : `M${f(lx)} -24 Q${f(lx + 22)} -4 ${f(lx + 30 + sw)} 30 M${f(lx + 8)} -22 Q${f(lx + 44)} -14 ${f(lx + 60 - sw)} 14`;
      s += S.path(d, lineOnly(9, LINE)) + S.path(d, lineOnly(4.5, dimC(lc)));
    }
  }
  return s;
}
function makeLeg7(style) {
  const kw = style.legW || 1;
  return function leg({ shade = true, dim = false, toeShift = 0, back = false, J } = {}) {
    const straight = style.pantsShape !== 'wide';
    const wOut = (straight ? [42, 46, 54] : [42, 74, 103]).map((v) => v * kw), wIn = [40, 40, 40].map((v) => v * kw);
    const o = legBody7(style, J, wOut, wIn, shade, dim);
    const x1 = (straight ? 94 : 107) * kw, x0 = -44 * kw;
    const s = shoe7(style, { x0, x1, back, dim, shade, toeCx: (straight ? 24 : 30) * kw + toeShift, side: false });
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}
function makeLegSide7(style) {
  const c = style.col;
  const kw = style.legW || 1;
  return function legSide({ shade = true, dim = false, J } = {}) {
    const straight = style.pantsShape !== 'wide';
    const wOut = (straight ? [62, 64, 68] : [64, 74, 85]).map((v) => v * kw), wIn = (straight ? [56, 58, 62] : [58, 69, 80]).map((v) => v * kw);
    const o = legBody7(style, J, wOut, wIn, shade, dim);
    const sc = { ...style, col: { ...c, toe: c.toe === c.sole ? (dim ? c.soleShade : c.sole) : c.toe } };
    const s = shoe7(sc, { x0: -138 * kw, x1: 88 * kw, back: false, dim, shade, toeCx: -86 * kw, side: true });
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}

// ====================================================================== dress7()
function dress7(d) {
  const st = d.style, c = st.col, a = st.acc || {};
  d.torso = makeTorso7(st);
  d.torsoSide = makeTorsoSide7(st);
  d.arm = makeArm7(st);
  d.leg = makeLeg7(st);
  d.legSide = makeLegSide7(st);
  if (st.thigh) Object.assign(d.dims, { thigh: st.thigh, shin: st.shin, sideThigh: st.thigh - 4, sideShin: st.shin - 2 });
  const hs0 = d.headSide, hb0 = d.headBack;
  if (a.hugeWalrus || a.bigSpecs || a.braces || a.flourCheek || a.eyeBags || a.tankBandaid) {
    d.headSide = (face, shade) => {
      let o = hs0(face, shade);
      if (a.eyeBags) o += S.path('M-150 -642 Q-118 -620 -88 -640', { fill: 'none', stroke: '#9A78C2', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: f(0.45 + 0.4 * STATE.tired) });
      if (a.flourCheek && STATE.flour > 0) o += flourSmudge(-90, -636, STATE.flour * 0.8);
      if (a.braces) o += braces(mouthOf(st, face), [-132, -600], 0.55, 1);
      if (a.hugeWalrus) o += S.g(L6.walrusFront ? walrusSideBig(c) : '', null);
      if (a.bigSpecs) o += bigSpecsSide(a.bigSpecs);
      if (a.tankBandaid) o += L5.bandaid(-110, -650, -20, 0.8);
      return o;
    };
  }
  if (a.hugeWalrus) d.headBack = (face, shade) => (() => { let o = ''; for (const sx of [-1, 1]) o += puffs([[sx * 150, -632, 22], [sx * 170, -606, 18]], c.stache || c.hair, 6); return o; })() + hb0(face, shade);
  if (a.braces) {
    const h0 = d.head;
    d.head = (face, t, shade) => { const m = hm(t); return h0(face, t, shade) + braces(mouthOf(st, face), m.feat([0, -598]), (1 - 0.15 * m.at) * (st.mouthScale || 1), st.mouthScale || 1); };
  }
  return d;
}
function walrusSideBig(c) {
  const col = c.stache || c.hair;
  const cs = [[-206, -632, 30], [-166, -644, 32], [-126, -640, 30], [-92, -630, 24], [-228, -606, 22], [-198, -600, 20], [-150, -612, 22]];
  return puffs(cs, col, 6) + curlMarks(cs.slice(0, 4), 28, 4, c.hairShade || '#C9C4D8') + S.path('M-206 -654 Q-170 -670 -130 -660', lineOnly(6, '#FFFFFF'));
}

// ====================================================================== OVERLAYS (cast.js: head-space `over` layers and body-space props)
// Mom's day-off sunhat (head space)
function sunhat(view, turn = 0, c = {}) {
  const straw = c.straw || '#F2D38A', strawSh = c.strawShade || '#D9B060', rib = c.ribbon || '#FF7A6B';
  const m = hm(turn);
  if (view === 'side') {
    return S.path('M-290 -846 Q0 -900 280 -842 Q290 -820 250 -820 Q0 -862 -260 -818 Q-300 -822 -290 -846 Z', outline(straw, 6)) +
      clipped('M-150 -860 Q-150 -1010 0 -1020 Q150 -1010 160 -860 Z', straw, S.rect(-200, -910, 400, 40, 0, { fill: rib }) + S.path('M-120 -980 Q0 -1010 120 -980', lineOnly(4, strawSh)), 6) + S.path('M150 -890 q40 10 50 60 M156 -880 q20 30 10 80', lineOnly(14, LINE)) + S.path('M150 -890 q40 10 50 60 M156 -880 q20 30 10 80', lineOnly(8, rib));
  }
  const p = view === 'back' ? [0, -860] : m.hair([0, -860]);
  const [x, y] = p;
  let o = S.path(`M${f(x - 290)} ${f(y + 22)} Q${f(x)} ${f(y - 70)} ${f(x + 290)} ${f(y + 22)} Q${f(x + 300)} ${f(y + 50)} ${f(x + 250)} ${f(y + 50)} Q${f(x)} ${f(y - 20)} ${f(x - 250)} ${f(y + 50)} Q${f(x - 300)} ${f(y + 50)} ${f(x - 290)} ${f(y + 22)} Z`, outline(straw, 6));
  o += S.path(`M${f(x - 240)} ${f(y + 24)} Q${f(x)} ${f(y - 50)} ${f(x + 240)} ${f(y + 24)}`, lineOnly(4, strawSh));
  o += clipped(`M${f(x - 156)} ${f(y)} Q${f(x - 160)} ${f(y - 166)} ${f(x)} ${f(y - 172)} Q${f(x + 160)} ${f(y - 166)} ${f(x + 156)} ${f(y)} Z`, straw, S.rect(x - 200, y - 58, 400, 44, 0, { fill: rib }) + S.path(`M${f(x - 110)} ${f(y - 130)} Q${f(x)} ${f(y - 160)} ${f(x + 110)} ${f(y - 130)}`, lineOnly(4, strawSh)), 6);
  if (view !== 'back') { const fl = [x + 110, y - 40]; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; o += S.circle(fl[0] + Math.cos(a) * 17, fl[1] + Math.sin(a) * 17, 15, outline('#FFFFFF', 4)); } o += S.circle(fl[0], fl[1], 11, outline('#FFD23F', 3.5)); }
  return o;
}
// Mom asleep standing: a small snot-bubble-free "zzz" cloud + droop is done by cast.js; this is the floating zzz
function zzz(t = 0, x = 200, y = -960) {
  let o = '';
  for (let i = 0; i < 3; i++) {
    const u = ((t * 0.6 + i / 3) % 1);
    o += txt('Z', x + u * 60 + i * 10, y - u * 120, 40 + i * 14, '#FFFFFF', { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke', opacity: f(Math.sin(u * Math.PI)) });
  }
  return o;
}
// the hero's backpack (body space; view: front = straps + the top peeking over the shoulders; side; back = the whole pack)
function backpack(view, turn = 0, col = '#3B82C4', col2 = '#FFC93C') {
  const sh = shadeHex(col, 0.8);
  if (view === 'side') return clipped(S.roundedPath([[40, -560], [170, -540], [180, -330], [50, -320]], 30), col, S.rect(120, -500, 80, 160, 18, { fill: sh }) + S.rect(40, -470, 200, 20, 0, { fill: col2 }), 7) + S.path('M60 -536 Q-10 -520 -50 -500 M60 -360 Q0 -360 -50 -380', lineOnly(14, LINE)) + S.path('M60 -536 Q-10 -520 -50 -500 M60 -360 Q0 -360 -50 -380', lineOnly(8, sh));
  if (view === 'back') {
    let o = clipped(S.roundedPath([[-120, -560], [120, -560], [130, -300], [-130, -300]], 40), col, S.rect(-140, -470, 280, 22, 0, { fill: col2 }) + S.path('M-100 -540 Q0 -580 100 -540', lineOnly(14, '#FFFFFF44')), 7);
    o += clipped(S.roundedPath([[-80, -430], [80, -430], [86, -320], [-86, -320]], 24), sh, S.path('M-70 -400 L70 -400', lineOnly(5, LINE)) + S.rect(-8, -414, 16, 26, 5, outline(col2, 3)), 6);
    return o;
  }
  const cx = turn * 30;
  let o = '';
  for (const sx of [-1, 1]) o += band(`M${f(cx + sx * 74)} -540 Q${f(cx + sx * 82)} -440 ${f(cx + sx * 78)} -340`, 18, sh, 7) + S.rect(cx + sx * 78 - 12, -430, 24, 18, 5, outline(col2, 3.5));
  return o;
}
function backpackBehind(turn = 0, col = '#3B82C4') {
  return clipped(S.roundedPath([[-130, -590], [130, -590], [136, -320], [-136, -320]], 44), col, S.path('M-100 -570 Q0 -606 100 -570', lineOnly(14, '#FFFFFF44')), 7);
}
// the hero's breakfast apron (body space, front view; turn shifts it)
function heroApron(turn = 0, col = '#FFF3DC', trim = '#F27C6B') {
  const cx = turn * 30, k = 1 - 0.12 * Math.abs(turn);
  let o = '';
  for (const sx of [-1, 1]) o += band(`M${f(cx + sx * 40 * k)} -548 L${f(cx + sx * 56 * k)} -488`, 9, col, 6);
  o += clipped(poly([[cx - 62 * k, -492], [cx + 62 * k, -492], [cx + 78 * k, -320], [cx - 78 * k, -320]], 10), col, S.path(poly([[cx - 52 * k, -482], [cx + 52 * k, -482], [cx + 68 * k, -320], [cx - 68 * k, -320]], 8), stitch(trim)) + txt('CHEF', cx, -410, 34, trim, { stroke: LINE, 'stroke-width': 4, 'paint-order': 'stroke' }) + S.path(F.heartPath(cx, -372, 12), outline(trim, 3)), 5.5);
  o += band(`M${-108} -326 L108 -326`, 10, col, 6);
  o += clipped(poly([[cx - 86 * k, -330], [cx + 86 * k, -330], [cx + 98 * k, -150], [cx - 98 * k, -150]], 12), col, S.path(poly([[cx - 76 * k, -322], [cx + 76 * k, -322], [cx + 88 * k, -160], [cx - 88 * k, -160]], 8), stitch(trim)), 5.5);
  return o;
}
// Lou's champion sash (body space, front view): over his right shoulder to the left hip, "CHAMP '79" + gold fringe
function champSash(view = 'front', turn = 0) {
  const cx = turn * 30;
  if (view === 'side') return band('M-50 -540 L60 -330', 36, '#D8263E', 7);
  if (view === 'back') return band('M90 -540 L-100 -320', 40, '#D8263E', 7);
  const d = `M${f(cx - 92)} -540 L${f(cx + 104)} -318`;
  let o = band(d, 44, '#D8263E', 8) + S.path(d, { fill: 'none', stroke: '#FFC93C', 'stroke-width': 4, 'stroke-dasharray': '2 0', opacity: 0 });
  o += S.path(`M${f(cx - 106)} -526 L${f(cx + 90)} -306 M${f(cx - 78)} -554 L${f(cx + 118)} -330`, lineOnly(4, '#FFC93C'));
  o += S.g(txt('CHAMP', 0, 10, 30, '#FFE58A', { stroke: LINE, 'stroke-width': 5, 'paint-order': 'stroke' }), `translate(${f(cx + 4)} -428) rotate(48.6)`);
  let fr = '';
  for (let i = 0; i < 7; i++) fr += `M${f(cx + 88 + i * 6)} ${-316 + i * 2} l-2 26 `;
  o += S.path(fr, lineOnly(5, '#FFC93C')) + S.g(S.circle(0, 0, 26, outline('#FFC93C', 5)) + txt('79', 0, 10, 26, '#B8331E'), `translate(${f(cx + 96)} -330)`);
  return o;
}

// ====================================================================== LITE HUMANS (crowds: flat, no clips, no filters, ~0.6–1 ms each)
// spec: { skin, hair, hairStyle, shirt, sleeve, pants, shoe, logo, logoCol, jacket, skirt, hat, hatCol, glasses, size, kid, mouth, blush, beard }
function liteHair(sp, fx, view) {
  const st = (fill, w = 7) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round' });
  const X = (x) => f(x + fx * 0.4);
  const h = sp.hair, hs = sp.hairStyle;
  const side = view === 'side', back = view === 'back';
  if (side) {
    switch (hs) {
      case 'bald': return '';
      case 'long': case 'pony': case 'bob': return S.path('M-160 -820 Q-150 -980 0 -990 Q160 -980 170 -860 L176 ' + (hs === 'long' ? -560 : hs === 'bob' ? -680 : -760) + ' L110 ' + (hs === 'long' ? -580 : -700) + ' L60 -820 Q-60 -840 -160 -820 Z', st(h)) + (hs === 'pony' ? S.path('M150 -900 Q260 -880 240 -700 Q210 -800 160 -820 Z', st(h)) : '');
      case 'curly': case 'afro': return L3.puffs([[-100, -900, 50], [0, -940, 60], [100, -900, 56], [140, -800, 44]], h, 7);
      case 'bun': return S.circle(110, -960, 46, st(h)) + S.path('M-160 -830 Q-150 -980 0 -990 Q160 -980 166 -840 L160 -760 L100 -780 L60 -840 Q-60 -850 -160 -830 Z', st(h));
      default: return S.path('M-160 -830 Q-150 -976 0 -986 Q160 -976 166 -840 L160 -770 L110 -780 L80 -840 Q-60 -850 -160 -830 Z', st(h));
    }
  }
  if (back) {
    switch (hs) {
      case 'bald': return S.path(`M-150 -760 Q0 -700 150 -760 L150 -820 Q0 -760 -150 -820 Z`, st(h));
      case 'long': return S.path('M-170 -560 L-176 -880 Q0 -1010 176 -880 L170 -560 Q0 -540 -170 -560 Z', st(h));
      case 'bob': return S.path('M-172 -680 L-176 -880 Q0 -1010 176 -880 L172 -680 Q0 -660 -172 -680 Z', st(h));
      case 'curly': case 'afro': return L3.puffs([[-110, -880, 56], [0, -930, 66], [110, -880, 56], [-120, -780, 44], [120, -780, 44], [0, -800, 50]], h, 7);
      case 'pony': return S.path('M-160 -760 L-166 -880 Q0 -1000 166 -880 L160 -760 Q0 -740 -160 -760 Z', st(h)) + S.path('M-24 -900 Q-40 -760 0 -640 Q40 -760 24 -900 Z', st(h));
      case 'bun': return S.path('M-160 -760 L-166 -880 Q0 -1000 166 -880 L160 -760 Q0 -740 -160 -760 Z', st(h)) + S.circle(0, -960, 48, st(h));
      default: return S.path('M-152 -770 L-158 -880 Q0 -990 158 -880 L152 -770 Q0 -752 -152 -770 Z', st(h));
    }
  }
  switch (hs) {
    case 'bald': return S.path(`M${X(-146)} -760 Q${X(-160)} -820 ${X(-140)} -840 L${X(-140)} -760 Z M${X(146)} -760 Q${X(160)} -820 ${X(140)} -840 L${X(140)} -760 Z`, st(h, 5));
    case 'buzz': return S.path(`M${X(-146)} -800 L${X(-150)} -880 Q${X(0)} -960 ${X(150)} -880 L${X(146)} -800 L${X(130)} -840 Q${X(0)} -866 ${X(-130)} -840 Z`, st(h));
    case 'spiky': return S.path(`M${X(-150)} -800 L${X(-170)} -900 L${X(-110)} -910 L${X(-110)} -990 L${X(-40)} -940 L${X(10)} -1010 L${X(50)} -940 L${X(120)} -990 L${X(116)} -910 L${X(170)} -890 L${X(150)} -800 L${X(120)} -846 L${X(60)} -836 L${X(0)} -856 L${X(-60)} -836 L${X(-120)} -846 Z`, st(h));
    case 'bob': return S.path(`M${X(-168)} -680 L${X(-176)} -890 Q${X(0)} -1020 ${X(176)} -890 L${X(168)} -680 L${X(132)} -690 L${X(126)} -826 Q${X(0)} -800 ${X(-126)} -826 L${X(-132)} -690 Z`, st(h));
    case 'long': return S.path(`M${X(-172)} -560 L${X(-176)} -890 Q${X(0)} -1020 ${X(176)} -890 L${X(172)} -560 L${X(136)} -580 L${X(130)} -830 Q${X(40)} -850 ${X(-30)} -820 Q${X(-100)} -850 ${X(-130)} -830 L${X(-136)} -580 Z`, st(h));
    case 'pony': return S.path(`M${X(150)} -890 Q${X(260)} -880 ${X(246)} -700 Q${X(220)} -800 ${X(150)} -820 Z`, st(h)) + S.path(`M${X(-150)} -800 L${X(-158)} -900 Q${X(0)} -1000 ${X(158)} -900 L${X(150)} -800 Q${X(60)} -856 ${X(-40)} -836 Q${X(-110)} -840 ${X(-150)} -800 Z`, st(h));
    case 'curly': return L3.puffs([[+X(-120), -860, 40], [+X(-70), -930, 46], [+X(0), -950, 48], [+X(70), -930, 46], [+X(120), -860, 40], [+X(-150), -790, 26], [+X(150), -790, 26]], h, 7);
    case 'afro': return L3.puffs([[+X(0), -950, 118], [+X(-120), -870, 70], [+X(120), -870, 70], [+X(-70), -1010, 70], [+X(70), -1010, 70]], h, 7);
    case 'bun': return S.circle(+X(0), -1000, 54, st(h)) + S.path(`M${X(-150)} -790 L${X(-158)} -890 Q${X(0)} -980 ${X(158)} -890 L${X(150)} -790 L${X(130)} -840 Q${X(0)} -870 ${X(-130)} -840 Z`, st(h));
    case 'pigtails': return S.path(`M${X(-150)} -880 Q${X(-250)} -860 ${X(-240)} -700 Q${X(-200)} -790 ${X(-150)} -800 Z M${X(150)} -880 Q${X(250)} -860 ${X(240)} -700 Q${X(200)} -790 ${X(150)} -800 Z`, st(h)) + S.path(`M${X(-150)} -800 L${X(-158)} -900 Q${X(0)} -990 ${X(158)} -900 L${X(150)} -800 L${X(120)} -846 Q${X(0)} -870 ${X(-120)} -846 Z`, st(h));
    default: // crop
      return S.path(`M${X(-150)} -790 L${X(-158)} -890 Q${X(0)} -990 ${X(158)} -890 L${X(150)} -790 L${X(130)} -846 L${X(90)} -830 L${X(60)} -852 L${X(20)} -832 L${X(-20)} -856 L${X(-60)} -832 L${X(-100)} -852 L${X(-130)} -840 Z`, st(h));
  }
}
function liteHat2(sp, fx, view) {
  if (!sp.hat) return '';
  const st = (fill, w = 7) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round' });
  const X = (x) => f(x + fx * 0.4);
  const a = sp.hatCol || '#E8453C', b = shadeHex(a, 0.8);
  const side = view === 'side';
  switch (sp.hat) {
    case 'cap': return S.path(`M${X(-152)} -860 Q${X(-152)} -1000 ${X(0)} -1004 Q${X(152)} -1000 ${X(152)} -860 Z`, st(a)) + (side ? S.path('M-150 -880 L-290 -866 Q-300 -846 -280 -842 L-140 -852 Z', st(b)) : view === 'back' ? '' : S.path(`M${X(-162)} -866 Q${X(0)} -892 ${X(162)} -866 Q${X(150)} -838 ${X(0)} -838 Q${X(-150)} -838 ${X(-162)} -866 Z`, st(b)));
    case 'beanie': return S.path(`M${X(-154)} -850 Q${X(-158)} -1010 ${X(0)} -1016 Q${X(158)} -1010 ${X(154)} -850 Z`, st(a)) + S.rect(+X(-160), -876, 320, 46, 18, st(b)) + S.circle(+X(0), -1030, 28, st('#FFFFFF'));
    case 'sunhat': return S.path(`M${X(-250)} -840 Q${X(0)} -900 ${X(250)} -840 Q${X(260)} -818 ${X(220)} -818 Q${X(0)} -860 ${X(-220)} -818 Q${X(-260)} -818 ${X(-250)} -840 Z`, st('#F2D38A')) + S.path(`M${X(-140)} -856 Q${X(-140)} -1000 ${X(0)} -1004 Q${X(140)} -1000 ${X(140)} -856 Z`, st('#F2D38A')) + S.rect(+X(-142), -900, 284, 32, 0, st(a, 5));
    case 'headband': return S.path(`M${X(-160)} -880 Q${X(0)} -1000 ${X(160)} -880`, { fill: 'none', stroke: LINE, 'stroke-width': 30, 'stroke-linecap': 'round' }) + S.path(`M${X(-160)} -880 Q${X(0)} -1000 ${X(160)} -880`, { fill: 'none', stroke: a, 'stroke-width': 18, 'stroke-linecap': 'round' });
    default: return '';
  }
}
// flat face for lite humans (dot eyes, simple brows, the usual mouths incl. lip-sync visemes, face fx)
function liteFace(face, sp, fx) {
  const fr = F.resolveFace(face);
  const blink = fr.blink || 0;
  let o = '';
  const eye = (x, y, e) => {
    const ty = e.type || 'open';
    if (ty === 'happy') return S.path(`M${f(x - 20)} ${f(y + 8)} Q${f(x)} ${f(y - 22)} ${f(x + 20)} ${f(y + 8)}`, lineOnly(9));
    if (ty === 'closed' || blink > 0.6 || (e.upper || 0) > 0.8) return S.path(`M${f(x - 20)} ${f(y)} Q${f(x)} ${f(y + 10)} ${f(x + 20)} ${f(y)}`, lineOnly(9));
    if (ty === 'x') return S.path(`M${f(x - 14)} ${f(y - 14)} L${f(x + 14)} ${f(y + 14)} M${f(x + 14)} ${f(y - 14)} L${f(x - 14)} ${f(y + 14)}`, lineOnly(9));
    if (ty === 'star') return S.path(F.starPath(x, y, 26), outline('#FFD21F', 5));
    if (ty === 'heart') return S.path(F.heartPath(x, y, 18), outline('#FF3B5C', 5));
    if (ty === 'swirl') return S.circle(x, y, 18, lineOnly(6)) + S.circle(x, y, 7, lineOnly(5));
    const k = clamp(e.pupil ?? 1, 0.5, 1.6);
    const lk = e.look || [0, 0];
    return S.ellipse(x + lk[0] * 8, y + lk[1] * 6, 16 * k, 23 * k, { fill: LINE }) + S.circle(x + lk[0] * 8 - 5 * k, y + lk[1] * 6 - 9 * k, 5 * k, { fill: '#FFFFFF' });
  };
  o += eye(-50 + fx, -722, fr.eyeL) + eye(50 + fx, -722, fr.eyeR);
  if (sp.brows) o += S.path(`M${f(-80 + fx)} ${f(-790 + (fr.brows.L || [0, 0])[1] * 0.6)} L${f(-24 + fx)} ${f(-786 + (fr.brows.L || [0, 0])[0] * 0.6)} M${f(80 + fx)} ${f(-790 + (fr.brows.R || [0, 0])[1] * 0.6)} L${f(24 + fx)} ${f(-786 + (fr.brows.R || [0, 0])[0] * 0.6)}`, lineOnly(10, sp.browCol || LINE));
  if (sp.blush) o += S.ellipse(-86 + fx, -640, 24, 11, { fill: '#FF8FA3', opacity: 0.6 }) + S.ellipse(86 + fx, -640, 24, 11, { fill: '#FF8FA3', opacity: 0.6 });
  const name = typeof face === 'string' ? face : face && face.name;
  const mouth = (face && typeof face === 'object' && face.mouth) || (!name || name === 'neutral' ? (sp.mouth || 'smile') : fr.mouth);
  o += F.mouth(mouth, fx, -610, 0.9, 0.9);
  o += F.faceFx(fr.fx, { fx });
  return o;
}
function liteHuman(sp) {
  const st = (fill, w = 7) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round' });
  const skin = st(sp.skin), shirt = st(sp.shirt), sleeve = st(sp.sleeve || sp.shirt), pants = st(sp.pants), shoe = st(sp.shoe || '#F4F4F8');
  const LT = {
    headF: S.roundedPath([[-140, -890], [140, -890], [140, -559], [-140, -559]], 46),
    headS: S.roundedPath([[-165, -885], [150, -885], [150, -553], [-165, -553]], 44),
    armF: S.roundedPath([[-30, -18], [30, -18], [40, 268], [-40, 268]], 17),
    armS: S.roundedPath([[-40, -20], [40, -20], [40, 248], [-40, 248]], 18),
    torsoF: S.roundedPath([[-100, -533], [100, -533], [100, -306], [-100, -306]], 16),
    torsoS: S.roundedPath([[-62, -535], [70, -535], [70, -305], [-62, -305]], 16),
  };
  const slY = sp.longSleeve ? 226 : 112;
  const sleeveF = S.roundedPath([[-30, -18, 17], [30, -18, 17], [30 + 10 * slY / 286, slY, 0], [-30 - 10 * slY / 286, slY, 0]]);
  const sleeveS = S.roundedPath([[-40, -20, 18], [40, -20, 18], [40, sp.longSleeve ? 206 : 100, 0], [-40, sp.longSleeve ? 206 : 100, 0]]);
  const logo = (cx, y, k) => {
    const lc = sp.logoCol || '#FFFFFF';
    switch (sp.logo) {
      case 'star': return S.path(F.starPath(cx, y, 30 * k, 13 * k), outline(lc, 5));
      case 'heart': return S.path(F.heartPath(cx, y, 22 * k), outline(lc, 5));
      case 'stripe': return S.rect(-100, y - 14, 200, 28, 0, st(lc, 5));
      case 'num': return txt(sp.num || '7', cx, y + 24, 70, lc, { stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' });
      case 'dot': return S.circle(cx, y, 24 * k, outline(lc, 5));
      default: return '';
    }
  };
  const feetF = (J) => S.g(S.path(S.roundedPath([[-44, -4], [94, -4], [94, 40], [-44, 40]], 14), shoe), `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  const skirtF = sp.skirt ? S.path(S.roundedPath([[-104, -330], [104, -330], [134, sp.skirtLen || -150], [-134, sp.skirtLen || -150]], 12), st(sp.skirt)) : '';
  const tall = ['afro', 'bun'].includes(sp.hairStyle) || sp.hat === 'beanie';
  // head top in body units (before size): hair style vs hat, whichever is higher
  const HT = { crop: 940, buzz: 920, spiky: 1010, bob: 955, long: 955, pony: 950, pigtails: 945, curly: 998, afro: 1068, bun: 1054, bald: 890 };
  const HAT = { cap: 1004, beanie: 1058, sunhat: 1004, headband: 945 };
  const top = Math.max(HT[sp.hairStyle] || 940, HAT[sp.hat] || 0);
  return {
    style: { lite: true, size: sp.size || 1 },
    dims: { size: sp.size || 1, nametagY: tall ? -1100 : -1040, top },
    defaults: { volume: false },
    leg: ({ J }) => S.path(bentLimb(J, [42, 46, 54], [40, 40, 40], 24).d, pants) + feetF(J),
    legSide: ({ J }) => S.path(bentLimb(J, [62, 64, 68], [56, 58, 62], 24).d, pants) + S.g(S.path(S.roundedPath([[-138, -4], [88, -4], [88, 42], [-138, 42]], 16), shoe), `translate(${P(J.ankle)}) rotate(${f(J.foot)})`),
    arm: ({ view, dim }) => S.path(view === 'side' ? LT.armS : LT.armF, skin) + S.path(view === 'side' ? sleeveS : sleeveF, sleeve) + (dim ? S.path(view === 'side' ? LT.armS : LT.armF, { fill: '#000', opacity: 0.12 }) : ''),
    torso: (t, shade, back) => {
      const cx = (t || 0) * 30, k = 1 - 0.12 * Math.abs(t || 0);
      let o = S.path(LT.torsoF, shirt);
      if (!back) {
        if (sp.jacket) o += S.path(`M-100 -533 L${f(cx - 34 * k)} -533 L${f(cx - 34 * k)} -306 L-100 -306 Z M100 -533 L${f(cx + 34 * k)} -533 L${f(cx + 34 * k)} -306 L100 -306 Z`, st(sp.jacket, 6));
        else o += logo(cx, -430, k);
        o += S.path(`M${f(cx - 30 * k)} -533 Q${f(cx)} -506 ${f(cx + 30 * k)} -533 Z`, st(sp.skin, 5));
      } else if (sp.jacket) o += S.path(LT.torsoF, st(sp.jacket, 6));
      return o + skirtF;
    },
    torsoSide: () => S.path(LT.torsoS, sp.jacket ? st(sp.jacket) : shirt) + (sp.skirt ? S.path(S.roundedPath([[-66, -330], [74, -330], [96, sp.skirtLen || -150], [-90, sp.skirtLen || -150]], 12), st(sp.skirt)) : ''),
    head: (fc, t) => {
      const fx = (t || 0) * 40;
      const behind = ['long', 'bob', 'pony', 'pigtails'].includes(sp.hairStyle) ? liteHair(sp, fx, 'front') : '';
      let o = (sp.hairStyle === 'long' || sp.hairStyle === 'bob' ? S.path(`M${f(-166 + fx * 0.4)} -880 L${f(166 + fx * 0.4)} -880 L${f(170 + fx * 0.4)} ${sp.hairStyle === 'long' ? -570 : -690} L${f(-170 + fx * 0.4)} ${sp.hairStyle === 'long' ? -570 : -690} Z`, st(shadeHex(sp.hair, 0.8), 6)) : '');
      o += S.path(LT.headF, skin);
      o += behind || liteHair(sp, fx, 'front');
      o += liteHat2(sp, fx, 'front');
      o += liteFace(fc, sp, fx);
      if (sp.beard) o += S.path(`M${f(-120 + fx)} -660 Q${f(fx)} -520 ${f(120 + fx)} -660 L${f(110 + fx)} -600 Q${f(fx)} -560 ${f(-110 + fx)} -600 Z`, st(sp.hair, 5));
      if (sp.glasses) o += S.circle(-52 + fx, -722, 42, { fill: 'none', stroke: LINE, 'stroke-width': 9 }) + S.circle(52 + fx, -722, 42, { fill: 'none', stroke: LINE, 'stroke-width': 9 }) + S.path(`M${f(-12 + fx)} -726 L${f(12 + fx)} -726`, lineOnly(8));
      return o;
    },
    headSide: (fc) => {
      const fr = F.resolveFace(fc);
      let o = S.path(LT.headS, skin) + liteHair(sp, 0, 'side') + liteHat2(sp, 0, 'side');
      o += S.ellipse(-122, -722, 15, 22, { fill: LINE }) + S.circle(-128, -730, 5, { fill: '#FFFFFF' });
      if (sp.glasses) o += S.circle(-124, -722, 38, { fill: 'none', stroke: LINE, 'stroke-width': 9 }) + S.path('M-86 -730 L40 -740', lineOnly(8));
      return o + F.mouth((fc && fc.mouth) || (fr.mouth === 'line' ? (sp.mouth || 'smile') : fr.mouth), -132, -610, 0.5, 0.9);
    },
    headBack: () => S.path(LT.headF, skin) + liteHair(sp, 0, 'back') + liteHat2(sp, 0, 'back'),
  };
}

module.exports = {
  dress7, makeTorso7, makeTorsoSide7, makeArm7, makeLeg7, makeLegSide7, outfit7, TOPS7, STATE,
  sunhat, zzz, krumpHive, backpack, backpackBehind, heroApron, champSash, hoodDownBehind, hoodDownBack, dinoTail, dinoSpike, googly,
  bigSpecsFront, braces, eyeBags, flourSmudge, redPen, cupcake, rocket, patch, liteHuman, liteHair, EL_F, EL_S,
};
