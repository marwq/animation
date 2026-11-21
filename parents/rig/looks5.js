// Looks for the "What If You Could RESPAWN in Real Life?" cast, built on looks .. looks4 the way looks4 built on looks3:
// new hair styles (registered into L.HAIR), face accessories (Ivy's cheek band-aid, Dad's huge bushy beard,
// thick fluffy brow (Dad): no highlight, slightly tufted outer end
function thickBrow(inner, outer, col) {
  const mid = [(inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2 - 12];
  const d = `M${P(inner)} Q${P(mid)} ${P(outer)}`;
  const tuft = `M${f(outer[0] - (outer[0] - inner[0]) * 0.25)} ${f(outer[1] - 6)} l${f((outer[0] - inner[0]) * 0.2)} 14`;
  return S.path(d + ' ' + tuft, lineOnly(31, LINE)) + S.path(d + ' ' + tuft, lineOnly(20, col));
}
// Mr. Fig's pencil moustache, Principal Pemberton's cat-eye glasses), a body-part set (tops, skirts/aprons,
// striped / rolled / puff / sparkly sleeves, knee patch + torn knee with a band-aid, socks, light-up sneakers,
// fuzzy slippers, clogs, ballet flats, rocket boosters) and character-level overlays used by cast.js
// (foam, soot, goggles, headphones, pancake-on-head, spaghetti, whistle in the mouth).
//
// dress5(design) swaps a makeDesign()/dress3/dress4 design's body parts for the looks5 ones and adds the accessories to
// the side and back views (the generic head only calls accessory hooks in the front view).
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const L = require('./looks');
const L2 = require('./looks2');
const L3 = require('./looks3');
const L4 = require('./looks4');
const X = require('./extras');
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
  const id = S.uid('l5');
  return S.clipDef(id, S.path(d)) + S.path(d, { fill }) + (inner ? S.g(inner, null, { 'clip-path': `url(#${id})` }) : '') + S.path(d, outline('none', w));
};
const txt = (s, x, y, size, fill, extra = {}) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, 'text-anchor': 'middle', ...extra }, s);
// same turn mapping as r6.js hairMap()
function hm(t = 0) {
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  return {
    at, dir, fx: dir * 40 * at,
    hair: ([x, y]) => [x * dir > 0 ? x * (1 - 0.12 * at) + dir * 16 * at : x * (1 + 0.03 * at) + dir * 16 * at, y],
    feat: ([x, y]) => [x * (1 - 0.15 * at) + dir * 40 * at, y],
  };
}
const curlMarks = (pts, r, w = 4.5, col = LINE) => S.path(pts.map(([x, y, rr = r]) => `M${f(x - rr * 0.42)} ${f(y + 3)} Q${f(x)} ${f(y - rr * 0.55)} ${f(x + rr * 0.4)} ${f(y + 5)}`).join(' '), lineOnly(w, col));
const mapC = (fn, cs) => cs.map(([x, y, r]) => [...fn([x, y]), r]);
const mirrorC = (cs) => [...cs, ...cs.filter(([x]) => x !== 0).map(([x, y, r]) => [-x, y, r])];
// per-draw state written by cast.js wrappers (time for blinking shoe lights, rocket boosters)
const STATE = { t: 0, rocket: null };

