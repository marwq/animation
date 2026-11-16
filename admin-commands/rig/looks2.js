// New looks for the Robux video cast: hair styles, mid eyes with irises, head accessories, outfits.
// Registers itself into looks.js (HAIR, outfit hooks) so the generic R6 head/torso pick them up.
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const L = require('./looks');
const { f } = S;

const SW = C.lineW;
const LINE = C.line;
const outline = (fill, w = SW) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const lineOnly = (w = SW, color = LINE) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const P = (p) => `${f(p[0])} ${f(p[1])}`;
const poly = (pts, r = 6) => S.roundedPath(pts, r);
const mapPoly = (fn, pts, r) => poly(pts.map(fn), r);

function curls(hair, pts, col, r = 26) {
  let o = '';
  for (const [x, y, k] of pts) {
    const p = hair([x, y]);
    o += S.circle(p[0], p[1], r * (k || 1), outline(col, 6));
    o += S.path(`M${f(p[0] - r * 0.45 * (k || 1))} ${f(p[1] + 2)} Q${f(p[0])} ${f(p[1] - r * 0.55 * (k || 1))} ${f(p[0] + r * 0.4 * (k || 1))} ${f(p[1] + 4)}`, lineOnly(4.5));
  }
  return o;
}

Object.assign(L.HAIR, {
  // Ty: knit beanie with a fold-up cuff, black curls escaping underneath
  beanie: {
    browY: -778, nametagY: -1140, fill: 'hat',
    behind(hair, feat, c) {
      return curls(hair, [[-150, -792, 1], [-162, -752, 0.9], [-150, -716, 0.75], [150, -792, 1], [164, -754, 0.9], [150, -718, 0.75]], c.hair, 28);
    },
    front(hair) {
      return mapPoly(hair, [[-160, -808], [-162, -866], [-146, -936], [-104, -994], [-36, -1026], [36, -1026], [104, -994], [146, -936], [162, -866], [160, -808]], 14);
    },
    details(hair, feat, c, shade) {
      let o = '';
      // knit ribs on the dome
      for (let x = -120; x <= 120; x += 30) o += S.path(`M${P(hair([x, -868]))} Q${P(hair([x * 0.8, -960]))} ${P(hair([x * 0.45, -1024]))}`, lineOnly(4, c.hatShade));
      if (shade) o += S.path(`M${P(hair([-110, -960]))} Q${P(hair([-40, -1012]))} ${P(hair([40, -1012]))}`, lineOnly(16, c.hatHi));
      return o;
    },
    over(hair, feat, c) {
      // cuff band + a little gold coin patch + one curl on the forehead
      let o = S.path(mapPoly(hair, [[-166, -878], [166, -878], [166, -806], [-166, -806]], 14), outline(c.hatShade));
      for (let x = -140; x <= 140; x += 22) o += S.path(`M${P(hair([x, -872]))} L${P(hair([x, -812]))}`, lineOnly(4, c.hat));
      const pc = hair([92, -842]);
      o += S.path(F.starPath(pc[0], pc[1], 0.01), {}) + S.circle(pc[0], pc[1], 21, outline('#FFC93C', 5)) + S.circle(pc[0], pc[1], 9, { fill: 'none', stroke: '#C98A12', 'stroke-width': 4 });
      o += curls(hair, [[-40, -798, 0.8]], c.hair, 24);
      return o;
    },
    side() {
      return poly([[-170, -806], [-176, -880], [-140, -980], [-40, -1032], [70, -1010], [140, -940], [160, -860], [160, -806]], 18);
    },
    sideOver(c) {
      return S.path(poly([[-178, -880], [162, -880], [162, -806], [-178, -806]], 14), outline(c.hatShade)) +
        curls((p) => p, [[120, -790, 1], [140, -746, 0.85]], c.hair, 26);
    },
    back() {
      return poly([[-160, -808], [-162, -866], [-146, -936], [-104, -994], [-36, -1026], [36, -1026], [104, -994], [146, -936], [162, -866], [160, -808]], 14);
    },
    backOver(c) {
      return S.path(poly([[-166, -878], [166, -878], [166, -806], [-166, -806]], 14), outline(c.hatShade)) +
        curls((p) => p, [[-120, -790, 1], [-40, -782, 1.05], [40, -782, 1.05], [120, -790, 1]], c.hair, 30);
    },
  },

  // Mia: side-swept fringe, hair down to the jaw, big messy bun on top
  topBun: {
    browY: -806, nametagY: -1170,
    behind(hair, feat, c, shade) {
      const b = hair([10, -1010]);
      let o = S.path(mapPoly(hair, [[-162, -900], [162, -900], [166, -660], [130, -640], [-130, -640], [-166, -660]], 40), outline(c.hair));
      o += S.circle(b[0], b[1], 92, outline(c.hair));
      o += S.path(`M${f(b[0] - 60)} ${f(b[1] + 10)} Q${f(b[0] - 10)} ${f(b[1] - 70)} ${f(b[0] + 66)} ${f(b[1] - 6)} M${f(b[0] - 40)} ${f(b[1] + 40)} Q${f(b[0] + 20)} ${f(b[1] - 20)} ${f(b[0] + 70)} ${f(b[1] + 34)}`, lineOnly(5));
      if (shade) o += S.path(`M${f(b[0] - 44)} ${f(b[1] - 52)} Q${f(b[0])} ${f(b[1] - 82)} ${f(b[0] + 44)} ${f(b[1] - 52)}`, lineOnly(14, c.hairHi));
      const tie = hair([10, -930]);
      o += S.ellipse(tie[0], tie[1], 54, 16, outline(c.accent || '#FFD1E6', 5));
      return o;
    },
    front(hair, feat) {
      const outer = [[-160, -660], [-166, -840], [-120, -940], [-20, -972], [100, -954], [160, -880], [166, -660], [134, -650], [136, -790]];
      const fringe = [[118, -812], [60, -830], [-10, -848], [-70, -870], [-112, -852], [-130, -800], [-136, -650]];
      return poly([...outer.map(hair), ...fringe.map(feat)], 12);
    },
    details(hair, feat, c, shade) {
      let o = '';
      if (shade) o += S.path(`M${P(hair([-100, -912]))} Q${P(hair([0, -956]))} ${P(hair([110, -916]))}`, lineOnly(14, c.hairHi));
      o += S.path(`M${P(feat([-90, -860]))} Q${P(hair([0, -920]))} ${P(hair([130, -880]))} M${P(feat([-40, -846]))} Q${P(hair([60, -900]))} ${P(hair([150, -840]))}`, lineOnly(4.5));
      return o;
    },
    side() {
      return poly([[-172, -800], [-150, -930], [-40, -980], [90, -960], [158, -880], [162, -660], [110, -640], [60, -680], [20, -790], [-80, -830], [-140, -820]], 22);
    },
    sideBehind(c) {
      return S.circle(40, -1030, 90, outline(c.hair)) + S.ellipse(30, -950, 50, 15, outline(c.accent || '#FFD1E6', 5));
    },
    back() {
      return poly([[-166, -650], [-166, -870], [-90, -966], [90, -966], [166, -870], [166, -650], [80, -636], [0, -646], [-80, -636]], 30);
    },
    backOver(c) {
      return S.circle(10, -1010, 92, outline(c.hair)) + S.ellipse(10, -930, 54, 16, outline(c.accent || '#FFD1E6', 5));
    },
  },

  // Pickle: bright orange bowl cut with a dead-straight fringe
  bowl: {
    browY: -770, nametagY: -1110,
    front(hair, feat) {
      const outer = [[-164, -700], [-170, -840], [-130, -950], [-40, -1000], [40, -1000], [130, -950], [170, -840], [164, -700], [134, -700], [134, -796]];
      const fringe = [[124, -800], [-124, -800], [-134, -796], [-134, -700]];
      return poly([...outer.map(hair), ...fringe.map(feat)], 10);
    },
    details(hair, feat, c, shade) {
      let o = '';
      if (shade) o += S.path(`M${P(hair([-110, -930]))} Q${P(hair([-10, -990]))} ${P(hair([100, -940]))}`, lineOnly(18, c.hairHi));
      for (let x = -100; x <= 100; x += 40) o += S.path(`M${P(feat([x, -806]))} L${P(hair([x * 0.9, -880]))}`, lineOnly(4.5));
      return o;
    },
    side() {
      return poly([[-176, -800], [-160, -930], [-60, -1000], [80, -990], [160, -900], [166, -700], [110, -700], [90, -800], [-150, -806]], 18);
    },
    back() {
      return poly([[-166, -700], [-170, -860], [-110, -976], [110, -976], [170, -860], [166, -700], [80, -690], [0, -700], [-80, -690]], 26);
    },
  },

  // Dad: short neat hair with a side part
  shortPart: {
    browY: -790, nametagY: -1080,
    front(hair, feat) {
      const outer = [[-150, -780], [-158, -870], [-110, -950], [-20, -976], [90, -966], [150, -910], [158, -800], [140, -790], [130, -850]];
      const line = [[60, -880], [-30, -872], [-100, -858], [-130, -800]];
      return poly([...outer.map(hair), ...line.map(feat)], 12);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(hair([-60, -970]))} Q${P(hair([-50, -900]))} ${P(feat([-30, -872]))}`, lineOnly(5));
      if (shade) o += S.path(`M${P(hair([10, -956]))} Q${P(hair([80, -950]))} ${P(hair([130, -900]))}`, lineOnly(14, c.hairHi));
      return o;
    },
    side() {
      return poly([[-160, -830], [-150, -920], [-60, -976], [70, -970], [150, -900], [158, -780], [110, -770], [80, -840], [-100, -860]], 18);
    },
    back() {
      return poly([[-156, -760], [-160, -880], [-100, -966], [100, -966], [160, -880], [156, -760], [80, -740], [0, -750], [-80, -740]], 24);
    },
  },

  // Mom: shoulder-length waves
  wavy: {
    browY: -800, nametagY: -1110,
    behind(hair, feat, c) {
      const pts = [[-170, -880], [170, -880], [182, -720], [196, -640], [176, -560], [140, -600], [-140, -600], [-176, -560], [-196, -640], [-182, -720]];
      return S.path(mapPoly(hair, pts, 34), outline(c.hair)) + S.path(`M${P(hair([-170, -640]))} Q${P(hair([-150, -600]))} ${P(hair([-176, -568]))} M${P(hair([170, -640]))} Q${P(hair([150, -600]))} ${P(hair([176, -568]))}`, lineOnly(4.5));
    },
    front(hair, feat) {
      const outer = [[-164, -640], [-172, -840], [-120, -950], [-20, -986], [100, -966], [168, -870], [164, -640], [134, -650], [130, -800]];
      const fringe = [[90, -846], [20, -866], [-50, -846], [-110, -800], [-134, -650]];
      return poly([...outer.map(hair), ...fringe.map(feat)], 18);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(hair([-40, -980]))} Q${P(feat([-20, -900]))} ${P(feat([-110, -800]))} M${P(hair([40, -976]))} Q${P(feat([80, -900]))} ${P(feat([130, -790]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-120, -920]))} Q${P(hair([-60, -970]))} ${P(hair([10, -976]))}`, lineOnly(14, c.hairHi));
      return o;
    },
    side() {
      return poly([[-176, -800], [-156, -930], [-50, -990], [90, -970], [162, -880], [176, -640], [150, -560], [100, -610], [60, -700], [20, -800], [-100, -830]], 24);
    },
    back() {
      return poly([[-196, -620], [-176, -860], [-100, -980], [100, -980], [176, -860], [196, -620], [150, -570], [0, -590], [-150, -570]], 34);
    },
  },

  // Grandma: soft grey hair with a little bun
  grayBun: {
    browY: -800, nametagY: -1150,
    behind(hair, feat, c) {
      const b = hair([0, -990]);
      return S.circle(b[0], b[1], 64, outline(c.hair)) + S.path(`M${f(b[0] - 40)} ${f(b[1])} Q${f(b[0])} ${f(b[1] - 40)} ${f(b[0] + 40)} ${f(b[1])}`, lineOnly(4.5)) +
        S.path(`M${f(b[0] + 30)} ${f(b[1] - 50)} L${f(b[0] + 70)} ${f(b[1] - 90)} M${f(b[0] + 40)} ${f(b[1] - 40)} L${f(b[0] + 84)} ${f(b[1] - 70)}`, lineOnly(7, '#6B4E2E'));
    },
    front(hair, feat) {
      const outer = [[-162, -700], [-166, -850], [-110, -946], [0, -972], [110, -946], [166, -850], [162, -700], [134, -700], [130, -810]];
      const fringe = [[100, -836], [40, -856], [-20, -850], [-80, -836], [-130, -800], [-134, -700]];
      return poly([...outer.map(hair), ...fringe.map(feat)], 22);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-60, -846]))} Q${P(hair([-60, -920]))} ${P(hair([10, -960]))} M${P(feat([40, -854]))} Q${P(hair([80, -910]))} ${P(hair([60, -960]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-110, -900]))} Q${P(hair([-40, -956]))} ${P(hair([40, -956]))}`, lineOnly(14, c.hairHi));
      return o;
    },
    side() {
      return poly([[-174, -800], [-156, -920], [-50, -976], [90, -960], [160, -880], [164, -700], [110, -700], [60, -800], [-100, -826]], 24);
    },
    sideBehind(c) {
      return S.circle(70, -990, 60, outline(c.hair));
    },
    back() {
      return poly([[-162, -690], [-166, -860], [-100, -962], [100, -962], [166, -860], [162, -690], [80, -676], [0, -686], [-80, -676]], 26);
    },
    backOver(c) {
      return S.circle(0, -990, 64, outline(c.hair));
    },
  },

  // the Thirty Percent Guy: green accountant's visor over a three-strand comb-over
  visor: {
    browY: -790, nametagY: -1080, fill: 'hair',
    front(hair) {
      return mapPoly(hair, [[-140, -862], [-120, -900], [-40, -920], [60, -918], [130, -896], [140, -862]], 16);
    },
    details(hair, feat, c) {
      return S.path(`M${P(hair([-100, -880]))} Q${P(hair([0, -930]))} ${P(hair([110, -880]))}`, lineOnly(5));
    },
    over(hair, feat, c) {
      let o = S.path(mapPoly(hair, [[-160, -876], [160, -876], [160, -846], [-160, -846]], 10), outline('#2E6B3A'));
      const a = hair([-168, -850]), b = hair([168, -850]), m = feat([0, -812]);
      o += S.path(`M${P(a)} Q${f(m[0])} ${f(m[1] + 10)} ${P(b)} Z`, { fill: '#3FD06B', opacity: 0.55, stroke: LINE, 'stroke-width': 6 });
      o += S.path(`M${P(hair([-120, -840]))} Q${f(m[0])} ${f(m[1] - 6)} ${P(hair([120, -840]))}`, lineOnly(5, '#BFFFD0'));
      return o;
    },
    side() {
      return poly([[-150, -880], [-100, -920], [60, -920], [140, -880], [140, -860], [-150, -860]], 14);
    },
    sideOver() {
      return S.path('M-150 -876 L150 -876 L150 -846 L-150 -846 Z', outline('#2E6B3A')) + S.path('M-150 -850 Q-300 -830 -330 -790 L-150 -820 Z', { fill: '#3FD06B', opacity: 0.55, stroke: LINE, 'stroke-width': 6 });
    },
    back() {
      return poly([[-140, -862], [-120, -900], [-40, -920], [60, -918], [130, -896], [140, -862]], 16);
    },
    backOver() {
      return S.path('M-160 -876 L160 -876 L160 -846 L-160 -846 Z', outline('#2E6B3A'));
    },
  },

  // news anchor: glossy helmet hair
  slick: {
    browY: -792, nametagY: -1110,
    front(hair, feat) {
      const outer = [[-150, -790], [-160, -880], [-110, -980], [0, -1010], [110, -990], [160, -900], [152, -790], [134, -800], [120, -870]];
      const line = [[40, -900], [-60, -890], [-120, -850], [-134, -790]];
      return poly([...outer.map(hair), ...line.map(feat)], 14);
    },
    details(hair, feat, c, shade) {
      let o = '';
      for (const k of [-0.6, -0.2, 0.2]) o += S.path(`M${P(hair([-140 + k * 10, -880]))} Q${P(hair([k * 100, -1000]))} ${P(hair([150, -900 + k * 40]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-90, -960]))} Q${P(hair([0, -1000]))} ${P(hair([90, -976]))}`, lineOnly(18, c.hairHi));
      return o;
    },
    side() {
      return poly([[-160, -840], [-140, -960], [-20, -1010], [110, -990], [160, -900], [158, -790], [110, -790], [80, -880], [-110, -870]], 20);
    },
    back() {
      return poly([[-152, -770], [-160, -890], [-100, -996], [100, -996], [160, -890], [152, -770], [0, -750]], 26);
    },
  },
});

// ---------------------------------------------------------------- head accessories (stage: 'behind' | 'face' | 'top')
function headAcc(style, stage, hair, feat, fx) {
  const a = style.acc || {};
  const c = style.col;
  let o = '';
  if (stage === 'behind') {
    if (a.goblinEars) {
      for (const sx of [-1, 1]) {
        const p0 = hair([sx * 130, -800]), p1 = hair([sx * 262, -860]), p2 = hair([sx * 140, -700]);
        o += S.path(`M${P(p0)} Q${P(hair([sx * 220, -820]))} ${P(p1)} Q${P(hair([sx * 210, -730]))} ${P(p2)} Z`, outline(c.skin));
        o += S.path(`M${P(hair([sx * 150, -780]))} Q${P(hair([sx * 200, -800]))} ${P(hair([sx * 226, -830]))}`, lineOnly(5, c.skinShade));
      }
    }
  } else if (stage === 'face') {
    if (a.freckles) {
      for (const sx of [-1, 1]) for (const [dx, dy] of [[0, 0], [18, 10], [-16, 12], [6, 22]]) {
        const p = feat([sx * 92 + dx, -634 + dy]);
        o += S.circle(p[0], p[1], 4.5, { fill: a.freckles, opacity: 0.8 });
      }
    }
    if (a.goblinNose) {
      const n = feat([0, -646]);
      o += S.path(`M${f(n[0] - 20)} ${f(n[1] - 40)} Q${f(n[0] - 46)} ${f(n[1] + 34)} ${f(n[0])} ${f(n[1] + 38)} Q${f(n[0] + 46)} ${f(n[1] + 34)} ${f(n[0] + 20)} ${f(n[1] - 40)} Z`, outline(c.skin, 6));
      o += S.circle(n[0] - 13, n[1] + 24, 5, { fill: LINE }) + S.circle(n[0] + 13, n[1] + 24, 5, { fill: LINE });
      o += S.path(`M${f(n[0] - 14)} ${f(n[1] - 20)} Q${f(n[0] - 22)} ${f(n[1])} ${f(n[0] - 12)} ${f(n[1] + 12)}`, lineOnly(6, '#FFFFFF55'));
    }
    if (a.mustache) {
      const m = feat([0, -628]);
      o += S.path(`M${f(m[0])} ${f(m[1] - 8)} C${f(m[0] - 30)} ${f(m[1] - 30)} ${f(m[0] - 74)} ${f(m[1] - 14)} ${f(m[0] - 80)} ${f(m[1] + 14)} C${f(m[0] - 50)} ${f(m[1] + 6)} ${f(m[0] - 24)} ${f(m[1] + 10)} ${f(m[0])} ${f(m[1] + 4)} C${f(m[0] + 24)} ${f(m[1] + 10)} ${f(m[0] + 50)} ${f(m[1] + 6)} ${f(m[0] + 80)} ${f(m[1] + 14)} C${f(m[0] + 74)} ${f(m[1] - 14)} ${f(m[0] + 30)} ${f(m[1] - 30)} ${f(m[0])} ${f(m[1] - 8)} Z`, outline(a.mustache, 6));
    }
    if (a.roundGlasses) {
      const eL = feat([-56, -712]), eR = feat([56, -712]);
      o += S.circle(eL[0], eL[1], 48, { fill: '#BFE6FF', opacity: 0.25, stroke: a.roundGlasses, 'stroke-width': 9 }) + S.circle(eR[0], eR[1], 48, { fill: '#BFE6FF', opacity: 0.25, stroke: a.roundGlasses, 'stroke-width': 9 });
      o += S.path(`M${f(eL[0] + 46)} ${f(eL[1] - 6)} Q${f((eL[0] + eR[0]) / 2)} ${f(eL[1] - 22)} ${f(eR[0] - 46)} ${f(eR[1] - 6)}`, lineOnly(8, a.roundGlasses));
      o += S.path(`M${f(eL[0] - 26)} ${f(eL[1] - 24)} L${f(eL[0] - 10)} ${f(eL[1] - 34)} M${f(eR[0] - 26)} ${f(eR[1] - 24)} L${f(eR[0] - 10)} ${f(eR[1] - 34)}`, lineOnly(6, '#FFFFFFAA'));
    }
  } else if (stage === 'top') {
    if (a.headGlasses) {
      const l = hair([-62, -912]), r = hair([62, -912]);
      o += S.path(poly([[l[0] - 50, l[1] - 24], [l[0] + 46, l[1] - 24], [l[0] + 40, l[1] + 22], [l[0] - 44, l[1] + 22]], 16), outline(a.headGlasses, 6));
      o += S.path(poly([[r[0] - 46, r[1] - 24], [r[0] + 50, r[1] - 24], [r[0] + 44, r[1] + 22], [r[0] - 40, r[1] + 22]], 16), outline(a.headGlasses, 6));
      o += S.path(`M${f(l[0] + 46)} ${f(l[1] - 10)} L${f(r[0] - 46)} ${f(r[1] - 10)}`, lineOnly(7));
      o += S.path(`M${f(l[0] - 30)} ${f(l[1] - 12)} L${f(l[0] - 6)} ${f(l[1] - 12)}`, lineOnly(5, '#FFFFFF88'));
    }
    if (a.headset) {
      o += L.headphones(hair, a.headset);
      const p = hair([-168, -700]), q = feat([-60, -610]);
      o += S.path(`M${P(p)} Q${f(p[0])} ${f(q[1])} ${P(q)}`, lineOnly(8)) + S.circle(q[0], q[1], 13, outline(a.headset, 5));
    }
  }
  return o;
}

// ---------------------------------------------------------------- extra outfits (inside the torso clip)
function outfit2(style, t, shade, back, T, B, W) {
  const c = style.col;
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  const top = style.top;
  let o = '';
  const tie = (col) => S.path(`M${f(cx - 16 * k)} ${T + 30} L${f(cx + 16 * k)} ${T + 30} L${f(cx + 22 * k)} ${T + 170} L${f(cx)} ${T + 196} L${f(cx - 22 * k)} ${T + 170} Z`, outline(col, 5)) +
    S.path(`M${f(cx - 22 * k)} ${T + 6} L${f(cx + 22 * k)} ${T + 6} L${f(cx + 16 * k)} ${T + 34} L${f(cx - 16 * k)} ${T + 34} Z`, outline(col, 5));
  if (top === 'suit') {
    if (!back) {
      o += S.path(`M${f(cx - 46 * k)} ${T - 6} L${f(cx)} ${T + 160} L${f(cx + 46 * k)} ${T - 6} Z`, { fill: c.shirt || '#FFFFFF' });
      if (c.tie) o += tie(c.tie);
      o += S.path(`M${f(cx - 46 * k)} ${T - 6} L${f(cx - 8)} ${T + 168} L${f(cx - 70 * k)} ${T + 60} Z`, outline(c.topShade, 5)) + S.path(`M${f(cx + 46 * k)} ${T - 6} L${f(cx + 8)} ${T + 168} L${f(cx + 70 * k)} ${T + 60} Z`, outline(c.topShade, 5));
      for (const y of [B - 70, B - 34]) o += S.circle(cx, y, 6, { fill: LINE });
      if (c.pocket) o += S.path(`M${f(cx - 80 * k)} ${T + 60} l18 -14 l12 18 Z`, { fill: c.pocket, stroke: LINE, 'stroke-width': 3 });
    }
  } else if (top === 'shirtTie') {
    if (!back) {
      o += S.path(`M${f(cx - 40 * k)} ${T - 6} L${f(cx)} ${T + 26} L${f(cx + 40 * k)} ${T - 6}`, outline(c.topShade, 5));
      if (c.tie) o += S.g(tie(c.tie), `rotate(${f(8 * dir + 6)} ${f(cx)} ${T + 10})`);
      o += S.path(`M${f(cx)} ${T + 30} L${f(cx)} ${B}`, lineOnly(3, c.topShade));
      if (c.pocket) o += S.path(S.roundedPath([[cx + 40 * k, T + 70], [cx + 80 * k, T + 70], [cx + 80 * k, T + 110], [cx + 40 * k, T + 110]], 4), outline('none', 4)) + S.rect(cx + 50 * k, T + 54, 8, 22, 2, { fill: '#2B6CE0' });
    }
  } else if (top === 'cardigan') {
    if (!back) {
      o += S.rect(cx - 40 * k, T - 10, 80 * k, B - T + 20, 0, { fill: c.inner || '#FFFFFF' });
      if (c.innerPrint) o += S.path(F.heartPath(cx, T + 110, 18), outline(c.innerPrint, 4));
      o += S.path(`M${f(cx - 40 * k)} ${T - 10} L${f(cx - 40 * k)} ${B + 10} M${f(cx + 40 * k)} ${T - 10} L${f(cx + 40 * k)} ${B + 10}`, lineOnly(5));
      for (const y of [T + 70, T + 130, T + 190]) o += S.circle(cx - 54 * k, y, 6, outline(c.trim || '#FFFFFF', 3));
    }
    o += S.rect(-W - 10, B - 26, 2 * W + 20, 26, 0, { fill: c.topShade });
    for (let x = -W; x < W; x += 16) o += S.path(`M${x} ${B - 24} L${x} ${B}`, lineOnly(3, c.top));
  } else if (top === 'sweater') {
    for (const y of [T + 60, T + 120]) {
      o += S.rect(-W - 10, y, 2 * W + 20, 22, 0, { fill: c.trim || '#FFFFFF' });
      for (let x = -W; x < W; x += 28) o += S.path(F.heartPath(x + 14, y + 11, 6), { fill: c.topShade });
    }
    if (!back) o += S.path(`M${f(cx - 50 * k)} ${T - 6} Q${f(cx)} ${T + 30} ${f(cx + 50 * k)} ${T - 6}`, outline(c.topShade, 6));
    o += S.rect(-W - 10, B - 24, 2 * W + 20, 24, 0, { fill: c.topShade });
  } else if (top === 'robot') {
    if (!back) {
      o += S.rect(cx - 56 * k, T + 60, 112 * k, 90, 12, outline('#2A3448', 5));
      for (let i = 0; i < 3; i++) o += S.circle(cx - 30 * k + i * 30 * k, T + 105, 10, { fill: ['#FF4D6D', '#FFD21F', '#3BD16F'][i] });
      o += S.path(`M${f(cx - 34)} ${T + 14} L${f(cx)} ${T + 30} L${f(cx - 34)} ${T + 46} Z M${f(cx + 34)} ${T + 14} L${f(cx)} ${T + 30} L${f(cx + 34)} ${T + 46} Z`, outline('#1A1A22', 4)) + S.circle(cx, T + 30, 8, { fill: '#1A1A22' });
    }
    for (const y of [T + 180, T + 200]) o += S.path(`M${-W} ${y} L${W} ${y}`, lineOnly(3, c.topShade));
  }
  // hoodie chest badges
  if (top === 'hoodie' && !back && style.badge) {
    const bx = cx + 0, by = T + 68;
    if (style.badge === 'coin') {
      o += S.circle(bx, by, 26, outline('#FFC93C', 5)) + S.path(`M${f(bx - 10)} ${f(by - 12)} L${f(bx + 10)} ${f(by - 12)} L${f(bx + 14)} ${f(by + 12)} L${f(bx - 14)} ${f(by + 12)} Z`, { fill: 'none', stroke: '#C98A12', 'stroke-width': 5 });
    } else if (style.badge === 'pickle') {
      o += S.path(`M${f(bx - 30)} ${f(by + 14)} Q${f(bx - 40)} ${f(by - 18)} ${f(bx)} ${f(by - 22)} Q${f(bx + 40)} ${f(by - 24)} ${f(bx + 32)} ${f(by + 8)} Q${f(bx)} ${f(by + 26)} ${f(bx - 30)} ${f(by + 14)} Z`, outline('#7BC043', 5));
      for (const [dx, dy] of [[-14, -4], [4, -10], [16, 4], [-2, 8]]) o += S.circle(bx + dx, by + dy, 3.5, { fill: '#3E7A1E' });
      o += S.circle(bx - 8, by - 2, 3, { fill: LINE }) + S.circle(bx + 8, by - 4, 3, { fill: LINE }) + S.path(`M${f(bx - 8)} ${f(by + 6)} Q${f(bx)} ${f(by + 12)} ${f(bx + 8)} ${f(by + 5)}`, lineOnly(3));
    }
  }
  return o;
}

module.exports = { headAcc, outfit2, curls };
