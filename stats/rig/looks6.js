// Looks for "What If Your PARENTS Joined Your Roblox Server?", built on looks .. looks5 the way looks5 built on looks4:
//  * real-life family: Dad's receding hair + walrus moustache + sweater vest + socks-with-sandals, Mom's neat librarian bun
//    (pencil in it) + cardigan / pajamas, Grandma's flowery dress + cardigan + slippers + curlers, teen Mom 1998 (big teased
//    bangs, colour-block windbreaker, chunky sneakers)
//  * the game avatars of Cube City: the HOT DOG costume (DadBod1978), MOM_OFFICIAL grey default + golden armour,
//    GrannyGoodies fur coat, NoodleBoi's ramen-bowl head + sushi hoodie, xX_DarkBlade_Xx's spiky helmet + armour + cape,
//    clan armour, DarkBlade's mom, cheap "lite" avatars for players / noobs, and the BLOCK KING boss (non-rig)
//  * overlays used by cast.js: game nametags, the LVL-99 crown, YOU's hood + gaming headset, reading glasses up/on,
//    curlers, DarkBlade's dizzy stars...
// dress6(design) swaps a dress5 design's body parts for the looks6 ones (falling back to looks5 for unknown tops)
// and adds the new accessories to the side and back views.
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const L = require('./looks');
const L2 = require('./looks2');
const L3 = require('./looks3');
const L4 = require('./looks4');
const L5 = require('./looks5');
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
const { puffs, fluffy } = L3;
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const clipped = (d, fill, inner, w = SW) => {
  const id = S.uid('l6');
  return S.clipDef(id, S.path(d)) + S.path(d, { fill }) + (inner ? S.g(inner, null, { 'clip-path': `url(#${id})` }) : '') + (w ? S.path(d, outline('none', w)) : '');
};
const txt = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const TF = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
const hm = L5.hm;
const curlMarks = (pts, r, w = 4.5, col = LINE) => S.path(pts.map(([x, y, rr = r]) => `M${f(x - rr * 0.42)} ${f(y + 3)} Q${f(x)} ${f(y - rr * 0.55)} ${f(x + rr * 0.4)} ${f(y + 5)}`).join(' '), lineOnly(w, col));
const stitch = (col, w = 3.5) => ({ fill: 'none', stroke: col, 'stroke-width': w, 'stroke-dasharray': '8 6', 'stroke-linecap': 'round' });
const shadeHex = (hex, k = 0.82) => '#' + [1, 3, 5].map((i) => Math.round(clamp(parseInt(hex.slice(i, i + 2), 16) * k, 0, 255)).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - k) + parseInt(b.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
// two-tone stroke (dark outline + coloured core) along a path
const band = (d, w, col, ow = 7) => S.path(d, lineOnly(w + ow, LINE)) + S.path(d, lineOnly(w, col));

// per-draw state written by cast.js wrappers (options that change body parts: apron, badge, MVP medal, hot dog face...)
const STATE = { t: 0, face: null, apron: false, badge: null, mvp: false, headRot: 0, hairnet: false, shy: false };

// ====================================================================== HAIR
// fluffy side tuft (sx = side); pts are authored for the right side (clockwise) and mirrored for the left
function sideTuft(map, sx, col, shadeCol, pts) {
  let q = pts.map(([x, y, b]) => [...map([sx * x, y]), b]);
  if (sx < 0) { q = q.slice().reverse(); q = q.map((p, i) => [p[0], p[1], q[(i + 1) % q.length][2]]); }
  const p = (x, y) => P(map([sx * x, y]));
  return S.path(fluffy(q), outline(col)) + S.path(`M${p(150, -820)} q${sx * 14} 6 ${sx * 20} 20 M${p(150, -764)} q${sx * 14} 6 ${sx * 18} 18`, lineOnly(4, shadeCol));
}
const TUFT = [[132, -860, 0], [158, -854, 8], [176, -812, 9], [174, -752, 9], [160, -700, 8], [138, -700, 0]];

// Dad: receding hairline — a small comb-over island with a widow's peak on top, bald shiny temples, bushy grey-brown side tufts
const RECEDE_OUT = [[-106, -890], [-100, -934], [-54, -964], [10, -972], [72, -962], [114, -930], [118, -890]];
const RECEDE_LINE = [[90, -880], [52, -886], [22, -870], [0, -856], [-22, -870], [-52, -886], [-88, -880]];
// Mom: sleek hair with a side part
const SLEEK_OUT = [[-158, -724], [-164, -862], [-112, -956], [0, -984], [112, -956], [164, -862], [158, -724], [136, -732], [134, -802]];
const SIDEPART_LINE = [[110, -836], [60, -862], [0, -874], [-36, -884], [-48, -860], [-110, -838], [-134, -802], [-136, -732]];

// neat librarian bun with a hair tie; a yellow pencil stuck through it
function neatBun(x, y, r, c, shade, pencil = true) {
  let o = '';
  if (pencil) o += L3.pencil([x - r * 1.75, y + r * 0.75], [x + r * 1.6, y - r * 0.95], 17, '#FFC93C');
  o += S.circle(x, y, r, outline(c.hair));
  o += S.path(`M${f(x - r * 0.72)} ${f(y + r * 0.2)} Q${f(x - r * 0.1)} ${f(y - r * 0.92)} ${f(x + r * 0.74)} ${f(y - r * 0.05)} M${f(x - r * 0.5)} ${f(y + r * 0.6)} Q${f(x + r * 0.1)} ${f(y - r * 0.15)} ${f(x + r * 0.62)} ${f(y + r * 0.5)}`, lineOnly(4.5, c.hairShade));
  if (shade) o += S.path(`M${f(x - r * 0.55)} ${f(y - r * 0.55)} Q${f(x)} ${f(y - r * 0.95)} ${f(x + r * 0.5)} ${f(y - r * 0.62)}`, lineOnly(r * 0.16, c.hairHi));
  o += S.path(`M${f(x - r * 0.86)} ${f(y + r * 0.62)} Q${f(x)} ${f(y + r * 1.02)} ${f(x + r * 0.86)} ${f(y + r * 0.62)}`, lineOnly(15, LINE)) + S.path(`M${f(x - r * 0.86)} ${f(y + r * 0.62)} Q${f(x)} ${f(y + r * 1.02)} ${f(x + r * 0.86)} ${f(y + r * 0.62)}`, lineOnly(8, c.accent || '#3E6E9E'));
  return o;
}

// teen Mom 1998: the big teased fringe (drawn in `over`, scalloped bottom edge sits on the brows)
function teenFringe(hair, feat, c, shade) {
  const pts = [
    [...hair([-158, -846]), 0], [...hair([-150, -942]), 16], [...hair([-92, -1018]), 18], [...hair([-10, -1052]), 18], [...hair([74, -1040]), 16], [...hair([140, -984]), 14], [...hair([164, -900]), 0],
    [...feat([146, -826]), 0], [...feat([112, -800]), 10], [...feat([62, -814]), 10], [...feat([22, -794]), 10], [...feat([-22, -810]), 10], [...feat([-66, -792]), 10], [...feat([-110, -808]), 10], [...feat([-146, -796]), 0],
  ];
  const d = fluffy(pts);
  let inner = S.path(`M${P(feat([-120, -812]))} Q${P(hair([-110, -930]))} ${P(hair([-40, -1010]))} M${P(feat([-30, -808]))} Q${P(hair([-20, -930]))} ${P(hair([30, -1030]))} M${P(feat([60, -812]))} Q${P(hair([70, -920]))} ${P(hair([110, -990]))}`, lineOnly(4.5, c.hairShade));
  if (shade) inner += S.path(`M${P(hair([-100, -980]))} Q${P(hair([-40, -1036]))} ${P(hair([40, -1030]))}`, lineOnly(16, c.hairHi)) + S.path(`M${P(feat([-150, -830]))} L${P(feat([150, -830]))} L${P(feat([150, -780]))} L${P(feat([-150, -780]))} Z`, { fill: c.hairShade, opacity: 0.5 });
  return clipped(d, c.hair, inner);
}
// her high side ponytail (fountain + cascade) with a neon scrunchie
function teenPony(map, c, shade) {
  const pts = [[136, -940, 0], [190, -1030, 14], [270, -1036, 16], [318, -960, 14], [326, -850, 12], [306, -730, 12], [276, -680, 0], [268, -760, 10], [244, -860, 10], [196, -920, 8], [150, -900, 0]].map(([x, y, b]) => [...map([x, y]), b]);
  let o = S.path(fluffy(pts), outline(c.hair));
  o += S.path(`M${P(map([206, -1000]))} Q${P(map([290, -980]))} ${P(map([298, -820]))} M${P(map([180, -960]))} Q${P(map([250, -940]))} ${P(map([266, -790]))}`, lineOnly(4.5, c.hairShade));
  if (shade) o += S.path(`M${P(map([200, -1012]))} Q${P(map([268, -1020]))} ${P(map([300, -950]))}`, lineOnly(11, c.hairHi));
  const s = map([150, -938]);
  o += puffs([[s[0] - 14, s[1] + 18, 24], [s[0] + 10, s[1] - 6, 26], [s[0] + 26, s[1] + 22, 22]], c.accent);
  return o;
}

Object.assign(L.HAIR, {
  dadRecede: {
    browY: -800, nametagY: -1050,
    behind(hair, feat, c) { return sideTuft(hair, -1, c.hair, c.hairShade, TUFT) + sideTuft(hair, 1, c.hair, c.hairShade, TUFT); },
    front: (hair, feat) => poly([...RECEDE_OUT.map(hair), ...RECEDE_LINE.map(feat)], 12),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-40, -880]))} Q${P(hair([-30, -930]))} ${P(hair([30, -962]))} M${P(feat([34, -876]))} Q${P(hair([56, -920]))} ${P(hair([100, -940]))} M${P(feat([-80, -884]))} Q${P(hair([-80, -920]))} ${P(hair([-60, -950]))}`, lineOnly(4.5, c.hairShade));
      if (shade) o += S.path(`M${P(hair([-80, -930]))} Q${P(hair([-30, -962]))} ${P(hair([40, -962]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    over(hair, feat) {
      // the shine of the bald temples
      let o = '';
      for (const sx of [-1, 1]) { const p = hair([sx * 122, -866]); o += S.ellipse(p[0], p[1], 15, 7, { fill: '#FFFFFF', opacity: 0.75, transform: `rotate(${sx * -42} ${P(p)})` }); }
      return o;
    },
    side: () => poly([[-56, -884], [-54, -936], [10, -964], [90, -950], [150, -900], [168, -800], [164, -700], [124, -678], [70, -700], [46, -770], [20, -850], [-20, -872]], 14),
    sideOver: () => S.ellipse(-110, -866, 30, 10, { fill: '#FFFFFF', opacity: 0.7, transform: 'rotate(-14 -110 -866)' }),
    back: () => poly([[-160, -720], [-166, -860], [-120, -944], [0, -972], [120, -944], [166, -860], [160, -720], [100, -686], [0, -676], [-100, -686]], 24),
    backOver(c) { return S.ellipse(0, -934, 52, 22, outline(c.skin, 4.5)) + S.ellipse(-14, -940, 20, 6, { fill: '#FFFFFF', opacity: 0.8 }) + S.path('M-110 -840 q16 30 6 70 M110 -840 q-16 30 -6 70 M0 -890 q12 40 0 90', lineOnly(4, c.hairShade)); },
  },

  momBun: {
    browY: -800, nametagY: -1190,
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-162, -880], [162, -880], [166, -706], [140, -686], [-140, -686], [-166, -706]], 34), outline(c.hair));
      const b = hair([26, -1010]);
      return o + neatBun(b[0], b[1], 66, c, shade, c.pencil !== false);
    },
    front: (hair, feat) => poly([...SLEEK_OUT.map(hair), ...SIDEPART_LINE.map(feat)], 16),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-42, -880]))} Q${P(hair([-44, -940]))} ${P(hair([-30, -982]))}`, lineOnly(5));
      o += S.path(`M${P(feat([-16, -878]))} Q${P(hair([80, -900]))} ${P(hair([150, -780]))} M${P(feat([-70, -856]))} Q${P(hair([-130, -880]))} ${P(hair([-150, -760]))}`, lineOnly(4, c.hairShade));
      if (shade) o += S.path(`M${P(hair([10, -968]))} Q${P(hair([76, -960]))} ${P(hair([126, -920]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-174, -806], [-150, -930], [-40, -984], [90, -966], [160, -884], [164, -712], [120, -698], [64, -780], [-90, -832], [-140, -824]], 22),
    sideBehind: (c) => neatBun(84, -1006, 62, c, true, c.pencil !== false),
    back: () => poly([[-162, -712], [-166, -872], [-96, -970], [96, -970], [166, -872], [162, -712], [80, -698], [0, -706], [-80, -698]], 28),
    backOver(c) { return S.path('M-110 -720 Q-60 -880 -10 -960 M110 -720 Q60 -880 10 -960', lineOnly(4, c.hairShade)) + neatBun(0, -1012, 66, c, true, c.pencil !== false); },
  },

  teenBangs: {
    browY: -790, nametagY: -1180,
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-172, -890], [172, -890], [192, -660], [166, -596], [110, -624], [56, -594], [0, -614], [-56, -594], [-110, -624], [-166, -596], [-192, -660]], 26), outline(c.hair));
      o += S.path(`M${P(hair([-176, -760]))} Q${P(hair([-170, -660]))} ${P(hair([-150, -610]))} M${P(hair([176, -760]))} Q${P(hair([170, -660]))} ${P(hair([150, -610]))}`, lineOnly(4.5, c.hairShade));
      return o + teenPony(hair, c, shade);
    },
    front: (hair, feat) => poly([...[[-160, -716], [-168, -860], [-112, -962], [0, -990], [112, -962], [168, -860], [160, -716], [138, -724], [136, -800]].map(hair), ...[[110, -836], [0, -860], [-110, -836], [-136, -800], [-138, -724]].map(feat)], 18),
    details: () => '',
    over(hair, feat, c) { return teenFringe(hair, feat, c, true); },
    side: () => poly([[-150, -800], [-170, -900], [-120, -990], [-20, -1040], [90, -1010], [160, -930], [180, -760], [190, -640], [140, -600], [90, -640], [70, -760], [-20, -800], [-90, -790]], 20),
    sideBehind: (c) => teenPony(([x, y]) => [x - 60, y], c, true),
    sideOver(c) {
      const d = fluffy([[-196, -800, 0], [-210, -880, 12], [-176, -980, 14], [-90, -1040, 14], [10, -1030, 0], [-40, -940, 0], [-120, -860, 8], [-150, -790, 0]]);
      return clipped(d, c.hair, S.path('M-200 -830 Q-160 -940 -60 -1010', lineOnly(12, c.hairHi)));
    },
    back: () => poly([[-178, -700], [-176, -870], [-110, -972], [110, -972], [176, -870], [178, -700], [190, -620], [150, -590], [80, -606], [0, -590], [-80, -606], [-150, -590], [-190, -620]], 22),
    backOver(c) { return S.path('M-120 -660 Q-80 -860 -20 -960 M120 -660 Q80 -860 20 -960 M0 -600 L0 -960', lineOnly(4.5, c.hairShade)) + teenPony(ID, c, true); },
  },

  // DarkBlade's mom (avatar): a big rounded dark-plum beehive with a hair band
  hiveBun: {
    browY: -800, nametagY: -1240,
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-162, -880], [162, -880], [166, -716], [140, -696], [-140, -696], [-166, -716]], 34), outline(c.hair));
      const b = hair([0, -1040]);
      const d = `M${f(b[0] - 118)} ${f(b[1] + 150)} C${f(b[0] - 190)} ${f(b[1] + 10)} ${f(b[0] - 120)} ${f(b[1] - 150)} ${f(b[0])} ${f(b[1] - 150)} C${f(b[0] + 120)} ${f(b[1] - 150)} ${f(b[0] + 190)} ${f(b[1] + 10)} ${f(b[0] + 118)} ${f(b[1] + 150)} Z`;
      let inner = S.path(`M${f(b[0] - 100)} ${f(b[1] + 80)} Q${f(b[0] - 110)} ${f(b[1] - 90)} ${f(b[0] + 10)} ${f(b[1] - 110)} Q${f(b[0] + 100)} ${f(b[1] - 100)} ${f(b[0] + 90)} ${f(b[1] - 10)} Q${f(b[0] + 70)} ${f(b[1] + 60)} ${f(b[0] - 10)} ${f(b[1] + 40)} Q${f(b[0] - 60)} ${f(b[1] + 20)} ${f(b[0] - 40)} ${f(b[1] - 30)}`, lineOnly(5, c.hairShade));
      if (shade) inner += S.path(`M${f(b[0] - 90)} ${f(b[1] - 50)} Q${f(b[0] - 60)} ${f(b[1] - 120)} ${f(b[0] + 10)} ${f(b[1] - 130)}`, lineOnly(16, c.hairHi));
      o += clipped(d, c.hair, inner);
      o += band(`M${f(b[0] - 124)} ${f(b[1] + 132)} Q${f(b[0])} ${f(b[1] + 112)} ${f(b[0] + 124)} ${f(b[1] + 132)}`, 12, c.accent || '#FF6FB5');
      return o;
    },
    front: (hair, feat) => poly([...SLEEK_OUT.map(hair), ...SIDEPART_LINE.map(feat)], 16),
    details: (hair, feat, c, shade) => (shade ? S.path(`M${P(hair([10, -968]))} Q${P(hair([76, -960]))} ${P(hair([126, -920]))}`, lineOnly(12, c.hairHi)) : ''),
    side: () => poly([[-174, -806], [-150, -930], [-40, -984], [90, -966], [160, -884], [164, -712], [120, -698], [64, -780], [-90, -832], [-140, -824]], 22),
    sideBehind: (c) => clipped('M-90 -900 C-170 -1040 -90 -1190 20 -1190 C130 -1190 190 -1040 120 -900 Z', c.hair, S.path('M-60 -960 Q-40 -1140 60 -1120 Q140 -1080 90 -980', lineOnly(5, c.hairShade))) + band('M-96 -912 Q20 -930 126 -912', 12, c.accent || '#FF6FB5'),
    back: () => poly([[-162, -712], [-166, -872], [-96, -970], [96, -970], [166, -872], [162, -712], [80, -698], [0, -706], [-80, -698]], 28),
    backOver: (c) => clipped('M-118 -890 C-190 -1030 -120 -1190 0 -1190 C120 -1190 190 -1030 118 -890 Z', c.hair, S.path('M-80 -940 Q-90 -1120 10 -1150 Q100 -1130 90 -1000 Q60 -930 0 -960', lineOnly(5, c.hairShade))) + band('M-124 -908 Q0 -928 124 -908', 12, c.accent || '#FF6FB5'),
  },
});