// ====================================================================== HAIR
// Ivy: a big cloud of dark curls pulled up into a puff on top, a little wrench stuck in it. frizz: blown-out after an explosion
function wrenchSvg(x, y, ang, s = 1) {
  const d = 'M-9 0 L-9 -96 A26 26 0 1 1 9 -96 L9 0 A10 10 0 0 1 -9 0 Z';
  return S.g(S.path(d, outline('#C9CED8', 5)) + S.path('M-12 -126 L-5 -138 L5 -138 L12 -126 Z', { fill: '#7A8090' }) + S.path('M-3 -10 L-3 -88', lineOnly(4, '#FFFFFF')),
    `translate(${f(x)} ${f(y)}) rotate(${f(ang)}) scale(${f(s)})`);
}
function ivyCloud(fz) {
  const k = 1 + 0.16 * fz;
  return mirrorC([[-168, -862, 64], [-198, -790, 56], [-194, -716, 46], [-172, -654, 34], [-116, -946, 66], [-44, -984, 64]]).map(([x, y, r]) => [x * (1 + 0.1 * fz), y - 14 * fz, r * k]);
}
function frizzSpikes(map, cs, col, n = 14) {
  let d = '';
  cs.slice(0, n).forEach(([x, y, r], i) => {
    const a = Math.atan2(y + 820, x) + (hash(i) - 0.5) * 0.6;
    const p = map([x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8]);
    const L1 = r * (0.5 + 0.4 * hash(i * 3));
    d += `M${P(p)} l${f(Math.cos(a) * L1 * 0.5 + 8)} ${f(Math.sin(a) * L1 * 0.5 - 6)} l${f(Math.cos(a) * L1 * 0.5 - 6)} ${f(Math.sin(a) * L1 * 0.5 + 8)} `;
  });
  return S.path(d, lineOnly(11, LINE)) + S.path(d, lineOnly(5, col));
}
function ivyTop(map, c, fz, shade) {
  const b = map([10, -1072 - 16 * fz]);
  const r = 78 * (1 + 0.15 * fz);
  let o = wrenchSvg(b[0] + 52, b[1] - 6, 36, 0.9);
  const cs = [[b[0], b[1], r], [b[0] - 62, b[1] + 18, r * 0.52], [b[0] + 60, b[1] + 14, r * 0.55], [b[0] - 36, b[1] - 50, r * 0.5], [b[0] + 34, b[1] - 52, r * 0.48]];
  o += puffs(cs, c.hair) + curlMarks(cs.slice(1), r * 0.5, 4.5, c.hairHi);
  if (shade) o += S.path(`M${f(b[0] - 40)} ${f(b[1] - 52)} Q${f(b[0])} ${f(b[1] - 84)} ${f(b[0] + 36)} ${f(b[1] - 60)}`, lineOnly(10, c.hairHi));
  if (fz > 0.3) o += frizzSpikes(ID, cs.map(([x, y, rr]) => [x, y, rr]), c.hair, 5);
  const tie = map([10, -1000 - 10 * fz]);
  o += S.ellipse(tie[0], tie[1], 54, 17, outline(c.accent, 5)) + S.path(`M${f(tie[0] - 34)} ${f(tie[1] - 4)} L${f(tie[0] + 30)} ${f(tie[1] - 6)}`, lineOnly(4, '#FFFFFF88'));
  return o;
}
function ivyHair(fz) {
  return {
    browY: -800, nametagY: -1250,
    behind(hair, feat, c, shade) {
      const cs = mapC(hair, ivyCloud(fz));
      let o = puffs(cs, c.hair) + curlMarks(cs.filter((_, i) => i % 2 === 0), 52, 4.5, c.hairHi);
      if (fz > 0.3) o += frizzSpikes(ID, cs, c.hair);
      return o + ivyTop(hair, c, fz, shade);
    },
    front(hair, feat) {
      const outer = [[-150, -700, 0], [-158, -860, 0], [-104, -956, 0], [0, -984, 0], [104, -956, 0], [158, -860, 0], [150, -700, 0]].map(([x, y, b]) => [...hair([x, y]), b]);
      const fr = [[136, -730, 10], [126, -796, 14], [86, -834, 14], [42, -848, 14], [0, -852, 14], [-42, -848, 14], [-86, -834, 14], [-126, -796, 10], [-136, -730, 0]].map(([x, y, b]) => [...feat([x, y]), b + fz * 6]);
      return fluffy([...outer, ...fr]);
    },
    details(hair, feat, c, shade) {
      let o = curlMarks([feat([-90, -880]), feat([-20, -900]), feat([60, -890]), feat([110, -850]), hair([-140, -800])].map(([x, y]) => [x, y, 30]), 30, 4.5, c.hairHi);
      if (shade) o += S.path(`M${P(hair([-120, -920]))} Q${P(hair([-50, -968]))} ${P(hair([30, -966]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    over(hair, feat, c) {
      const p = feat([-34, -846]);
      return S.path(`M${f(p[0])} ${f(p[1])} q-14 22 2 34 q14 10 6 -6`, lineOnly(11, LINE)) + S.path(`M${f(p[0])} ${f(p[1])} q-14 22 2 34 q14 10 6 -6`, lineOnly(5, c.hair));
    },
    side: () => fluffy([[-182, -826, 10], [-172, -920, 0], [-82, -990, 0], [60, -982, 0], [150, -900, 0], [160, -760, 0], [120, -722, 0], [60, -780, 10], [-40, -828, 10], [-120, -844, 10]]),
    sideBehind(c) {
      const cs = [[40, -962, 70], [124, -930, 70], [182, -850, 66], [204, -766, 58], [186, -684, 46], [146, -640, 36], [-56, -982, 60], [-136, -930, 50]].map(([x, y, r]) => [x * (1 + 0.1 * fz), y - 10 * fz, r * (1 + 0.16 * fz)]);
      let o = puffs(cs, c.hair) + curlMarks(cs.filter((_, i) => i % 2), 50, 4.5, c.hairHi);
      if (fz > 0.3) o += frizzSpikes(ID, cs, c.hair, 8);
      return o + S.g(ivyTop(ID, c, fz, true), 'translate(30 0)');
    },
    sideOver: (c) => curlMarks([[-120, -900, 30], [-40, -950, 30], [60, -930, 30], [120, -860, 30]], 30, 4.5, c.hairHi),
    back: () => null,
    backOver(c) {
      const cs = [...ivyCloud(fz), [0, -820, 84], [-84, -830, 74], [84, -830, 74], [-60, -706, 64], [60, -706, 64], [0, -690, 60], [0, -930, 76]];
      let o = puffs(cs, c.hair) + curlMarks(cs.filter((_, i) => i % 2), 52, 4.5, c.hairHi);
      if (fz > 0.3) o += frizzSpikes(ID, cs, c.hair);
      return o + ivyTop(ID, c, fz, true);
    },
  };
}

// Dad: short ginger hair with a little front swoop
const DAD_FRONT = [[-148, -770], [-156, -872], [-118, -946], [-30, -978], [70, -976], [138, -936], [156, -864], [150, -770], [134, -778], [130, -840]];
const DAD_LINE = [[106, -860], [70, -870], [40, -896], [10, -872], [-40, -868], [-90, -858], [-120, -832], [-134, -778]];

// Bea's pigtails: big round bunches sticking out above the ears
function bunch(map, sx, c, shade, big = 1) {
  const base = [196, -820];
  const cs = [[0, 0, 62], [44, -36, 48], [58, 20, 46], [22, 54, 40], [84, -10, 34], [-6, -52, 34]].map(([x, y, r]) => [base[0] + x * big, base[1] + y * big, r * big]);
  const q = cs.map(([x, y, r]) => [...map([sx * x, y]), r]);
  let o = puffs(q, c.hair) + curlMarks(q.slice(1, 4), 40, 4.5, c.hairShade);
  if (shade) { const p = q[0]; o += S.path(`M${f(p[0] - 30)} ${f(p[1] - 30)} Q${f(p[0])} ${f(p[1] - 52)} ${f(p[0] + 28)} ${f(p[1] - 36)}`, lineOnly(10, c.hairHi)); }
  const tie = map([sx * 150, -826]);
  o += S.circle(tie[0], tie[1] - 18, 17, outline(c.accent, 4.5)) + S.circle(tie[0], tie[1] + 18, 17, outline(c.accent, 4.5)) + S.circle(tie[0] - 5, tie[1] - 23, 5, { fill: '#FFFFFF', opacity: 0.8 }) + S.circle(tie[0] - 5, tie[1] + 13, 5, { fill: '#FFFFFF', opacity: 0.8 });
  return o;
}

// Mom / Principal / juggler: a bun on top
function bun(x, y, r, c, shade, kind = 'messy') {
  let o = '';
  if (kind === 'messy') {
    o += puffs([[x, y, r], [x - r * 0.8, y + r * 0.2, r * 0.42], [x + r * 0.8, y - r * 0.3, r * 0.45], [x + r * 0.1, y - r * 0.85, r * 0.4]], c.hair);
    o += S.path(`M${f(x - r * 0.6)} ${f(y + r * 0.2)} Q${f(x)} ${f(y - r * 0.7)} ${f(x + r * 0.7)} ${f(y)} M${f(x - r * 0.4)} ${f(y + r * 0.55)} Q${f(x + r * 0.2)} ${f(y)} ${f(x + r * 0.75)} ${f(y + r * 0.45)}`, lineOnly(4.5));
    o += S.path(`M${f(x + r * 0.7)} ${f(y - r * 0.9)} q${f(r * 0.4)} -10 ${f(r * 0.3)} ${f(-r * 0.45)} M${f(x - r * 1.1)} ${f(y)} q-16 -6 -14 -26`, lineOnly(5));
  } else {
    o += S.circle(x, y, r, outline(c.hair));
    o += S.path(`M${f(x - r * 0.7)} ${f(y + r * 0.15)} Q${f(x)} ${f(y - r * 0.9)} ${f(x + r * 0.7)} ${f(y + r * 0.15)} M${f(x - r * 0.45)} ${f(y + r * 0.55)} Q${f(x)} ${f(y - r * 0.2)} ${f(x + r * 0.5)} ${f(y + r * 0.55)}`, lineOnly(4.5, kind === 'sleek' ? c.hairShade : LINE));
  }
  if (shade) o += S.path(`M${f(x - r * 0.55)} ${f(y - r * 0.55)} Q${f(x)} ${f(y - r * 0.95)} ${f(x + r * 0.5)} ${f(y - r * 0.62)}`, lineOnly(r * 0.16, c.hairHi));
  return o;
}
const SLEEK_FRONT = [[-158, -724], [-164, -862], [-112, -956], [0, -984], [112, -956], [164, -862], [158, -724], [136, -732], [134, -802]];
const SLEEK_LINE = [[110, -840], [56, -868], [0, -876], [-56, -868], [-110, -840], [-134, -802], [-136, -732]];

Object.assign(L.HAIR, {
  ivyPuff: ivyHair(0),
  ivyFrizz: ivyHair(1),

  // Dad: short ginger crop with a small swoop at the front, sideburns run into the beard
  dadSwoop: {
    browY: -800, nametagY: -1080,
    front: (hair, feat) => poly([...DAD_FRONT.map(hair), ...DAD_LINE.map(feat)], 12),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([40, -896]))} Q${P(hair([20, -950]))} ${P(hair([-40, -972]))} M${P(feat([-40, -868]))} Q${P(hair([-80, -910]))} ${P(hair([-120, -930]))} M${P(feat([60, -872]))} Q${P(hair([110, -900]))} ${P(hair([140, -880]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-110, -926]))} Q${P(hair([-50, -968]))} ${P(hair([20, -970]))}`, lineOnly(13, c.hairHi));
      return o;
    },
    over(hair, feat, c) {
      let o = '';
      for (const sx of [-1, 1]) o += S.path(mapPoly(hair, [[sx * 150, -790], [sx * 134, -790], [sx * 134, -700], [sx * 150, -690]].map(([x, y]) => [x, y]), 4), outline(c.hair, 5));
      return o;
    },
    side: () => poly([[-160, -830], [-150, -922], [-60, -978], [70, -974], [150, -906], [158, -776], [110, -764], [80, -836], [-30, -850], [-60, -880], [-100, -856]], 16),
    back: () => poly([[-154, -760], [-158, -880], [-100, -966], [100, -966], [158, -880], [154, -760], [80, -742], [0, -752], [-80, -742]], 24),
  },

  // Mom (ER nurse): centre-parted hair pulled up into a big messy bun with a scrunchie, two loose strands
  nurseBun: {
    browY: -800, nametagY: -1200,
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-162, -880], [162, -880], [168, -700], [140, -676], [-140, -676], [-168, -700]], 36), outline(c.hair));
      const b = hair([18, -1012]);
      o += bun(b[0], b[1], 70, c, shade, 'messy');
      o += puffs([[b[0] - 30, b[1] + 62, 22], [b[0] + 4, b[1] + 70, 24], [b[0] + 38, b[1] + 60, 22]], c.accent);
      return o;
    },
    front: (hair, feat) => poly([...SLEEK_FRONT.map(hair), ...SLEEK_LINE.map(feat)], 16),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([0, -876]))} L${P(hair([0, -984]))} M${P(feat([-60, -866]))} Q${P(hair([-120, -890]))} ${P(hair([-150, -760]))} M${P(feat([60, -866]))} Q${P(hair([120, -890]))} ${P(hair([150, -760]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-124, -920]))} Q${P(hair([-74, -968]))} ${P(hair([-14, -978]))} M${P(hair([20, -978]))} Q${P(hair([80, -968]))} ${P(hair([126, -922]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    over(hair, feat, c) {
      const a = hair([-142, -820]), b = hair([140, -826]);
      const d = `M${P(a)} Q${f(a[0] - 26)} ${f(a[1] + 70)} ${f(a[0] - 4)} ${f(a[1] + 130)} M${P(b)} Q${f(b[0] + 30)} ${f(b[1] + 60)} ${f(b[0] + 8)} ${f(b[1] + 120)}`;
      return S.path(d, lineOnly(10, LINE)) + S.path(d, lineOnly(4, c.hair));
    },
    side: () => poly([[-176, -802], [-150, -930], [-40, -984], [90, -966], [162, -882], [168, -690], [124, -664], [62, -704], [22, -792], [-80, -832], [-140, -822]], 22),
    sideBehind(c) { return bun(96, -1004, 66, c, true, 'messy') + puffs([[70, -950, 20], [100, -942, 22], [128, -956, 20]], c.accent); },
    back: () => poly([[-166, -672], [-168, -872], [-92, -972], [92, -972], [168, -872], [166, -672], [100, -654], [0, -664], [-100, -654]], 30),
    backOver(c) {
      return S.path('M-120 -690 Q-70 -860 -10 -950 M120 -690 Q70 -860 10 -950 M0 -670 L0 -950', lineOnly(4.5)) + bun(0, -1012, 70, c, true, 'messy') + puffs([[-32, -952, 22], [0, -944, 24], [32, -952, 22]], c.accent);
    },
  },

  // Bea: blunt bangs and two BIG round pigtail bunches with bobble ties
  beaPigtails: {
    browY: -824, nametagY: -1110,
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-164, -880], [164, -880], [168, -690], [140, -666], [-140, -666], [-168, -690]], 34), outline(c.hair));
      return o + bunch(hair, -1, c, shade) + bunch(hair, 1, c, shade);
    },
    front(hair, feat) {
      const outer = [[-160, -690], [-166, -862], [-112, -958], [0, -984], [112, -958], [166, -862], [160, -690], [138, -700], [136, -812]];
      const bangs = [[118, -838], [80, -832], [40, -840], [0, -834], [-40, -840], [-80, -832], [-118, -838], [-136, -812], [-138, -700]];
      return poly([...outer.map(hair), ...bangs.map(feat)], 10);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-60, -836]))} L${P(hair([-54, -900]))} M${P(feat([20, -838]))} L${P(hair([18, -906]))} M${P(feat([86, -832]))} L${P(hair([80, -890]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-120, -920]))} Q${P(hair([-50, -970]))} ${P(hair([40, -966]))}`, lineOnly(13, c.hairHi));
      return o;
    },
    side: () => poly([[-178, -830], [-150, -932], [-40, -984], [90, -966], [160, -884], [166, -690], [110, -670], [60, -760], [-60, -820], [-150, -840]], 18),
    sideBehind: (c) => bunch(ID, 1, c, true, 0.92),
    sideOver: (c) => S.g(bunch(ID, 1, c, true, 0.95), 'translate(-150 10)'),
    back: () => poly([[-166, -690], [-168, -872], [-92, -972], [92, -972], [168, -872], [166, -690], [100, -672], [0, -680], [-100, -672]], 26),
    backOver: (c) => S.path('M0 -960 L0 -690', lineOnly(4.5)) + bunch(ID, -1, c, true) + bunch(ID, 1, c, true),
  },

  // Mr. Fig: neat, glossy side part, sharp as his grading
  figPart: {
    browY: -800, nametagY: -1080,
    front(hair, feat) {
      const outer = [[-148, -784], [-156, -886], [-112, -958], [-20, -986], [92, -976], [152, -918], [156, -800], [150, -784], [134, -790], [128, -856]];
      const line = [[96, -870], [40, -882], [-20, -892], [-58, -906], [-62, -872], [-100, -858], [-130, -832], [-134, -790]];
      return poly([...outer.map(hair), ...line.map(feat)], 10);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-60, -906]))} Q${P(hair([-62, -950]))} ${P(hair([-56, -982]))}`, lineOnly(5.5));
      o += S.path(`M${P(hair([-40, -956]))} Q${P(hair([60, -960]))} ${P(hair([146, -900]))} M${P(hair([-40, -930]))} Q${P(hair([60, -930]))} ${P(hair([150, -860]))} M${P(hair([-100, -930]))} Q${P(hair([-130, -890]))} ${P(hair([-146, -820]))}`, lineOnly(4, c.hairShade));
      if (shade) o += S.path(`M${P(hair([0, -968]))} Q${P(hair([70, -964]))} ${P(hair([124, -924]))}`, lineOnly(13, c.hairHi)) + S.ellipse(...hair([40, -950]), 20, 6, { fill: '#FFFFFF', opacity: 0.7 });
      return o;
    },
    side: () => poly([[-160, -848], [-150, -926], [-60, -980], [70, -974], [150, -908], [158, -778], [110, -764], [80, -836], [-100, -862]], 16),
    back: () => poly([[-154, -762], [-158, -882], [-100, -968], [100, -968], [158, -882], [154, -762], [80, -744], [0, -754], [-80, -744]], 24),
  },

  // Coach Dee: sun visor, slicked-back hair, high bouncing ponytail
  visorPony: {
    browY: -800, nametagY: -1150,
    behind(hair, feat, c, shade) {
      const a = hair([40, -984]);
      const d = `M${f(a[0] - 30)} ${f(a[1] + 10)} Q${f(a[0] + 120)} ${f(a[1] - 70)} ${f(a[0] + 190)} ${f(a[1] + 30)} Q${f(a[0] + 236)} ${f(a[1] + 130)} ${f(a[0] + 196)} ${f(a[1] + 250)} Q${f(a[0] + 196)} ${f(a[1] + 140)} ${f(a[0] + 140)} ${f(a[1] + 80)} Q${f(a[0] + 80)} ${f(a[1] + 30)} ${f(a[0] + 10)} ${f(a[1] + 40)} Z`;
      let o = S.path(d, outline(c.hair)) + S.path(`M${f(a[0] + 60)} ${f(a[1] - 6)} Q${f(a[0] + 190)} ${f(a[1] + 20)} ${f(a[0] + 204)} ${f(a[1] + 170)}`, lineOnly(4.5, c.hairHi));
      o += S.ellipse(a[0] + 22, a[1] + 4, 22, 30, outline(c.accent, 5));
      return o;
    },
    front: (hair, feat) => poly([...[[-156, -760], [-162, -870], [-112, -960], [0, -990], [112, -960], [162, -870], [156, -760], [136, -770], [134, -836]].map(hair), ...[[110, -852], [50, -870], [0, -874], [-50, -870], [-110, -852], [-134, -836], [-136, -770]].map(feat)], 14),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-70, -866]))} Q${P(hair([-60, -930]))} ${P(hair([30, -984]))} M${P(feat([10, -874]))} Q${P(hair([40, -930]))} ${P(hair([80, -976]))} M${P(feat([80, -864]))} Q${P(hair([110, -920]))} ${P(hair([120, -960]))}`, lineOnly(4.5, c.hairHi));
      if (shade) o += S.path(`M${P(hair([-130, -910]))} Q${P(hair([-80, -966]))} ${P(hair([-10, -980]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    over(hair, feat, c) {
      // the visor: band round the head + brim toward the camera
      const m = feat([0, -838]);
      let o = S.path(mapPoly(hair, [[-168, -884], [168, -884], [168, -848], [-168, -848]], 8), outline(c.visor));
      o += S.path(`M${P(hair([-182, -852]))} Q${f(m[0])} ${f(m[1] - 30)} ${P(hair([182, -852]))} Q${f(m[0])} ${f(m[1] + 62)} ${P(hair([-182, -852]))} Z`, outline(c.visorBrim || c.visor));
      o += S.path(`M${P(hair([-150, -846]))} Q${f(m[0])} ${f(m[1] + 26)} ${P(hair([150, -846]))}`, lineOnly(5, '#00000033'));
      const lg = feat([0, -866]);
      o += S.path(F.starPath(lg[0], lg[1], 15), outline('#FFFFFF', 3.5));
      return o;
    },
    side: () => poly([[-168, -840], [-160, -926], [-90, -984], [30, -994], [130, -950], [166, -860], [166, -760], [110, -744], [70, -800], [-60, -840]], 20),
    sideBehind(c) {
      return S.path('M90 -980 Q230 -1010 260 -900 Q284 -800 240 -700 Q236 -800 200 -860 Q160 -920 100 -930 Z', outline(c.hair)) + S.ellipse(100, -958, 24, 32, outline(c.accent, 5));
    },
    sideOver(c) {
      let o = S.path(poly([[-170, -886], [168, -886], [168, -850], [-170, -850]], 8), outline(c.visor));
      o += S.path('M-160 -870 Q-260 -866 -330 -834 Q-310 -818 -156 -840 Z', outline(c.visorBrim || c.visor));
      o += S.path(F.starPath(-110, -868, 13), outline('#FFFFFF', 3));
      return o;
    },
    back: () => poly([[-156, -744], [-160, -880], [-100, -980], [100, -980], [160, -880], [156, -744], [80, -726], [0, -736], [-80, -726]], 24),
    backOver(c) {
      let o = S.path('M-100 -760 Q-60 -900 -14 -976 M100 -760 Q60 -900 14 -976', lineOnly(4.5, c.hairHi));
      o += S.path(poly([[-168, -884], [168, -884], [168, -848], [-168, -848]], 8), outline(c.visor));
      o += S.path('M-30 -1000 Q-50 -900 -20 -700 Q0 -640 20 -700 Q50 -900 30 -1000 Z', outline(c.hair)) + S.ellipse(0, -990, 30, 20, outline(c.accent, 5));
      return o;
    },
  },

  // Principal Pemberton: sleek silver hair, side part, a tight bun like a doorknob
  greyBun: {
    browY: -802, nametagY: -1180,
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-160, -880], [160, -880], [164, -720], [138, -700], [-138, -700], [-164, -720]], 34), outline(c.hair));
      const b = hair([0, -1030]);
      o += bun(b[0], b[1], 56, c, shade, 'sleek') + S.ellipse(b[0], b[1] + 44, 42, 12, outline(c.hairShade, 4.5));
      return o;
    },
    front(hair, feat) {
      const outer = [[-158, -724], [-164, -862], [-112, -956], [0, -984], [112, -956], [164, -862], [158, -724], [136, -732], [134, -802]];
      const line = [[110, -836], [60, -862], [0, -876], [-40, -884], [-50, -862], [-110, -840], [-134, -802], [-136, -732]];
      return poly([...outer.map(hair), ...line.map(feat)], 16);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-44, -884]))} Q${P(hair([-44, -940]))} ${P(hair([-36, -982]))}`, lineOnly(5));
      o += S.path(`M${P(feat([-20, -880]))} Q${P(hair([80, -900]))} ${P(hair([150, -780]))} M${P(feat([-70, -858]))} Q${P(hair([-130, -880]))} ${P(hair([-150, -760]))}`, lineOnly(4, c.hairShade));
      if (shade) o += S.path(`M${P(hair([0, -968]))} Q${P(hair([70, -962]))} ${P(hair([124, -920]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-174, -806], [-150, -930], [-40, -984], [90, -966], [160, -884], [164, -712], [120, -700], [64, -780], [-90, -832], [-140, -824]], 22),
    sideBehind: (c) => bun(80, -1020, 54, c, true, 'sleek') + S.ellipse(70, -976, 40, 12, outline(c.hairShade, 4.5)),
    back: () => poly([[-162, -712], [-166, -872], [-96, -970], [96, -970], [166, -872], [162, -712], [80, -698], [0, -706], [-80, -698]], 28),
    backOver(c) { return S.path('M-110 -720 Q-60 -880 -10 -960 M110 -720 Q60 -880 10 -960', lineOnly(4, c.hairShade)) + bun(0, -1030, 56, c, true, 'sleek') + S.ellipse(0, -986, 42, 12, outline(c.hairShade, 4.5)); },
  },

  // the juggler: high ballet bun with a sparkly scrunchie and a gold headband
  jugglerBun: {
    browY: -800, nametagY: -1180,
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-160, -880], [160, -880], [164, -730], [138, -710], [-138, -710], [-164, -730]], 34), outline(c.hair));
      const b = hair([0, -1026]);
      o += bun(b[0], b[1], 58, c, shade, 'round');
      o += puffs([[b[0] - 40, b[1] + 50, 18], [b[0], b[1] + 58, 20], [b[0] + 40, b[1] + 50, 18]], c.accent);
      return o;
    },
    front: (hair, feat) => poly([...SLEEK_FRONT.map(hair), ...SLEEK_LINE.map(feat)], 16),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([0, -876]))} L${P(hair([0, -984]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-124, -920]))} Q${P(hair([-74, -968]))} ${P(hair([-14, -978]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    over(hair, feat, c) {
      const a = hair([-158, -880]), b = hair([158, -880]), m = hair([0, -1000]);
      const d = `M${P(a)} Q${f(m[0])} ${f(m[1] - 10)} ${P(b)}`;
      let o = S.path(d, lineOnly(20, LINE)) + S.path(d, lineOnly(11, '#FFC93C'));
      for (const x of [-90, 0, 90]) { const p = hair([x, x ? -954 : -978]); o += S.path(F.starPath(p[0], p[1], 13), outline('#FFF6C0', 3)); }
      return o;
    },
    side: () => poly([[-176, -802], [-150, -930], [-40, -984], [90, -966], [160, -884], [166, -716], [120, -704], [64, -780], [-90, -832], [-140, -824]], 22),
    sideBehind: (c) => bun(70, -1016, 56, c, true, 'round') + puffs([[40, -966, 18], [74, -958, 20]], c.accent),
    sideOver: () => S.path('M-150 -900 Q-40 -1000 110 -960', lineOnly(20, LINE)) + S.path('M-150 -900 Q-40 -1000 110 -960', lineOnly(11, '#FFC93C')),
    back: () => poly([[-162, -720], [-166, -872], [-96, -970], [96, -970], [166, -872], [162, -720], [80, -704], [0, -712], [-80, -704]], 28),
    backOver: (c) => S.path('M0 -970 L0 -730', lineOnly(4.5)) + bun(0, -1026, 58, c, true, 'round') + puffs([[-40, -976, 18], [0, -968, 20], [40, -976, 18]], c.accent),
  },

  // crowd: two afro puffs
  afroPuffs: {
    browY: -800, nametagY: -1150,
    behind(hair, feat, c) {
      let o = '';
      for (const sx of [-1, 1]) {
        const b = hair([sx * 118, -990]);
        const cs = [[b[0], b[1], 66], [b[0] - 40, b[1] + 24, 36], [b[0] + 40, b[1] + 20, 38], [b[0], b[1] - 44, 38]];
        o += puffs(cs, c.hair) + curlMarks(cs.slice(1), 30, 4, c.hairHi);
        const t = hair([sx * 96, -930]);
        o += S.ellipse(t[0], t[1], 34, 13, outline(c.accent, 4.5));
      }
      return o;
    },
    front(hair, feat) {
      const outer = [[-150, -770, 0], [-158, -880, 0], [-104, -950, 0], [0, -972, 0], [104, -950, 0], [158, -880, 0], [150, -770, 0]].map(([x, y, b]) => [...hair([x, y]), b]);
      const fr = [[132, -790, 8], [110, -840, 10], [50, -858, 10], [-10, -860, 10], [-70, -852, 10], [-120, -826, 8], [-134, -780, 0]].map(([x, y, b]) => [...feat([x, y]), b]);
      return fluffy([...outer, ...fr]);
    },
    details: (hair, feat, c, shade) => (shade ? S.path(`M${P(hair([-110, -910]))} Q${P(hair([-40, -950]))} ${P(hair([40, -950]))}`, lineOnly(10, c.hairHi)) : ''),
    side: () => poly([[-170, -830], [-150, -926], [-50, -970], [80, -960], [150, -890], [156, -760], [110, -744], [80, -820], [-90, -850]], 22),
    sideBehind: (c) => puffs([[40, -1000, 62], [10, -960, 36], [80, -980, 38]], c.hair),
    back: () => poly([[-154, -750], [-158, -880], [-100, -960], [100, -960], [158, -880], [154, -750], [80, -732], [0, -742], [-80, -732]], 24),
    backOver(c) { let o = ''; for (const sx of [-1, 1]) o += puffs([[sx * 118, -990, 66], [sx * 78, -966, 36], [sx * 158, -970, 38], [sx * 118, -1034, 38]], c.hair) + S.ellipse(sx * 96, -930, 34, 13, outline(c.accent, 4.5)); return o; },
  },
});

// ====================================================================== FACE ACCESSORIES
// Ivy's cheek band-aid
function bandaid(x, y, rot = -24, s = 1) {
  return S.g(S.rect(-30, -12, 60, 24, 11, outline('#F2C48A', 4)) + S.rect(-10, -9, 20, 18, 3, { fill: '#E3A66A' }) + S.path('M-22 -4 l0 0 M-20 5 l0 0 M20 -4 l0 0 M22 5 l0 0', lineOnly(3.5, '#C98A4A')),
    `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// Dad's huge bushy beard: front (top stage, under the eyes/mouth), moustache (face stage, over the mouth), side, back
function bushyBeardFront(hair, feat, c) {
  const M = (x, y, b) => { const p = Math.abs(x) >= 128 ? hair([x, y]) : feat([x, y]); return [p[0], p[1], b]; };
  const pts = [M(-150, -760, 0), M(-130, -760, 0), M(-124, -684, 0), M(-90, -660, 0), M(-40, -654, 0), M(0, -660, 0), M(40, -654, 0), M(90, -660, 0), M(124, -684, 0), M(130, -760, 0), M(150, -760, 0),
    M(166, -690, 14), M(170, -600, 18), M(150, -520, 18), M(104, -464, 18), M(40, -432, 18), M(-40, -432, 18), M(-104, -464, 18), M(-150, -520, 18), M(-170, -600, 14), M(-166, -690, 0)];
  const q = (x, y) => P(feat([x, y]));
  let inner = S.path(`M${q(-220, -500)} L${q(220, -500)} L${q(220, -400)} L${q(-220, -400)} Z`, { fill: c.beardShade, opacity: 0.85 });
  inner += S.path(`M${q(-120, -600)} q-12 30 4 60 M${q(-80, -560)} q-10 34 6 64 M${q(-20, -540)} q-8 40 8 70 M${q(40, -546)} q-10 36 6 66 M${q(100, -580)} q-6 30 8 56 M${q(140, -660)} q-4 30 6 56 M${q(-150, -660)} q-4 30 6 56`, lineOnly(4.5, c.beardShade));
  // a gap round the mouth: darker oval so the mouth reads inside the beard
  inner += S.ellipse(...feat([0, -598]), 64, 30, { fill: c.beardShade, opacity: 0.7 });
  return clipped(fluffy(pts), c.beard, inner, 6.5);
}
function bushyStacheFront(feat, c) {
  const m = feat([0, -630]);
  const half = (sx) => `M${f(m[0])} ${f(m[1] - 12)} C${f(m[0] + sx * 36)} ${f(m[1] - 40)} ${f(m[0] + sx * 98)} ${f(m[1] - 34)} ${f(m[0] + sx * 118)} ${f(m[1] + 6)} Q${f(m[0] + sx * 106)} ${f(m[1] + 14)} ${f(m[0] + sx * 96)} ${f(m[1] + 6)} Q${f(m[0] + sx * 86)} ${f(m[1] + 20)} ${f(m[0] + sx * 70)} ${f(m[1] + 10)} Q${f(m[0] + sx * 50)} ${f(m[1] + 22)} ${f(m[0] + sx * 30)} ${f(m[1] + 12)} Q${f(m[0] + sx * 10)} ${f(m[1] + 12)} ${f(m[0])} ${f(m[1] - 2)} Z`;
  return S.path(half(-1) + ' ' + half(1), outline(c.beard, 6)) + S.path(`M${f(m[0] - 80)} ${f(m[1] - 18)} Q${f(m[0] - 46)} ${f(m[1] - 30)} ${f(m[0] - 18)} ${f(m[1] - 16)}`, lineOnly(5, c.beardHi || '#FFFFFF88'));
}
function bushyBeardSide(c) {
  const pts = [[-20, -760, 0], [34, -760, 0], [48, -660, 12], [34, -560, 16], [-20, -470, 18], [-110, -440, 16], [-190, -480, 14], [-206, -566, 0], [-190, -640, 0], [-120, -656, 0], [-60, -676, 0]];
  let o = clipped(fluffy(pts), c.beard, S.rect(-260, -500, 400, 120, 0, { fill: c.beardShade, opacity: 0.85 }) + S.path('M-150 -600 q-8 30 6 60 M-90 -590 q-8 36 6 66 M-30 -620 q-6 40 8 70', lineOnly(4.5, c.beardShade)) + S.ellipse(-150, -600, 34, 22, { fill: c.beardShade, opacity: 0.7 }), 6.5);
  o += S.path('M-116 -644 C-130 -666 -178 -662 -200 -632 Q-190 -618 -176 -626 Q-160 -612 -144 -622 Q-126 -614 -116 -632 Z', outline(c.beard, 6));
  return o;
}
function bushyBeardBack(c) {
  let o = '';
  for (const sx of [-1, 1]) o += S.path(fluffy([[sx * 128, -680, 0], [sx * 168, -670, 12], [sx * 172, -580, 14], [sx * 150, -500, 12], [sx * 110, -470, 0]].map(([x, y, b], i, a) => (sx < 0 ? [x, y, b] : [x, y, b]))), outline(c.beard, 6.5));
  return o;
}
// thick fluffy brow (Dad): no highlight, slightly tufted outer end
function thickBrow(inner, outer, col) {
  const mid = [(inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2 - 12];
  const d = `M${P(inner)} Q${P(mid)} ${P(outer)}`;
  const tuft = `M${f(outer[0] - (outer[0] - inner[0]) * 0.25)} ${f(outer[1] - 6)} l${f((outer[0] - inner[0]) * 0.2)} 14`;
  return S.path(d + ' ' + tuft, lineOnly(31, LINE)) + S.path(d + ' ' + tuft, lineOnly(20, col));
}
// Mr. Fig's pencil moustache
function pencilStache(m, col, k = 1) {
  const d = `M${f(m[0] - 4)} ${f(m[1])} Q${f(m[0] - 34 * k)} ${f(m[1] - 10)} ${f(m[0] - 58 * k)} ${f(m[1] + 2)} Q${f(m[0] - 66 * k)} ${f(m[1] - 4)} ${f(m[0] - 62 * k)} ${f(m[1] - 12)} M${f(m[0] + 4)} ${f(m[1])} Q${f(m[0] + 34 * k)} ${f(m[1] - 10)} ${f(m[0] + 58 * k)} ${f(m[1] + 2)} Q${f(m[0] + 66 * k)} ${f(m[1] - 4)} ${f(m[0] + 62 * k)} ${f(m[1] - 12)}`;
  return S.path(d, lineOnly(12, col));
}
// Principal Pemberton's cat-eye glasses
function catEyeFront(feat, at, dir, spec) {
  const col = spec.col || '#B02E4A';
  const kNear = 1 - 0.04 * at, kFar = 1 - 0.3 * at;
  let o = '';
  for (const sx of [-1, 1]) {
    const k = (sx < 0) === (dir > 0) ? kNear : kFar;
    const [cx, cy] = feat([sx * 62, -712]);
    const w = 58 * k;
    const d = `M${f(cx - sx * w * 1.18)} ${f(cy - 50)} Q${f(cx)} ${f(cy - 46)} ${f(cx + sx * w * 0.95)} ${f(cy - 30)} Q${f(cx + sx * w * 0.98)} ${f(cy + 34)} ${f(cx)} ${f(cy + 38)} Q${f(cx - sx * w * 0.95)} ${f(cy + 34)} ${f(cx - sx * w)} ${f(cy - 18)} Z`;
    o += S.path(d, { fill: '#DDF4FF', 'fill-opacity': 0.2, stroke: col, 'stroke-width': 10, 'stroke-linejoin': 'round' });
    o += S.path(`M${f(cx - sx * w * 0.5)} ${f(cy + 10)} L${f(cx - sx * w * 0.1)} ${f(cy - 28)}`, lineOnly(5, '#FFFFFFAA'));
    o += S.circle(cx - sx * w * 1.05, cy - 44, 5, { fill: '#FFE58A', stroke: LINE, 'stroke-width': 2 });
  }
  const l = feat([-8, -730]), r = feat([8, -730]);
  o += S.path(`M${f(l[0] - 6)} ${f(l[1])} Q${f((l[0] + r[0]) / 2)} ${f(l[1] - 12)} ${f(r[0] + 6)} ${f(r[1])}`, lineOnly(8, col));
  return o;
}
function catEyeSide(spec) {
  const col = spec.col || '#B02E4A';
  return S.path('M-110 -740 L30 -748', lineOnly(8, col)) + S.path('M-186 -760 Q-150 -752 -132 -742 Q-130 -690 -150 -676 Q-180 -680 -184 -720 Z', { fill: '#DDF4FF', 'fill-opacity': 0.2, stroke: col, 'stroke-width': 9, 'stroke-linejoin': 'round' });
}

// chain looks4's head-accessory hook (front view): beard under the face, the rest over it
const headAcc4 = L2.headAcc;
L2.headAcc = function headAcc(style, stage, hair, feat, fx) {
  let o = headAcc4(style, stage, hair, feat, fx);
  const a = style.acc || {}, c = style.col;
  const at = Math.abs(fx) / 40, dir = fx >= 0 ? 1 : -1;
  if (stage === 'top') {
    if (a.bushyBeard) o += bushyBeardFront(hair, feat, c);
  } else if (stage === 'face') {
    if (a.bushyBeard) o += bushyStacheFront(feat, c);
    if (a.pencilStache) o += pencilStache(feat([0, -628]), a.pencilStache, 1 - 0.15 * at);
    if (a.catEye) o += catEyeFront(feat, at, dir, a.catEye);
    if (a.bandaid) { const p = feat([a.bandaid.x ?? 92, a.bandaid.y ?? -636]); o += bandaid(p[0], p[1], a.bandaid.rot ?? -24); }
  }
  return o;
};

// ====================================================================== OUTFITS (front, inside the torso clip)
const hem = (B, W, col, line = true) => S.rect(-W - 10, B - 24, 2 * W + 20, 26, 0, { fill: col }) + (line ? S.path(`M${-W - 10} ${B - 24} L${W + 10} ${B - 24}`, lineOnly(4)) : '');
function plaid(W, T, B, c, step = 40) {
  let a = '', b = '';
  for (let x = -W; x <= W; x += step) a += `M${x} ${T - 10} L${x} ${B + 10} `;
  for (let y = T + 10; y <= B; y += step) a += `M${-W - 10} ${y} L${W + 10} ${y} `;
  for (let x = -W + step / 2; x <= W; x += step) b += `M${x} ${T - 10} L${x} ${B + 10} `;
  for (let y = T + 10 + step / 2; y <= B; y += step) b += `M${-W - 10} ${y} L${W + 10} ${y} `;
  return S.path(a, lineOnly(13, c.plaid1)) + S.path(b, { ...lineOnly(4, c.plaid2), opacity: 0.6 });
}
function stripes(W, T, B, col, gap = 36, h = 15) {
  let st = '';
  for (let y = T + 14; y < B + 10; y += gap) st += `M${-W - 10} ${y} h${2 * W + 20} v${h} h${-2 * W - 20} Z `;
  return S.path(st, { fill: col });
}
const stitch = (col) => ({ fill: 'none', stroke: col, 'stroke-width': 3.5, 'stroke-dasharray': '8 6', 'stroke-linecap': 'round' });
function patchSquare(x, y, s, rot, col, line = '#FFFFFF') {
  return S.g(S.path(poly([[-26, -24], [26, -26], [28, 24], [-24, 26]], 5), outline(col, 4.5)) + S.path('M-16 -14 l10 0 M-14 -2 l10 0 M-16 10 l10 0', lineOnly(4, line)) + S.path(poly([[-20, -18], [20, -20], [22, 18], [-18, 20]], 3), stitch(line)), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function patchHeart(x, y, s, rot, col) {
  return S.g(S.path(F.heartPath(0, 0, 22), outline(col, 4.5)) + S.path(F.heartPath(0, 0, 15), stitch('#FFFFFF')), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function sparkles(W, T, B, seed = 1, cols = ['#FFFFFF', '#FFE58A']) {
  let a = '', b = '';
  for (let i = 0; i < 18; i++) {
    const x = -W + hash(i * 3.1 + seed) * 2 * W, y = T + hash(i * 7.7 + seed) * (B - T), r = 4 + 5 * hash(i * 1.3 + seed);
    const d = `M${f(x)} ${f(y - r)} L${f(x + r * 0.3)} ${f(y - r * 0.3)} L${f(x + r)} ${f(y)} L${f(x + r * 0.3)} ${f(y + r * 0.3)} L${f(x)} ${f(y + r)} L${f(x - r * 0.3)} ${f(y + r * 0.3)} L${f(x - r)} ${f(y)} L${f(x - r * 0.3)} ${f(y - r * 0.3)} Z `;
    if (i % 3) a += d; else b += d;
  }
  return S.path(a, { fill: cols[0], opacity: 0.85 }) + S.path(b, { fill: cols[1] });
}
function bowTie(cx, cy, col, dots, s = 1) {
  let o = S.path(`M${f(cx)} ${f(cy)} L${f(cx - 40 * s)} ${f(cy - 22 * s)} Q${f(cx - 48 * s)} ${f(cy)} ${f(cx - 40 * s)} ${f(cy + 22 * s)} Z M${f(cx)} ${f(cy)} L${f(cx + 40 * s)} ${f(cy - 22 * s)} Q${f(cx + 48 * s)} ${f(cy)} ${f(cx + 40 * s)} ${f(cy + 22 * s)} Z`, outline(col, 4.5));
  if (dots) o += S.path([[-28, -6], [-22, 10], [24, -8], [30, 8]].map(([x, y]) => `M${f(cx + x * s - 3)} ${f(cy + y * s)} a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 Z`).join(' '), { fill: dots });
  return o + S.rect(cx - 10 * s, cy - 12 * s, 20 * s, 24 * s, 6 * s, outline(col, 4.5));
}
function idBadge(x, y, s = 1, c = {}) {
  let o = S.rect(-28, -36, 56, 72, 8, outline('#FFFFFF', 4)) + S.rect(-28, -36, 56, 16, 6, { fill: c.badge || '#E8453C' }) + S.rect(-20, -14, 22, 26, 4, { fill: '#B9D4F0' });
  o += S.circle(-9, -5, 6, { fill: '#7A5040' }) + S.path('M8 -8 L22 -8 M8 2 L20 2 M-20 24 L20 24', lineOnly(4, '#9AA6C0')) + txt('RN', 10, 18, 14, '#2A3A6A');
  return S.g(S.rect(-10, -48, 20, 16, 4, outline('#C9CED8', 3)) + o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function outfit5(style, t, shade, back, T, B, W) {
  const c = style.col;
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  let o = '';
  switch (style.top) {
    case 'ivyOveralls': {
      o += stripes(W, T, B, c.stripe, 34, 14);
      const den = c.denim, st = stitch(c.stitch);
      if (!back) {
        o += S.path(`M${f(cx - 36 * k)} ${T - 6} Q${f(cx)} ${T + 30} ${f(cx + 36 * k)} ${T - 6} Z`, outline(c.skin, 5));
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 46 * k - 14, -468], [cx + sx * 46 * k + 14, -468], [sx * 72 + 16, T - 12], [sx * 72 - 16, T - 12]], 3), outline(den, 5)) + S.path(`M${f(cx + sx * 46 * k)} -468 L${sx * 72} ${T - 12}`, st);
        o += S.path(poly([[cx - 64 * k, -476], [cx + 64 * k, -476], [cx + 66 * k, -372], [cx - 66 * k, -372]], 10), outline(den, 6));
        o += S.rect(-W - 10, -380, 2 * W + 20, B + 400, 0, { fill: den }) + S.path(`M${-W - 10} -380 L${f(cx - 66 * k)} -380 M${f(cx + 66 * k)} -380 L${W + 10} -380`, lineOnly(5));
        o += S.path(poly([[cx - 54 * k, -466], [cx + 54 * k, -466], [cx + 56 * k, -384], [cx - 56 * k, -384]], 6), st);
        // bib pocket with a screwdriver and a pencil
        o += S.rect(cx - 16 * k, -470, 9, 40, 3, outline('#FFC93C', 3)) + S.path(`M${f(cx - 11.5 * k)} -470 l0 -12`, lineOnly(5, '#5A6478'));
        o += S.rect(cx + 6 * k, -468, 12, 40, 4, outline('#E8453C', 3)) + S.rect(cx + 8 * k, -482, 8, 16, 2, outline('#C9CED8', 3));
        o += S.path(poly([[cx - 40 * k, -440], [cx + 40 * k, -440], [cx + 38 * k, -392], [cx - 38 * k, -392]], 8), outline(c.denimShade, 5)) + S.path(`M${f(cx - 40 * k)} -428 L${f(cx + 40 * k)} -428`, st);
        for (const sx of [-1, 1]) o += S.rect(cx + sx * 46 * k - 12, -472, 24, 18, 5, outline(c.button, 3.5));
        o += patchSquare(cx - 64 * k, -336, 0.9, -8, c.patch1, '#FFFFFF');
        o += S.path(`M${-W + 18} -360 L${-W + 18} ${B} M${W - 18} -360 L${W - 18} ${B}`, st);
      } else {
        for (const sx of [-1, 1]) o += S.path(`M${sx * 74} ${T - 10} L${-sx * 30} -394`, lineOnly(30, LINE)) + S.path(`M${sx * 74} ${T - 10} L${-sx * 30} -394`, lineOnly(22, den));
        o += S.path(poly([[-W - 10, -400], [W + 10, -400], [W + 10, B + 10], [-W - 10, B + 10]], 2), outline(den, 5));
        o += patchHeart(46, -350, 0.9, 10, c.patch2);
      }
      break;
    }
    case 'dadPlaid':
    case 'dadApron': {
      o += plaid(W, T, B, c);
      const apron = style.top === 'dadApron';
      if (!back) {
        o += S.path(`M${f(cx - 36 * k)} ${T - 6} L${f(cx)} ${T + 30} L${f(cx + 36 * k)} ${T - 6} Z`, { fill: c.skin });
        o += S.path(`M${f(cx)} ${T + 30} L${f(cx)} ${B}`, lineOnly(4.5));
        for (const y of [-470, -420, -370, -330]) o += S.circle(cx - 7, y, 5, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 2.5 });
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 6} L${f(cx + sx * 50 * k)} ${T - 10} L${f(cx + sx * 42 * k)} ${T + 38} Z`, outline(c.collar || c.topShade, 4.5));
        if (apron) {
          for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 64 * k)} -486 L${f(cx + sx * 40 * k)} ${T - 10}`, lineOnly(18, LINE)) + S.path(`M${f(cx + sx * 64 * k)} -486 L${f(cx + sx * 40 * k)} ${T - 10}`, lineOnly(10, c.apron));
          o += S.path(poly([[cx - 76 * k, -492], [cx + 76 * k, -492], [cx + 84 * k, B + 20], [cx - 84 * k, B + 20]], 12), outline(c.apron, 6));
          o += S.path(poly([[cx - 66 * k, -482], [cx + 66 * k, -482], [cx + 74 * k, B + 20], [cx - 74 * k, B + 20]], 8), stitch(c.apronTrim));
          // a pancake + spatula logo (the beard hides the top of the bib)
          o += S.g(S.ellipse(-16, -360, 30, 11, outline('#F2B64A', 4)) + S.ellipse(-16, -364, 18, 5, { fill: '#F8CC6C' }) + S.path('M8 -356 L50 -388', lineOnly(7, c.apronInk)) + S.path(poly([[40, -406], [64, -394], [56, -376], [34, -388]], 4), outline('#C9D0DA', 3.5)), `translate(${f(cx)} 0) scale(${f(k)} 1)`);
        } else {
          o += S.path(poly([[cx + 30 * k, -470], [cx + 76 * k, -470], [cx + 76 * k, -426], [cx + 30 * k, -426]], 5), outline('none', 4)) + S.rect(cx + 40 * k, -488, 8, 26, 3, outline('#2B6CE0', 3));
          o += S.rect(-W - 10, B - 24, 2 * W + 20, 30, 0, { fill: '#000', opacity: 0.08 });
        }
      } else {
        o += S.path(`M-56 ${T - 6} Q0 ${T + 20} 56 ${T - 6}`, lineOnly(18, LINE)) + S.path(`M-56 ${T - 6} Q0 ${T + 20} 56 ${T - 6}`, lineOnly(11, c.collar || c.topShade));
        if (apron) {
          for (const sx of [-1, 1]) o += S.path(`M${sx * 64} ${T - 10} L${-sx * 66} -352`, lineOnly(16, LINE)) + S.path(`M${sx * 64} ${T - 10} L${-sx * 66} -352`, lineOnly(9, c.apron));
          o += S.path(`M${-W - 10} -340 L${W + 10} -340`, lineOnly(16, LINE)) + S.path(`M${-W - 10} -340 L${W + 10} -340`, lineOnly(9, c.apron));
          o += S.path('M0 -340 Q-40 -378 -46 -350 Q-40 -320 0 -340 Q40 -378 46 -350 Q40 -320 0 -340 Z M0 -340 L-26 -296 M0 -340 L24 -298', outline(c.apron, 4.5));
        }
      }
      break;
    }
    case 'scrubs': {
      if (!back) {
        o += S.path(`M${f(cx - 46 * k)} ${T - 6} L${f(cx)} ${T + 64} L${f(cx + 46 * k)} ${T - 6} Z`, { fill: c.skin });
        o += S.path(`M${f(cx - 46 * k)} ${T - 6} L${f(cx)} ${T + 64} L${f(cx + 46 * k)} ${T - 6}`, lineOnly(16, LINE)) + S.path(`M${f(cx - 46 * k)} ${T - 6} L${f(cx)} ${T + 64} L${f(cx + 46 * k)} ${T - 6}`, lineOnly(9, c.trim));
        // chest pocket with pens
        o += S.rect(cx + 34 * k, -470, 9, 34, 3, outline('#2E6BE0', 3)) + S.rect(cx + 48 * k, -466, 9, 30, 3, outline('#E8453C', 3));
        o += S.path(poly([[cx + 26 * k, -446], [cx + 80 * k, -446], [cx + 80 * k, -396], [cx + 26 * k, -396]], 6), outline(c.topShade, 4.5));
        // lanyard + ID badge
        const lan = `M${f(cx - 40 * k)} ${T - 8} Q${f(cx - 44 * k)} -470 ${f(cx - 40 * k)} -420 M${f(cx + 10 * k)} ${T - 8} Q${f(cx - 10 * k)} -470 ${f(cx - 40 * k)} -420`;
        o += S.path(lan, lineOnly(10, LINE)) + S.path(lan, lineOnly(5, c.lanyard));
        o += idBadge(cx - 40 * k, -378, 0.86, c);
        o += S.path(poly([[cx - 84 * k, -362], [cx - 50 * k, -362], [cx - 50 * k, -320], [cx - 84 * k, -320]], 5), outline(c.topShade, 4));
      } else o += S.path(`M-50 ${T - 6} Q0 ${T + 20} 50 ${T - 6}`, lineOnly(16, LINE)) + S.path(`M-50 ${T - 6} Q0 ${T + 20} 50 ${T - 6}`, lineOnly(9, c.trim));
      break;
    }
    case 'beaDress': {
      if (!back) {
        o += S.path(`M${f(cx - 34 * k)} ${T - 6} Q${f(cx)} ${T + 26} ${f(cx + 34 * k)} ${T - 6} Z`, outline(c.skin, 5));
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 2)} ${T + 20} Q${f(cx + sx * 30 * k)} ${T + 60} ${f(cx + sx * 64 * k)} ${T + 22} Q${f(cx + sx * 62 * k)} ${T - 6} ${f(cx + sx * 34 * k)} ${T - 10} Q${f(cx + sx * 26 * k)} ${T + 14} ${f(cx + sx * 2)} ${T + 20} Z`, outline(c.collar, 4.5));
        o += S.path(F.starPath(cx, -400, 42, 20), outline(c.star, 5)) + S.path(`M${f(cx - 14)} -414 L${f(cx - 6)} -428`, lineOnly(5, '#FFFFFF'));
      } else o += S.path(`M-46 ${T - 6} Q0 ${T + 22} 46 ${T - 6}`, lineOnly(16, LINE)) + S.path(`M-46 ${T - 6} Q0 ${T + 22} 46 ${T - 6}`, lineOnly(9, c.collar));
      o += S.rect(-W - 10, B - 30, 2 * W + 20, 30, 0, { fill: c.topShade }) + S.path(`M${-W - 10} ${B - 30} L${W + 10} ${B - 30}`, lineOnly(4));
      if (back) o += S.path(`M0 ${B - 16} Q-50 ${B - 60} -60 ${B - 20} Q-50 ${B + 10} 0 ${B - 16} Q50 ${B - 60} 60 ${B - 20} Q50 ${B + 10} 0 ${B - 16} Z`, outline(c.collar, 4.5)) + S.circle(0, B - 16, 10, outline(c.collar, 4));
      break;
    }
    case 'figVest': {
      if (!back) {
        o += S.path(poly([[-W - 12, -500], [cx - 46 * k, T - 12], [cx, -432], [cx + 46 * k, T - 12], [W + 12, -500], [W + 12, B + 12], [-W - 12, B + 12]], 4), outline(c.vest, 5));
        o += S.path(`M${f(cx - 46 * k)} ${T - 10} L${f(cx)} -432 L${f(cx + 46 * k)} ${T - 10}`, lineOnly(15, LINE)) + S.path(`M${f(cx - 46 * k)} ${T - 10} L${f(cx)} -432 L${f(cx + 46 * k)} ${T - 10}`, lineOnly(8, c.vestTrim));
        let cable = '';
        for (const x0 of [-60, 60]) { const x = cx + x0 * k; for (let y = -420; y < B - 40; y += 30) cable += `M${f(x - 10)} ${y} Q${f(x + 12)} ${y + 15} ${f(x - 10)} ${y + 30} M${f(x + 10)} ${y} Q${f(x - 12)} ${y + 15} ${f(x + 10)} ${y + 30} `; }
        o += S.path(cable, lineOnly(5, c.vestTrim));
        o += S.path(`M${f(cx)} -430 L${f(cx)} ${B}`, lineOnly(3, c.vestTrim));
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 4} L${f(cx + sx * 38 * k)} ${T - 8} L${f(cx + sx * 30 * k)} ${T + 30} Z`, outline(c.top, 4));
        o += bowTie(cx, T + 14, c.bow, c.bowDot, 0.9 * k);
        o += S.rect(cx + 42 * k, -470, 7, 32, 2, outline('#E8453C', 3)) + S.rect(cx + 54 * k, -466, 7, 28, 2, outline('#2E6BE0', 3));
      } else o += S.path(poly([[-W - 12, -500], [W + 12, -500], [W + 12, B + 12], [-W - 12, B + 12]], 4), outline(c.vest, 5));
      let rib = '';
      for (let x = -W + 6; x < W; x += 14) rib += `M${x} ${B - 24} L${x} ${B} `;
      o += S.rect(-W - 10, B - 26, 2 * W + 20, 28, 0, { fill: c.vestTrim }) + S.path(rib, lineOnly(3, c.vest)) + S.path(`M${-W - 10} ${B - 26} L${W + 10} ${B - 26}`, lineOnly(4));
      break;
    }
    case 'trackJacket': {
      o += S.rect(-W - 10, T - 10, 26, B - T + 20, 0, { fill: c.panel }) + S.rect(W - 16, T - 10, 26, B - T + 20, 0, { fill: c.panel });
      o += S.path(`M${-W + 16} ${T} L${-W + 16} ${B} M${W - 16} ${T} L${W - 16} ${B}`, lineOnly(4));
      if (!back) {
        o += S.path(poly([[cx - 50 * k, T - 14], [cx + 50 * k, T - 14], [cx + 44 * k, T + 24], [cx - 44 * k, T + 24]], 8), outline(c.topShade, 5));
        o += S.path(`M${f(cx)} ${T + 22} L${f(cx)} ${B}`, lineOnly(9, LINE)) + S.path(`M${f(cx)} ${T + 22} L${f(cx)} ${B}`, { ...lineOnly(4, c.zip), 'stroke-dasharray': '4 4' });
        o += S.rect(cx - 7, T + 26, 14, 28, 4, outline(c.zip, 3.5));
        o += S.path(F.starPath(cx + 52 * k, -462, 15), outline(c.zip, 3.5));
        if (!style.whistleUp) {
          const lan = `M${f(cx - 40 * k)} ${T - 10} Q${f(cx - 26)} -440 ${f(cx - 6)} -420 M${f(cx + 40 * k)} ${T - 10} Q${f(cx + 30)} -440 ${f(cx - 6)} -420`;
          o += S.path(lan, lineOnly(11, LINE)) + S.path(lan, lineOnly(6, c.lanyard)) + L4.whistleShape(cx - 6, -404, 1);
        }
      } else o += txt('COACH', 0, -430, 50, c.panel, { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }) + txt('DEE', 0, -372, 46, c.zip, { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
      o += hem(B, W, c.topShade);
      break;
    }
    case 'pembCardigan': {
      if (!back) {
        o += S.rect(cx - 42 * k, T - 10, 84 * k, B - T + 20, 0, { fill: c.shirt });
        o += S.path(`M${f(cx - 26 * k)} ${T - 8} Q${f(cx)} ${T + 20} ${f(cx + 26 * k)} ${T - 8}`, lineOnly(5, c.shirtShade));
        for (let i = 0; i <= 8; i++) { const u = i / 8, x = cx + (-40 + 80 * u) * k, y = T + 10 + Math.sin(u * Math.PI) * 40; o += S.circle(x, y, 8, outline('#FFF8EE', 2.5)) + S.circle(x - 2.5, y - 2.5, 2.4, { fill: '#FFFFFF' }); }
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 42 * k, T - 12], [cx + sx * 74 * k, T - 12], [cx + sx * 50 * k, B + 12], [cx + sx * 40 * k, B + 12]], 4), outline(c.topShade, 5));
        for (const y of [-430, -380, -330]) o += S.circle(cx - 47 * k, y, 7, outline(c.button, 3.5));
        o += S.path(F.starPath(cx + 64 * k, -460, 14), outline('#FFC93C', 3)) + S.circle(cx + 64 * k, -460, 5, { fill: '#E8453C' });
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 60 * k, -380], [cx + sx * 94 * k, -380], [cx + sx * 94 * k, -332], [cx + sx * 60 * k, -332]], 6), outline(c.topShade, 4.5));
      }
      let rib = '';
      for (let x = -W + 8; x < W; x += 22) rib += `M${x} ${T + (back ? 10 : 40)} L${x} ${B} `;
      o += S.path(rib, lineOnly(2.5, c.topShade)) + hem(B, W, c.topShade);
      break;
    }
    case 'leotard': {
      o += sparkles(W, T, B, 3, ['#FFFFFF', '#FFE58A']);
      if (!back) {
        o += S.path(`M${f(cx - 48 * k)} ${T - 8} Q${f(cx)} ${T + 56} ${f(cx + 48 * k)} ${T - 8} Z`, outline(c.skin, 5));
        o += S.path(F.starPath(cx, -400, 40, 18), outline('#FFC93C', 5)) + S.path(F.starPath(cx, -400, 16, 7), { fill: '#FFF6C0' });
      } else o += S.path(`M-50 ${T - 8} Q0 ${T + 80} 50 ${T - 8} Z`, outline(c.skin, 5));
      o += S.rect(-W - 10, -326, 2 * W + 20, 22, 0, { fill: c.topShade });
      break;
    }
    default: return null;
  }
  return o;
}
const TOPS5 = ['ivyOveralls', 'dadPlaid', 'dadApron', 'scrubs', 'beaDress', 'figVest', 'trackJacket', 'pembCardigan', 'leotard'];

// side-view torso details (inside the side torso clip); facing screen-left, front edge x0, back edge x1
function outfitSide5(style, x0, x1) {
  const c = style.col;
  let o = '';
  switch (style.top) {
    case 'ivyOveralls':
      o += stripes(100, -535, -300, c.stripe, 34, 14);
      o += S.path(`M${x0 - 10} -380 L${x1 + 10} -380 L${x1 + 10} -290 L${x0 - 10} -290 Z`, outline(c.denim, 5)) + S.path(poly([[x0 - 10, -476], [x0 + 40, -476], [x0 + 44, -370], [x0 - 10, -370]], 8), outline(c.denim, 5));
      o += S.path(`M${x0 + 30} -470 L${x1 - 24} -545`, lineOnly(30, LINE)) + S.path(`M${x0 + 30} -470 L${x1 - 24} -545`, lineOnly(22, c.denim)) + S.rect(x0 + 18, -478, 24, 18, 5, outline(c.button, 3.5));
      o += patchSquare(20, -336, 0.8, 6, c.patch1);
      break;
    case 'dadPlaid':
    case 'dadApron':
      o += plaid(100, -545, -300, c);
      o += S.path(`M${x0 - 10} -548 L${x0 + 34} -548 L${x0 + 10} -506 Z`, outline(c.collar || c.topShade, 4.5));
      if (style.top === 'dadApron') o += S.path(poly([[x0 - 14, -496], [x0 + 18, -496], [x0 + 18, -290], [x0 - 14, -290]], 4), outline(c.apron, 5)) + S.path(`M${x0 + 10} -496 L${x1 - 20} -545`, lineOnly(16, LINE)) + S.path(`M${x0 + 10} -496 L${x1 - 20} -545`, lineOnly(9, c.apron)) + S.path(`M${x0} -340 L${x1 + 10} -340`, lineOnly(16, LINE)) + S.path(`M${x0} -340 L${x1 + 10} -340`, lineOnly(9, c.apron));
      break;
    case 'scrubs':
      o += S.path(`M${x0 - 10} -548 L${x0 + 26} -548 L${x0 - 10} -470 Z`, { fill: c.skin }) + S.path(`M${x0 + 26} -548 L${x0 - 10} -470`, lineOnly(9, c.trim)) + S.path(poly([[x0 + 4, -446], [x0 + 50, -446], [x0 + 50, -398], [x0 + 4, -398]], 6), outline(c.topShade, 4.5)) + S.rect(x0 + 12, -468, 8, 30, 3, outline('#2E6BE0', 3));
      o += S.path(`M${x0 - 4} -530 Q${x0 - 14} -470 ${x0 - 2} -420`, lineOnly(10, LINE)) + S.path(`M${x0 - 4} -530 Q${x0 - 14} -470 ${x0 - 2} -420`, lineOnly(5, c.lanyard)) + S.rect(x0 - 12, -420, 22, 50, 5, outline('#FFFFFF', 3.5));
      break;
    case 'beaDress':
      o += S.path(`M${x0 - 10} -548 Q${x0 + 30} -520 ${x0 + 40} -500 Q${x0 + 10} -490 ${x0 - 10} -500 Z`, outline(c.collar, 4.5)) + S.rect(x0 - 10, -336, x1 - x0 + 20, 30, 0, { fill: c.topShade });
      o += S.path(F.starPath(x0 + 6, -410, 26, 12), outline(c.star, 4));
      break;
    case 'figVest':
      o += S.path(poly([[x0 - 10, -500], [x1 + 10, -500], [x1 + 10, -290], [x0 - 10, -290]], 4), outline(c.vest, 5)) + S.path(`M${x0 - 10} -548 L${x0 + 30} -548 L${x0 - 6} -500 Z`, outline(c.top, 4)) + S.rect(x0 - 10, -332, x1 - x0 + 20, 28, 0, { fill: c.vestTrim });
      { let cable = ''; for (let y = -480; y < -340; y += 30) cable += `M${x0 + 16} ${y} Q${x0 + 38} ${y + 15} ${x0 + 16} ${y + 30} M${x0 + 36} ${y} Q${x0 + 14} ${y + 15} ${x0 + 36} ${y + 30} `; o += S.path(cable, lineOnly(5, c.vestTrim)); }
      break;
    case 'trackJacket':
      o += S.rect(-12, -545, 26, 260, 0, { fill: c.panel }) + S.path('M-12 -545 L-12 -290 M14 -545 L14 -290', lineOnly(4)) + S.path(poly([[x0 - 10, -552], [x1 - 30, -552], [x1 - 30, -514], [x0 - 10, -514]], 8), outline(c.topShade, 5)) + hem(-306, 100, c.topShade);
      if (!style.whistleUp) o += S.path(`M${x0 + 4} -514 Q${x0 - 4} -460 ${x0 + 2} -430`, lineOnly(11, LINE)) + S.path(`M${x0 + 4} -514 Q${x0 - 4} -460 ${x0 + 2} -430`, lineOnly(6, c.lanyard));
      break;
    case 'pembCardigan':
      o += S.path(`M${x0 - 10} -545 L${x0 + 22} -545 L${x0 + 2} -300 L${x0 - 10} -300 Z`, { fill: c.shirt }) + S.path(`M${x0 + 22} -545 L${x0 + 2} -300`, lineOnly(5)) + S.circle(x0 + 2, -520, 7, outline('#FFF8EE', 2.5)) + S.circle(x0 - 4, -500, 7, outline('#FFF8EE', 2.5)) + hem(-306, 100, c.topShade);
      break;
    case 'leotard':
      o += sparkles(100, -545, -300, 5) + S.path(`M${x0 - 10} -548 Q${x0 + 20} -510 ${x0 - 10} -480 Z`, outline(c.skin, 4.5)) + S.rect(x0 - 10, -326, x1 - x0 + 20, 22, 0, { fill: c.topShade });
      break;
    default: return L4.outfitSide4 ? '' : '';
  }
  return o;
}

// ====================================================================== EXTENSIONS: dress skirt, apron, scrub-top hem, pencil skirt, leotard brief
// style.ext5 = { kind: 'skirt'|'apron'|'tunic'|'pencil'|'brief', top, len, flare, col, shade, trim }
function ext5Front(style, t, shade, back) {
  const e = style.ext5, c = style.col;
  if (!e) return '';
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  const W = style.torsoW || 100;
  const y0 = e.top ?? -330, y1 = y0 + e.len;
  if (e.kind === 'apron') {
    if (back) return S.path(`M${-W - 6} ${y0 - 10} L${W + 6} ${y0 - 10}`, lineOnly(16, LINE)) + S.path(`M${-W - 6} ${y0 - 10} L${W + 6} ${y0 - 10}`, lineOnly(9, e.col));
    const d = poly([[cx - 84 * k, y0], [cx + 84 * k, y0], [cx + (84 + e.flare) * k, y1], [cx - (84 + e.flare) * k, y1]], 12);
    let inner = S.path(poly([[cx - 74 * k, y0 + 6], [cx + 74 * k, y0 + 6], [cx + (74 + e.flare) * k, y1 - 8], [cx - (74 + e.flare) * k, y1 - 8]], 8), stitch(e.trim));
    if (e.text) inner += S.g(e.text.map((tx, i) => txt(tx, 0, y0 + 54 + i * 44, i ? 40 : 50, e.ink || LINE, { 'letter-spacing': i ? 0 : 3 })).join(''), `translate(${f(cx)} 0) scale(${f(k)} 1)`);
    else inner += S.path(poly([[cx - 62 * k, y0 + 44], [cx + 62 * k, y0 + 44], [cx + 64 * k, y0 + 104], [cx - 64 * k, y0 + 104]], 8), outline(e.col, 4.5));
    if (shade) inner += S.rect(cx - 120 * k, y1 - 26, 240 * k, 30, 0, { fill: '#000', opacity: 0.1 });
    let o = clipped(d, e.col, inner);
    // a whisk tucked in the waistband
    if (!e.text) o += S.g(S.rect(-5, -10, 10, 50, 4, outline('#C98A4A', 3)) + S.path('M0 -10 Q-22 -50 0 -78 Q22 -50 0 -10 M0 -10 Q-8 -50 0 -78 Q8 -50 0 -10', lineOnly(4, '#9AA4B4')), `translate(${f(cx + 36 * k)} ${y0 + 60}) rotate(14)`);
    o += S.path(`M${-W - 6} ${y0 - 4} L${W + 6} ${y0 - 4}`, lineOnly(16, LINE)) + S.path(`M${-W - 6} ${y0 - 4} L${W + 6} ${y0 - 4}`, lineOnly(9, e.col));
    return o;
  }
  const wTop = W + (e.inset || 0), wBot = W + (e.flare || 0);
  const d = e.kind === 'brief'
    ? `M${-wTop} ${y0} L${wTop} ${y0} L${wTop} ${y0 + 20} L${f(cx + 30 * k)} ${y1} L${f(cx - 30 * k)} ${y1} L${-wTop} ${y0 + 20} Z`
    : poly([[-wTop, y0], [wTop, y0], [wBot, y1], [-wBot, y1]], e.kind === 'tunic' ? 8 : 14);
  let inner = '';
  if (e.kind === 'skirt') {
    if (shade) inner += S.rect(-wBot - 10, y1 - 24, 2 * wBot + 20, 30, 0, { fill: '#000', opacity: 0.1 });
    for (const x of [-0.55, 0, 0.55]) inner += S.path(`M${f(cx + x * wTop * 0.8)} ${y0 + 10} L${f(cx + x * wBot * 0.92)} ${y1}`, lineOnly(4, e.shade));
    if (e.dots) { let dd = ''; for (let i = 0; i < 12; i++) { const x = -wBot + hash(i + 2) * 2 * wBot, y = y0 + 16 + hash(i * 5) * (e.len - 40); dd += `M${f(x - 5)} ${f(y)} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z `; } inner += S.path(dd, { fill: e.dots, opacity: 0.85 }); }
    if (e.trim) inner += S.rect(-wBot - 10, y1 - 20, 2 * wBot + 20, 14, 0, { fill: e.trim }) + S.path(`M${-wBot - 10} ${y1 - 20} L${wBot + 10} ${y1 - 20}`, lineOnly(3.5));
  } else if (e.kind === 'tunic') {
    if (!back) for (const sx of [-1, 1]) inner += S.path(`M${sx * (wBot - 4)} ${y1} L${sx * (wBot - 14)} ${y1 - 26}`, lineOnly(5));
    inner += S.rect(-wBot - 10, y1 - 12, 2 * wBot + 20, 14, 0, { fill: e.shade || c.topShade });
  } else if (e.kind === 'pencil') {
    if (shade) inner += S.rect(-wBot - 10, y1 - 22, 2 * wBot + 20, 30, 0, { fill: '#000', opacity: 0.12 });
    inner += S.path(`M${-wTop + 6} ${y0 + 20} L${-wBot + 10} ${y1}`, lineOnly(4, e.shade)) + (back ? S.path(`M0 ${y1 - 46} L0 ${y1}`, lineOnly(5)) : '');
  } else if (e.kind === 'brief') {
    inner += sparkles(wTop, y0, y1, 9);
  }
  return clipped(d, e.col, inner);
}
function ext5Side(style, x0, x1) {
  const e = style.ext5, c = style.col;
  if (!e) return '';
  const y0 = e.top ?? -330, y1 = y0 + e.len;
  if (e.kind === 'apron') return S.path(poly([[x0 - 16, y0], [x0 + 18, y0], [x0 + 18 - e.flare * 0.4, y1], [x0 - 16 - e.flare * 0.6, y1]], 6), outline(e.col, 5));
  if (e.kind === 'brief') return S.path(`M${x0 - 8} ${y0} L${x1 + 8} ${y0} L${x1 + 8} ${y0 + 10} L${(x0 + x1) / 2} ${y1} L${x0 - 8} ${y0 + 20} Z`, outline(e.col, 5));
  const fl = e.flare || 0;
  const d = poly([[x0 - 8, y0], [x1 + 8, y0], [x1 + fl * 0.7, y1], [x0 - fl * 0.6, y1]], e.kind === 'tunic' ? 8 : 14);
  let inner = '';
  if (e.kind === 'skirt') { inner += S.path(`M0 ${y0 + 10} L10 ${y1}`, lineOnly(4, e.shade)); if (e.trim) inner += S.rect(x0 - fl - 10, y1 - 20, x1 - x0 + 2 * fl + 20, 14, 0, { fill: e.trim }); }
  else if (e.kind === 'tunic') inner += S.rect(x0 - fl - 10, y1 - 12, x1 - x0 + 2 * fl + 20, 14, 0, { fill: e.shade || c.topShade });
  return clipped(d, e.col, inner);
}

// ====================================================================== TORSO
function makeTorso5(style) {
  const c = style.col;
  const W = style.torsoW || 100, Wb = W - (style.taper || 0);
  return function torso(t, shade, back = false) {
    const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
    const T = -533, B = -306;
    let o = '';
    if (style.ext5 && style.ext5.under) o += ext5Front(style, t, shade, back);
    const id = S.uid('t5');
    const d = poly([[-W, T], [W, T], [Wb, B], [-Wb, B]], 16);
    let inner = outfit5(style, t, shade, back, T, B, W);
    if (inner === null) inner = L4.outfit4(style, t, shade, back, T, B, W);
    if (shade) {
      inner += S.rect(-W - 10, B - 26, 2 * W + 20, 30, 0, { fill: '#000', opacity: 0.1 });
      if (at > 0.02) inner += S.rect(dir > 0 ? -W - 10 : W - 34 * at, T - 10, 34 * at + 10, B - T + 20, 0, { fill: '#000', opacity: 0.22 });
    }
    o += S.clipDef(id, S.path(d)) + S.path(d, { fill: c.top }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    if (style.ext5 && !style.ext5.under) o += ext5Front(style, t, shade, back);
    return o;
  };
}
function makeTorsoSide5(style) {
  const c = style.col;
  const k = (style.torsoW || 100) / 100;
  const x0 = -62 * k, x1 = 70 * k;
  return function torsoSide(shade) {
    let o = '';
    if (style.ext5 && style.ext5.under) o += ext5Side(style, x0, x1);
    const td = S.roundedPath([[x0, -535], [x1, -535], [x1, -305], [x0, -305]], 16);
    const tid = S.uid('ts5');
    let inner = S.rect(x0 - 18, -545, 40, 260, 0, { fill: c.topShade || c.top, opacity: 0.6 }) + outfitSide5(style, x0, x1);
    if (shade) inner += S.rect(x0 - 10, -330, x1 - x0 + 20, 30, 0, { fill: '#000', opacity: 0.12 });
    o += S.clipDef(tid, S.path(td)) + S.path(td, { fill: c.top }) + S.g(inner, null, { 'clip-path': `url(#${tid})` }) + S.path(td, outline('none'));
    if (style.ext5 && !style.ext5.under) o += ext5Side(style, x0, x1);
    if (style.top === 'trackJacket' && !style.whistleUp) o += L4.whistleShape(x0 - 4, -420, 0.9, 80);
    return o;
  };
}