// ====================================================================== FACE ACCESSORIES
// Dad's big walrus moustache (front: centre m on the upper lip)
function walrusFront(m, c, k = 1) {
  const X = (x) => m[0] + x * k, Y = (y) => m[1] + y;
  const half = [[0, -22, 0], [42, -36, 8], [92, -28, 8], [124, -2, 6], [134, 30, 0], [124, 50, 0], [110, 42, 6], [92, 22, 6], [66, 24, 6], [40, 12, 6], [16, 16, 0]];
  const R = half.map(([x, y, b]) => [X(x), Y(y), b]);
  const Lh = half.slice().reverse().map(([x, y]) => [X(-x), Y(y)]);
  // left half reversed: bulge belongs to the segment that starts at each point
  const Lb = half.slice().reverse().map((p, i, a) => a[i + 1] ? a[i + 1][2] : 0);
  const pts = [...R, ...Lh.map((p, i) => [p[0], p[1], Lb[i]])];
  const d = fluffy(pts);
  const col = c.stache || c.hair;
  let inner = S.path(`M${f(X(-110))} ${f(Y(30))} L${f(X(110))} ${f(Y(30))} L${f(X(140))} ${f(Y(70))} L${f(X(-140))} ${f(Y(70))} Z`, { fill: shadeHex(col, 0.8) });
  inner += S.path(`M${f(X(-96))} ${f(Y(-14))} q-6 22 6 40 M${f(X(-56))} ${f(Y(-22))} q-6 24 6 42 M${f(X(-18))} ${f(Y(-16))} q-4 20 4 34 M${f(X(18))} ${f(Y(-16))} q4 20 -4 34 M${f(X(56))} ${f(Y(-22))} q6 24 -6 42 M${f(X(96))} ${f(Y(-14))} q6 22 -6 40`, lineOnly(4, shadeHex(col, 0.72)));
  inner += S.path(`M${f(X(-92))} ${f(Y(-20))} Q${f(X(-56))} ${f(Y(-34))} ${f(X(-20))} ${f(Y(-20))}`, lineOnly(7, c.stacheHi || mixHex(col, '#FFFFFF', 0.35)));
  return clipped(d, col, inner, 6.5);
}
function walrusSide(c) {
  const col = c.stache || c.hair;
  const d = fluffy([[-112, -650, 0], [-150, -656, 8], [-190, -640, 8], [-206, -610, 0], [-198, -592, 0], [-184, -600, 6], [-160, -604, 6], [-130, -612, 0], [-110, -626, 0]]);
  return clipped(d, col, S.path('M-200 -620 L-110 -620 L-110 -580 L-200 -580 Z', { fill: shadeHex(col, 0.8) }) + S.path('M-186 -644 Q-160 -656 -130 -646', lineOnly(6, c.stacheHi || mixHex(col, '#FFFFFF', 0.35))), 6);
}
// little lash flicks for dot-eyed female avatars
function lashFlicks(feat, at, dir) {
  let d = '';
  for (const sx of [-1, 1]) { const e = feat([sx * 54, -712]); d += `M${f(e[0] + sx * 14)} ${f(e[1] - 20)} l${sx * 18} -12 M${f(e[0] + sx * 18)} ${f(e[1] - 6)} l${sx * 20} -4`; }
  return S.path(d, lineOnly(7));
}
// the monocle (GrannyGoodies): gold ring over the screen-right eye + a chain
function monocleFront(feat, c) {
  const e = feat([54, -712]);
  return S.circle(e[0], e[1], 46, { fill: '#DDF4FF', 'fill-opacity': 0.25, stroke: LINE, 'stroke-width': 15 }) + S.circle(e[0], e[1], 46, { fill: 'none', stroke: '#FFC93C', 'stroke-width': 8 }) +
    S.path(`M${f(e[0] - 28)} ${f(e[1] - 20)} Q${f(e[0] - 20)} ${f(e[1] - 34)} ${f(e[0] - 4)} ${f(e[1] - 38)}`, lineOnly(5, '#FFFFFF')) +
    S.path(`M${f(e[0] + 40)} ${f(e[1] + 24)} Q${f(e[0] + 70)} ${f(e[1] + 110)} ${f(e[0] + 30)} -548`, { fill: 'none', stroke: '#E0A21A', 'stroke-width': 5, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });
}
function monocleSide() {
  return S.circle(-150, -712, 40, { fill: '#DDF4FF', 'fill-opacity': 0.25, stroke: LINE, 'stroke-width': 13 }) + S.circle(-150, -712, 40, { fill: 'none', stroke: '#FFC93C', 'stroke-width': 7 }) +
    S.path('M-120 -690 Q-80 -610 -30 -548', { fill: 'none', stroke: '#E0A21A', 'stroke-width': 5, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' });
}
// lipstick on a smile-ish mouth: a soft colour tint behind the mouth line
function lipTint(m, col, k = 1) { return S.ellipse(m[0], m[1] + 6, 40 * k, 13, { fill: col, opacity: 0.45 }); }

// chain looks5's head-accessory hook (front view)
const headAcc5 = L2.headAcc;
L2.headAcc = function headAcc(style, stage, hair, feat, fx) {
  let o = headAcc5(style, stage, hair, feat, fx);
  const a = style.acc || {}, c = style.col;
  const at = Math.abs(fx) / 40, dir = fx >= 0 ? 1 : -1;
  if (stage === 'top') {
    if (a.lipTint) o += lipTint(feat([0, -598]), a.lipTint, 1 - 0.15 * at);
  } else if (stage === 'face') {
    if (a.walrus) o += walrusFront(feat([0, -634]), c, 1 - 0.15 * at);
    if (a.lashFlicks) o += lashFlicks(feat, at, dir);
    if (a.monocle) o += monocleFront(feat, c);
    if (a.avatarShine) { const p = hair([-96, -862]); o += S.path(`M${f(p[0] - 14)} ${f(p[1] + 18)} Q${f(p[0] - 10)} ${f(p[1] - 6)} ${f(p[0] + 18)} ${f(p[1] - 10)}`, lineOnly(9, '#FFFFFF')) + S.circle(p[0] + 34, p[1] - 12, 5, { fill: '#FFFFFF' }); }
    if (a.freckles6) { let d = ''; for (const sx of [-1, 1]) for (const [x, y] of [[70, -640], [92, -652], [100, -628]]) { const p = feat([sx * x, y]); d += `M${f(p[0] - 4)} ${f(p[1])} a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z `; } o += S.path(d, { fill: a.freckles6 }); }
  }
  return o;
};

// ====================================================================== OUTFITS (front, inside the torso clip)
const hem = (B, W, col, h = 26) => S.rect(-W - 14, B - h, 2 * W + 28, h + 4, 0, { fill: col }) + S.path(`M${-W - 14} ${B - h} L${W + 14} ${B - h}`, lineOnly(4));
function ribs(x0, x1, y0, y1, gap, col, w = 3) { let d = ''; for (let x = x0; x <= x1; x += gap) d += `M${f(x)} ${f(y0)} L${f(x)} ${f(y1)} `; return S.path(d, lineOnly(w, col)); }
// scattered small icons over a box (seeded)
function scatter(x0, x1, y0, y1, n, seed, fn) { let o = ''; for (let i = 0; i < n; i++) o += fn(x0 + hash(seed + i * 3.7) * (x1 - x0), y0 + hash(seed * 2 + i * 7.3) * (y1 - y0), i); return o; }
const moonD = (x, y, r = 10) => `M${f(x + r * 0.2)} ${f(y - r)} A${f(r)} ${f(r)} 0 1 0 ${f(x + r * 0.2)} ${f(y + r)} A${f(r * 0.72)} ${f(r * 0.72)} 0 1 1 ${f(x + r * 0.2)} ${f(y - r)} Z `;
const dotD = (x, y, r) => `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z `;
// a little 5-petal flower
function flower(x, y, r, col, mid = '#FFD23F', w = 3) {
  const cs = [];
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; cs.push([x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.48]); }
  return puffs(cs, col, w) + S.circle(x, y, r * 0.3, { fill: mid });
}
function flowerField(x0, x1, y0, y1, n, seed, c, r = 15) {
  let o = '';
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + hash(seed + i * 3.7) * (x1 - x0), y = y0 + hash(seed * 2 + i * 7.3) * (y1 - y0);
    leaves.push(`M${f(x + r * 0.5)} ${f(y + r * 0.3)} q${f(r * 0.9)} ${f(-r * 0.2)} ${f(r * 1.2)} ${f(r * 0.6)} q${f(-r * 0.7)} ${f(r * 0.3)} ${f(-r * 1.2)} ${f(-r * 0.6)} Z`);
    o += flower(x, y, r * (0.8 + 0.4 * hash(seed + i)), i % 3 === 0 ? c.flower2 : c.flower1, c.flowerMid || '#FFD23F');
  }
  return S.path(leaves.join(' '), { fill: c.leaf || '#5DBB6E', stroke: LINE, 'stroke-width': 2.5 }) + o;
}
function nigiri(x, y, s = 1) {
  let o = S.path(poly([[-46, -4], [46, -4], [44, 26], [-44, 26]], 14), outline('#FFFFFF', 5)) + S.path('M-30 6 l6 0 M-6 14 l6 0 M18 6 l6 0', lineOnly(4, '#D8DDE6'));
  o += S.path('M-52 -2 Q-40 -34 0 -32 Q40 -34 54 -4 Q20 6 -52 -2 Z', outline('#FF8A5C', 5)) + S.path('M-30 -24 l10 18 M-6 -30 l10 22 M20 -28 l8 20', lineOnly(5, '#FFD6C2'));
  o += S.rect(-12, -30, 24, 58, 3, outline('#1E3A2A', 4));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
const maki = (x, y, r) => S.circle(x, y, r, outline('#1E3A2A', 3.5)) + S.circle(x, y, r * 0.7, { fill: '#FFFFFF' }) + S.circle(x, y, r * 0.32, { fill: '#FF8A5C' });
// a round cookie with chocolate chips (the Granny's Goodies logo)
function cookieIcon(x, y, r, w = 4) {
  let o = S.circle(x, y, r, outline('#E2A55A', w)) + S.circle(x - r * 0.1, y - r * 0.12, r * 0.7, { fill: '#EDB86C' });
  for (const [dx, dy, rr] of [[-0.4, -0.3, 0.16], [0.3, -0.42, 0.13], [0.36, 0.2, 0.17], [-0.2, 0.36, 0.14], [0.02, -0.02, 0.12]]) o += S.circle(x + dx * r, y + dy * r, rr * r, { fill: '#6A3A1E' });
  return o;
}
// the name badge / rosette (EMPLOYEE OF THE MONTH)
function rosette(x, y, s = 1, text = null) {
  let o = S.path('M-16 10 L-30 70 L-14 60 L-4 76 L4 14 Z M16 10 L30 70 L14 60 L4 76 L-4 14 Z', outline('#3B6CE0', 4));
  o += puffs([[0, 0, 30], ...Array.from({ length: 10 }, (_, i) => [Math.cos(i * 0.628) * 26, Math.sin(i * 0.628) * 26, 12])], '#FFC93C', 4) + S.circle(0, 0, 20, outline('#FFE58A', 3.5)) + S.path(F.starPath(0, 0, 14), { fill: '#E09A00' });
  if (text) {
    const words = String(text).split(' ');
    const lines = words.length > 2 ? [words.slice(0, 1).join(' '), words.slice(1).join(' ')] : [String(text)];
    o += S.rect(36, -30, 122, 60, 8, outline('#FFFFFF', 4)) + S.rect(36, -30, 122, 14, 6, { fill: '#FFC93C' });
    lines.forEach((l, i) => { o += TF(l, 97, 2 + i * 18, l.length > 10 ? 12 : 15, '#2A1640'); });
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
// a bib apron inside the torso clip (front) — logo: 'cookie' | text
function apronBib(cx, k, T, B, ap, back) {
  if (back) return band(`M-80 ${T - 10} L72 -350 M80 ${T - 10} L-72 -350`, 9, ap.col) + band(`M-140 -340 L140 -340`, 10, ap.col);
  let o = '';
  for (const sx of [-1, 1]) o += band(`M${f(cx + sx * 50 * k)} ${T - 12} L${f(cx + sx * 62 * k)} -490`, 9, ap.col);
  o += S.path(poly([[cx - 66 * k, -492], [cx + 66 * k, -492], [cx + 76 * k, B + 24], [cx - 76 * k, B + 24]], 10), outline(ap.col, 5.5));
  o += S.path(poly([[cx - 56 * k, -482], [cx + 56 * k, -482], [cx + 66 * k, B + 24], [cx - 66 * k, B + 24]], 8), stitch(ap.trim || '#FF8FB0'));
  if (ap.logo === 'cookie' || !ap.text) o += cookieIcon(cx, -418, 30 * k + 4) + txt('GG', cx, -362, 26, ap.trim || '#E8456A', { stroke: LINE, 'stroke-width': 4, 'paint-order': 'stroke' });
  else o += txt(ap.text, cx, -400, 40, ap.trim || '#E8456A', { stroke: LINE, 'stroke-width': 5, 'paint-order': 'stroke' }) + S.path(F.heartPath(cx, -362, 13), outline(ap.trim || '#E8456A', 3));
  return o;
}

function outfit6(style, t, shade, back, T, B, W) {
  const c = style.col;
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  const Wb = W - (style.taper || 0);
  let o = '';
  switch (style.top) {
    case 'vestDad': {
      if (!back) {
        o += S.path(poly([[-Wb - 16, T - 12], [cx - 50 * k, T - 12], [cx, -416], [cx + 50 * k, T - 12], [Wb + 16, T - 12], [Wb + 16, B + 12], [-Wb - 16, B + 12]], 4), outline(c.vest, 5));
        // argyle row across the belly
        let dia = '', dia2 = '', cross = '';
        for (let i = -3; i <= 3; i++) {
          const x = cx + i * 58 * k, y = -372;
          const dd = `M${f(x)} ${y - 40} L${f(x + 29 * k)} ${y} L${f(x)} ${y + 40} L${f(x - 29 * k)} ${y} Z `;
          if (i % 2) dia += dd; else dia2 += dd;
          cross += `M${f(x - 29 * k)} ${y - 40} L${f(x + 29 * k)} ${y + 40} M${f(x + 29 * k)} ${y - 40} L${f(x - 29 * k)} ${y + 40} `;
        }
        o += S.path(dia, { fill: c.argyle1, stroke: LINE, 'stroke-width': 3 }) + S.path(dia2, { fill: c.vestShade, stroke: LINE, 'stroke-width': 3 }) + S.path(cross, { fill: 'none', stroke: c.argyle2, 'stroke-width': 3, 'stroke-dasharray': '6 6' });
        o += band(`M${f(cx - 50 * k)} ${T - 10} L${f(cx)} -416 L${f(cx + 50 * k)} ${T - 10}`, 9, c.vestTrim);
        o += S.circle(cx, -470, 5, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 2.5 }) + S.circle(cx, -440, 5, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 2.5 });
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 6} L${f(cx + sx * 50 * k)} ${T - 10} L${f(cx + sx * 40 * k)} ${T + 40} Z`, outline(c.collar, 4.5));
        // two pens in the shirt pocket peeking over the vest (accountant)
        o += S.rect(cx - 74 * k, -506, 8, 30, 3, outline('#2E6BE0', 3)) + S.rect(cx - 62 * k, -500, 8, 26, 3, outline('#E8453C', 3));
        if (shade) o += S.path(`M${-Wb - 10} ${B - 60} Q${f(cx)} ${B - 20} ${Wb + 10} ${B - 60}`, lineOnly(5, c.vestShade));
      } else o += S.path(poly([[-Wb - 16, T + 10], [Wb + 16, T + 10], [Wb + 16, B + 12], [-Wb - 16, B + 12]], 4), outline(c.vest, 5)) + band(`M-56 ${T - 4} Q0 ${T + 22} 56 ${T - 4}`, 9, c.collar);
      o += hem(B, Wb, c.vestTrim) + ribs(-Wb, Wb, B - 24, B, 14, c.vestShade);
      break;
    }
    case 'cardiganMom': {
      if (!back) {
        o += S.rect(cx - 44 * k, T - 10, 88 * k, B - T + 20, 0, { fill: c.shirt });
        o += S.path(`M${f(cx)} ${T + 30} L${f(cx)} ${B}`, lineOnly(3.5, c.shirtShade));
        for (const y of [-470, -430, -390, -350]) o += S.circle(cx, y, 4.5, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 2 });
        // peter-pan collar
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 2)} ${T + 4} Q${f(cx + sx * 6)} ${T + 42} ${f(cx + sx * 40 * k)} ${T + 34} Q${f(cx + sx * 56 * k)} ${T + 20} ${f(cx + sx * 44 * k)} ${T - 8} Z`, outline(c.collar, 4.5));
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 44 * k, T - 12], [cx + sx * 76 * k, T - 12], [cx + sx * 56 * k, B + 12], [cx + sx * 42 * k, B + 12]], 4), outline(c.topShade, 5));
        for (const y of [-460, -410, -360]) o += S.circle(cx - 49 * k, y, 7, outline(c.button, 3.5)) + S.path(`M${f(cx - 52 * k)} ${y - 2} l6 4`, lineOnly(2.5, LINE));
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 62 * k, -392], [cx + sx * 98 * k, -392], [cx + sx * 98 * k, -336], [cx + sx * 62 * k, -336]], 6), outline(c.topShade, 4.5));
        // a little book brooch + a bookmark ribbon peeking out of the pocket
        o += S.g(S.path('M-16 -8 Q-8 -14 0 -8 Q8 -14 16 -8 L16 10 Q8 4 0 10 Q-8 4 -16 10 Z', outline('#FFFFFF', 3)) + S.path('M0 -8 L0 10', lineOnly(2.5)), `translate(${f(cx + 74 * k)} -470) rotate(-8)`);
        o += S.path(`M${f(cx - 84 * k)} -392 l-4 -26 l8 6 l8 -6 l-4 26 Z`, outline('#E8456A', 3));
        o += ribs(-W, W, T + 50, B - 26, 22, c.topShade, 2.5);
      } else o += ribs(-W, W, T + 10, B - 26, 22, c.topShade, 2.5);
      o += hem(B, Wb, c.topShade) + ribs(-Wb, Wb, B - 24, B, 12, shadeHex(c.topShade, 0.9));
      break;
    }
    case 'pjTop': {
      o += S.path(scatter(-W - 10, W + 10, T, B, 16, 4, (x, y, i) => (i % 3 === 2 ? dotD(x, y, 5) : moonD(x, y, 11))), { fill: c.pattern, opacity: 0.9 });
      if (!back) {
        o += S.path(`M${f(cx)} ${T + 50} L${f(cx)} ${B}`, lineOnly(4, c.piping));
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 50} L${f(cx + sx * 56 * k)} ${T - 10} L${f(cx + sx * 76 * k)} ${T - 10} L${f(cx + sx * 64 * k)} ${T + 30} L${f(cx + sx * 34 * k)} ${T + 30} Z`, { ...outline(c.topShade, 4), stroke: LINE });
        o += S.path(`M${f(cx - 4)} ${T + 50} L${f(cx - 56 * k)} ${T - 10} M${f(cx + 4)} ${T + 50} L${f(cx + 56 * k)} ${T - 10}`, lineOnly(4, c.piping));
        o += S.path(`M${f(cx - 30 * k)} ${T - 8} L${f(cx)} ${T + 48} L${f(cx + 30 * k)} ${T - 8} Z`, { fill: c.skin });
        for (const y of [-440, -390, -340]) o += S.circle(cx - 8, y, 6, outline('#FFFFFF', 2.5));
        o += S.path(poly([[cx + 30 * k, -470], [cx + 80 * k, -470], [cx + 80 * k, -424], [cx + 30 * k, -424]], 5), { fill: 'none', stroke: c.piping, 'stroke-width': 4 });
      } else o += band(`M-56 ${T - 4} Q0 ${T + 22} 56 ${T - 4}`, 8, c.topShade);
      o += hem(B, Wb, c.topShade, 18);
      break;
    }
    case 'grannyDress': {
      if (!back) {
        o += S.rect(cx - 46 * k, T - 10, 92 * k, B - T + 20, 0, { fill: c.dress });
        o += S.g(flowerField(-46, 46, T + 50, B, 5, 3, c, 13), `translate(${f(cx)} 0) scale(${f(k)} 1)`);
        let lace = '';
        for (let i = -3; i <= 3; i++) if (i) lace += `M${f(cx + i * 15 * k - 9)} ${T + 2} a9 9 0 1 0 18 0 `;
        o += S.path(lace, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 3.5 });
        o += S.circle(cx, T + 32, 10, outline('#B98AE0', 4)) + S.circle(cx - 3, T + 29, 3.5, { fill: '#FFFFFF' });
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 46 * k, T - 12], [cx + sx * 72 * k, T - 12], [cx + sx * 52 * k, B + 12], [cx + sx * 42 * k, B + 12]], 4), outline(c.topShade, 5));
        for (const y of [-470, -420, -370]) o += S.circle(cx - 50 * k, y, 7, outline(c.button || '#FFFFFF', 3.5));
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 64 * k, -386], [cx + sx * 98 * k, -386], [cx + sx * 98 * k, -330], [cx + sx * 64 * k, -330]], 6), outline(c.topShade, 4.5));
        o += S.path(`M${f(cx + 72 * k)} -386 q6 -26 18 -18 q4 -20 14 -6 l-2 24 Z`, outline('#FFFFFF', 3.5));
        o += ribs(-W, W, T + 50, B - 26, 20, c.topShade, 2.5);
      } else o += ribs(-W, W, T + 10, B - 26, 20, c.topShade, 2.5);
      o += hem(B, Wb, c.topShade);
      break;
    }
    case 'jacket90s': {
      const yb = -410;
      o += S.rect(-W - 14, yb, 2 * W + 28, B - yb + 20, 0, { fill: c.block2 });
      o += S.path(`M${-W - 14} ${yb + 6} L${W + 14} ${yb - 40} L${W + 14} ${yb - 6} L${-W - 14} ${yb + 40} Z`, outline(c.block3, 4.5));
      o += S.path(`M${-W - 14} ${yb + 52} L${W + 14} ${yb + 6}`, lineOnly(10, c.zip));
      if (!back) {
        o += S.path(`M${f(cx - 40 * k)} ${T - 8} L${f(cx)} ${T + 56} L${f(cx + 40 * k)} ${T - 8} Z`, { fill: c.shirt }) + S.path(`M${f(cx - 26 * k)} ${T - 8} Q${f(cx)} ${T + 14} ${f(cx + 26 * k)} ${T - 8}`, lineOnly(4, c.shirtShade || '#C9D0DA'));
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 6)} ${T + 56} L${f(cx + sx * 42 * k)} ${T - 12} L${f(cx + sx * 74 * k)} ${T - 12} L${f(cx + sx * 26 * k)} ${T + 70} Z`, outline(c.topShade, 4.5));
        o += S.path(`M${f(cx)} ${T + 60} L${f(cx)} ${B}`, lineOnly(10, LINE)) + S.path(`M${f(cx)} ${T + 60} L${f(cx)} ${B}`, { ...lineOnly(4, c.zip), 'stroke-dasharray': '4 4' });
        o += S.rect(cx - 7, T + 62, 14, 30, 4, outline(c.zip, 3.5));
        // smiley pin + a cassette patch
        o += S.circle(cx - 66 * k, -480, 15, outline('#FFE14D', 3.5)) + S.path(`M${f(cx - 73 * k)} -474 Q${f(cx - 66 * k)} -466 ${f(cx - 59 * k)} -474`, lineOnly(3)) + S.circle(cx - 71 * k, -484, 2.5, { fill: LINE }) + S.circle(cx - 61 * k, -484, 2.5, { fill: LINE });
        o += S.g(S.rect(-24, -15, 48, 30, 5, outline('#2A2A33', 3)) + S.rect(-16, -9, 32, 11, 3, { fill: '#FF4FA0' }) + S.circle(-9, -3, 3, { fill: '#FFFFFF' }) + S.circle(9, -3, 3, { fill: '#FFFFFF' }), `translate(${f(cx + 64 * k)} -350) rotate(-8)`);
      } else o += txt('98', 0, -440, 74, c.zip, { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
      o += hem(B, Wb, c.topShade, 22);
      break;
    }
    case 'plainAvatar':
    case 'tee6': {
      if (!back) o += S.path(`M${f(cx - 34 * k)} ${T - 6} Q${f(cx)} ${T + 26} ${f(cx + 34 * k)} ${T - 6} Z`, { fill: c.skin }) + S.path(`M${f(cx - 34 * k)} ${T - 6} Q${f(cx)} ${T + 26} ${f(cx + 34 * k)} ${T - 6}`, lineOnly(5, c.topShade));
      if (style.logo === 'star') o += S.path(F.starPath(cx, -420, 36, 16), outline(c.logo || '#FFFFFF', 4.5));
      break;
    }
    case 'goldArmor': {
      o += S.rect(-W - 14, T - 10, 2 * W + 28, B - T + 20, 0, { fill: c.under });
      if (!back) {
        o += S.path(poly([[-W - 6, T - 12], [cx - 30 * k, T - 12], [cx, T + 8], [cx + 30 * k, T - 12], [W + 6, T - 12], [W - 4, -400], [cx + 40 * k, -374], [cx - 40 * k, -374], [-W + 4, -400]], 10), outline(c.top, 5));
        o += S.path(`M${f(cx)} ${T + 10} L${f(cx)} -378`, lineOnly(5, c.goldShade));
        o += S.path(`M${f(-W + 6)} ${T + 20} Q${f(cx - 60 * k)} ${T + 30} ${f(cx - 44 * k)} -440`, lineOnly(9, c.goldHi));
        o += S.path(F.heartPath(cx, -446, 26), outline(c.gem, 5)) + S.path(`M${f(cx - 14)} -462 q6 -8 14 -6`, lineOnly(4, '#FFFFFF'));
        let plates = '';
        for (const y of [-366, -340]) plates += `M${-W - 10} ${y} Q${f(cx)} ${y + 14} ${W + 10} ${y} L${W + 10} ${y + 24} Q${f(cx)} ${y + 38} ${-W - 10} ${y + 24} Z `;
        o += S.path(plates, outline(c.top, 4));
        o += S.rect(-W - 10, -322, 2 * W + 20, 18, 0, outline(c.belt || '#8A4A22', 4)) + S.rect(cx - 18, -326, 36, 26, 5, outline(c.goldHi, 4));
      } else {
        o += S.path(poly([[-W - 6, T - 12], [W + 6, T - 12], [W - 4, -380], [-W + 4, -380]], 10), outline(c.top, 5)) + S.path(`M0 ${T} L0 -386`, lineOnly(5, c.goldShade));
        o += S.rect(-W - 10, -322, 2 * W + 20, 18, 0, outline(c.belt || '#8A4A22', 4));
      }
      break;
    }
    case 'furCoat': {
      if (!back) {
        o += S.rect(cx - 40 * k, T - 10, 80 * k, B - T + 20, 0, { fill: c.dress });
        o += S.path(`M${f(cx - 40 * k)} ${T + 4} Q${f(cx)} ${T + 34} ${f(cx + 40 * k)} ${T + 4}`, lineOnly(4, shadeHex(c.dress, 0.75)));
        // big pearls
        let pd = '';
        for (let i = 0; i <= 8; i++) { const u = i / 8, x = cx + (-38 + 76 * u) * k, y = T + 18 + Math.sin(u * Math.PI) * 72; pd += dotD(x, y, 9); }
        o += S.path(pd, { fill: '#FFF8EE', stroke: LINE, 'stroke-width': 3 }) + S.path(Array.from({ length: 9 }, (_, i) => { const u = i / 8; return dotD(cx + (-38 + 76 * u) * k - 3, T + 15 + Math.sin(u * Math.PI) * 72, 2.8); }).join(''), { fill: '#FFFFFF' });
        for (const sx of [-1, 1]) {
          const ed = fluffy([[cx + sx * 40 * k, T - 14, 0], [cx + sx * 80 * k, T - 14, 0], [cx + sx * 70 * k, B + 14, 0], [cx + sx * 40 * k, B + 14, sx * 8], [cx + sx * 46 * k, -380, sx * 8], [cx + sx * 40 * k, -450, sx * 8]].map(([x, y, b]) => [x, y, sx < 0 ? -b : b]));
          o += S.path(sx < 0 ? ed : ed, outline(c.furShade, 4.5));
        }
        o += S.path(F.starPath(cx + 62 * k, -470, 16), outline('#FFC93C', 3)) + S.circle(cx + 62 * k, -470, 6, { fill: '#3BB8E8' });
      }
      o += S.path(scatter(-W, W, T + 20, B, 22, 9, (x, y) => `M${f(x - 8)} ${f(y)} q8 -10 16 0 `), lineOnly(3.5, c.furShade));
      break;
    }
    case 'sushiHoodie': {
      if (!back) {
        o += nigiri(cx, -440, 0.95 * k);
        o += scatter(-W, W, -500, -320, 6, 5, (x, y) => (Math.abs(x - cx) > 60 || y > -390 ? maki(x, y, 11) : ''));
        o += S.path(poly([[cx - 62 * k, -372], [cx + 62 * k, -372], [cx + 74 * k, B - 24], [cx - 74 * k, B - 24]], 12), outline(c.topShade, 5));
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 22 * k)} ${T + 8} L${f(cx + sx * 26 * k)} -470`, lineOnly(8, LINE)) + S.path(`M${f(cx + sx * 22 * k)} ${T + 8} L${f(cx + sx * 26 * k)} -470`, lineOnly(4, '#FFFFFF')) + S.circle(cx + sx * 26 * k, -468, 6, outline('#FFFFFF', 3));
      } else {
        o += S.path(`M-74 ${T - 10} Q-86 -410 0 -390 Q86 -410 74 ${T - 10} Z`, outline(c.topShade, 5)) + S.path('M-50 -500 Q0 -420 50 -500', lineOnly(4, shadeHex(c.topShade, 0.8)));
        o += nigiri(0, -352, 0.6);
      }
      o += hem(B, Wb, c.topShade, 22) + ribs(-Wb, Wb, B - 20, B, 12, shadeHex(c.topShade, 0.8));
      break;
    }
    case 'darkArmor': {
      if (!back) {
        o += S.path(poly([[-W - 6, T - 12], [W + 6, T - 12], [W - 6, -392], [cx + 26 * k, -360], [cx - 26 * k, -360], [-W + 6, -392]], 6), outline(c.top, 5));
        o += S.path(`M${f(-W + 10)} ${T + 6} L${f(cx)} -410 L${f(W - 10)} ${T + 6}`, lineOnly(16, LINE)) + S.path(`M${f(-W + 10)} ${T + 6} L${f(cx)} -410 L${f(W - 10)} ${T + 6}`, lineOnly(8, c.trim));
        o += S.path(`M${f(cx - 22)} -470 L${f(cx + 22)} -426 M${f(cx + 22)} -470 L${f(cx - 22)} -426`, lineOnly(15, LINE)) + S.path(`M${f(cx - 22)} -470 L${f(cx + 22)} -426 M${f(cx + 22)} -470 L${f(cx - 22)} -426`, lineOnly(7, c.glow || c.trim));
        o += S.path(`M${f(-W + 4)} ${T + 30} L${f(cx - 50 * k)} -430`, lineOnly(7, c.armorHi));
        for (const sx of [-1, 1]) o += S.circle(cx + sx * 76 * k, -500, 6, outline(c.armorHi, 3)) + S.circle(cx + sx * 70 * k, -404, 6, outline(c.armorHi, 3));
        o += S.path(poly([[cx - 24 * k, -364], [cx + 24 * k, -364], [cx + 18 * k, -336], [cx - 18 * k, -336]], 4), outline(c.armorHi, 4));
      } else {
        o += S.path(`M${-W + 10} ${T + 10} L0 -420 L${W - 10} ${T + 10}`, lineOnly(14, LINE)) + S.path(`M${-W + 10} ${T + 10} L0 -420 L${W - 10} ${T + 10}`, lineOnly(7, c.trim));
      }
      o += S.rect(-W - 10, -328, 2 * W + 20, 22, 0, outline(c.belt || '#1A1A20', 4)) + S.path(`M${f(cx - 16)} -336 L${f(cx)} -350 L${f(cx + 16)} -336 L${f(cx + 16)} -300 L${f(cx - 16)} -300 Z`, outline(c.trim, 4));
      break;
    }
    default: return null;
  }
  return o;
}
const TOPS6 = ['vestDad', 'cardiganMom', 'pjTop', 'grannyDress', 'jacket90s', 'plainAvatar', 'tee6', 'goldArmor', 'furCoat', 'sushiHoodie', 'darkArmor'];

// side-view torso details (inside the side torso clip); facing screen-left, front edge x0, back edge x1
function outfitSide6(style, x0, x1) {
  const c = style.col;
  let o = '';
  switch (style.top) {
    case 'vestDad':
      o += S.path(poly([[x0 - 10, -500], [x1 + 10, -520], [x1 + 10, -290], [x0 - 10, -290]], 4), outline(c.vest, 5)) + S.path(`M${x0 - 10} -548 L${x0 + 34} -548 L${x0 + 6} -506 Z`, outline(c.collar, 4.5));
      { let dd = ''; for (let i = 0; i < 3; i++) { const x = x0 + 30 + i * 50, y = -372; dd += `M${x} ${y - 36} L${x + 24} ${y} L${x} ${y + 36} L${x - 24} ${y} Z `; } o += S.path(dd, { fill: c.argyle1, stroke: LINE, 'stroke-width': 3 }); }
      o += hem(-306, 140, c.vestTrim);
      break;
    case 'cardiganMom':
    case 'grannyDress':
      o += S.path(`M${x0 - 10} -545 L${x0 + 24} -545 L${x0 + 4} -300 L${x0 - 10} -300 Z`, { fill: style.top === 'grannyDress' ? c.dress : c.shirt }) + S.path(`M${x0 + 24} -545 L${x0 + 4} -300`, lineOnly(5)) + S.circle(x0 + 8, -470, 7, outline(c.button || '#FFFFFF', 3)) + S.circle(x0 + 6, -410, 7, outline(c.button || '#FFFFFF', 3));
      o += S.path(poly([[x0 + 24, -392], [x0 + 70, -392], [x0 + 70, -336], [x0 + 24, -336]], 6), outline(c.topShade, 4.5)) + hem(-306, 140, c.topShade);
      break;
    case 'pjTop':
      o += S.path(scatter(x0 - 10, x1 + 10, -540, -300, 8, 6, (x, y, i) => (i % 3 === 2 ? dotD(x, y, 5) : moonD(x, y, 11))), { fill: c.pattern, opacity: 0.9 }) + S.path(`M${x0 - 10} -548 L${x0 + 34} -548 L${x0 + 2} -490 Z`, outline(c.topShade, 4)) + hem(-306, 140, c.topShade, 18);
      break;
    case 'jacket90s':
      o += S.rect(x0 - 20, -410, x1 - x0 + 40, 120, 0, { fill: c.block2 }) + S.path(`M${x0 - 20} -400 L${x1 + 20} -446 L${x1 + 20} -414 L${x0 - 20} -368 Z`, outline(c.block3, 4.5)) + S.path(`M${x0 - 10} -548 L${x0 + 34} -548 L${x0 - 4} -480 Z`, outline(c.topShade, 4.5)) + hem(-306, 140, c.topShade, 22);
      break;
    case 'goldArmor':
      o += S.rect(x0 - 20, -545, x1 - x0 + 40, 260, 0, { fill: c.under }) + S.path(poly([[x0 - 10, -545], [x1 + 10, -545], [x1 + 4, -380], [x0 - 4, -370]], 10), outline(c.top, 5)) + S.path(`M${x0 + 4} -520 Q${x0 - 6} -460 ${x0 + 10} -420`, lineOnly(9, c.goldHi)) + S.rect(x0 - 20, -322, x1 - x0 + 40, 18, 0, outline(c.belt || '#8A4A22', 4));
      break;
    case 'furCoat':
      o += S.path(scatter(x0, x1, -520, -300, 10, 7, (x, y) => `M${f(x - 8)} ${f(y)} q8 -10 16 0 `), lineOnly(3.5, c.furShade)) + S.path(`M${x0 - 10} -545 L${x0 + 16} -545 L${x0 + 4} -300 L${x0 - 10} -300 Z`, { fill: c.dress });
      break;
    case 'sushiHoodie':
      o += maki(x0 + 40, -470, 12) + maki(x0 + 70, -400, 10) + S.path(poly([[x0 - 10, -372], [x0 + 60, -372], [x0 + 60, -330], [x0 - 10, -330]], 10), outline(c.topShade, 5)) + hem(-306, 140, c.topShade, 22);
      o += S.path(`M${x1 - 70} -548 Q${x1 + 10} -540 ${x1 + 10} -460 Q${x1 - 30} -470 ${x1 - 60} -500 Z`, outline(c.topShade, 5));
      break;
    case 'darkArmor':
      o += S.path(`M${x0 - 10} -520 L${x1} -420`, lineOnly(16, LINE)) + S.path(`M${x0 - 10} -520 L${x1} -420`, lineOnly(8, c.trim)) + S.rect(x0 - 20, -328, x1 - x0 + 40, 22, 0, outline(c.belt || '#1A1A20', 4));
      break;
    case 'plainAvatar':
    case 'tee6':
      if (style.logo === 'star') o += S.path(F.starPath(x0 + 20, -420, 26, 12), outline(c.logo || '#FFFFFF', 4));
      break;
    default: break;
  }
  return o;
}

// ====================================================================== LOWER GARMENTS (outside the torso: over the legs)
// style.ext6 = { kind: 'skirt'|'flowers'|'coat'|'tassets'|'jagged', top, len, flare, col, shade }
function ext6Front(style, t, shade, back) {
  const e = style.ext6, c = style.col;
  if (!e) return '';
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  const W = (style.torsoW || 100) - (style.taper || 0);
  const y0 = e.top ?? -330, y1 = y0 + e.len, wTop = W + 4, wBot = W + (e.flare || 0);
  if (e.kind === 'tassets' || e.kind === 'jagged') {
    // armour skirt plates (gold) / jagged dark plates
    let o = '';
    const n = 4;
    for (let i = 0; i < n; i++) {
      const u0 = -1 + (2 * i) / n, u1 = -1 + (2 * (i + 1)) / n;
      const xa = u0 * wTop, xb = u1 * wTop, xc = u1 * wBot, xd = u0 * wBot;
      const d = e.kind === 'jagged'
        ? `M${f(xa)} ${y0} L${f(xb)} ${y0} L${f(xc)} ${f(y1 - 20)} L${f((xc + xd) / 2)} ${f(y1 + (i % 2 ? 10 : 24))} L${f(xd)} ${f(y1 - 20)} Z`
        : poly([[xa, y0], [xb, y0], [xc, y1], [xd, y1]], 10);
      o += S.path(d, outline(e.col, 5)) + (e.kind === 'tassets' ? S.path(`M${f(xd + 12)} ${f(y1 - 16)} L${f(xc - 12)} ${f(y1 - 16)}`, lineOnly(5, e.shade)) : S.path(`M${f((xa + xb) / 2)} ${y0 + 10} L${f((xc + xd) / 2)} ${f(y1 - 6)}`, lineOnly(4, e.shade)));
    }
    return o;
  }
  if (e.kind === 'coat') {
    // long fur coat to the knees, open at the front (dress shows between the panels)
    let o = clipped(poly([[cx - 40 * k, y0], [cx + 40 * k, y0], [cx + 56 * k, y1 - 30], [cx - 56 * k, y1 - 30]], 6), c.dress, S.path(`M${f(cx - 60)} ${f(y1 - 60)} L${f(cx + 60)} ${f(y1 - 60)}`, lineOnly(5, shadeHex(c.dress, 0.75))), 5);
    for (const sx of [-1, 1]) {
      const pts = sx > 0
        ? [[cx + 36 * k, y0, 0], [wTop, y0, 0], [wBot, y1 - 10, 0], [wBot - 30, y1 + 6, 10], [(wBot + cx) / 2, y1 + 4, 10], [cx + 52 * k, y1, 0], [cx + 44 * k, (y0 + y1) / 2, 0]]
        : [[-wTop, y0, 0], [cx - 36 * k, y0, 0], [cx - 44 * k, (y0 + y1) / 2, 0], [cx - 52 * k, y1, 10], [(-wBot + cx) / 2, y1 + 4, 10], [-wBot + 30, y1 + 6, 0], [-wBot, y1 - 10, 0]];
      let inner = S.path(scatter(sx > 0 ? cx + 40 : -wBot, sx > 0 ? wBot : cx - 40, y0 + 20, y1 - 10, 7, 11 + sx, (x, y) => `M${f(x - 8)} ${f(y)} q8 -10 16 0 `), lineOnly(3.5, c.furShade));
      if (shade) inner += S.rect(-wBot - 20, y1 - 30, 2 * wBot + 40, 50, 0, { fill: '#000', opacity: 0.08 });
      o += clipped(fluffy(pts), c.top, inner, 6);
    }
    return o;
  }
  // skirt / flowered skirt
  const d = poly([[-wTop, y0], [wTop, y0], [wBot, y1], [-wBot, y1]], 14);
  let inner = '';
  if (e.kind === 'flowers') inner += flowerField(-wBot, wBot, y0 + 16, y1 - 10, 9, 5, { flower1: c.flower1, flower2: c.flower2, leaf: c.leaf, flowerMid: c.flowerMid }, 15);
  for (const x of [-0.55, 0, 0.55]) inner += S.path(`M${f(cx + x * wTop * 0.8)} ${y0 + 10} L${f(cx + x * wBot * 0.92)} ${y1}`, lineOnly(4, e.shade));
  if (shade) inner += S.rect(-wBot - 10, y1 - 24, 2 * wBot + 20, 30, 0, { fill: '#000', opacity: 0.1 });
  if (e.trim) inner += S.rect(-wBot - 10, y1 - 18, 2 * wBot + 20, 14, 0, { fill: e.trim }) + S.path(`M${-wBot - 10} ${y1 - 18} L${wBot + 10} ${y1 - 18}`, lineOnly(3.5));
  return clipped(d, e.col, inner);
}
function ext6Side(style, x0, x1) {
  const e = style.ext6, c = style.col;
  if (!e) return '';
  const y0 = e.top ?? -330, y1 = y0 + e.len, fl = e.flare || 0;
  if (e.kind === 'tassets' || e.kind === 'jagged') return S.path(poly([[x0 - 8, y0], [x1 + 8, y0], [x1 + fl * 0.6, y1], [x0 - fl * 0.5, y1]], 10), outline(e.col, 5)) + S.path(`M${x0} ${y1 - 16} L${x1} ${y1 - 16}`, lineOnly(5, e.shade));
  if (e.kind === 'coat') return clipped(fluffy([[x0 - 10, y0, 0], [x1 + 10, y0, 0], [x1 + fl * 0.7, y1, 10], [x0 - fl * 0.6, y1, 0]]), c.top, S.path(scatter(x0, x1 + fl, y0 + 20, y1 - 10, 6, 13, (x, y) => `M${f(x - 8)} ${f(y)} q8 -10 16 0 `), lineOnly(3.5, c.furShade)), 6);
  const d = poly([[x0 - 8, y0], [x1 + 8, y0], [x1 + fl * 0.7, y1], [x0 - fl * 0.6, y1]], 14);
  let inner = S.path(`M0 ${y0 + 10} L10 ${y1}`, lineOnly(4, e.shade));
  if (e.kind === 'flowers') inner += flowerField(x0 - fl, x1 + fl, y0 + 16, y1 - 10, 4, 7, { flower1: c.flower1, flower2: c.flower2, leaf: c.leaf }, 15);
  return clipped(d, e.col, inner);
}
// apron skirt under the bib (STATE.apron / style.apronAlways)
function apronLower(t, ap, back) {
  if (back) return S.path('M0 -340 Q-40 -378 -46 -350 Q-40 -320 0 -340 Q40 -378 46 -350 Q40 -320 0 -340 Z M0 -340 L-26 -296 M0 -340 L24 -298', outline(ap.col, 4.5));
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1, cx = dir * at * 30, k = 1 - 0.12 * at;
  const y0 = -330, y1 = -160;
  const d = poly([[cx - 84 * k, y0], [cx + 84 * k, y0], [cx + 96 * k, y1], [cx - 96 * k, y1]], 12);
  return clipped(d, ap.col, S.path(poly([[cx - 74 * k, y0 + 6], [cx + 74 * k, y0 + 6], [cx + 86 * k, y1 - 10], [cx - 86 * k, y1 - 10]], 8), stitch(ap.trim || '#FF8FB0')) + S.path(poly([[cx - 50 * k, y0 + 40], [cx + 50 * k, y0 + 40], [cx + 54 * k, y0 + 100], [cx - 54 * k, y0 + 100]], 8), outline(ap.col, 4))) +
    band(`M${-130} ${y0 - 4} L130 ${y0 - 4}`, 9, ap.col);
}

// ====================================================================== TORSO
const APRON_GG = { col: '#FFB3CF', trim: '#E8456A', logo: 'cookie' };
function makeTorso6(style) {
  if (!TOPS6.includes(style.top)) return L5.makeTorso5(style);
  const c = style.col;
  const W = style.torsoW || 100, Wb = W - (style.taper || 0);
  return function torso(t, shade, back = false) {
    const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
    const cx = dir * at * 30, k = 1 - 0.12 * at;
    const T = -533, B = -306;
    let o = '';
    const id = S.uid('t6');
    const d = poly([[-W, T], [W, T], [Wb, B], [-Wb, B]], 16);
    let inner = outfit6(style, t, shade, back, T, B, W) || '';
    const ap = STATE.apron ? (typeof STATE.apron === 'object' ? STATE.apron : APRON_GG) : style.apronAlways;
    if (ap) inner += apronBib(cx, k, T, B, ap, back);
    if (STATE.badge && !back) inner += rosette(cx - 60 * k, -452, 0.62, STATE.badge === true ? null : STATE.badge);
    if (shade) {
      inner += S.rect(-Wb - 14, B - 26, 2 * Wb + 28, 30, 0, { fill: '#000', opacity: 0.1 });
      if (at > 0.02) inner += S.rect(dir > 0 ? -Wb - 14 : W - 34 * at, T - 10, 34 * at + 14, B - T + 20, 0, { fill: '#000', opacity: 0.22 });
    }
    o += S.clipDef(id, S.path(d)) + S.path(d, { fill: c.top }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    // outside the clip: collars / hoods round the neck (the head covers their middle), lower garments
    if (style.top === 'sushiHoodie' && !back) o += S.path(`M${f(cx - 124 * k)} ${T + 14} Q${f(cx - 140 * k)} ${T - 56} ${f(cx)} ${T - 62} Q${f(cx + 140 * k)} ${T - 56} ${f(cx + 124 * k)} ${T + 14} Q${f(cx)} ${T - 20} ${f(cx - 124 * k)} ${T + 14} Z`, outline(c.topShade, 5.5));
    if (style.top === 'furCoat') {
      const cs = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8; cs.push([cx + (-130 + 260 * u) * k, T - 6 - Math.sin(u * Math.PI) * 26 + (i % 2) * 8, 34 - Math.abs(u - 0.5) * 16]); }
      o += puffs(cs, c.top, 5.5) + curlMarks(cs.filter((_, i) => i % 2 === 0), 26, 3.5, c.furShade);
    }
    if (style.ext6) o += ext6Front(style, t, shade, back);
    if (ap) o += apronLower(t, ap, back);
    return o;
  };
}
function makeTorsoSide6(style) {
  if (!TOPS6.includes(style.top)) return L5.makeTorsoSide5(style);
  const c = style.col;
  const k = (style.torsoW || 100) / 100;
  const x0 = -62 * k, x1 = 70 * k + Math.max(0, -(style.taper || 0)) * 0.6;
  return function torsoSide(shade) {
    let o = '';
    const td = S.roundedPath([[x0, -535], [x1, -535], [x1 + Math.max(0, -(style.taper || 0)) * 0.4, -305], [x0 - Math.max(0, -(style.taper || 0)) * 0.6, -305]], 16);
    const tid = S.uid('ts6');
    let inner = S.rect(x0 - 18, -545, 40, 260, 0, { fill: c.topShade || c.top, opacity: 0.6 }) + outfitSide6(style, x0, x1);
    const ap = STATE.apron ? (typeof STATE.apron === 'object' ? STATE.apron : APRON_GG) : style.apronAlways;
    if (ap) inner += S.path(poly([[x0 - 14, -492], [x0 + 18, -492], [x0 + 18, -290], [x0 - 14, -290]], 4), outline(ap.col, 5)) + band(`M${x0 + 10} -492 L${x1 - 20} -545`, 9, ap.col) + band(`M${x0} -330 L${x1 + 10} -330`, 9, ap.col);
    if (shade) inner += S.rect(x0 - 10, -330, x1 - x0 + 30, 30, 0, { fill: '#000', opacity: 0.12 });
    o += S.clipDef(tid, S.path(td)) + S.path(td, { fill: c.top }) + S.g(inner, null, { 'clip-path': `url(#${tid})` }) + S.path(td, outline('none'));
    if (style.top === 'furCoat') o += puffs([[x0 + 10, -540, 30], [x0 + 50, -556, 32], [x0 + 96, -548, 30], [x1, -530, 26]], c.top, 5.5);
    if (style.top === 'sushiHoodie') o += S.path(`M${x0 + 30} -520 Q${x1 + 20} -600 ${x1 + 10} -500 Q${x1 - 20} -520 ${x0 + 30} -520 Z`, outline(c.topShade, 5));
    if (style.ext6) o += ext6Side(style, x0, x1);
    if (ap) o += S.path(poly([[x0 - 16, -330], [x0 + 18, -330], [x0 + 18, -160], [x0 - 20, -160]], 6), outline(ap.col, 5));
    return o;
  };
}