// ====================================================================== ARMS: stripes, plaid, rolled sleeves, puff sleeves, sparkles, track stripes
function makeArm5(style) {
  const c = style.col;
  const kw = style.armW || 1;
  return function arm({ shade = true, dim = false, view = 'front' } = {}) {
    const side = view === 'side';
    const hw0 = (side ? 40 : 30) * kw, hw1 = 40 * kw, len = side ? 248 : 268;
    const id = S.uid('a5');
    const d = S.roundedPath([[-hw0, -18], [hw0, -18], [hw1, len], [-hw1, len]], 17);
    const sl = style.sleeve;
    const sleeveY = sl === 'long' ? (side ? 206 : 226) : sl === 'none' ? -40 : sl === 'rolled' ? (side ? 126 : 138) : sl === 'puff' ? (side ? 80 : 88) : (side ? 100 : 112);
    const sc = c.sleeve || c.top;
    let inner = '';
    if (sl !== 'none') {
      inner += S.rect(-hw1 - 6, -30, 2 * hw1 + 12, sleeveY + 30, 0, { fill: sc });
      if (style.sleeveStripes) { let st = ''; for (let y = -6; y < sleeveY - 8; y += 34) st += `M${-hw1 - 6} ${y} h${2 * hw1 + 12} v14 h${-2 * hw1 - 12} Z `; inner += S.path(st, { fill: style.sleeveStripes }); }
      if (style.sleevePlaid) inner += S.path(`M${-hw1 - 6} 30 L${hw1 + 6} 30 M${-hw1 - 6} 76 L${hw1 + 6} 76 M0 -30 L0 ${sleeveY}`, lineOnly(11, c.plaid1)) + S.path(`M${-hw1 - 6} 52 L${hw1 + 6} 52 M-20 -30 L-20 ${sleeveY} M20 -30 L20 ${sleeveY}`, { ...lineOnly(3.5, c.plaid2), opacity: 0.6 });
      if (style.trackStripe) inner += S.rect(side ? -8 : 8 * kw, -40, 10, sleeveY + 40, 0, { fill: style.trackStripe }) + S.rect(side ? 8 : 24 * kw, -40, 10, sleeveY + 40, 0, { fill: style.trackStripe });
      if (style.sleeveSparkle) inner += sparkles(hw1, 0, sleeveY, 11);
      if (sl === 'long') inner += S.rect(-hw1 - 6, sleeveY - 18, 2 * hw1 + 12, 18, 0, { fill: c.cuff || c.topShade || '#0003' }) + S.path(`M${-hw1 - 6} ${sleeveY - 18} L${hw1 + 6} ${sleeveY - 18}`, lineOnly(4.5));
      if (sl === 'short' && style.sleeveTrim) inner += S.rect(-hw1 - 6, sleeveY - 14, 2 * hw1 + 12, 14, 0, { fill: style.sleeveTrim });
    }
    if (style.gloveCol) inner += S.rect(-hw1 - 6, len - 50, 2 * hw1 + 12, 60, 0, { fill: style.gloveCol }) + S.path(`M${-hw1 - 6} ${len - 50} L${hw1 + 6} ${len - 50}`, lineOnly(4.5));
    if (shade) inner += S.rect((side ? 22 : 20) * kw, -30, 24 * kw, len + 30, 0, { fill: '#000', opacity: 0.07 });
    if (sl !== 'none') inner += S.path(`M${-hw1 - 6} ${sleeveY} L${hw1 + 6} ${sleeveY}`, lineOnly(SW));
    if (dim) inner += S.path(d, { fill: '#000', opacity: 0.14 });
    let o = S.clipDef(id, S.path(d)) + S.path(d, { fill: c.skin }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    if (sl === 'rolled') {
      // the rolled-up cuff sits proud of the arm
      const rc = S.roundedPath([[-hw1 - 8, sleeveY - 30], [hw1 + 8, sleeveY - 30], [hw1 + 10, sleeveY + 4], [-hw1 - 10, sleeveY + 4]], 10);
      o += S.path(rc, outline(c.cuff || sc, 5.5)) + S.path(`M${-hw1 - 4} ${sleeveY - 13} L${hw1 + 4} ${sleeveY - 13}`, lineOnly(3.5, c.plaid1 || '#0003'));
      if (dim) o += S.path(rc, { fill: '#000', opacity: 0.14 });
    } else if (sl === 'puff') {
      const pd = `M${-hw0 - 6} -24 Q${-hw1 - 30} ${sleeveY * 0.45} ${-hw1 - 8} ${sleeveY + 4} L${hw1 + 8} ${sleeveY + 4} Q${hw1 + 30} ${sleeveY * 0.45} ${hw0 + 6} -24 Z`;
      o += S.path(pd, outline(sc, 6)) + S.path(`M${-hw1 - 6} ${sleeveY - 10} L${hw1 + 6} ${sleeveY - 10}`, lineOnly(9, style.sleeveTrim || c.topShade)) + S.path(`M${-hw1 - 14} ${sleeveY * 0.3} Q0 ${sleeveY * 0.5} ${hw1 + 14} ${sleeveY * 0.3}`, lineOnly(4, c.topShade));
      if (dim) o += S.path(pd, { fill: '#000', opacity: 0.12 });
    }
    return o;
  };
}

// ====================================================================== LEGS: patches, torn knee + band-aid, rolled cuffs, socks, side stripe, shoes
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul2 = (a, k) => [a[0] * k, a[1] * k];
function legBody5(style, J, wOut, wIn, shade, dim, sideView, legSide) {
  const c = style.col;
  const Lb = bentLimb(J, wOut, wIn, 24);
  const id = S.uid('lg5');
  let inner = '';
  if (shade) {
    const a = add2(J.hip, mul2(Lb.u1, -40)), b = add2(J.hip, mul2(Lb.u1, 44)), wq = Math.max(wOut[0], wIn[0]) + 14;
    inner += S.path(`M${P(add2(a, mul2(Lb.n1, -wq)))} L${P(add2(a, mul2(Lb.n1, wq)))} L${P(add2(b, mul2(Lb.n1, wq)))} L${P(add2(b, mul2(Lb.n1, -wq)))} Z`, { fill: c.pantsShade });
  }
  if (style.legStripe) {
    const off = sideView ? 0 : (wOut[1] - 16);
    for (const dd of [0, -16]) inner += S.path(`M${P(add2(J.hip, mul2(Lb.n1, off + dd)))} L${P(add2(J.knee, mul2(Lb.n1, off + dd)))} L${P(add2(J.ankle, mul2(Lb.n2, off + dd)))}`, lineOnly(9, style.legStripe));
  }
  const kneeAng = (Math.atan2(J.ankle[1] - J.hip[1], J.ankle[0] - J.hip[0]) * 180) / Math.PI - 90;
  const kp = add2(J.knee, mul2(Lb.n1, sideView ? -6 : 6));
  const kneeHere = (spec) => spec && (sideView ? legSide === 'near' : spec.side === legSide);
  if (kneeHere(style.kneePatch)) inner += style.kneePatch.shape === 'heart' ? patchHeart(kp[0], kp[1], 1.05, kneeAng + 6, style.kneePatch.col) : patchSquare(kp[0], kp[1], 1.1, kneeAng - 8, style.kneePatch.col);
  if (kneeHere(style.kneeHole)) {
    const hole = 'M-34 -16 L-20 -26 L-8 -18 L6 -28 L22 -20 L34 -24 L30 0 L36 16 L18 24 L4 18 L-12 26 L-28 18 L-36 4 Z';
    inner += S.g(S.path(hole, outline(c.skin, 4.5)) + S.path('M-34 -16 L-20 -26 L-8 -18 L6 -28 L22 -20 L34 -24', lineOnly(6, '#FFFFFF')) + S.g(bandaid(0, 0, 0, 0.82), 'rotate(-28)'), `translate(${P(kp)}) rotate(${f(kneeAng)})`);
  }
  if (style.cuffCol || style.socks) {
    const col = style.socks ? style.socks : style.cuffCol;
    const a = add2(J.ankle, mul2(Lb.u2, style.socks ? -46 : -40));
    const wc = Math.max(wOut[2], wIn[2]) + 12;
    inner += S.path(`M${P(add2(a, mul2(Lb.n2, -wc)))} L${P(add2(a, mul2(Lb.n2, wc)))} L${P(add2(J.ankle, mul2(Lb.n2, wc)))} L${P(add2(J.ankle, mul2(Lb.n2, -wc)))} Z`, { fill: col });
  }
  if (dim) inner += S.path(Lb.d, { fill: '#000', opacity: 0.25 });
  let o = S.clipDef(id, S.path(Lb.d)) + S.path(Lb.d, { fill: c.pants }) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  if (Lb.crease && !style.socks) o += S.path(Lb.crease, lineOnly(5));
  o += S.path(Lb.d, outline('none'));
  if (style.cuffCol || style.socks) {
    const a = add2(J.ankle, mul2(Lb.u2, style.socks ? -46 : -40));
    if (style.socks && style.sockFrill) {
      let fr = `M${P(add2(a, mul2(Lb.n2, wOut[2] + 8)))}`;
      for (let i = 1; i <= 5; i++) { const p = add2(a, mul2(Lb.n2, wOut[2] + 8 - (i * (wOut[2] + wIn[2] + 16)) / 5)); fr += ` A9 9 0 0 1 ${P(p)}`; }
      o += S.path(fr, outline(style.socks, 4));
    } else o += S.path(`M${P(add2(a, mul2(Lb.n2, wOut[2] + 2)))} L${P(add2(a, mul2(Lb.n2, -wIn[2] - 2)))}`, lineOnly(5));
  }
  const cid = S.uid('cf5');
  const cut = S.clipDef(cid, S.el('rect', { x: -700, y: -1400, width: 1400, height: 1408, transform: `translate(${P(J.ankle)}) rotate(${f(J.foot)})` }));
  return cut + S.g(o, null, { 'clip-path': `url(#${cid})` });
}
const LIGHTS = ['#FF5FA2', '#FFE14D', '#4DE8FF'];
function shoe5(style, { x0, x1, back, dim, shade, toeCx, side }) {
  const c = style.col;
  const kind = style.shoe || 'sneaker';
  const sole = dim ? c.soleShade : c.sole;
  let s = '';
  if (kind === 'slipper') {
    const d = S.roundedPath([[x0 - 4, -14], [x1 + 4, -14], [x1 + 4, 40], [x0 - 4, 40]], 22);
    s += S.path(d, outline(dim ? c.soleShade : c.toe));
    let fl = '';
    for (let x = x0 + 4; x < x1; x += 20) fl += `M${x} -12 a10 10 0 0 1 20 0 `;
    s += S.path(fl, { fill: dim ? c.soleShade : c.toe, stroke: LINE, 'stroke-width': 4 });
    s += S.path(`M${x0 - 2} 26 L${x1 + 2} 26`, lineOnly(8, c.sole));
    return s;
  }
  if (kind === 'flats') {
    s += S.path(S.roundedPath([[x0 + 4, 4], [x1, 4], [x1, 40], [x0 + 4, 40]], 16), outline(sole));
    if (!back) s += S.path(`M${f(toeCx - 16)} 8 l16 8 l16 -8 l0 16 l-16 -8 l-16 8 Z`, outline(c.toe, 3.5));
    return s;
  }
  if (kind === 'clog') {
    s += S.path(S.roundedPath([[x0 - 4, -24], [x1 + 4, -24], [x1 + 4, 40], [x0 - 4, 40]], 24), outline(sole));
    s += S.path(`M${x0 - 2} 26 L${x1 + 2} 26`, lineOnly(8, c.soleShade));
    if (!back) for (let i = 0; i < 3; i++) s += S.circle(toeCx - 18 + i * 18, -2, 4, { fill: c.toe });
    return s;
  }
  if (kind === 'loafer') {
    const soleD = S.roundedPath([[x0, -6], [x1, -6], [x1, 42], [x0, 42]], 18);
    s += S.path(soleD, outline(sole)) + S.path(`M${x0 + 4} 32 L${x1 - 4} 32`, lineOnly(7, c.soleShade));
    if (!back) s += S.path(`M${f(toeCx - 26)} 4 Q${f(toeCx)} -6 ${f(toeCx + 26)} 4`, lineOnly(5, '#FFFFFF66'));
    return s;
  }
  if (kind === 'hightop') {
    const cx0 = side ? -52 : x0 + 2, cx1 = side ? 62 : x0 + 98;
    s += S.path(S.roundedPath([[cx0 + 4, -62], [cx1 - 4, -62], [cx1, 2], [cx0, 2]], 12), outline(dim ? c.collarDim || c.collar : c.collar));
    s += S.path(`M${(cx0 + cx1) / 2 - 16} -50 l32 12 M${(cx0 + cx1) / 2 + 16} -50 l-32 12 M${(cx0 + cx1) / 2 - 16} -28 l32 12 M${(cx0 + cx1) / 2 + 16} -28 l-32 12`, lineOnly(5, c.lace || '#FFFFFF'));
  }
  const soleD = S.roundedPath([[x0, -4], [x1, -4], [x1, 42], [x0, 42]], 14);
  s += S.path(soleD, outline(sole));
  if (shade) s += S.path(`M${x0 + 6} 32 L${x1 - 6} 32`, lineOnly(6, c.soleShade));
  if (kind === 'lightup') {
    const n = 3;
    for (let i = 0; i < n; i++) {
      const x = x0 + 22 + ((x1 - x0 - 44) * i) / (n - 1);
      const on = (Math.floor(STATE.t * 6) + i) % 3 !== 0;
      if (on) s += S.circle(x, 24, 15, { fill: LIGHTS[i % 3], opacity: 0.35 });
      s += S.circle(x, 24, 8, { fill: on ? LIGHTS[i % 3] : '#B9B0C0', stroke: LINE, 'stroke-width': 3 }) + S.circle(x - 2, 22, 3, { fill: '#FFFFFF' });
    }
  }
  if (!back) {
    s += S.path(`M${f(toeCx - 42)} -2 A42 37 0 0 1 ${f(toeCx + 42)} -2 Z`, outline(c.toe));
    if (c.toe !== c.sole) s += S.path(`M${f(toeCx - 22)} -18 Q${f(toeCx)} -30 ${f(toeCx + 22)} -18`, lineOnly(4.5, '#fff'));
  }
  return s;
}
// rocket boosters on the shoes (STATE.rocket = { flame, t } while drawing Ivy with pose.rockets)
function rocketBits(side, x0, x1) {
  const r = STATE.rocket;
  if (!r) return '';
  const fl = clamp(r.flame ?? 1, 0, 1);
  let o = '';
  if (side) {
    // heel booster pointing back (+x), flame back-down
    if (fl > 0.01) { const L1 = (120 + 40 * Math.sin(r.t * 37)) * fl; o += S.path(`M${x1 + 30} -4 Q${f(x1 + 30 + L1 * 0.5)} ${f(-34)} ${f(x1 + 30 + L1)} ${f(20)} Q${f(x1 + 30 + L1 * 0.4)} 30 ${x1 + 30} 22 Z`, { fill: '#FF8A1F', stroke: LINE, 'stroke-width': 5 }) + S.path(`M${x1 + 30} 2 Q${f(x1 + 30 + L1 * 0.3)} -14 ${f(x1 + 30 + L1 * 0.6)} 14 Q${f(x1 + 30 + L1 * 0.25)} 20 ${x1 + 30} 16 Z`, { fill: '#FFE14D' }); }
    o += S.path(`M${x1 - 30} -40 L${x1 + 24} -40 L${x1 + 36} -26 L${x1 + 36} 18 L${x1 + 24} 30 L${x1 - 30} 30 Z`, outline('#C9CED8', 5)) + S.path(`M${x1 - 10} -40 L${x1 - 10} 30`, lineOnly(4, '#8E96A6')) + S.path(`M${x1 - 20} -40 L${x1 - 34} -60 L${x1 + 4} -40 Z`, outline('#E8453C', 4));
    return o;
  }
  // front view: little boosters on the outside of each shoe, flames pointing down
  if (fl > 0.01) { const L1 = (110 + 40 * Math.sin(r.t * 41)) * fl; o += S.path(`M${x1 - 6} 40 Q${f(x1 + 26)} ${f(40 + L1 * 0.5)} ${f(x1 + 10)} ${f(40 + L1)} Q${f(x1 - 6)} ${f(40 + L1 * 0.5)} ${x1 - 6} 40 Z`, { fill: '#FF8A1F', stroke: LINE, 'stroke-width': 5 }) + S.path(`M${x1 + 2} 40 Q${f(x1 + 16)} ${f(40 + L1 * 0.35)} ${f(x1 + 8)} ${f(40 + L1 * 0.6)} Q${f(x1)} ${f(40 + L1 * 0.35)} ${x1 + 2} 40 Z`, { fill: '#FFE14D' }); }
  o += S.rect(x1 - 18, -30, 36, 72, 10, outline('#C9CED8', 5)) + S.path(`M${x1 - 18} -8 L${x1 + 18} -8`, lineOnly(4, '#E8453C'));
  return o;
}
function makeLeg5(style) {
  const kw = style.legW || 1;
  return function leg({ shade = true, dim = false, toeShift = 0, back = false, J, side = 1 } = {}) {
    const straight = style.pantsShape !== 'wide';
    const wOut = (straight ? [42, 46, 54] : [42, 74, 103]).map((v) => v * kw), wIn = [40, 40, 40].map((v) => v * kw);
    let o = legBody5(style, J, wOut, wIn, shade, dim, false, side);
    const x1 = (straight ? 94 : 107) * kw, x0 = -44 * kw;
    const s = shoe5(style, { x0, x1, back, dim, shade, toeCx: (straight ? 24 : 30) * kw + toeShift, side: false }) + (style.rockets ? rocketBits(false, x0, x1) : '');
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}
function makeLegSide5(style) {
  const c = style.col;
  const kw = style.legW || 1;
  return function legSide({ shade = true, dim = false, J } = {}) {
    const straight = style.pantsShape !== 'wide';
    const wOut = (straight ? [62, 64, 68] : [64, 74, 85]).map((v) => v * kw), wIn = (straight ? [56, 58, 62] : [58, 69, 80]).map((v) => v * kw);
    let o = legBody5(style, J, wOut, wIn, shade, dim, true, dim ? 'far' : 'near');
    const sc = { ...style, col: { ...c, toe: c.toe === c.sole ? (dim ? c.soleShade : c.sole) : c.toe } };
    const s = shoe5(sc, { x0: -138 * kw, x1: 88 * kw, back: false, dim, shade, toeCx: -86 * kw, side: true }) + (style.rockets ? rocketBits(true, -138 * kw, 88 * kw) : '');
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}

// ====================================================================== CHARACTER OVERLAYS (used by cast.js through the design's `over` hook / props)
// foam on a head (head space; view 'front'|'side'|'back'; k 0..1). stache: a foam moustache on the upper lip (front view)
function foamHead(view, k, t = 0, { seed = 1, stache = false, turn = 0, topY = -960 } = {}) {
  if (k <= 0.01) return '';
  const m = hm(turn);
  let o = '';
  const dx = view === 'side' ? -10 : 0;
  // the cap: big puffs over the top of the head, drips down the sides
  o += X.foam({ x: m.hair([dx, topY])[0], y: topY, r: 86 + 44 * k, n: 9, k: Math.min(1, k * 1.4), seed, drip: k * 0.8 });
  if (k > 0.35) for (const sx of view === 'side' ? [1] : [-1, 1]) o += X.foam({ x: m.hair([sx * 186, -800])[0], y: -800, r: 56 * k, n: 5, k: 1, seed: seed + sx * 3, drip: k });
  if (k > 0.7 && view !== 'back') o += X.foam({ x: m.feat([view === 'side' ? -100 : 96, -620])[0], y: -620, r: 34, n: 4, k: (k - 0.7) / 0.3, seed: seed + 9 });
  if (stache && view === 'front') {
    const p = m.feat([0, -632]);
    o += X.foam({ x: p[0] - 46, y: p[1], r: 34, n: 4, k: 1, seed: 21 }) + X.foam({ x: p[0] + 46, y: p[1], r: 34, n: 4, k: 1, seed: 22 });
  }
  return o;
}
// foam on the shoulders / body (body space)
function foamBody(view, k, seed = 1, W = 100) {
  if (k <= 0.01) return '';
  let o = '';
  const xs = view === 'side' ? [10] : [-W, W];
  for (const x of xs) o += X.foam({ x, y: -520, r: 46 + 30 * k, n: 6, k: Math.min(1, k * 1.5), seed: seed + x, drip: k });
  if (k > 0.5) o += X.foam({ x: view === 'side' ? -20 : -30, y: -380, r: 50 * k, n: 5, k: (k - 0.5) * 2, seed: seed + 5, drip: 1 });
  if (k > 0.8) o += X.foam({ x: view === 'side' ? 0 : 60, y: -120, r: 46, n: 5, k: (k - 0.8) * 5, seed: seed + 7 });
  return o;
}
// soot smudges (head space, front/side) and on the clothes (body space)
function sootFace(view, k, turn = 0) {
  if (k <= 0.01 || view === 'back') return '';
  const m = hm(turn);
  const blot = (x, y, rx, ry, rot, op) => { const p = view === 'side' ? [x, y] : m.feat([x, y]); return S.ellipse(p[0], p[1], rx, ry, { fill: '#2A2226', opacity: f(op * k), transform: `rotate(${rot} ${f(p[0])} ${f(p[1])})` }); };
  if (view === 'side') return blot(-120, -630, 34, 16, -10, 0.45) + blot(-40, -820, 30, 12, 20, 0.35) + blot(-80, -590, 18, 9, 0, 0.4);
  return blot(-86, -630, 38, 18, -12, 0.45) + blot(70, -820, 34, 12, 18, 0.35) + blot(96, -600, 20, 10, 0, 0.4) + blot(-20, -850, 26, 10, -6, 0.3);
}
function sootBody(view, k) {
  if (k <= 0.01) return '';
  const b = (x, y, rx, ry, rot) => S.ellipse(x, y, rx, ry, { fill: '#2A2226', opacity: f(0.38 * k), transform: `rotate(${rot} ${x} ${y})` });
  if (view === 'side') return b(-20, -440, 30, 16, 20) + b(20, -360, 24, 12, -10);
  return b(-60, -470, 34, 16, 20) + b(50, -350, 30, 14, -15) + b(-30, -200, 26, 12, 10) + b(70, -120, 22, 10, 0);
}
// a smoke wisp rising from the frizz (head space)
function smokeWisps(k, t = 0) {
  if (k <= 0.3) return '';
  let o = '';
  for (let i = 0; i < 3; i++) {
    const u = ((t * 0.5 + i / 3) % 1);
    const x = -140 + i * 140 + Math.sin(t * 2 + i) * 20, y = -1080 - u * 160;
    o += S.circle(x, y, 26 + 30 * u, { fill: '#8A8494', opacity: f((1 - u) * 0.5 * k) });
  }
  return o;
}
// Ivy's goggles. pos 'up' (pushed up on the forehead) | 'down' (over the eyes); front view uses the turn mapping
function goggles(view, pos = 'up', turn = 0, col = {}) {
  const frame = col.frame || '#C98A3A', glass = col.glass || '#6FE3E8', strap = col.strap || '#3A2A2A';
  const m = hm(turn);
  const y = pos === 'down' ? -706 : -868;
  const r = pos === 'down' ? 56 : 44;
  if (view === 'back') return S.path(`M-170 ${y + 10} Q0 ${y - 20} 170 ${y + 10}`, lineOnly(30, LINE)) + S.path(`M-170 ${y + 10} Q0 ${y - 20} 170 ${y + 10}`, lineOnly(20, strap)) + S.rect(-26, y - 16, 52, 30, 8, outline('#C9CED8', 4));
  if (view === 'side') {
    let o = S.path(`M-120 ${y} L150 ${y + 14}`, lineOnly(28, LINE)) + S.path(`M-120 ${y} L150 ${y + 14}`, lineOnly(18, strap));
    o += S.path(`M-186 ${y - r * 0.85} L-126 ${y - r * 0.9} L-126 ${y + r * 0.9} L-186 ${y + r * 0.85} Z`, outline(frame, 6)) + S.ellipse(-190, y, 14, r * 0.8, { fill: glass, opacity: 0.6, stroke: LINE, 'stroke-width': 5 });
    return o;
  }
  const a = m.hair([-168, y + 6]), b = m.hair([168, y + 6]);
  let o = S.path(`M${P(a)} L${P(b)}`, lineOnly(28, LINE)) + S.path(`M${P(a)} L${P(b)}`, lineOnly(18, strap));
  for (const sx of [-1, 1]) {
    const p = m.feat([sx * 60, y]);
    const k = 1 - 0.18 * m.at * (sx * m.dir < 0 ? 1 : 0.2);
    o += S.ellipse(p[0], p[1], (r + 12) * k, r + 12, outline(frame, 6)) + S.ellipse(p[0], p[1], r * k, r, { fill: glass, opacity: pos === 'down' ? 0.45 : 0.8, stroke: LINE, 'stroke-width': 5 });
    o += S.path(`M${f(p[0] - r * 0.5 * k)} ${f(p[1] - r * 0.1)} Q${f(p[0] - r * 0.4 * k)} ${f(p[1] - r * 0.6)} ${f(p[0])} ${f(p[1] - r * 0.62)}`, lineOnly(7, '#FFFFFF'));
    for (const a2 of [0.6, 2.2, 3.9, 5.4]) o += S.circle(p[0] + Math.cos(a2) * (r + 6) * k, p[1] + Math.sin(a2) * (r + 6), 3.5, { fill: '#7A4A1A' });
  }
  const br = m.feat([0, y]);
  o += S.rect(br[0] - 16, br[1] - 8, 32, 16, 6, outline(frame, 4));
  return o;
}
// headphones over YOU's bob hair (the bob is wider than generic hair)
function heroHeadphones(view, turn = 0, col = '#2E7BD1') {
  const m = hm(turn);
  if (view === 'side') return S.path('M56 -760 C76 -960 0 -1030 -70 -1000', lineOnly(26, LINE)) + S.path('M56 -760 C76 -960 0 -1030 -70 -1000', lineOnly(14, col)) + S.path(S.roundedPath([[16, -830], [100, -830], [100, -690], [16, -690]], 30), outline(col, 6)) + S.circle(58, -760, 26, { fill: '#1B1D26' });
  const a = view === 'back' ? [-222, -770] : m.hair([-222, -770]), b = view === 'back' ? [222, -770] : m.hair([222, -770]);
  const top = (a[1] + b[1]) / 2 - 330;
  let o = S.path(`M${P(a)} Q${f((a[0] + b[0]) / 2)} ${f(top)} ${P(b)}`, lineOnly(28, LINE)) + S.path(`M${P(a)} Q${f((a[0] + b[0]) / 2)} ${f(top)} ${P(b)}`, lineOnly(15, col));
  for (const p of [a, b]) o += S.path(S.roundedPath([[p[0] - 30, p[1] - 66], [p[0] + 30, p[1] - 66], [p[0] + 30, p[1] + 66], [p[0] - 30, p[1] + 66]], 26), outline(col, 6)) + S.path(S.roundedPath([[p[0] - 12, p[1] - 44], [p[0] + 12, p[1] - 44], [p[0] + 12, p[1] + 44], [p[0] - 12, p[1] + 44]], 10), { fill: '#000', opacity: 0.25 });
  if (view !== 'back') { const q = a; o += S.path(`M${f(q[0] + 10)} ${f(q[1] + 60)} Q${f(q[0] + 20)} -640 ${P(m.feat([-80, -626]))}`, lineOnly(12, LINE)) + S.path(`M${f(q[0] + 10)} ${f(q[1] + 60)} Q${f(q[0] + 20)} -640 ${P(m.feat([-80, -626]))}`, lineOnly(5, col)) + S.circle(...m.feat([-80, -626]), 12, outline('#1B1D26', 4)); }
  return o;
}
// a pancake draped over a head (Dad)
function pancakeHead(view, turn = 0, k = 1) {
  const m = hm(turn);
  const c = view === 'side' ? [-10, -940] : m.hair([0, -940]);
  const dr = 140 * k; // how far the floppy ends droop
  // a big round pancake flopped over the head: a flat golden top and two soft flaps hanging over the sides
  const [x, y] = c;
  const top = `M${f(x - 196)} ${f(y + 18)} Q${f(x - 186)} ${f(y - 52)} ${f(x)} ${f(y - 62)} Q${f(x + 186)} ${f(y - 52)} ${f(x + 196)} ${f(y + 18)}` +
    ` L${f(x + 206)} ${f(y + dr)} Q${f(x + 204)} ${f(y + dr + 26)} ${f(x + 180)} ${f(y + dr + 20)} Q${f(x + 160)} ${f(y + dr + 14)} ${f(x + 162)} ${f(y + dr * 0.5)}` +
    ` L${f(x + 158)} ${f(y + 30)} Q${f(x)} ${f(y + 12)} ${f(x - 158)} ${f(y + 30)} L${f(x - 162)} ${f(y + dr * 0.55)}` +
    ` Q${f(x - 162)} ${f(y + dr + 18)} ${f(x - 184)} ${f(y + dr + 24)} Q${f(x - 206)} ${f(y + dr + 26)} ${f(x - 208)} ${f(y + dr)} Z`;
  let o = S.path(top, outline('#F2B64A', 6));
  // browner underside lip where the flaps fold over
  o += S.path(`M${f(x - 162)} ${f(y + 32)} Q${f(x)} ${f(y + 14)} ${f(x + 158)} ${f(y + 32)}`, lineOnly(10, '#D9902E'));
  o += S.ellipse(x, y - 24, 150, 22, { fill: '#F8CC6C' });
  let dots = '';
  for (let i = 0; i < 9; i++) dots += `M${f(x - 150 + i * 38)} ${f(y - 30 + Math.sin(i * 2.1) * 14)} a5 3 0 1 0 10 0 a5 3 0 1 0 -10 0 Z `;
  for (const sx of [-1, 1]) dots += `M${f(x + sx * 186 - 4)} ${f(y + dr * 0.6)} a4 5 0 1 0 8 0 a4 5 0 1 0 -8 0 Z `;
  o += S.path(dots, { fill: '#C98424', opacity: 0.75 });
  o += S.path(`M${f(x - 30)} ${f(y - 56)} l44 -6 l8 18 l-44 6 Z`, outline('#FFE58A', 4)) + S.path(`M${f(x - 22)} ${f(y - 52)} l26 -4`, lineOnly(3, '#FFFFFF'));
  return S.g(o, `rotate(-5 ${f(x)} ${f(y)})`);
}
// spaghetti on a head (Principal); body part = shoulders
function spaghettiHead(view, k, turn = 0) {
  if (k <= 0.01) return '';
  const m = hm(turn);
  const c = view === 'side' ? [-10, -930] : m.hair([0, -940]);
  return X.spaghetti({ x: c[0], y: c[1], s: 1.1, mode: 'drape', k, seed: 4, meatballs: k > 0.5 ? 2 : 1 });
}
function spaghettiBody(view, k) {
  if (k <= 0.01 || k < 0.4) return '';
  return view === 'side' ? X.spaghetti({ x: 10, y: -520, s: 0.5, mode: 'drape', k, seed: 7, meatballs: 0 }) : S.g(X.spaghetti({ x: 0, y: 0, s: 0.5, mode: 'drape', k, seed: 7, meatballs: 1 }), 'translate(104 -514) rotate(14)');
}
// whistle in the mouth (Coach), head space
function whistleMouth(view, turn = 0) {
  if (view === 'back') return '';
  if (view === 'side') return L4.whistleShape(-176, -604, 1.1, 180) + S.path('M-150 -598 Q-80 -560 -30 -540', lineOnly(11, LINE)) + S.path('M-150 -598 Q-80 -560 -30 -540', lineOnly(6, '#E8453C'));
  const m = hm(turn);
  const p = m.feat([-24, -604]);
  return S.path(`M${f(p[0] + 30)} ${f(p[1] + 4)} Q${f(p[0] + 90)} -560 ${f(p[0] + 110)} -540`, lineOnly(11, LINE)) + S.path(`M${f(p[0] + 30)} ${f(p[1] + 4)} Q${f(p[0] + 90)} -560 ${f(p[0] + 110)} -540`, lineOnly(6, '#E8453C')) + L4.whistleShape(p[0], p[1], 1.2, 160);
}

// ====================================================================== dress5()
// headK < 1 shrinks the head around the neck (Mr. Fig: tall and thin with a smaller head)
const headScale = (svg, k) => (k && k !== 1 ? S.g(svg, `translate(0 -560) scale(${f(k)}) translate(0 560)`) : svg);
function dress5(d) {
  const st = d.style, c = st.col, a = st.acc || {};
  const W = st.torsoW || 100;
  d.torso = makeTorso5(st);
  d.torsoSide = makeTorsoSide5(st);
  d.arm = makeArm5(st);
  d.leg = makeLeg5(st);
  d.legSide = makeLegSide5(st);
  d.dims = { ...d.dims, shoulderX: W, hipX: Math.round(48 * (st.hipK || W / 100)), shadowR: Math.round(175 * Math.max(1, W / 100)) };
  const hs0 = d.headSide, hb0 = d.headBack, h0 = d.head;
  const H = L.HAIR[st.hair] || L.HAIR.none;
  if (a.thickBrows) {
    d.head = (face, t, shade) => {
      let o = h0(face, t, shade);
      const fr = F.resolveFace(face), m = hm(t), by = H.browY ?? -790, base = st.browBase || {};
      for (const sx of [-1, 1]) {
        const kk = sx < 0 ? 'L' : 'R', b = fr.brows[kk] || [0, 0], bb = base[kk] || [0, 0];
        o += thickBrow(m.feat([sx * 18, by + b[0] * 0.8 + bb[0]]), m.feat([sx * 98, by + 4 + b[1] * 0.8 + bb[1]]), a.thickBrows);
      }
      return o;
    };
  }
  if (a.bushyBeard || a.pencilStache || a.catEye || a.bandaid || a.thickBrows) {
    d.headSide = (face, shade) => {
      let o = hs0(face, shade);
      if (a.bushyBeard) o += bushyBeardSide(c);
      if (a.thickBrows) { const fr = F.resolveFace(face), b = fr.brows.L || [0, 0], by = H.browY ?? -790; o += thickBrow([-88, by + b[0] * 0.8], [-168, by + 6 + b[1] * 0.8], a.thickBrows); }
      if (a.pencilStache) o += S.path('M-160 -632 Q-140 -640 -112 -632 Q-104 -640 -106 -648', lineOnly(9, a.pencilStache));
      if (a.catEye) o += catEyeSide(a.catEye);
      if (a.bandaid) o += bandaid(-96, -640, -20);
      return o;
    };
  }
  if (a.bushyBeard) d.headBack = (face, shade) => bushyBeardBack(c) + hb0(face, shade);
  if (st.headK && st.headK !== 1) {
    const hh = d.head, hss = d.headSide, hbb = d.headBack;
    d.head = (face, t, shade) => headScale(hh(face, t, shade), st.headK);
    d.headSide = (face, shade) => headScale(hss(face, shade), st.headK);
    d.headBack = (face, shade) => headScale(hbb(face, shade), st.headK);
    if (d.dims.nametagY) d.dims.nametagY = -560 + (d.dims.nametagY + 560) * st.headK;
  }
  void h0;
  return d;
}

module.exports = {
  dress5, makeTorso5, makeTorsoSide5, makeArm5, makeLeg5, makeLegSide5, outfit5, TOPS5, STATE,
  foamHead, foamBody, sootFace, sootBody, smokeWisps, goggles, heroHeadphones, pancakeHead, spaghettiHead, spaghettiBody, whistleMouth,
  bandaid, bowTie, idBadge, wrenchSvg, headScale, hm,
};