// ====================================================================== ARMS
// style: sleeve 'long'|'short'|'none'|'rolled'|'puff', sleeveBlock (lower sleeve colour), sleevePattern 'moons'|'flowers'|'maki',
// furCuff (colour), armor { kind: 'gold'|'dark', col, hi, shade, trim }, gloveCol, armW
function makeArm6(style) {
  const c = style.col;
  const kw = style.armW || 1;
  return function arm({ shade = true, dim = false, view = 'front' } = {}) {
    const side = view === 'side';
    const hw0 = (side ? 40 : 30) * kw, hw1 = 40 * kw, len = side ? 248 : 268;
    const id = S.uid('a6');
    const d = S.roundedPath([[-hw0, -18], [hw0, -18], [hw1, len], [-hw1, len]], 17);
    const sl = style.sleeve;
    const sleeveY = sl === 'long' ? (side ? 206 : 226) : sl === 'none' ? -40 : sl === 'rolled' ? (side ? 126 : 138) : sl === 'puff' ? (side ? 80 : 88) : (side ? 100 : 112);
    const sc = c.sleeve || c.top;
    let inner = '';
    if (sl !== 'none') {
      inner += S.rect(-hw1 - 6, -30, 2 * hw1 + 12, sleeveY + 30, 0, { fill: sc });
      if (style.sleeveBlock) inner += S.rect(-hw1 - 6, 96, 2 * hw1 + 12, sleeveY - 96, 0, { fill: style.sleeveBlock }) + S.path(`M${-hw1 - 6} 96 L${hw1 + 6} 96`, lineOnly(4)) + S.rect(-hw1 - 6, 84, 2 * hw1 + 12, 12, 0, { fill: c.block3 || '#FF4FA0' });
      if (style.sleevePattern === 'moons') inner += S.path(scatter(-hw1, hw1, 0, sleeveY - 20, 4, 3, (x, y, i) => (i % 2 ? dotD(x, y, 5) : moonD(x, y, 10))), { fill: c.pattern, opacity: 0.9 });
      if (style.sleevePattern === 'maki') inner += maki(0, 50, 11) + maki(-14, 140, 9);
      if (style.sleevePattern === 'fur') inner += S.path(scatter(-hw1, hw1, 10, sleeveY - 30, 5, 2, (x, y) => `M${f(x - 7)} ${f(y)} q7 -9 14 0 `), lineOnly(3.5, c.furShade));
      if (sl === 'long') inner += S.rect(-hw1 - 6, sleeveY - 18, 2 * hw1 + 12, 18, 0, { fill: c.cuff || c.topShade || '#0003' }) + S.path(`M${-hw1 - 6} ${sleeveY - 18} L${hw1 + 6} ${sleeveY - 18}`, lineOnly(4.5));
    }
    if (style.gloveCol) inner += S.rect(-hw1 - 6, len - 52, 2 * hw1 + 12, 64, 0, { fill: style.gloveCol }) + S.path(`M${-hw1 - 6} ${len - 52} L${hw1 + 6} ${len - 52}`, lineOnly(4.5));
    if (style.armor) inner += S.rect(-hw1 - 6, len - 130, 2 * hw1 + 12, 70, 0, { fill: style.armor.col }) + S.path(`M${-hw1 - 6} ${len - 130} L${hw1 + 6} ${len - 130} M${-hw1 - 6} ${len - 60} L${hw1 + 6} ${len - 60}`, lineOnly(4.5)) + S.rect(-hw1 + 6, len - 120, 10, 50, 4, { fill: style.armor.hi, opacity: 0.8 });
    if (shade) inner += S.rect((side ? 22 : 20) * kw, -30, 24 * kw, len + 30, 0, { fill: '#000', opacity: 0.07 });
    if (sl !== 'none') inner += S.path(`M${-hw1 - 6} ${sleeveY} L${hw1 + 6} ${sleeveY}`, lineOnly(SW));
    if (dim) inner += S.path(d, { fill: '#000', opacity: 0.14 });
    let o = S.clipDef(id, S.path(d)) + S.path(d, { fill: c.skin }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    if (sl === 'rolled') {
      const rc = S.roundedPath([[-hw1 - 8, sleeveY - 30], [hw1 + 8, sleeveY - 30], [hw1 + 10, sleeveY + 4], [-hw1 - 10, sleeveY + 4]], 10);
      o += S.path(rc, outline(c.cuff || sc, 5.5));
    }
    if (style.furCuff && sl !== 'none') {
      const cs = [];
      for (let i = 0; i <= 4; i++) cs.push([-hw1 - 4 + (i * (2 * hw1 + 8)) / 4, sleeveY - 6 + (i % 2) * 6, 17]);
      o += puffs(cs, style.furCuff, 5);
      if (dim) o += S.rect(-hw1 - 22, sleeveY - 26, 2 * hw1 + 44, 44, 14, { fill: '#000', opacity: 0.1 });
    }
    if (style.armor) {
      // pauldron: a dome over the shoulder (spiky for the dark armour)
      const A = style.armor;
      const pw = hw1 + 26;
      const pd = `M${f(-pw)} 70 Q${f(-pw - 6)} -40 0 -52 Q${f(pw + 6)} -40 ${f(pw)} 70 Q0 52 ${f(-pw)} 70 Z`;
      if (A.kind === 'dark') for (const [x, y, a, h] of [[-26, -40, -20, 70], [14, -48, 10, 84], [44, -24, 40, 60]]) o += S.path(`M${f(x - 16)} ${f(y + 10)} Q${f(x - 6 + Math.sin((a * Math.PI) / 180) * h * 0.4)} ${f(y - h * 0.6)} ${f(x + Math.sin((a * Math.PI) / 180) * h)} ${f(y - h)} Q${f(x + 8 + Math.sin((a * Math.PI) / 180) * h * 0.4)} ${f(y - h * 0.5)} ${f(x + 16)} ${f(y + 10)} Z`, outline(A.spike || '#C9CED8', 5));
      o += clipped(pd, A.col, S.path(`M${f(-pw + 10)} 20 Q${f(-pw + 14)} -24 ${f(-10)} -36`, lineOnly(9, A.hi)) + S.path(`M${f(-pw)} 52 Q0 34 ${f(pw)} 52`, lineOnly(6, A.trim || A.shade)), 5.5);
      if (A.gem) o += S.circle(0, 20, 9, outline(A.gem, 3.5));
      if (dim) o += S.path(pd, { fill: '#000', opacity: 0.14 });
    }
    return o;
  };
}

// ====================================================================== LEGS
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul2 = (a, k) => [a[0] * k, a[1] * k];
function legBody6(style, J, wOut, wIn, shade, dim) {
  const c = style.col;
  const Lb = bentLimb(J, wOut, wIn, 24);
  const id = S.uid('lg6');
  let inner = '';
  if (style.pantsPattern === 'moons') inner += S.path(scatter(-140, 140, -40, 300, 9, 8, (x, y, i) => (i % 3 === 2 ? dotD(x, y, 5) : moonD(x, y, 11))), { fill: c.pattern, opacity: 0.9 });
  if (shade) {
    const a = add2(J.hip, mul2(Lb.u1, -40)), b = add2(J.hip, mul2(Lb.u1, 44)), wq = Math.max(wOut[0], wIn[0]) + 14;
    inner += S.path(`M${P(add2(a, mul2(Lb.n1, -wq)))} L${P(add2(a, mul2(Lb.n1, wq)))} L${P(add2(b, mul2(Lb.n1, wq)))} L${P(add2(b, mul2(Lb.n1, -wq)))} Z`, { fill: c.pantsShade });
  }
  const wc = Math.max(wOut[2], wIn[2]) + 14;
  const ankleBand = (from, col) => { const a = add2(J.ankle, mul2(Lb.u2, -from)); return S.path(`M${P(add2(a, mul2(Lb.n2, -wc)))} L${P(add2(a, mul2(Lb.n2, wc)))} L${P(add2(J.ankle, mul2(Lb.n2, wc)))} L${P(add2(J.ankle, mul2(Lb.n2, -wc)))} Z`, { fill: col }); };
  if (style.socks) inner += ankleBand(style.sockH || 46, style.socks) + (style.sockRib ? (() => { const a = add2(J.ankle, mul2(Lb.u2, -(style.sockH || 46) + 6)), b = add2(J.ankle, mul2(Lb.u2, -(style.sockH || 46) + 16)); return S.path(`M${P(add2(a, mul2(Lb.n2, -wc)))} L${P(add2(a, mul2(Lb.n2, wc)))} M${P(add2(b, mul2(Lb.n2, -wc)))} L${P(add2(b, mul2(Lb.n2, wc)))}`, lineOnly(4, style.sockRib)); })() : '');
  if (style.greaves) inner += ankleBand(118, style.greaves.col) + S.path((() => { const a = add2(J.ankle, mul2(Lb.u2, -100)); return `M${P(add2(a, mul2(Lb.n2, -wc + 18)))} L${P(add2(J.ankle, mul2(Lb.n2, -wc + 18)))}`; })(), lineOnly(8, style.greaves.hi));
  if (dim) inner += S.path(Lb.d, { fill: '#000', opacity: 0.25 });
  let o = S.clipDef(id, S.path(Lb.d)) + S.path(Lb.d, { fill: c.pants }) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  if (Lb.crease && !style.socks && !style.greaves) o += S.path(Lb.crease, lineOnly(5));
  o += S.path(Lb.d, outline('none'));
  for (const [on, from] of [[style.socks, style.sockH || 46], [style.greaves, 118]]) {
    if (!on) continue;
    const a = add2(J.ankle, mul2(Lb.u2, -from));
    o += S.path(`M${P(add2(a, mul2(Lb.n2, wOut[2] + 2)))} L${P(add2(a, mul2(Lb.n2, -wIn[2] - 2)))}`, lineOnly(5));
  }
  if (style.greaves && style.greaves.knee) { const kp = J.knee; o += S.circle(kp[0], kp[1], 30, outline(style.greaves.col, 5)) + S.circle(kp[0] - 8, kp[1] - 8, 8, { fill: style.greaves.hi }); }
  const cid = S.uid('cf6');
  const cut = S.clipDef(cid, S.el('rect', { x: -700, y: -1400, width: 1400, height: 1408, transform: `translate(${P(J.ankle)}) rotate(${f(J.foot)})` }));
  return cut + S.g(o, null, { 'clip-path': `url(#${cid})` });
}
function shoe6(style, { x0, x1, back, dim, shade, toeCx, side }) {
  const c = style.col;
  const kind = style.shoe || 'sneaker';
  const sole = dim ? (c.soleShade || c.sole) : c.sole;
  let s = '';
  const dimC = (col) => (dim ? shadeHex(col, 0.82) : col);
  if (kind === 'sandal') {
    // white socks in brown sandals
    const sock = dimC(style.socks || '#FFFFFF');
    s += S.path(S.roundedPath([[x0, -14], [x1, -14], [x1, 30], [x0, 30]], 18), outline(sock));
    if (!back) s += S.path(`M${f(toeCx - 30)} -6 q10 -8 20 0 M${f(toeCx - 6)} -8 q10 -8 20 0`, lineOnly(3.5, '#D8DCE6'));
    s += S.path(S.roundedPath([[x0 - 8, 24], [x1 + 8, 24], [x1 + 8, 44], [x0 - 8, 44]], 9), outline(dimC(c.sole)));
    const strap = dimC(c.strap || '#8A5A30');
    const sx1 = side ? x0 + 60 : toeCx - 2, sx2 = side ? x1 - 50 : x0 + 22;
    s += S.path(`M${f(sx1 - 14)} 26 L${f(sx1 - 4)} -14 L${f(sx1 + 14)} -14 L${f(sx1 + 4)} 26 Z M${f(sx2 - 12)} 26 L${f(sx2 - 12)} -14 L${f(sx2 + 10)} -14 L${f(sx2 + 10)} 26 Z`, outline(strap, 4));
    s += S.rect(sx2 - 8, -2, 14, 12, 3, outline('#FFC93C', 2.5));
    return s;
  }
  if (kind === 'slipper') {
    const d = S.roundedPath([[x0 - 4, -16], [x1 + 4, -16], [x1 + 4, 40], [x0 - 4, 40]], 22);
    s += S.path(d, outline(dimC(c.toe)));
    let fl = '';
    for (let x = x0 + 4; x < x1; x += 20) fl += `M${x} -14 a10 10 0 0 1 20 0 `;
    s += S.path(fl, { fill: dimC(c.toe), stroke: LINE, 'stroke-width': 4 });
    s += S.path(`M${x0 - 2} 28 L${x1 + 2} 28`, lineOnly(8, sole));
    if (c.pompom && !back) s += puffs([[toeCx - 8, -12, 12], [toeCx + 8, -16, 12], [toeCx + 2, -2, 11]], c.pompom, 4);
    return s;
  }
  if (kind === 'flats') {
    s += S.path(S.roundedPath([[x0 + 4, 2], [x1, 2], [x1, 40], [x0 + 4, 40]], 16), outline(sole));
    if (!back) s += S.path(`M${f(toeCx - 18)} 10 Q${f(toeCx)} 0 ${f(toeCx + 18)} 10`, lineOnly(5, c.toe || '#FFFFFF66'));
    return s;
  }
  if (kind === 'boot') {
    s += S.path(S.roundedPath([[x0 - 4, -40], [x1 + 4, -40], [x1 + 6, 42], [x0 - 6, 42]], 16), outline(sole));
    s += S.path(`M${x0 - 4} -14 L${x1 + 4} -14`, lineOnly(5, c.bootTrim || c.soleShade)) + S.path(`M${x0} 30 L${x1} 30`, lineOnly(7, c.soleShade));
    if (!back && style.bootSpike) s += S.path(`M${f(toeCx - 16)} -36 L${f(toeCx)} -70 L${f(toeCx + 16)} -36 Z`, outline(style.bootSpike, 4));
    return s;
  }
  if (kind === 'avatar') {
    s += S.path(S.roundedPath([[x0, -6], [x1, -6], [x1, 42], [x0, 42]], 14), outline(sole));
    if (shade) s += S.path(`M${x0 + 6} 32 L${x1 - 6} 32`, lineOnly(6, c.soleShade));
    return s;
  }
  if (kind === 'chunky') {
    s += S.path(S.roundedPath([[x0 - 4, -8], [x1 + 4, -8], [x1 + 6, 50], [x0 - 6, 50]], 16), outline(sole));
    s += S.path(`M${x0 - 4} 22 L${x1 + 4} 22`, lineOnly(4)) + S.rect(x0, 28, x1 - x0, 10, 4, { fill: c.soleBand || '#FF4FA0' });
    if (!back) s += S.path(`M${f(toeCx - 46)} -6 A46 40 0 0 1 ${f(toeCx + 46)} -6 Z`, outline(c.toe)) + S.path(`M${f(toeCx - 30)} -18 l14 -10 l12 10 l14 -10`, lineOnly(5, c.lace || '#2BB5B0'));
    return s;
  }
  // default sneaker
  const soleD = S.roundedPath([[x0, -4], [x1, -4], [x1, 42], [x0, 42]], 14);
  s += S.path(soleD, outline(sole));
  if (shade) s += S.path(`M${x0 + 6} 32 L${x1 - 6} 32`, lineOnly(6, c.soleShade));
  if (!back) {
    s += S.path(`M${f(toeCx - 42)} -2 A42 37 0 0 1 ${f(toeCx + 42)} -2 Z`, outline(c.toe));
    if (c.toe !== c.sole) s += S.path(`M${f(toeCx - 22)} -18 Q${f(toeCx)} -30 ${f(toeCx + 22)} -18`, lineOnly(4.5, '#fff'));
  }
  return s;
}
function makeLeg6(style) {
  const kw = style.legW || 1;
  return function leg({ shade = true, dim = false, toeShift = 0, back = false, J, side = 1 } = {}) {
    const straight = style.pantsShape !== 'wide';
    const wOut = (straight ? [42, 46, 54] : [42, 74, 103]).map((v) => v * kw), wIn = [40, 40, 40].map((v) => v * kw);
    const o = legBody6(style, J, wOut, wIn, shade, dim);
    const x1 = (straight ? 94 : 107) * kw, x0 = -44 * kw;
    const s = shoe6(style, { x0, x1, back, dim, shade, toeCx: (straight ? 24 : 30) * kw + toeShift, side: false });
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}
function makeLegSide6(style) {
  const c = style.col;
  const kw = style.legW || 1;
  return function legSide({ shade = true, dim = false, J } = {}) {
    const straight = style.pantsShape !== 'wide';
    const wOut = (straight ? [62, 64, 68] : [64, 74, 85]).map((v) => v * kw), wIn = (straight ? [56, 58, 62] : [58, 69, 80]).map((v) => v * kw);
    const o = legBody6(style, J, wOut, wIn, shade, dim);
    const sc = { ...style, col: { ...c, toe: c.toe === c.sole ? (dim ? c.soleShade : c.sole) : c.toe } };
    const s = shoe6(sc, { x0: -138 * kw, x1: 88 * kw, back: false, dim, shade, toeCx: -86 * kw, side: true });
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}

// ====================================================================== dress6()
function dress6(d) {
  const st = d.style, c = st.col, a = st.acc || {};
  d.torso = makeTorso6(st);
  d.torsoSide = makeTorsoSide6(st);
  d.arm = makeArm6(st);
  d.leg = makeLeg6(st);
  d.legSide = makeLegSide6(st);
  if (st.thigh) Object.assign(d.dims, { thigh: st.thigh, shin: st.shin, sideThigh: st.thigh - 4, sideShin: st.shin - 2 });
  const hs0 = d.headSide, hb0 = d.headBack;
  if (a.walrus || a.monocle || a.lipTint) {
    d.headSide = (face, shade) => {
      let o = hs0(face, shade);
      if (a.walrus) o += walrusSide(c);
      if (a.monocle) o += monocleSide();
      return o;
    };
  }
  if (a.walrus) d.headBack = (face, shade) => hb0(face, shade) + (() => { let o = ''; for (const sx of [-1, 1]) o += S.path(`M${sx * 128} -640 Q${sx * 156} -630 ${sx * 150} -604`, lineOnly(16, LINE)) + S.path(`M${sx * 128} -640 Q${sx * 156} -630 ${sx * 150} -604`, lineOnly(8, c.stache || c.hair)); return o; })();
  return d;
}

// ====================================================================== NOODLEBOI — the ramen-bowl head
// head space (same frame as the R6 head: neck at y -560). c: bowl, bowlShade, band, wave, noodle, noodleShade, egg, yolk, chop
const MOUTH_OPEN = { B: 0.3, C: 0.5, D: 0.8, E: 0.62, F: 0.34, G: 0.2, H: 0.5, o: 0.4, O: 0.78, grin: 0.5, bigGrin: 0.82, scream: 1, wail: 0.9, yawn: 0.8, teeth: 0.36, uh: 0.25, tongue: 0.3 };
const withBlinkE = (e, blink) => (blink > 0 && (!e.type || e.type === 'open') ? { ...e, upper: (e.upper || 0) + (1 - (e.upper || 0)) * blink } : e);
function noodleHeap(map, c, hairnet) {
  const top = [[-176, -878, 0], [-170, -916, 10], [-130, -950, 12], [-80, -968, 12], [-20, -978, 12], [40, -976, 12], [100, -962, 12], [150, -936, 10], [178, -900, 0], [178, -878, 0]];
  const pts = top.map(([x, y, b]) => [...map([x, y]), b]);
  const d = fluffy(pts);
  let inner = '';
  let wav = '';
  for (let i = 0; i < 5; i++) { const y = -900 - i * 16; const a = map([-170 + i * 12, y]), b = map([170 - i * 12, y]); wav += `M${P(a)} q${f((b[0] - a[0]) / 8)} -14 ${f((b[0] - a[0]) / 4)} 0 t${f((b[0] - a[0]) / 4)} 0 t${f((b[0] - a[0]) / 4)} 0 t${f((b[0] - a[0]) / 4)} 0 `; }
  inner += S.path(wav, lineOnly(4.5, c.noodleShade));
  let o = clipped(d, c.noodle, inner, 6);
  if (hairnet) {
    let net = '';
    for (let x = -200; x <= 200; x += 30) { const a = map([x, -1000]), b = map([x + 60, -870]); net += `M${P(a)} L${P(b)} `; const a2 = map([x, -1000]), b2 = map([x - 60, -870]); net += `M${P(a2)} L${P(b2)} `; }
    const nid = S.uid('net');
    o += S.clipDef(nid, S.path(d)) + S.g(S.path(net, lineOnly(3, '#FFFFFF')) + S.path(net, { ...lineOnly(1.5, '#9AA6B8') }), null, { 'clip-path': `url(#${nid})` });
    o += band(`M${P(map([-182, -884]))} Q${P(map([0, -900]))} ${P(map([182, -884]))}`, 8, '#FFFFFF', 6);
  }
  return o;
}
function noodleToppings(map, c, t = 0, view = 'front') {
  let o = '';
  // nori sheet behind, chopsticks, naruto, half egg, spring onions
  const nb = map([-118, -930]);
  o += S.g(S.rect(-30, -90, 64, 104, 6, outline('#22402E', 5)) + S.path('M-18 -70 l0 70 M2 -76 l0 74', lineOnly(3, '#3A6A4A')), `translate(${P(nb)}) rotate(-14)`);
  for (const [x0, y0, x1, y1] of [[30, -900, 150, -1190], [64, -900, 214, -1158]]) {
    const a = map([x0, y0]), b = map([x1, y1]);
    o += S.path(`M${P(a)} L${P(b)}`, lineOnly(24, LINE)) + S.path(`M${P(a)} L${P(b)}`, lineOnly(14, c.chop)) + S.path(`M${P([a[0] + (b[0] - a[0]) * 0.72, a[1] + (b[1] - a[1]) * 0.72])} L${P(b)}`, lineOnly(14, c.chopTip || '#C0392B'));
  }
  return o;
}
function noodleFront(map, c) {
  let o = '';
  const n = map([-56, -950]);
  o += S.g(S.ellipse(0, 0, 40, 30, outline('#FFFFFF', 5)) + S.path('M-4 -2 a6 6 0 1 1 8 4 a12 12 0 1 1 -16 -8 a18 18 0 1 1 26 10', lineOnly(4.5, '#FF6FA8')) + S.path('M-40 0 l-6 -6 M40 0 l6 -6 M0 -30 l0 -6', lineOnly(4, '#FFFFFF')), `translate(${P(n)}) rotate(-12)`);
  const e = map([72, -960]);
  o += S.g(S.ellipse(0, 0, 48, 36, outline('#FFFFFF', 5)) + S.ellipse(4, 4, 24, 18, outline(c.yolk || '#FFA51F', 4)) + S.ellipse(-2, -2, 8, 6, { fill: '#FFD27A' }), `translate(${P(e)}) rotate(14)`);
  let on = '';
  for (const [x, y] of [[-10, -976], [20, -930], [-110, -900], [130, -920], [-150, -914]]) { const p = map([x, y]); on += dotD(p[0], p[1], 8); }
  o += S.path(on, { fill: '#7ED957', stroke: LINE, 'stroke-width': 3 });
  return o;
}
const BOWL = 'M-182 -882 Q-180 -660 -120 -600 L120 -600 Q180 -660 182 -882 Z';
function bowlPath(map) {
  const p = (x, y) => P(map([x, y]));
  return `M${p(-182, -882)} Q${p(-180, -660)} ${p(-120, -600)} L${p(120, -600)} Q${p(180, -660)} ${p(182, -882)} Z`;
}
function noodleHead(style) {
  const c = style.col;
  return function head(face, t, shade) {
    const m = hm(t);
    const fr = F.resolveFace(face);
    const blink = fr.blink || 0;
    let o = noodleToppings(m.hair, c, STATE.t);
    o += noodleHeap(m.hair, c, STATE.hairnet);
    o += noodleFront(m.hair, c);
    // the bowl: foot ring, body (cream with a red rim band + blue waves), rim lip
    const foot = m.hair([0, -578]);
    o += S.path(poly([[foot[0] - 86, -604], [foot[0] + 86, -604], [foot[0] + 76, -560], [foot[0] - 76, -560]], 8), outline(c.bowlShade, 6));
    let inner = S.rect(-260, -890, 520, 46, 0, { fill: c.band });
    let wv = '';
    for (let x = -200; x < 200; x += 40) { const a = m.hair([x, -630]); wv += `M${f(a[0])} ${f(a[1])} q10 -18 20 0 t20 0 `; }
    inner += S.path(wv, lineOnly(5, c.wave));
    if (shade) inner += S.path(`M${P(m.hair([120, -860]))} Q${P(m.hair([150, -700]))} ${P(m.hair([96, -606]))} L${P(m.hair([200, -606]))} L${P(m.hair([200, -860]))} Z`, { fill: c.bowlShade, opacity: 0.7 }) + S.path(`M${P(m.hair([-150, -830]))} Q${P(m.hair([-148, -720]))} ${P(m.hair([-118, -660]))}`, lineOnly(12, '#FFFFFF'));
    o += clipped(bowlPath(m.hair), c.bowl, inner, 7);
    o += S.path(poly([m.hair([-196, -900]), m.hair([196, -900]), m.hair([192, -870]), m.hair([-192, -870])], 14), outline(c.band, 6));
    // face on the bowl
    const lb = t * 0.45;
    const eL = m.feat([-56, -764]), eR = m.feat([56, -764]);
    const le = (e) => ({ ...withBlinkE(e, blink), look: [S.clamp(((e.look || [0, 0])[0]) + lb, -1, 1), (e.look || [0, 0])[1]], pupil: (e.pupil ?? 1) * 1.1 });
    o += L.dotEye(eL[0], eL[1], le(fr.eyeL), -1) + L.dotEye(eR[0], eR[1], le(fr.eyeR), 1);
    o += L.strokeBrows(m.feat, -824, fr.brows, {}, LINE, 10);
    for (const sx of [-1, 1]) { const p = m.feat([sx * 104, -712]); o += S.ellipse(p[0], p[1], 24, 11, { fill: '#FF8FA3', opacity: 0.55 }); }
    const mm = m.feat([0, -690]);
    o += F.mouth(fr.mouth, mm[0], mm[1], 0.9 * (1 - 0.15 * m.at), 0.9);
    o += F.faceFx(fr.fx, { fx: m.fx });
    return o;
  };
}
function noodleHeadSide(style) {
  const c = style.col;
  return function headSide(face, shade) {
    const fr = F.resolveFace(face);
    let o = noodleToppings(ID, c, STATE.t, 'side') + noodleHeap(ID, c, STATE.hairnet) + noodleFront(([x, y]) => [x - 30, y], c);
    o += S.path(poly([[-86, -604], [86, -604], [76, -560], [-76, -560]], 8), outline(c.bowlShade, 6));
    let inner = S.rect(-260, -890, 520, 46, 0, { fill: c.band }) + S.path('M-200 -630 q10 -18 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0', lineOnly(5, c.wave));
    if (shade) inner += S.path('M120 -860 Q150 -700 96 -606 L200 -606 L200 -860 Z', { fill: c.bowlShade, opacity: 0.7 });
    o += clipped(BOWL, c.bowl, inner, 7) + S.path(poly([[-196, -900], [196, -900], [192, -870], [-192, -870]], 14), outline(c.band, 6));
    const e = withBlinkE(fr.eyeL, fr.blink || 0);
    o += L.dotEye(-120, -764, { ...e, look: [-0.8, (e.look || [0, 0])[1]] }, 1);
    o += S.ellipse(-130, -712, 20, 10, { fill: '#FF8FA3', opacity: 0.55 }) + F.mouth(fr.mouth, -140, -690, 0.5, 0.9);
    o += F.faceFx(fr.fx.filter((x) => (typeof x === 'string' ? x : x.type) !== 'blush'), { fx: 0 });
    return o;
  };
}
function noodleHeadBack(style) {
  const c = style.col;
  return function headBack(face, shade) {
    let o = noodleFront(ID, c) + noodleHeap(ID, c, STATE.hairnet) + noodleToppings(([x, y]) => [-x, y], c, STATE.t);
    o += S.path(poly([[-86, -604], [86, -604], [76, -560], [-76, -560]], 8), outline(c.bowlShade, 6));
    o += clipped(BOWL, c.bowl, S.rect(-260, -890, 520, 46, 0, { fill: c.band }) + (shade ? S.path('M-120 -860 Q-150 -700 -96 -606 L-200 -606 L-200 -860 Z', { fill: c.bowlShade, opacity: 0.7 }) : ''), 7);
    return o + S.path(poly([[-196, -900], [196, -900], [192, -870], [-192, -870]], 14), outline(c.band, 6));
  };
}

// ====================================================================== DARKBLADE — the spiky helmet with glowing red eyes
// spec: { spikes: n (0..5), eye: colour, eyeCore, horns: bool, crest: colour }. STATE.shy -> visor up, a kid's face shows.
function darkEye(cx, cy, sx, e, glow, col, core) {
  const type = e.type || 'open';
  const k = 1 + 0.25 * glow;
  let o = S.ellipse(cx, cy, 58 * k, 34 * k, { fill: col, opacity: f(0.16 + 0.2 * glow) }) + S.ellipse(cx, cy, 38 * k, 22 * k, { fill: col, opacity: f(0.2 + 0.25 * glow) });
  if (type === 'happy') return o + band(`M${f(cx - 34)} ${f(cy + 8)} Q${f(cx)} ${f(cy - 24)} ${f(cx + 34)} ${f(cy + 8)}`, 10, core, 0) + S.path(`M${f(cx - 34)} ${f(cy + 8)} Q${f(cx)} ${f(cy - 24)} ${f(cx + 34)} ${f(cy + 8)}`, lineOnly(6, col));
  if (type === 'x' || type === 'swirl') return o + S.path(`M${f(cx - 20)} ${f(cy - 16)} L${f(cx + 20)} ${f(cy + 16)} M${f(cx + 20)} ${f(cy - 16)} L${f(cx - 20)} ${f(cy + 16)}`, lineOnly(10, col)) + S.path(`M${f(cx - 20)} ${f(cy - 16)} L${f(cx + 20)} ${f(cy + 16)} M${f(cx + 20)} ${f(cy - 16)} L${f(cx - 20)} ${f(cy + 16)}`, lineOnly(4, core));
  const pupil = e.pupil ?? 1;
  const up = clamp(e.upper || 0, 0, 1), tilt = (e.tilt || 0) * 0.9;
  if (pupil < 0.8 || type === 'star' || type === 'heart') {
    const r = 24 * (pupil < 0.8 ? 1.1 : 1);
    return o + S.ellipse(cx, cy, r, r * 0.9, { fill: col }) + S.ellipse(cx, cy, r * 0.5, r * 0.44, { fill: core });
  }
  // angled slit: the inner end lower than the outer (angry); tilt raises the inner end
  const hh = 18 * (1 - up * 0.85) * (pupil > 1.2 ? 1.25 : 1) + 2;
  const inY = cy + 6 - tilt * 0.4, outY = cy - 8;
  const xi = cx - sx * 34, xo = cx + sx * 40;
  const d = `M${f(xi)} ${f(inY - hh * 0.5)} L${f(xo)} ${f(outY - hh * 0.8)} Q${f(xo + sx * 8)} ${f(outY)} ${f(xo)} ${f(outY + hh * 0.5)} L${f(xi)} ${f(inY + hh * 0.6)} Z`;
  return o + S.path(d, { fill: col }) + S.path(`M${f(xi + sx * 8)} ${f(inY)} L${f(xo - sx * 6)} ${f(outY - hh * 0.15)}`, lineOnly(Math.max(2, hh * 0.45), core));
}
function helmetSpikes(map, n, col, sw = 6) {
  const specs = [[0, -900, 0, 120, 30], [-74, -892, -26, 96, 26], [74, -892, 26, 96, 26], [-128, -862, -54, 74, 22], [128, -862, 54, 74, 22]].slice(0, n);
  let o = '';
  for (const [x, y, a, h, w] of specs.slice().reverse()) {
    const b = map([x, y]);
    o += S.path(`M${f(-w)} 0 Q${f(-w * 0.5)} ${f(-h * 0.6)} 0 ${f(-h)} Q${f(w * 0.5)} ${f(-h * 0.6)} ${f(w)} 0 Z`, { ...outline(col, sw), transform: `translate(${P(b)}) rotate(${f(a)})` }) +
      S.path(`M${f(-w * 0.4)} -6 Q${f(-w * 0.3)} ${f(-h * 0.5)} 0 ${f(-h * 0.86)}`, { ...lineOnly(5, '#FFFFFF33'), transform: `translate(${P(b)}) rotate(${f(a)})` });
  }
  return o;
}
function darkHead(style) {
  const c = style.col, spec = style.helm || {};
  return function head(face, t, shade) {
    const m = hm(t);
    const fr = F.resolveFace(face);
    const glow = clamp(MOUTH_OPEN[fr.mouth] ?? 0, 0, 1);
    let o = '';
    o += helmetSpikes(m.hair, spec.spikes ?? 5, c.spike || '#3A3A46');
    if (spec.horns) for (const sx of [-1, 1]) { const b = m.hair([sx * 140, -850]); o += S.path(`M${f(b[0])} ${f(b[1] + 30)} Q${f(b[0] + sx * 90)} ${f(b[1] + 10)} ${f(b[0] + sx * 110)} ${f(b[1] - 110)} Q${f(b[0] + sx * 60)} ${f(b[1] - 30)} ${f(b[0])} ${f(b[1] - 30)} Z`, outline(c.horn || '#D8D0C0', 5)); }
    const hx = m.dir * 4 * m.at;
    const helmD = S.roundedPath([[-154 + hx, -912], [154 + hx, -912], [154 + hx, -556], [-154 + hx, -556]], 48);
    let inner = '';
    if (shade) inner += S.path(`M${f(-154 + hx)} -912 L${f(154 + hx)} -912 L${f(154 + hx)} -880 L${f(-154 + hx)} -880 Z`, { fill: c.armorHi, opacity: 0.6 }) + S.rect(m.dir > 0 ? 100 - 40 * m.at : -160, -920, 60 + 40 * m.at, 380, 0, { fill: '#000', opacity: 0.25 });
    if (spec.crest) inner += S.path(`M${P(m.feat([-12, -912]))} L${P(m.feat([12, -912]))} L${P(m.feat([10, -800]))} L${P(m.feat([-10, -800]))} Z`, { fill: spec.crest });
    if (!STATE.shy) {
      // T-visor: dark slit across the eyes + a vertical breathing slit
      const a = m.feat([-128, -770]), b = m.feat([128, -770]);
      inner += S.path(`M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])} L${f(b[0] - 10)} ${f(b[1] + 92)} L${f(a[0] + 10)} ${f(a[1] + 92)} Z`, { fill: c.visor || '#0B0B10' });
      inner += S.path(`M${P(m.feat([-18, -680]))} L${P(m.feat([18, -680]))} L${P(m.feat([14, -590]))} L${P(m.feat([-14, -590]))} Z`, { fill: c.visor || '#0B0B10' });
      for (const sx of [-1, 1]) for (const y of [-640, -604]) { const p = m.feat([sx * 70, y]); inner += S.circle(p[0], p[1], 7, { fill: c.armorHi }); }
    }
    o += clipped(helmD, c.helm || c.top, inner, 7);
    if (!STATE.shy) {
      const eL = m.feat([-60, -726]), eR = m.feat([60, -726]);
      const blink = fr.blink || 0;
      if (blink < 0.6) o += darkEye(eL[0], eL[1], -1, fr.eyeL, glow, c.eye || '#FF2E4A', c.eyeCore || '#FFD0D6') + darkEye(eR[0], eR[1], 1, fr.eyeR, glow, c.eye || '#FF2E4A', c.eyeCore || '#FFD0D6');
      else for (const p of [eL, eR]) o += S.path(`M${f(p[0] - 30)} ${f(p[1])} L${f(p[0] + 30)} ${f(p[1])}`, lineOnly(6, c.eye || '#FF2E4A'));
      o += S.path(`M${P(m.feat([-128, -770]))} L${P(m.feat([128, -770]))}`, lineOnly(5, c.armorHi));
    } else {
      // visor up: a shy kid inside the helmet
      const fo = m.feat([0, -700]);
      const op = S.roundedPath([[fo[0] - 118, -846], [fo[0] + 118, -846], [fo[0] + 118, -578], [fo[0] - 118, -578]], 40);
      let fin = S.path(`M${f(fo[0] - 130)} -850 L${f(fo[0] + 130)} -850 L${f(fo[0] + 120)} -800 Q${f(fo[0] + 60)} -770 ${f(fo[0] + 20)} -806 Q${f(fo[0] - 30)} -770 ${f(fo[0] - 80)} -800 L${f(fo[0] - 130)} -790 Z`, { fill: c.kidHair || '#2A2230' });
      o += clipped(op, c.kidSkin || '#F6D5BC', fin, 6);
      const eL = m.feat([-50, -716]), eR = m.feat([50, -716]);
      const blink = fr.blink || 0;
      o += F.eye(eL[0], eL[1], 42, 52, { ...withBlinkE(fr.eyeL, blink), iris: c.kidIris || '#7A5AE0' }, -1, { pupilScale: 0.95 }) + F.eye(eR[0], eR[1], 42, 52, { ...withBlinkE(fr.eyeR, blink), iris: c.kidIris || '#7A5AE0' }, 1, { pupilScale: 0.95 });
      for (const sx of [-1, 1]) { const p = m.feat([sx * 82, -648]); o += S.ellipse(p[0], p[1], 24, 10, { fill: '#FF8FA3', opacity: 0.7 }); }
      const mm = m.feat([0, -620]);
      o += F.mouth(fr.mouth, mm[0], mm[1], 0.72, 0.72);
      // the visor plate pushed up over the forehead
      const vb = m.hair([0, -900]);
      o += S.path(poly([[vb[0] - 140, vb[1] - 40], [vb[0] + 140, vb[1] - 40], [vb[0] + 128, vb[1] + 30], [vb[0] - 128, vb[1] + 30]], 14), outline(c.helm || c.top, 6)) + S.path(`M${f(vb[0] - 110)} ${f(vb[1] - 4)} L${f(vb[0] + 110)} ${f(vb[1] - 4)}`, lineOnly(10, c.visor || '#0B0B10'));
    }
    o += F.faceFx(fr.fx.filter((x) => !['blush', 'tears'].includes(typeof x === 'string' ? x : x.type) || STATE.shy), { fx: m.fx });
    return o;
  };
}
function darkHeadSide(style) {
  const c = style.col, spec = style.helm || {};
  return function headSide(face, shade) {
    const fr = F.resolveFace(face);
    const glow = clamp(MOUTH_OPEN[fr.mouth] ?? 0, 0, 1);
    let o = helmetSpikes(([x, y]) => [x * 0.8 + 10, y], Math.min(3, spec.spikes ?? 5), c.spike || '#3A3A46');
    if (spec.horns) o += S.path('M60 -820 Q170 -840 190 -960 Q130 -880 60 -870 Z', outline(c.horn || '#D8D0C0', 5));
    const d = S.roundedPath([[-176, -906], [158, -906], [158, -552], [-176, -552]], 46);
    let inner = shade ? S.rect(-180, -912, 340, 30, 0, { fill: c.armorHi, opacity: 0.6 }) + S.rect(90, -912, 80, 380, 0, { fill: '#000', opacity: 0.25 }) : '';
    if (!STATE.shy) inner += S.path('M-190 -770 L-40 -770 L-50 -680 L-190 -680 Z', { fill: c.visor || '#0B0B10' }) + S.path('M-190 -660 L-120 -660 L-120 -590 L-190 -590 Z', { fill: c.visor || '#0B0B10' });
    else inner += S.path('M-190 -846 L-30 -846 L-30 -578 L-190 -578 Z', { fill: c.kidSkin || '#F6D5BC' }) + S.path('M-190 -850 L-40 -850 L-50 -800 L-120 -790 L-190 -800 Z', { fill: c.kidHair || '#2A2230' });
    o += clipped(d, c.helm || c.top, inner, 7);
    if (!STATE.shy) o += darkEye(-140, -726, -1, { ...fr.eyeL, tilt: (fr.eyeL.tilt || 0) * 0.5 }, glow, c.eye || '#FF2E4A', c.eyeCore || '#FFD0D6');
    else o += F.eye(-128, -716, 36, 52, { ...withBlinkE(fr.eyeL, fr.blink || 0), iris: c.kidIris || '#7A5AE0' }, 1, { sidePupil: -0.66 }) + F.mouth(fr.mouth, -150, -620, 0.45, 0.72) + S.ellipse(-120, -648, 20, 9, { fill: '#FF8FA3', opacity: 0.7 });
    return o;
  };
}
function darkHeadBack(style) {
  const c = style.col, spec = style.helm || {};
  return function headBack() {
    let o = helmetSpikes(ID, spec.spikes ?? 5, c.spike || '#3A3A46');
    if (spec.horns) for (const sx of [-1, 1]) o += S.path(`M${sx * 140} -820 Q${sx * 230} -840 ${sx * 250} -960 Q${sx * 200} -880 ${sx * 140} -880 Z`, outline(c.horn || '#D8D0C0', 5));
    return o + clipped(S.roundedPath([[-154, -912], [154, -912], [154, -556], [-154, -556]], 48), c.helm || c.top, S.path('M0 -912 L0 -556', lineOnly(8, c.armorHi)) + S.rect(-160, -920, 320, 30, 0, { fill: c.armorHi, opacity: 0.6 }), 7);
  };
}
// tattered cape (body space): front view = behind the body (an underlay), back view = over the back; side view trails behind
function tatteredCape(view, col, lining, t = 0, len = 470) {
  const sway = Math.sin(t * 2.2) * 10;
  if (view === 'side') {
    const d = `M-20 -540 Q90 -560 150 -520 Q200 -300 ${f(230 + sway)} ${f(-540 + len)} L${f(196 + sway)} ${f(-560 + len)} L${f(176 + sway)} ${f(-516 + len)} L${f(150 + sway)} ${f(-566 + len)} L${f(120 + sway)} ${f(-520 + len)} L${f(96 + sway)} ${f(-570 + len)} Q80 -300 40 -500 Z`;
    return S.path(d, outline(col, 6)) + S.path(`M40 -500 Q100 -300 ${f(130 + sway)} ${f(-580 + len)}`, lineOnly(5, lining));
  }
  const y1 = -540 + len;
  const jag = [[-150, y1 - 10], [-118, y1 + 26], [-90, y1 - 24], [-54, y1 + 30], [-20, y1 - 14], [16, y1 + 32], [52, y1 - 20], [88, y1 + 26], [118, y1 - 16], [150, y1 + 14]].map(([x, y]) => [x + sway * (0.5 + x / 300), y]);
  const d = `M-118 -540 L118 -540 Q150 -300 ${f(jag[9][0])} ${f(jag[9][1])} ` + jag.slice().reverse().map(([x, y]) => `L${f(x)} ${f(y)}`).join(' ') + ' Q-150 -300 -118 -540 Z';
  return S.path(d, outline(view === 'back' ? col : lining, 6)) + (view === 'back' ? S.path(`M-60 -520 Q-70 -300 ${f(-80 + sway * 0.5)} ${f(y1 - 20)} M60 -520 Q70 -300 ${f(80 + sway * 0.5)} ${f(y1 - 20)}`, lineOnly(5, lining)) : '');
}
// a plain (non-tattered) cape for the golden armour
function heroCape(view, col, lining, t = 0, len = 440) {
  const sway = Math.sin(t * 2) * 8;
  if (view === 'side') return S.path(`M-20 -540 Q90 -560 140 -520 Q190 -300 ${f(200 + sway)} ${f(-560 + len)} Q${f(140 + sway)} ${f(-540 + len)} ${f(80 + sway)} ${f(-560 + len)} Q70 -300 40 -500 Z`, outline(col, 6));
  const y1 = -540 + len;
  return S.path(`M-112 -540 L112 -540 Q150 -300 ${f(150 + sway)} ${f(y1)} Q0 ${f(y1 + 30)} ${f(-150 + sway)} ${f(y1)} Q-150 -300 -112 -540 Z`, outline(view === 'back' ? col : lining, 6)) +
    (view === 'back' ? S.path(`M-40 -520 Q-50 -300 ${f(-60 + sway)} ${f(y1)} M40 -520 Q50 -300 ${f(60 + sway)} ${f(y1)}`, lineOnly(5, lining)) : '');
}

// ====================================================================== THE HOT DOG COSTUME (DadBod1978)
// body space; the face is read from STATE.face (set by cast.draw.dadAvatar). c: bun, bunHi, bunDark, sausage, sausageHi, sausageShade, mustard, skin, stache
const HD = { sx: 126, sTop: -1150, sBot: -232, bx0: 100, bx1: 230, bTop: -1010, bBot: -262, holeX: 96, holeT: -862, holeB: -598 };
function mustardZig(x0, y0, y1, n, amp) {
  let d = `M${f(x0 - amp)} ${f(y0)}`;
  for (let i = 1; i <= n; i++) d += ` L${f(x0 + (i % 2 ? amp : -amp))} ${f(y0 + ((y1 - y0) * i) / n)}`;
  return d;
}
function hotdogFace(cx, c, face, headRot = 0) {
  const fr = F.resolveFace(face);
  const blink = fr.blink || 0;
  const hole = S.roundedPath([[cx - HD.holeX, HD.holeT], [cx + HD.holeX, HD.holeT], [cx + HD.holeX, HD.holeB], [cx - HD.holeX, HD.holeB]], 38);
  let inner = S.rect(cx - 140, HD.holeT - 20, 280, HD.holeB - HD.holeT + 40, 0, { fill: c.skin });
  let feat = '';
  feat += L.dotEye(cx - 46, -772, withBlinkE(fr.eyeL, blink), -1) + L.dotEye(cx + 46, -772, withBlinkE(fr.eyeR, blink), 1);
  feat += L.strokeBrows(([x, y]) => [cx + x * 0.66, y], -830, fr.brows, {}, c.stache || LINE, 12);
  feat += F.mouth(fr.mouth, cx, -646, 0.76, 0.82);
  feat += walrusFront([cx, -686], c, 0.68);
  inner += S.g(feat, headRot ? `rotate(${f(headRot * 0.5)} ${f(cx)} -700)` : null);
  // inner shadow of the costume rim
  inner += S.path(`M${f(cx - HD.holeX - 10)} ${HD.holeT - 10} L${f(cx + HD.holeX + 10)} ${HD.holeT - 10} L${f(cx + HD.holeX + 10)} ${HD.holeT + 18} Q${f(cx)} ${HD.holeT + 6} ${f(cx - HD.holeX - 10)} ${HD.holeT + 18} Z`, { fill: '#000', opacity: 0.22 });
  let o = S.path(S.roundedPath([[cx - HD.holeX - 14, HD.holeT - 14], [cx + HD.holeX + 14, HD.holeT - 14], [cx + HD.holeX + 14, HD.holeB + 14], [cx - HD.holeX - 14, HD.holeB + 14]], 46), outline(c.sausageShade, 6));
  o += clipped(hole, c.skin, inner, 6);
  return o + S.g(F.faceFx(fr.fx, { fx: 0 }), `translate(${f(cx)} 60) scale(0.8)`);
}
function bunHalf(x0, x1, y0, y1, c, sx, shade) {
  // a tall rounded roll; sx = side (-1 left, +1 right): the toasted inner edge faces the sausage
  const d = S.roundedPath([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], Math.min(70, (x1 - x0) / 2));
  const inEdge = sx > 0 ? x0 : x1;
  let inner = S.rect(Math.min(x0, x1) - 10, y0 - 10, Math.abs(x1 - x0) + 20, y1 - y0 + 20, 0, { fill: c.bun });
  inner += S.rect(inEdge - (sx > 0 ? 6 : 26), y0, 32, y1 - y0, 0, { fill: c.bunDark });
  if (shade) {
    const outEdge = sx > 0 ? x1 : x0;
    inner += S.path(`M${f(outEdge - sx * 30)} ${f(y0 + 60)} Q${f(outEdge - sx * 34)} ${f((y0 + y1) / 2)} ${f(outEdge - sx * 30)} ${f(y1 - 60)}`, lineOnly(22, c.bunHi));
    inner += S.rect(Math.min(x0, x1) - 10, y1 - 40, Math.abs(x1 - x0) + 20, 50, 0, { fill: c.bunDark, opacity: 0.6 });
  }
  return clipped(d, c.bun, inner, 7);
}
function hotdogTorso(style) {
  const c = style.col;
  return function torso(t, shade, back = false) {
    const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
    const cx = back ? 0 : dir * at * 46;
    let o = '';
    // sausage
    const sd = S.roundedPath([[cx - HD.sx, HD.sTop], [cx + HD.sx, HD.sTop], [cx + HD.sx, HD.sBot], [cx - HD.sx, HD.sBot]], HD.sx);
    let si = S.rect(cx - 200, HD.sTop - 20, 400, HD.sBot - HD.sTop + 40, 0, { fill: c.sausage });
    if (shade) si += S.rect(cx + HD.sx - 52, HD.sTop, 60, HD.sBot - HD.sTop, 0, { fill: c.sausageShade }) + S.path(`M${f(cx - HD.sx + 34)} ${HD.sTop + 90} L${f(cx - HD.sx + 34)} ${HD.sBot - 90}`, lineOnly(16, c.sausageHi));
    if (back) si += S.path(`M${cx} ${HD.sTop + 140} L${cx} ${HD.sBot - 60}`, lineOnly(8, LINE)) + S.path(`M${cx} ${HD.sTop + 140} L${cx} ${HD.sBot - 60}`, { ...lineOnly(4, '#C9CED8'), 'stroke-dasharray': '6 5' }) + S.rect(cx - 10, HD.sTop + 120, 20, 34, 6, outline('#C9CED8', 3.5));
    o += clipped(sd, c.sausage, si, 7);
    // mustard zigzags (front: above and below the face hole)
    const mz = (d) => S.path(d, lineOnly(34, LINE)) + S.path(d, lineOnly(22, c.mustard)) + S.path(d, { ...lineOnly(6, '#FFF3A0'), opacity: 0.8 });
    if (!back) o += mz(mustardZig(cx, -1096, -900, 4, 52)) + mz(mustardZig(cx, -560, -300, 5, 56));
    else o += mz(mustardZig(cx, -1090, -320, 14, 56));
    if (!back) {
      o += hotdogFace(cx, c, STATE.face, STATE.headRot);
      if (STATE.mvp) {
        o += S.path(`M${f(cx - 60)} -600 L${f(cx - 10)} -470 L${f(cx + 10)} -470 L${f(cx + 60)} -600 L${f(cx + 36)} -600 L${f(cx)} -508 L${f(cx - 36)} -600 Z`, outline('#E8453C', 4.5));
        o += S.circle(cx, -440, 52, outline('#FFC93C', 6)) + S.circle(cx, -440, 40, { fill: 'none', stroke: '#E09A00', 'stroke-width': 5 }) + txt('MVP', cx, -426, 38, '#FFFFFF', { stroke: '#B06A00', 'stroke-width': 6, 'paint-order': 'stroke' });
      }
    }
    // buns (the far one narrows with the turn)
    const kL = dir > 0 ? 1 : 1 - 0.3 * at, kR = dir > 0 ? 1 - 0.3 * at : 1;
    o += bunHalf(cx - HD.bx1 * kL, cx - HD.bx0, HD.bTop, HD.bBot, c, -1, shade) + bunHalf(cx + HD.bx0, cx + HD.bx1 * kR, HD.bTop, HD.bBot, c, 1, shade);
    if (!back) {
      // arm holes in the buns
      for (const sx of [-1, 1]) o += S.ellipse(cx + sx * 194, -566, 34, 22, { fill: c.bunDark, stroke: LINE, 'stroke-width': 4 });
    }
    return o;
  };
}
function hotdogTorsoSide(style) {
  const c = style.col;
  return function torsoSide(shade) {
    let o = '';
    const sd = S.roundedPath([[-150, HD.sTop], [96, HD.sTop], [96, HD.sBot], [-150, HD.sBot]], 120);
    o += clipped(sd, c.sausage, (shade ? S.rect(40, HD.sTop, 70, HD.sBot - HD.sTop, 0, { fill: c.sausageShade }) + S.path(`M-120 ${HD.sTop + 90} L-120 ${HD.sBot - 90}`, lineOnly(14, c.sausageHi)) : ''), 7);
    const mz = (d) => S.path(d, lineOnly(30, LINE)) + S.path(d, lineOnly(19, c.mustard));
    o += mz(mustardZig(-60, -1100, -900, 3, 40)) + mz(mustardZig(-100, -560, -310, 4, 30));
    // face hole on the front edge: profile of the avatar face
    const hole = S.roundedPath([[-162, HD.holeT], [-40, HD.holeT], [-40, HD.holeB], [-162, HD.holeB]], 34);
    const fr = F.resolveFace(STATE.face);
    let fin = S.rect(-200, HD.holeT - 20, 200, 300, 0, { fill: c.skin });
    fin += L.dotEye(-116, -768, { ...withBlinkE(fr.eyeL, fr.blink || 0), look: [-0.8, 0] }, 1);
    fin += F.mouth(fr.mouth, -136, -650, 0.45, 0.8) + S.path('M-104 -700 C-118 -718 -160 -716 -176 -690 Q-170 -672 -150 -676 Q-130 -668 -112 -684 Z', outline(c.stache, 5));
    fin += S.path(`M-200 ${HD.holeT - 10} L0 ${HD.holeT - 10} L0 ${HD.holeT + 16} L-200 ${HD.holeT + 16} Z`, { fill: '#000', opacity: 0.22 });
    o += S.path(S.roundedPath([[-174, HD.holeT - 12], [-28, HD.holeT - 12], [-28, HD.holeB + 12], [-174, HD.holeB + 12]], 40), outline(c.sausageShade, 6)) + clipped(hole, c.skin, fin, 6);
    if (STATE.mvp) o += S.circle(-110, -460, 44, outline('#FFC93C', 6)) + txt('MVP', -110, -448, 30, '#FFFFFF', { stroke: '#B06A00', 'stroke-width': 5, 'paint-order': 'stroke' });
    o += bunHalf(-62, 200, HD.bTop, HD.bBot, c, 1, shade);
    o += S.ellipse(20, -566, 30, 20, { fill: c.bunDark, stroke: LINE, 'stroke-width': 4 });
    return o;
  };
}

// ====================================================================== OVERLAYS (head space, used through a design's `over` hook)
// YOU's LVL-99 crown on top of the bob
function crown99(view, turn = 0, opts = {}) {
  const m = hm(turn);
  const [x, y] = view === 'side' ? [10, -1000] : view === 'back' ? [0, -1004] : m.hair([0, -1004]);
  const w = 92, h = 96;
  const d = `M${-w} 0 L${-w} ${-h * 0.62} L${-w * 0.55} ${-h * 0.25} L${-w * 0.28} ${-h} L0 ${-h * 0.38} L${w * 0.28} ${-h} L${w * 0.55} ${-h * 0.25} L${w} ${-h * 0.62} L${w} 0 Z`;
  let o = S.path(d, outline('#FFC93C', 7)) + S.path(`M${-w + 10} -18 L${w - 10} -18`, lineOnly(5, '#E09A00')) + S.path(`M${-w + 14} ${-h * 0.5} L${-w * 0.42} ${-h * 0.22}`, lineOnly(7, '#FFF2B0'));
  for (const [px, py, col] of [[-w * 0.28, -h, '#3BB8E8'], [w * 0.28, -h, '#FF4F7A'], [-w, -h * 0.62, '#7ED957'], [w, -h * 0.62, '#7ED957']]) o += S.circle(px, py, 11, outline(col, 4));
  if (view !== 'back') o += txt(opts.text || '99', 0, -24, 40, '#FFFFFF', { stroke: '#B06A00', 'stroke-width': 7, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${view === 'side' ? -8 : 8 + turn * 4})`);
}
// YOU's hood pulled over the bob (the "I'm a tree" gag)
function heroHood(view, turn = 0, col = '#D8262E', lining = '#9E1A20') {
  if (view === 'side') {
    const d = 'M-40 -548 L-46 -760 Q-120 -800 -200 -846 Q-196 -1000 -60 -1056 Q120 -1078 240 -962 Q292 -820 254 -600 Q160 -536 -40 -548 Z';
    return clipped(d, col, S.path('M-120 -1010 Q60 -1060 200 -960', lineOnly(16, '#FF6A6A')) + S.path('M-56 -560 L-60 -770 Q-130 -812 -206 -856', lineOnly(26, lining)), 7);
  }
  if (view === 'back') return clipped('M-262 -600 Q-280 -860 -200 -980 Q-100 -1060 0 -1062 Q100 -1060 200 -980 Q280 -860 262 -600 Q130 -560 0 -566 Q-130 -560 -262 -600 Z', col, S.path('M-160 -980 Q0 -1060 160 -980', lineOnly(16, '#FF6A6A')) + S.path('M0 -1050 L0 -600', lineOnly(5, lining)), 7);
  const m = hm(turn);
  const H = (x, y) => P(m.hair([x, y])), Fe = (x, y) => P(m.feat([x, y]));
  const d = `M${H(-262, -590)} Q${H(-290, -860)} ${H(-196, -986)} Q${H(-100, -1062)} ${H(0, -1064)} Q${H(100, -1062)} ${H(196, -986)} Q${H(290, -860)} ${H(262, -590)} L${Fe(158, -590)} L${Fe(160, -800)} Q${Fe(150, -880)} ${Fe(0, -888)} Q${Fe(-150, -880)} ${Fe(-160, -800)} L${Fe(-158, -590)} Z`;
  let inner = S.path(`M${Fe(-176, -590)} L${Fe(-178, -806)} Q${Fe(-160, -904)} ${Fe(0, -908)} Q${Fe(160, -904)} ${Fe(178, -806)} L${Fe(176, -590)}`, lineOnly(34, lining));
  inner += S.path(`M${H(-200, -940)} Q${H(-100, -1030)} ${H(0, -1036)}`, lineOnly(16, '#FF6A6A'));
  let o = clipped(d, col, inner, 7);
  for (const sx of [-1, 1]) { const a = m.feat([sx * 120, -596]); o += S.path(`M${f(a[0])} ${f(a[1])} Q${f(a[0] + sx * 6)} ${f(a[1] + 40)} ${f(a[0] - sx * 4)} ${f(a[1] + 78)}`, lineOnly(12, LINE)) + S.path(`M${f(a[0])} ${f(a[1])} Q${f(a[0] + sx * 6)} ${f(a[1] + 40)} ${f(a[0] - sx * 4)} ${f(a[1] + 78)}`, lineOnly(6, '#FFFFFF')) + S.rect(a[0] - sx * 4 - 6, a[1] + 74, 12, 18, 4, outline('#C9CED8', 3)); }
  return o;
}
// a big gaming headset (band + chunky cups + RGB ring + boom mic). earX = half the head width at the ears
// k 0..1: 1 = on the head, 0 = lifted 260 above (animate putting it on)
function gamingHeadset(view, turn = 0, opts = {}) {
  const { col = '#2A2A35', glow = '#3DF2FF', glow2 = '#FF4FD8', earX = 178, k = 1, mic = true, top = -1070 } = opts;
  const lift = (1 - clamp(k, 0, 1)) * 260;
  const m = hm(turn);
  let o = '';
  if (view === 'side') {
    o += S.path(`M${70} -780 Q86 ${top + 30} 4 ${top}`, lineOnly(32, LINE)) + S.path(`M${70} -780 Q86 ${top + 30} 4 ${top}`, lineOnly(20, col));
    o += S.path(S.roundedPath([[14, -830], [126, -830], [126, -640], [14, -640]], 46), outline(col, 7));
    o += S.circle(70, -735, 46, { fill: glow, opacity: 0.9 }) + S.circle(70, -735, 32, { fill: col }) + S.circle(70, -735, 14, { fill: glow2 });
    if (mic) o += band('M30 -680 Q-70 -610 -150 -628', 7, col) + S.ellipse(-158, -628, 18, 15, outline(glow2, 5));
    return lift ? S.g(o, `translate(0 ${f(-lift)})`) : o;
  }
  const a = view === 'back' ? [-earX, -770] : m.hair([-earX, -770]), b = view === 'back' ? [earX, -770] : m.hair([earX, -770]);
  const cyq = 2 * top - (a[1] + b[1]) / 2, cxq = (a[0] + b[0]) / 2;
  const bd = `M${P(a)} Q${f(cxq)} ${f(cyq)} ${P(b)}`;
  o += S.path(bd, lineOnly(36, LINE)) + S.path(bd, lineOnly(24, col)) + S.path(bd, { ...lineOnly(7, glow), pathLength: 100, 'stroke-dasharray': '0 30 40 100' });
  for (const p of [a, b]) {
    o += S.path(S.roundedPath([[p[0] - 42, p[1] - 86], [p[0] + 42, p[1] - 86], [p[0] + 42, p[1] + 86], [p[0] - 42, p[1] + 86]], 36), outline(col, 7));
    o += S.path(S.roundedPath([[p[0] - 24, p[1] - 62], [p[0] + 24, p[1] - 62], [p[0] + 24, p[1] + 62], [p[0] - 24, p[1] + 62]], 22), { fill: glow, opacity: 0.85 }) + S.path(S.roundedPath([[p[0] - 13, p[1] - 46], [p[0] + 13, p[1] - 46], [p[0] + 13, p[1] + 46], [p[0] - 13, p[1] + 46]], 12), { fill: glow2 });
    o += S.path(`M${f(p[0] - 30)} ${f(p[1] - 70)} L${f(p[0] - 30)} ${f(p[1] - 30)}`, lineOnly(6, '#FFFFFF66'));
  }
  if (mic && view !== 'back') { const e = m.feat([-84, -622]); o += band(`M${f(a[0] + 10)} ${f(a[1] + 70)} Q${f(a[0] + 20)} ${f(e[1] + 10)} ${P(e)}`, 7, col) + S.ellipse(e[0], e[1], 17, 15, outline(glow2, 5)); }
  return lift ? S.g(o, `translate(0 ${f(-lift)})`) : o;
}
// Dad's reading glasses: pos 'on' (on the eyes) | 'up' (pushed up on the forehead)
function readers(view, turn = 0, pos = 'up', col = '#6A3A22') {
  if (!pos || pos === 'off') return '';
  const m = hm(turn);
  const y = pos === 'on' ? -712 : -846;
  const lensFill = { fill: '#DDF4FF', 'fill-opacity': pos === 'on' ? 0.25 : 0.5, stroke: col, 'stroke-width': 8 };
  if (view === 'side') {
    if (pos === 'on') return S.path(`M-120 ${y - 18} L30 ${y - 26}`, lineOnly(7, col)) + S.rect(-180, y - 28, 46, 52, 12, lensFill);
    return S.path(`M-130 ${y + 4} L40 ${y - 20}`, lineOnly(7, col)) + S.g(S.rect(-186, y - 22, 46, 46, 12, lensFill), `rotate(-14 -160 ${y})`);
  }
  if (view === 'back') return pos === 'up' ? S.path(`M-150 ${y + 10} Q0 ${y - 30} 150 ${y + 10}`, lineOnly(7, col)) : '';
  const k = 1 - 0.15 * m.at;
  const eL = m.feat([-56, y]), eR = m.feat([56, y]);
  const w = 88 * k, h = pos === 'on' ? 58 : 50;
  const tilt = pos === 'up' ? -4 : 0;
  let o = '';
  for (const e of [eL, eR]) {
    o += S.rect(e[0] - w / 2, e[1] - h / 2, w, h, 16, lensFill);
    o += S.path(`M${f(e[0] - w * 0.3)} ${f(e[1] + h * 0.18)} L${f(e[0] - w * 0.08)} ${f(e[1] - h * 0.28)}`, lineOnly(6, '#FFFFFFCC'));
  }
  o += S.path(`M${f(eL[0] + w / 2)} ${f(y - 6)} Q${f((eL[0] + eR[0]) / 2)} ${f(y - 18)} ${f(eR[0] - w / 2)} ${f(y - 6)}`, lineOnly(7, col));
  for (const [e, sx] of [[eL, -1], [eR, 1]]) o += S.path(`M${f(e[0] + sx * w / 2)} ${f(y - 8)} L${f(e[0] + sx * (w / 2 + 26))} ${f(y - 14)}`, lineOnly(7, col));
  return tilt ? S.g(o, `rotate(${tilt} ${f(m.feat([0, y])[0])} ${y})`) : o;
}
// Grandma's night curlers
function curlers(view, turn = 0, cols = ['#FF8FC0', '#8FD0FF', '#FFE07A']) {
  const m = hm(turn);
  const spots = view === 'side'
    ? [[-110, -930, -30], [-30, -990, -10], [60, -994, 10], [140, -940, 40], [170, -840, 80], [70, -900, 20]]
    : view === 'back'
      ? [[-120, -960, -30], [0, -1010, 0], [120, -960, 30], [-60, -880, -10], [60, -880, 10], [-170, -840, -70], [170, -840, 70]]
      : [[-120, -966, -26], [0, -1004, 0], [120, -966, 26], [-180, -860, -70], [180, -860, 70], [-64, -914, -10], [64, -914, 10]];
  let o = '';
  spots.forEach(([x, y, a], i) => {
    const p = view === 'front' ? m.hair([x, y]) : [x, y];
    const col = cols[i % cols.length];
    o += S.g(S.rect(-40, -20, 80, 40, 14, outline(col, 5)) + S.path('M-20 -18 L-20 18 M0 -18 L0 18 M20 -18 L20 18', lineOnly(3.5, shadeHex(col, 0.8))) + S.rect(-46, -6, 92, 12, 5, outline('#FFFFFF', 3)), `translate(${P(p)}) rotate(${a})`);
  });
  return o;
}
// MOM_OFFICIAL's golden helmet (head space) with a red plume and cheek guards; her round glasses stay visible
function goldHelmet(view, turn = 0, c = {}) {
  const gold = c.gold || '#F2C230', hi = c.goldHi || '#FFE58A', sh = c.goldShade || '#C98E12', plume = c.plume || '#E8456A';
  const m = hm(turn);
  if (view === 'side') {
    let o = puffs([[60, -1080, 40], [120, -1060, 36], [170, -1020, 32], [200, -970, 26]], plume, 6);
    o += clipped('M-180 -830 Q-190 -980 -60 -1030 Q100 -1060 170 -960 Q200 -880 190 -700 L120 -690 L110 -820 Q20 -850 -180 -830 Z', gold, S.path('M-150 -900 Q-80 -1000 60 -1010', lineOnly(14, hi)) + S.path('M-180 -850 L200 -850', lineOnly(8, sh)), 7);
    return o + S.circle(-120, -846, 12, outline(c.gem || '#FF4F7A', 4));
  }
  const H = (x, y) => (view === 'back' ? [x, y] : m.hair([x, y]));
  const pl = H(0, -1040);
  let o = puffs([[pl[0], pl[1] - 40, 42], [pl[0] + 30, pl[1] - 80, 36], [pl[0] + 70, pl[1] - 96, 30], [pl[0] + 110, pl[1] - 90, 24]], plume, 6) + S.path(`M${f(pl[0] + 10)} ${f(pl[1] - 60)} Q${f(pl[0] + 60)} ${f(pl[1] - 100)} ${f(pl[0] + 110)} ${f(pl[1] - 90)}`, lineOnly(5, shadeHex(plume, 0.75)));
  const d = `M${P(H(-176, -700))} L${P(H(-176, -860))} Q${P(H(-170, -1030))} ${P(H(0, -1048))} Q${P(H(170, -1030))} ${P(H(176, -860))} L${P(H(176, -700))} L${P(H(146, -690))} L${P(H(142, -830))} Q${P(H(0, -852))} ${P(H(-142, -830))} L${P(H(-146, -690))} Z`;
  let inner = S.path(`M${P(H(-140, -920))} Q${P(H(-90, -1010))} ${P(H(20, -1020))}`, lineOnly(16, hi)) + S.path(`M${P(H(-180, -858))} Q${P(H(0, -880))} ${P(H(180, -858))}`, lineOnly(10, sh));
  if (view !== 'back') inner += S.path(`M${P(H(0, -1046))} L${P(H(0, -880))}`, lineOnly(6, sh));
  o += clipped(d, gold, inner, 7);
  if (view !== 'back') { const g = H(0, -866); o += S.path(F.heartPath(g[0], g[1] - 4, 16), outline(c.gem || '#FF4F7A', 4)); }
  return o;
}
// dizzy KO stars circling over a head (head space)
function dizzyStars(t = 0, n = 3, y = -1010, rx = 190) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = t * 4 + (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx, yy = y + Math.sin(a) * 40, sc = 0.8 + 0.3 * Math.sin(a);
    o += S.path(F.starPath(x, yy, 30 * sc, 13 * sc), outline('#FFD21F', 5));
  }
  return o;
}

// GrannyGoodies' fur stole across the shoulders (body space; front layer — it sits just under the chin)
function furStole(view, turn = 0, col = '#F6EDE0', shade = '#D2BFA6') {
  const cs = [];
  if (view === 'side') {
    for (let i = 0; i <= 5; i++) { const u = i / 5; cs.push([-70 + 150 * u, -540 + 30 * Math.sin(u * Math.PI), 30 + 6 * Math.sin(u * Math.PI)]); }
    cs.push([-80, -500, 26], [-86, -462, 22]);
  } else {
    const cx = view === 'back' ? 0 : turn * 30;
    for (let i = 0; i <= 8; i++) { const u = i / 8; cs.push([cx - 176 + 352 * u, -548 + (view === 'back' ? 20 : 50) * Math.sin(u * Math.PI), 30 + 6 * Math.sin(u * Math.PI)]); }
    if (view !== 'back') for (let i = 1; i <= 4; i++) cs.push([cx - 132 + i * 4, -540 + i * 40, 28 - i * 2]);
  }
  return puffs(cs, col, 6) + curlMarks(cs.filter((_, i) => i % 2 === 0), 26, 3.5, shade);
}

// ====================================================================== GAME NAMETAG (screen space; drawn by cast.js above a head)
// opts: { name, col, lvl (number|string), mvp, sub, alpha }
function gameTag(x, y, s, opts = {}) {
  const name = String(opts.name || '');
  if (!name) return '';
  const size = 44;
  const w = Math.max(120, name.length * size * 0.55 + 56);
  let o = S.rect(-w / 2, -size * 0.92, w, size * 1.32, size * 0.5, { fill: '#121426', opacity: f(opts.alpha ?? 0.62) });
  o += TF(name.replace(/&/g, '&amp;').replace(/</g, '&lt;'), 0, size * 0.18, size, opts.col || '#FFFFFF', { stroke: '#121426', 'stroke-width': 6, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
  if (opts.lvl !== undefined && opts.lvl !== null && opts.lvl !== false) {
    const lt = `LVL ${opts.lvl}`;
    const lw = lt.length * 17 + 30;
    o += S.g(S.rect(-lw / 2, -22, lw, 40, 14, outline('#FFC93C', 5)) + TF(lt, 0, 10, 28, '#5A3200'), `translate(${f(w / 2 + lw / 2 - 6)} ${f(-size * 0.92)}) rotate(6)`);
  }
  if (opts.mvp) o += S.g(S.path(F.starPath(0, 0, 40, 20), outline('#FFC93C', 6)) + TF('MVP', 0, 9, 21, '#5A3200'), `translate(${f(-w / 2 - 30)} ${f(-size * 0.3)}) rotate(-8)`);
  if (opts.sub) o += TF(opts.sub, 0, size * 1.0, 26, '#FFE58A', { stroke: '#121426', 'stroke-width': 6, 'paint-order': 'stroke' });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ====================================================================== LITE AVATARS (players / noobs / crowds): flat, no clips, no filters
// spec: { skin, shirt, sleeve, pants, shoe, hat, hatCol, hatCol2, hair, logo, logoCol, size, face: 'smile'|'cool'|..., blush }
const LITE = {
  headF: S.roundedPath([[-140, -890], [140, -890], [140, -559], [-140, -559]], 46),
  headS: S.roundedPath([[-165, -885], [150, -885], [150, -553], [-165, -553]], 44),
  armF: S.roundedPath([[-30, -18], [30, -18], [40, 268], [-40, 268]], 17),
  armS: S.roundedPath([[-40, -20], [40, -20], [40, 248], [-40, 248]], 18),
  sleeveF: S.roundedPath([[-30, -18, 17], [30, -18, 17], [34.6, 112, 0], [-34.6, 112, 0]]),
  sleeveS: S.roundedPath([[-40, -20, 18], [40, -20, 18], [40, 100, 0], [-40, 100, 0]]),
  torsoF: S.roundedPath([[-100, -533], [100, -533], [100, -306], [-100, -306]], 16),
  torsoS: S.roundedPath([[-62, -535], [70, -535], [70, -305], [-62, -305]], 16),
};
// hat / hair shapes, front (x shifted by the turn) — returns svg
function liteHat(kind, sp, fx, view, t) {
  const st = (fill, w = 7) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round' });
  const a = sp.hatCol || '#E8453C', b = sp.hatCol2 || shadeHex(a, 0.78);
  const X = (x) => f(x + fx * 0.4);
  const side = view === 'side', back = view === 'back';
  switch (kind) {
    case 'cap': {
      let o = S.path(`M${X(-150)} -870 Q${X(-150)} -1000 ${X(0)} -1004 Q${X(150)} -1000 ${X(150)} -870 Z`, st(a)) + S.circle(+X(0), -1004, 12, st(b, 5));
      if (side) o += S.path('M-150 -890 L-290 -876 Q-300 -856 -280 -852 L-140 -862 Z', st(b));
      else if (!back) o += S.path(`M${X(-160)} -874 Q${X(0)} -900 ${X(160)} -874 Q${X(150)} -846 ${X(0)} -846 Q${X(-150)} -846 ${X(-160)} -874 Z`, st(b));
      else o += S.rect(+X(-40), -900, 80, 26, 10, st(b, 5));
      return o;
    }
    case 'beanie':
      return S.path(`M${X(-152)} -860 Q${X(-156)} -1010 ${X(0)} -1016 Q${X(156)} -1010 ${X(152)} -860 Z`, st(a)) + S.rect(+X(-158), -884, 316, 46, 18, st(b)) + S.circle(+X(0), -1030, 30, st(sp.hatCol3 || '#FFFFFF'));
    case 'spiky': {
      let d = `M${X(-150)} -820 L${X(-160)} -940`;
      const pts = [[-130, -1010], [-90, -950], [-50, -1040], [-10, -960], [30, -1050], [70, -960], [110, -1020], [140, -940], [160, -930]];
      for (const [x, y] of pts) d += ` L${X(x)} ${y}`;
      d += ` L${X(150)} -820 L${X(130)} -860 L${X(60)} -840 L${X(10)} -870 L${X(-60)} -840 L${X(-130)} -860 Z`;
      return S.path(d, st(sp.hair || a));
    }
    case 'bob':
      return S.path(`M${X(-168)} -700 L${X(-176)} -900 Q${X(0)} -1030 ${X(176)} -900 L${X(168)} -700 L${X(130)} -710 L${X(124)} -830 Q${X(0)} -800 ${X(-124)} -830 L${X(-130)} -710 Z`, st(sp.hair || a));
    case 'afro':
      return L3.puffs([[+X(0), -950, 120], [+X(-120), -880, 70], [+X(120), -880, 70], [+X(-70), -1010, 70], [+X(70), -1010, 70]], sp.hair || a, 7);
    case 'pony':
      return S.path(`M${X(150)} -900 Q${X(250)} -900 ${X(240)} -720 Q${X(220)} -800 ${X(150)} -820 Z`, st(sp.hair || a)) + S.path(`M${X(-150)} -800 L${X(-156)} -900 Q${X(0)} -1000 ${X(156)} -900 L${X(150)} -800 Q${X(60)} -860 ${X(-40)} -840 Q${X(-110)} -840 ${X(-150)} -800 Z`, st(sp.hair || a));
    case 'tophat':
      return S.rect(+X(-96), -1130, 192, 250, 12, st(a)) + S.rect(+X(-96), -940, 192, 34, 0, st(b, 5)) + S.path(`M${X(-160)} -880 Q${X(0)} -900 ${X(160)} -880 L${X(160)} -862 L${X(-160)} -862 Z`, st(a));
    case 'crown': {
      const d = `M${X(-110)} -880 L${X(-120)} -990 L${X(-60)} -940 L${X(0)} -1020 L${X(60)} -940 L${X(120)} -990 L${X(110)} -880 Z`;
      return S.path(d, st('#FFC93C')) + S.circle(+X(0), -1020, 12, st('#FF4F7A', 4)) + S.circle(+X(-120), -990, 10, st('#3BB8E8', 4)) + S.circle(+X(120), -990, 10, st('#3BB8E8', 4));
    }
    case 'viking':
      return S.path(`M${X(-150)} -1000 Q${X(-230)} -1000 ${X(-250)} -1100 Q${X(-190)} -1050 ${X(-140)} -1040 Z M${X(150)} -1000 Q${X(230)} -1000 ${X(250)} -1100 Q${X(190)} -1050 ${X(140)} -1040 Z`, st('#F4EBD8')) +
        S.path(`M${X(-156)} -860 Q${X(-156)} -1040 ${X(0)} -1046 Q${X(156)} -1040 ${X(156)} -860 Z`, st('#AEB6C4')) + S.rect(+X(-160), -886, 320, 36, 10, st('#8A93A6', 5));
    case 'propeller': {
      const segs = ['#E8453C', '#FFD23F', '#3B82F6', '#3BD16F'];
      let o = S.path(`M${X(-150)} -870 Q${X(-150)} -1000 ${X(0)} -1004 Q${X(150)} -1000 ${X(150)} -870 Z`, st(segs[0]));
      o += S.path(`M${X(-50)} -998 Q${X(-60)} -930 ${X(-56)} -872 L${X(56)} -872 Q${X(60)} -930 ${X(50)} -998 Q${X(0)} -1008 ${X(-50)} -998 Z`, st(segs[1], 5));
      o += S.path(`M${X(-50)} -998 Q${X(-60)} -930 ${X(-56)} -872 L${X(-150)} -872 Q${X(-140)} -980 ${X(-50)} -998 Z`, st(segs[2], 5));
      if (!side) o += S.path(`M${X(-160)} -874 Q${X(0)} -900 ${X(160)} -874 Q${X(150)} -846 ${X(0)} -846 Q${X(-150)} -846 ${X(-160)} -874 Z`, st(segs[3]));
      else o += S.path('M-150 -890 L-290 -876 Q-300 -856 -280 -852 L-140 -862 Z', st(segs[3]));
      const sp2 = Math.cos((t || 0) * 22) * 110;
      o += S.rect(+X(-6), -1050, 12, 50, 4, st('#C9CED8', 4));
      o += S.ellipse(+X(0) - sp2 / 2, -1052, Math.abs(sp2 / 2) + 4, 14, st('#E8453C', 5)) + S.ellipse(+X(0) + sp2 / 2, -1052, Math.abs(sp2 / 2) + 4, 14, st('#3B82F6', 5)) + S.circle(+X(0), -1052, 12, st('#FFD23F', 4));
      return o;
    }
    case 'bunny':
      return S.path(`M${X(-80)} -880 Q${X(-130)} -1100 ${X(-70)} -1140 Q${X(-20)} -1100 ${X(-30)} -880 Z M${X(30)} -880 Q${X(20)} -1100 ${X(70)} -1140 Q${X(130)} -1100 ${X(80)} -880 Z`, st(a)) + S.path(`M${X(-70)} -900 Q${X(-90)} -1060 ${X(-66)} -1100 M${X(56)} -900 Q${X(76)} -1060 ${X(70)} -1100`, lineOnly(14, b));
    case 'catEars':
      return S.path(`M${X(-140)} -880 L${X(-120)} -1010 L${X(-40)} -900 Z M${X(140)} -880 L${X(120)} -1010 L${X(40)} -900 Z`, st(a)) + S.path(`M${X(-118)} -900 L${X(-110)} -970 L${X(-70)} -906 Z M${X(118)} -900 L${X(110)} -970 L${X(70)} -906 Z`, { fill: '#FF9FC0' }) + S.rect(+X(-150), -900, 300, 22, 10, st(b, 5));
    case 'headphones':
      return S.path(`M${X(-170)} -760 Q${X(0)} -1120 ${X(170)} -760`, lineOnly(28, LINE)) + S.path(`M${X(-170)} -760 Q${X(0)} -1120 ${X(170)} -760`, lineOnly(16, a)) + S.rect(+X(-196), -820, 56, 120, 24, st(b)) + S.rect(+X(140), -820, 56, 120, 24, st(b));
    case 'ninja':
      return S.rect(+X(-150), -880, 300, 50, 8, st(a)) + S.path(`M${X(150)} -860 Q${X(220)} -870 ${X(250)} -810 M${X(150)} -850 Q${X(210)} -830 ${X(220)} -770`, lineOnly(20, LINE)) + S.path(`M${X(150)} -860 Q${X(220)} -870 ${X(250)} -810 M${X(150)} -850 Q${X(210)} -830 ${X(220)} -770`, lineOnly(11, a));
    default: return '';
  }
}
function liteFace(face, sp, fx, t) {
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
  if (sp.face === 'cool') o += S.path(`M${f(-120 + fx)} -748 L${f(120 + fx)} -748 L${f(110 + fx)} -700 Q${f(60 + fx)} -680 ${f(14 + fx)} -706 L${f(-14 + fx)} -706 Q${f(-60 + fx)} -680 ${f(-110 + fx)} -700 Z`, outline('#1B1B24', 5)) + S.path(`M${f(-90 + fx)} -736 l30 0`, lineOnly(6, '#FFFFFF88'));
  else o += eye(-50 + fx, -722, fr.eyeL) + eye(50 + fx, -722, fr.eyeR);
  if (sp.brows) o += S.path(`M${f(-80 + fx)} ${-790 + (fr.brows.L || [0, 0])[1] * 0.6} L${f(-24 + fx)} ${-786 + (fr.brows.L || [0, 0])[0] * 0.6} M${f(80 + fx)} ${-790 + (fr.brows.R || [0, 0])[1] * 0.6} L${f(24 + fx)} ${-786 + (fr.brows.R || [0, 0])[0] * 0.6}`, lineOnly(10));
  if (sp.blush) o += S.ellipse(-86 + fx, -640, 24, 11, { fill: '#FF8FA3', opacity: 0.6 }) + S.ellipse(86 + fx, -640, 24, 11, { fill: '#FF8FA3', opacity: 0.6 });
  const name = typeof face === 'string' ? face : face && face.name;
  const mouth = (face && typeof face === 'object' && face.mouth) || (!name || name === 'neutral' ? (sp.mouth || 'smile') : fr.mouth);
  o += F.mouth(mouth, fx, -610, 0.9, 0.9);
  o += F.faceFx(fr.fx, { fx });
  return o;
}
function liteDesign(sp) {
  const st = (fill, w = 7) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round' });
  const skin = st(sp.skin), shirt = st(sp.shirt), sleeve = st(sp.sleeve || sp.shirt), pants = st(sp.pants), shoe = st(sp.shoe || shadeHex(sp.pants, 0.62));
  const tall = ['tophat', 'bunny', 'viking', 'propeller', 'afro'].includes(sp.hat);
  const logo = (cx, y, k) => {
    const lc = sp.logoCol || '#FFFFFF';
    switch (sp.logo) {
      case 'star': return S.path(F.starPath(cx, y, 34 * k, 15 * k), outline(lc, 5));
      case 'heart': return S.path(F.heartPath(cx, y, 24 * k), outline(lc, 5));
      case 'bolt': return S.g(S.path('M8 -36 L-20 6 L0 6 L-8 36 L22 -8 L2 -8 Z', outline(lc, 5)), `translate(${f(cx)} ${y}) scale(${f(k)} 1)`);
      case 'stripe': return S.rect(-100, y - 16, 200, 32, 0, st(lc, 5));
      case 'num': return txt(sp.num || '7', cx, y + 26, 76, lc, { stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' });
      default: return '';
    }
  };
  const feetF = (J, back) => S.g(S.path(S.roundedPath([[-44, -4], [94, -4], [94, 40], [-44, 40]], 14), shoe), `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  return {
    style: { lite: true, size: sp.size || 1 },
    dims: { size: sp.size || 1, nametagY: tall ? -1180 : -1040 },
    defaults: { volume: false },
    leg: ({ J, back }) => S.path(bentLimb(J, [42, 46, 54], [40, 40, 40], 24).d, pants) + feetF(J, back),
    legSide: ({ J }) => S.path(bentLimb(J, [62, 64, 68], [56, 58, 62], 24).d, pants) + S.g(S.path(S.roundedPath([[-138, -4], [88, -4], [88, 42], [-138, 42]], 16), shoe), `translate(${P(J.ankle)}) rotate(${f(J.foot)})`),
    arm: ({ view, dim }) => S.path(view === 'side' ? LITE.armS : LITE.armF, skin) + (sp.sleeveLen === 0 ? '' : S.path(view === 'side' ? LITE.sleeveS : LITE.sleeveF, sleeve)) + (dim ? S.path(view === 'side' ? LITE.armS : LITE.armF, { fill: '#000', opacity: 0.12 }) : ''),
    torso: (t, shade, back) => { const cx = (t || 0) * 30; return S.path(LITE.torsoF, shirt) + (back ? '' : logo(cx, -430, 1 - 0.12 * Math.abs(t || 0))) + (sp.belt ? S.rect(-100, -340, 200, 22, 0, st(sp.belt, 5)) : ''); },
    torsoSide: () => S.path(LITE.torsoS, shirt) + (sp.logo === 'stripe' ? S.rect(-62, -446, 132, 32, 0, st(sp.logoCol || '#FFFFFF', 5)) : ''),
    head: (face, t) => {
      const fx = (t || 0) * 40;
      const behindHat = sp.hat === 'pony' || sp.hat === 'afro' || sp.hat === 'bunny' ? liteHat(sp.hat, sp, fx, 'front', STATE.t) : '';
      const hdr = S.path(LITE.headF, skin);
      const hat = sp.hat && !behindHat ? liteHat(sp.hat, sp, fx, 'front', STATE.t) : '';
      return (sp.hat === 'afro' || sp.hat === 'pony' ? behindHat : '') + hdr + (sp.hat === 'bunny' ? behindHat : '') + hat + liteFace(face, sp, fx, STATE.t) +
        (sp.hat === 'afro' ? L3.puffs([[fx * 0.4 - 90, -880, 40], [fx * 0.4, -896, 44], [fx * 0.4 + 90, -880, 40]], sp.hair || sp.hatCol, 7) : '');
    },
    headSide: (face) => {
      const fr = F.resolveFace(face);
      let o = S.path(LITE.headS, skin);
      if (sp.hat) o += S.g(liteHat(sp.hat, sp, 0, 'side', STATE.t), 'translate(6 0) scale(0.94 1)');
      if (sp.face === 'cool') o += S.path('M-170 -748 L-60 -748 L-70 -700 L-166 -704 Z', outline('#1B1B24', 5)) + S.path('M-60 -740 L40 -746', lineOnly(6, '#1B1B24'));
      else o += S.ellipse(-122, -722, 15, 22, { fill: LINE }) + S.circle(-128, -730, 5, { fill: '#FFFFFF' });
      return o + F.mouth((face && face.mouth) || (fr.mouth === 'line' ? (sp.mouth || 'smile') : fr.mouth), -132, -610, 0.5, 0.9);
    },
    headBack: () => S.path(LITE.headF, skin) + (sp.hat ? liteHat(sp.hat, sp, 0, 'back', STATE.t) : ''),
  };
}

// ====================================================================== THE BLOCK KING (non-rig boss; body space, feet at 0, ≈ 1220 tall at s 1)
const BK = {
  stone: ['#8E929C', '#959AA4', '#868A95', '#9A9EA8'], hi: '#B8BCC6', sh: '#6A6E79', crack: '#3A3C46', moss: '#6DBE45', mossD: '#4E9A32',
  glow: '#B65CFF', glowCore: '#F2DBFF', gold: '#FFC93C', goldSh: '#E09A00', gem: '#B65CFF', gem2: '#FF4F7A',
};
// one stone cube centred at (x, y), rotated rot; returns svg. opts { crack: 0..1 glowing crack, moss: 0..1, seed, dark }
function bkCube(x, y, w, h, rot, lw, opts = {}) {
  const seed = opts.seed || 0;
  const base = opts.dark ? '#5A5E68' : BK.stone[Math.floor(hash(seed + 0.3) * BK.stone.length) % BK.stone.length];
  const r = Math.min(w, h) * 0.13, i = lw / 2;
  let o = S.rect(-w / 2, -h / 2, w, h, r, { fill: base, stroke: LINE, 'stroke-width': lw, 'stroke-linejoin': 'round' });
  o += S.path(S.roundedPath([[-w / 2 + i, -h / 2 + i, r], [w / 2 - i, -h / 2 + i, r], [w / 2 - i - w * 0.04, -h / 2 + h * 0.2, 0], [-w / 2 + i + w * 0.04, -h / 2 + h * 0.2, 0]]), { fill: opts.dark ? '#73777F' : BK.hi });
  o += S.path(S.roundedPath([[w / 2 - i - w * 0.15, -h / 2 + h * 0.2, 0], [w / 2 - i, -h / 2 + h * 0.2, 0], [w / 2 - i, h / 2 - i, r], [w / 2 - i - w * 0.15, h / 2 - i, 0]]), { fill: opts.dark ? '#494C55' : BK.sh });
  if (hash(seed + 1.7) > 0.45 || opts.crack > 0) {
    const sx = hash(seed + 2.1) > 0.5 ? 1 : -1;
    const d = `M${f(sx * w * 0.42)} ${f(-h * 0.3)} L${f(sx * w * 0.18)} ${f(-h * 0.1)} L${f(sx * w * 0.26)} ${f(h * 0.08)} L${f(sx * w * 0.02)} ${f(h * 0.26)}`;
    o += S.path(d, lineOnly(Math.max(2.5, lw * 0.7), BK.crack));
    if (opts.crack > 0) o += S.path(d + ` M${f(sx * w * 0.18)} ${f(-h * 0.1)} L${f(-sx * w * 0.12)} ${f(-h * 0.26)} M${f(sx * w * 0.02)} ${f(h * 0.26)} L${f(-sx * w * 0.2)} ${f(h * 0.4)}`, { ...lineOnly(Math.max(2, lw * 0.55 + 6 * opts.crack), BK.glow), opacity: f(0.5 + 0.5 * opts.crack) }) + S.path(d, lineOnly(Math.max(1.5, lw * 0.3), BK.glowCore));
  }
  if (opts.moss) {
    const cs = [[-w * 0.36, -h / 2, w * 0.13], [-w * 0.14, -h / 2 - 4, w * 0.16], [w * 0.1, -h / 2, w * 0.12]];
    o += L3.puffs(cs, BK.moss, lw) + S.path(`M${f(-w * 0.3)} ${f(-h / 2 + 6)} q4 ${f(h * 0.22)} -6 ${f(h * 0.36)}`, lineOnly(Math.max(3, lw * 0.9), BK.mossD));
  }
  return S.g(o, `translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}`);
}
const BK_POSES = {
  idle: () => ({}),
  rise: () => ({ armL: 104, armR: 104, bendL: 38, bendR: 38, headY: -12, jaw: 0.45 }),
  smash: (k = 0) => ({ armL: S.lerp(168, 6, k), armR: S.lerp(168, 6, k), bendL: S.lerp(4, -8, k), bendR: S.lerp(4, -8, k), fist: S.lerp(1, 1.2, k), bodyY: 40 * k, headY: 18 * k, jaw: 0.3 + 0.5 * k }),
  roar: () => ({ armL: 72, armR: 72, bendL: 84, bendR: 84, headY: -18, lean: -3, jaw: 1 }),
  hit: () => ({ armL: 48, armR: 128, bendL: 30, bendR: -24, lean: -7, headRot: -12, jaw: 0.35, hurt: 1 }),
};
function blockKing(p = {}) {
  const pre = (BK_POSES[p.pose] || BK_POSES.idle)(p.k ?? 0);
  const q = { armL: 16, armR: 16, bendL: 10, bendR: 10, lean: 0, headRot: 0, headY: 0, bodyY: 0, fist: 1, hurt: 0, ...pre };
  // a named preset keeps its arms (auto-acting gestures from actor('boss') must not break 'smash'/'roar'); freeArms: true lets armL.. through.
  // bodyY / headY / headRot always add on top (voice bob)
  const named = p.pose && p.pose !== 'idle' && !p.freeArms;
  for (const kk of ['armL', 'armR', 'bendL', 'bendR', 'lean', 'fist', 'hurt']) if (p[kk] !== undefined && !(named && kk !== 'fist' && kk !== 'hurt')) q[kk] = p[kk];
  for (const kk of ['headRot', 'headY', 'bodyY']) if (p[kk] !== undefined) q[kk] += p[kk];
  const t = p.t || 0;
  const idle = p.idle === false ? 0 : 1;
  q.bodyY += idle * 8 * Math.sin(t * 1.6);
  q.armL += idle * 3 * Math.sin(t * 1.6 + 0.5); q.armR += idle * 3 * Math.sin(t * 1.6 + 1.1);
  const lw = p.lw ?? clamp(14 / (p.s || 1), 3, 10);
  const crack = clamp(p.crack || 0, 0, 1);
  const burst = clamp((crack - 0.55) / 0.45, 0, 1);
  // face: jaw follows the voice (face.mouth viseme), else the pose
  const fo = p.face && typeof p.face === 'object' ? p.face : { name: p.face || 'angry' };
  const fr = F.resolveFace(fo);
  const talkJaw = fo.mouth ? (MOUTH_OPEN[fo.mouth] ?? 0) : null;
  const jaw = clamp(p.jaw ?? (talkJaw !== null && talkJaw > 0 ? Math.max(talkJaw, pre.jaw ? pre.jaw * 0.6 : 0) : (pre.jaw ?? 0)), 0, 1);
  const glow = clamp((p.glow ?? 1) * (0.75 + 0.25 * Math.sin(t * 5)) + jaw * 0.3, 0, 1.4);
  const shield = clamp(p.shield ?? 0, 0, 1);
  let n = 0;
  // per-cube burst offset: pushes cubes away from the chest centre when cracking apart
  const cube = (x, y, w, h, rot, o2 = {}) => {
    const sd = (o2.seed ?? n++) * 1.37;
    let bx = 0, by = 0, br = 0;
    if (burst > 0) { const dx = x, dy = y + 600, l = Math.hypot(dx, dy) || 1; const m = burst * (120 + 160 * hash(sd + 4)); bx = (dx / l) * m + (hash(sd + 5) - 0.5) * 80 * burst; by = (dy / l) * m - 60 * burst; br = (hash(sd + 6) - 0.5) * 70 * burst; }
    const cr = crack > 0 && hash(sd + 9) < crack * 1.2 ? crack : 0;
    return bkCube(x + bx, y + by, w, h, rot + br, lw, { ...o2, seed: sd, crack: cr });
  };
  let legs = '';
  for (const sx of [-1, 1]) legs += cube(sx * 118, -218, 150, 150, sx * 2) + cube(sx * 128, -72, 186, 144, 0);
  legs += cube(-150, -330, 150, 112, -3) + cube(150, -330, 150, 112, 3) + cube(0, -336, 160, 116, 0);
  // arms (front view: 0 = hanging, 90 = out to the side, 180 = up; bend raises the forearm)
  const arm = (sx, a, bend) => {
    const rad = (d) => (d * Math.PI) / 180;
    const dir = (ang) => [sx * Math.sin(rad(ang)), Math.cos(rad(ang))];
    const sh = [sx * 336, -772];
    const u = dir(a), rotU = -sx * a;
    const el = [sh[0] + u[0] * 320, sh[1] + u[1] * 320];
    const a2 = a + bend, v = dir(a2), rotV = -sx * a2;
    let o = cube(sh[0] + u[0] * 120, sh[1] + u[1] * 120, 156, 150, rotU) + cube(sh[0] + u[0] * 250, sh[1] + u[1] * 250, 148, 140, rotU);
    o += cube(el[0] + v[0] * 96, el[1] + v[1] * 96, 144, 134, rotV) + cube(el[0] + v[0] * 210, el[1] + v[1] * 210, 150, 136, rotV);
    const fk = q.fist;
    const fc = [el[0] + v[0] * (330 + 40 * (fk - 1)), el[1] + v[1] * (330 + 40 * (fk - 1))];
    // the giant fist: a big cube with knuckle grooves and a thumb block
    let fist = bkCube(0, 0, 236 * fk, 214 * fk, 0, lw, { seed: sx * 7 + 3, crack: crack > 0.3 ? crack : 0 });
    fist += S.path(`M${f(-60 * fk)} ${f(40 * fk)} L${f(-60 * fk)} ${f(104 * fk)} M0 ${f(40 * fk)} L0 ${f(104 * fk)} M${f(60 * fk)} ${f(40 * fk)} L${f(60 * fk)} ${f(104 * fk)}`, lineOnly(Math.max(3, lw * 0.9), BK.crack));
    fist += bkCube(-sx * 122 * fk, -10 * fk, 70 * fk, 120 * fk, 0, lw, { seed: sx * 11 });
    let bx = 0, by = 0;
    if (burst > 0) { bx = sx * burst * 260; by = -burst * 120; }
    o += S.g(fist, `translate(${f(fc[0] + bx)} ${f(fc[1] + by)}) rotate(${f(rotV + (burst ? sx * 30 * burst : 0))})`);
    return o;
  };
  let torso = '';
  // chest: 3 x 3 grid, the centre one is the core socket
  const CH = [[-172, -455], [0, -458], [172, -455], [-176, -602], [176, -602], [-170, -748], [0, -752], [170, -748]];
  CH.forEach(([x, y], i) => { torso += cube(x, y, 178, 150, (hash(i * 3.3) - 0.5) * 4, { moss: i === 5 ? 1 : 0 }); });
  torso += cube(0, -604, 178, 150, 0, { dark: true });
  // the glowing core (shield charge)
  const cg = 0.55 + 0.45 * shield;
  const cc = [0 + (burst ? 0 : 0), -604];
  torso += S.circle(cc[0], cc[1], 190, { fill: BK.glow, opacity: f(0.08 * cg * glow) }) + S.circle(cc[0], cc[1], 120, { fill: BK.glow, opacity: f(0.18 * cg * glow) }) + S.circle(cc[0], cc[1], 72, { fill: BK.glow, opacity: f(0.35 * cg * glow) });
  torso += S.path(`M${cc[0]} ${cc[1] - 66} L${cc[0] + 46} ${cc[1]} L${cc[0]} ${cc[1] + 66} L${cc[0] - 46} ${cc[1]} Z`, { fill: BK.glow, stroke: LINE, 'stroke-width': lw }) + S.path(`M${cc[0]} ${cc[1] - 54} L${cc[0] + 18} ${cc[1]} L${cc[0]} ${cc[1] + 50} L${cc[0] - 30} ${cc[1]} Z`, { fill: BK.glowCore, opacity: f(0.7 + 0.3 * Math.sin(t * 6)) });
  if (shield > 0) torso += S.circle(cc[0], cc[1], 96 + 10 * Math.sin(t * 4), { fill: 'none', stroke: BK.glowCore, 'stroke-width': f(lw * 1.2), opacity: f(0.6 * shield) });
  // arms behind the shoulders, shoulders on top
  torso += arm(-1, q.armL, q.bendL) + arm(1, q.armR, q.bendR);
  torso += cube(-336, -772, 214, 200, -4, { moss: 1, seed: 40 }) + cube(336, -772, 214, 200, 4, { moss: 1, seed: 41 });
  // head: brow block + glowing eyes + dropping jaw + crown
  const hb = burst ? [0, -burst * 260] : [0, 0];
  let head = '';
  const jawY = -846 + jaw * 96;
  head += S.rect(-118, -880, 236, jaw * 96 + 40, 14, { fill: '#1A1024', stroke: LINE, 'stroke-width': lw });
  head += S.rect(-100, -872, 200, jaw * 96 + 24, 12, { fill: BK.glow, opacity: f(0.35 * glow * (0.3 + jaw)) });
  head += bkCube(0, jawY, 270, 86, 0, lw, { seed: 51 });
  for (const x of [-80, -28, 28, 80]) head += S.rect(x - 16, jawY - 62, 32, 34, 6, { fill: '#C9CCD4', stroke: LINE, 'stroke-width': lw * 0.7 });
  head += bkCube(0, -990, 330, 250, 0, lw, { seed: 50, moss: 0.6, crack: crack > 0.2 ? crack : 0 });
  for (const x of [-92, -30, 30, 92]) head += S.rect(x - 16, -872, 32, 30, 6, { fill: '#C9CCD4', stroke: LINE, 'stroke-width': lw * 0.7 });
  head += S.path('M-160 -1020 L160 -1020 L150 -986 L20 -1000 L0 -980 L-20 -1000 L-150 -986 Z', { fill: '#5A5E68', stroke: LINE, 'stroke-width': lw * 0.8 });
  const blink = fr.blink || 0;
  const hurt = q.hurt;
  for (const sx of [-1, 1]) {
    const ex = sx * 82, ey = -958;
    head += S.ellipse(ex, ey, 96, 56, { fill: BK.glow, opacity: f(0.12 * glow) }) + S.ellipse(ex, ey, 64, 36, { fill: BK.glow, opacity: f(0.24 * glow) });
    const ty = (fr.eyeL || {}).type;
    if (hurt > 0.5 || ty === 'x' || ty === 'swirl') head += S.path(`M${ex - 26} ${ey - 20} L${ex + 26} ${ey + 20} M${ex + 26} ${ey - 20} L${ex - 26} ${ey + 20}`, lineOnly(lw * 1.6, BK.glowCore)) + S.path(`M${ex - 26} ${ey - 20} L${ex + 26} ${ey + 20} M${ex + 26} ${ey - 20} L${ex - 26} ${ey + 20}`, lineOnly(lw * 0.8, BK.glow));
    else if (blink > 0.6) head += S.path(`M${ex - 40} ${ey} L${ex + 40} ${ey}`, lineOnly(lw * 1.4, BK.glow));
    else if ((fr.eyeL || {}).pupil !== undefined && fr.eyeL.pupil < 0.8) head += S.circle(ex, ey, 30, { fill: BK.glow, stroke: LINE, 'stroke-width': lw * 0.8 }) + S.circle(ex, ey, 14, { fill: BK.glowCore });
    else head += S.path(`M${ex - sx * 50} ${ey - 4} L${ex + sx * 46} ${ey - 26} L${ex + sx * 40} ${ey + 16} L${ex - sx * 44} ${ey + 20} Z`, { fill: BK.glow, stroke: LINE, 'stroke-width': lw * 0.8 }) + S.path(`M${ex - sx * 30} ${ey + 4} L${ex + sx * 30} ${ey - 10}`, lineOnly(lw * 1.1, BK.glowCore));
  }
  // the crown (tilted)
  const cw = 150, chh = 130;
  let cr = S.path(`M${-cw} 0 L${-cw} ${-chh * 0.6} L${-cw * 0.6} ${-chh * 0.3} L${-cw * 0.3} ${-chh} L0 ${-chh * 0.4} L${cw * 0.3} ${-chh} L${cw * 0.6} ${-chh * 0.3} L${cw} ${-chh * 0.6} L${cw} 0 Z`, { fill: BK.gold, stroke: LINE, 'stroke-width': lw, 'stroke-linejoin': 'round' });
  cr += S.rect(-cw + lw, -34, 2 * cw - 2 * lw, 22, 4, { fill: BK.goldSh }) + S.path(`M${-cw + 20} ${-chh * 0.5} L${-cw * 0.45} ${-chh * 0.26}`, lineOnly(lw * 1.1, '#FFF2B0'));
  for (const [x, y, c2] of [[-cw * 0.3, -chh, BK.gem], [cw * 0.3, -chh, BK.gem], [-cw, -chh * 0.6, BK.gem2], [cw, -chh * 0.6, BK.gem2], [0, -60, BK.gem]]) cr += S.circle(x, y, 16, { fill: c2, stroke: LINE, 'stroke-width': lw * 0.8 });
  head += S.g(cr, `translate(-10 -1106) rotate(${f(-7 + (burst ? 40 * burst : 0))})${burst ? ` translate(${f(burst * 120)} ${f(-burst * 300)})` : ''}`);
  torso += S.g(head, `translate(${f(hb[0])} ${f(q.headY + hb[1])}) rotate(${f(q.headRot)} 0 -860) translate(0 -850) scale(1.2) translate(0 850)`);
  let out = legs + S.g(torso, `translate(0 ${f(q.bodyY)}) rotate(${f(q.lean)} 0 -330)`);
  // falling debris while cracking
  if (crack > 0.1) {
    let deb = '';
    for (let i = 0; i < 6; i++) { const x = (hash(i * 4.1) - 0.5) * 700, y = -900 + hash(i * 2.3) * 700 + ((t * 300 + i * 120) % 500) * crack; deb += bkCube(x, y, 40 + 30 * hash(i), 40 + 30 * hash(i), t * 90 + i * 40, lw * 0.8, { seed: i + 90 }); }
    out += deb;
  }
  // rising out of the ground: shift down and cut at y = 0
  const rise = p.rise ?? 1;
  if (rise < 1) {
    const id = S.uid('bkr');
    out = S.clipDef(id, S.rect(-3000, -4000, 6000, 4000)) + S.g(S.g(out, `translate(0 ${f((1 - rise) * 1250)})`), null, { 'clip-path': `url(#${id})` });
  }
  return out;
}

module.exports = {
  dress6, makeTorso6, makeTorsoSide6, makeArm6, makeLeg6, makeLegSide6, outfit6, TOPS6, STATE, APRON_GG,
  noodleHead, noodleHeadSide, noodleHeadBack, darkHead, darkHeadSide, darkHeadBack, tatteredCape, heroCape,
  hotdogTorso, hotdogTorsoSide, HD, crown99, heroHood, gamingHeadset, readers, curlers, goldHelmet, dizzyStars, gameTag,
  furStole, liteDesign, liteHat, blockKing, bkCube, BK_POSES, BK, MOUTH_OPEN, cookieIcon, rosette, nigiri, maki, flower, walrusFront, shadeHex, mixHex, band,
};
