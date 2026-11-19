// Looks for the "What If Roblox Shut Down FOREVER?" cast: hats and hair (registered into L.HAIR),
// head accessories (glasses, gamer headset, beards, bushy brows, pearls, tooth gap), outfits
// (registered by chaining looks2's outfit2 hook), legs with shorts/socks/rolled cuffs/high-tops/
// light-up shoes, arms with sleeve stripes and fingerless gloves, a dino tail, and props (key ring, mop).
//
// Views: the generic R6 head only calls accessory hooks in the front view, so `dress(design)` wraps a
// design's head/headSide/headBack/torso/arm/leg functions to add the same accessories to side and back.
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const L = require('./looks');
const L2 = require('./looks2');
const { bentLimb } = require('./body');
const { f } = S;

const SW = C.lineW;
const LINE = C.line;
const outline = (fill, w = SW) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const lineOnly = (w = SW, color = LINE) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const P = (p) => `${f(p[0])} ${f(p[1])}`;
const poly = (pts, r = 6) => S.roundedPath(pts, r);
const mapPoly = (fn, pts, r) => poly(pts.map(fn), r);
const ID = (p) => p;
const mirror = (pts) => pts.map(([x, y]) => [-x, y]);
const clipped = (d, fill, inner, w = SW) => {
  const id = S.uid('l3');
  return S.clipDef(id, S.path(d)) + S.path(d, { fill }) + (inner ? S.g(inner, null, { 'clip-path': `url(#${id})` }) : '') + S.path(d, outline('none', w));
};
// same turn mapping as r6.js hairMap()
function hm(t = 0) {
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  return {
    at, dir, fx: dir * 40 * at,
    hair: ([x, y]) => [x * dir > 0 ? x * (1 - 0.12 * at) + dir * 16 * at : x * (1 + 0.03 * at) + dir * 16 * at, y],
    feat: ([x, y]) => [x * (1 - 0.15 * at) + dir * 40 * at, y],
  };
}
// union of circles with one outline: [[x, y, r], ...] -> 2 elements
function puffs(circles, fill, w = SW, extra = '') {
  const ring = (x, y, r) => `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
  return S.path(circles.map(([x, y, r]) => ring(x, y, r + w / 2)).join(' '), { fill: LINE }) +
    S.path(circles.map(([x, y, r]) => ring(x, y, r - w / 2)).join(' '), { fill }) + extra;
}
// closed path through points; a point's 3rd value bulges the segment that starts there outward (clockwise polygons)
function fluffy(pts) {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const bu = a[2] || 0;
    if (!bu) { d += ` L${P(b)}`; continue; }
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    d += ` Q${f((a[0] + b[0]) / 2 + (dy / l) * bu)} ${f((a[1] + b[1]) / 2 - (dx / l) * bu)} ${P(b)}`;
  }
  return d + ' Z';
}
// lighter hair tips above y0, in three soft cel steps up to y1 (a real gradient costs ~15 ms under the volume filter)
function tipGrad(c, x, y, w, h, y0, y1) {
  const col = c.hairTip || c.hairHi;
  let o = '';
  for (let i = 0; i < 3; i++) { const yy = y0 + ((y1 - y0) * i) / 3; o += S.rect(x, y, w, yy - y, 0, { fill: col, opacity: 0.38 }); }
  return o;
}
// fluffy side tuft of hair above the ear (sx = side); map = turn mapping
function tuft(map, sx, c, big = 1) {
  const pts = [[136, -844, 0], [172, -838, 7], [200, -812, 0], [186, -792, 6], [206, -762, 0], [188, -744, 6], [198, -712, 0], [174, -700, 6], [150, -684, 0], [136, -692, 0]]
    .map(([x, y, b]) => [x, -800 + (y + 800) * big, b]);
  let q = pts.map(([x, y, b]) => [...map([sx * x, y]), b]);
  if (sx < 0) { q = q.slice().reverse(); q = q.map((p, i) => [p[0], p[1], q[(i + 1) % q.length][2]]); }
  const p = (x, y) => P(map([sx * x, y]));
  return S.path(fluffy(q), outline(c.hair)) + S.path(`M${p(152, -816)} q${sx * 16} 4 ${sx * 26} 18 M${p(152, -760)} q${sx * 16} 4 ${sx * 24} 16`, lineOnly(4, c.hairShade));
}
// the horseshoe of hair seen from behind (bald top, fluffy fringe from ear to ear)
function backFringe(c) {
  const pts = [[-176, -816, 10], [-110, -806, 10], [-40, -800, 10], [40, -800, 10], [110, -806, 10], [176, -816, 0], [204, -788, 0], [184, -766, 0], [200, -736, 0],
    [156, -712, 12], [96, -690, 12], [32, -682, 12], [-32, -682, 12], [-96, -690, 12], [-156, -712, 0], [-200, -736, 0], [-184, -766, 0], [-204, -788, 0]];
  return clipped(fluffy(pts), c.hair, S.rect(-220, -724, 440, 60, 0, { fill: c.hairShade }) +
    S.path('M-120 -790 q14 10 10 30 M-40 -780 q14 10 10 30 M40 -780 q14 10 10 30 M120 -790 q14 10 10 30', lineOnly(4, c.hairShade)));
}
// the side fringe of a bald head (side view, facing left): band from the ear round to the back, spiky tufts behind
function sideFringe(c) {
  const pts = [[16, -792, 6], [90, -812, 6], [150, -824, 0], [200, -804, 0], [178, -784, 0], [210, -754, 0], [184, -738, 0], [202, -704, 0], [160, -698, 6], [100, -688, 6], [40, -708, 6]];
  return S.path(fluffy(pts), outline(c.hair)) + S.path('M60 -780 q16 4 30 18 M110 -790 q16 4 30 18 M100 -740 q16 4 28 16', lineOnly(4, c.hairShade));
}
// little vinyl sticker (white border, thin dark outline)
function sticker(kind, x, y, s = 1, rot = 0, col = '#FF6FA8') {
  let d;
  if (kind === 'star') d = F.starPath(0, 0, 26, 12);
  else if (kind === 'heart') d = F.heartPath(0, 2, 17);
  else if (kind === 'bolt') d = 'M6 -26 L-14 4 L0 4 L-6 26 L16 -6 L2 -6 Z';
  else d = 'M-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0 Z';
  let o = S.path(d, { fill: 'none', stroke: LINE, 'stroke-width': 14, 'stroke-linejoin': 'round' }) + S.path(d, { fill: col, stroke: '#FFFFFF', 'stroke-width': 8, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
  if (kind === 'bubble') o += S.path('M-12 -6 Q-10 -14 -2 -15', lineOnly(5, '#FFFFFF')) + S.circle(9, 9, 3.5, { fill: '#FFFFFF' });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// yellow pencil from tip to eraser end
function pencil(a, b, w = 15, col = '#FFC93C') {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  let o = S.path(`M0 0 L22 ${f(-w / 2)} L22 ${f(w / 2)} Z`, outline('#F2D2A6', 4)) + S.path(`M0 0 L8 -3 L8 3 Z`, { fill: '#3A3A44' });
  o += S.rect(22, -w / 2, l - 44, w, 0, outline(col, 4)) + S.path(`M24 0 L${f(l - 24)} 0`, lineOnly(3, '#E0A21A'));
  o += S.rect(l - 24, -w / 2, 10, w, 0, outline('#C9CED8', 4)) + S.rect(l - 14, -w / 2, 14, w, 5, outline('#FF8FA8', 4));
  return S.g(o, `translate(${P(a)}) rotate(${f(ang)})`);
}
// rounded spike pointing along `ang` (deg, 0 = up), base centred at (x, y)
function spike(x, y, h, w, ang, col, sw = 6) {
  const d = `M${f(-w)} 0 Q${f(-w * 0.55)} ${f(-h * 0.55)} 0 ${f(-h)} Q${f(w * 0.55)} ${f(-h * 0.55)} ${f(w)} 0 Z`;
  return S.path(d, { ...outline(col, sw), transform: `translate(${f(x)} ${f(y)}) rotate(${f(ang)})` });
}

// ---------------------------------------------------------------- hats and hair
// Juno's hard hat
const HH_DOME = [[-170, -838], [-172, -910], [-148, -988], [-92, -1046], [0, -1068], [92, -1046], [148, -988], [172, -910], [170, -838]];
const PIGTAIL = [[146, -808], [190, -820], [238, -808], [276, -778], [300, -738], [316, -688], [292, -702], [292, -658], [270, -684], [254, -646], [240, -690], [214, -724], [178, -740], [146, -734]];
function pigtail(map, sx, c, shade) {
  const pts = PIGTAIL.map(([x, y]) => map([sx * x, y]));
  let o = S.path(poly(pts, 9), outline(c.hair));
  const p = (x, y) => P(map([sx * x, y]));
  if (shade) o += S.path(`M${p(200, -738)} Q${p(240, -726)} ${p(262, -690)}`, lineOnly(10, c.hairShade));
  o += S.path(`M${p(184, -788)} Q${p(244, -790)} ${p(286, -716)} M${p(188, -760)} Q${p(236, -762)} ${p(266, -696)}`, lineOnly(4.5));
  if (shade) o += S.path(`M${p(198, -806)} Q${p(240, -804)} ${p(266, -782)}`, lineOnly(8, c.hairHi));
  const tie = map([sx * 168, -774]);
  o += S.ellipse(tie[0], tie[1], 15, 33, outline(c.tie || '#E8453C', 5)) + S.ellipse(tie[0] - 4, tie[1] - 12, 4, 9, { fill: '#FFFFFF', opacity: 0.7 });
  return o;
}
function hardhatDetails(hair, c, shade, back) {
  let o = '';
  o += S.rect(hair([-22, 0])[0], -1080, hair([22, 0])[0] - hair([-22, 0])[0], 250, 0, { fill: c.hatHi, opacity: 0.45 });
  o += S.path(`M${P(hair([-22, -1074]))} L${P(hair([-22, -836]))} M${P(hair([22, -1074]))} L${P(hair([22, -836]))}`, lineOnly(5, c.hatShade));
  o += S.path(`M${P(hair([-76, -1060]))} Q${P(hair([-138, -960]))} ${P(hair([-140, -836]))} M${P(hair([76, -1060]))} Q${P(hair([138, -960]))} ${P(hair([140, -836]))}`, lineOnly(4.5, c.hatShade));
  if (shade) o += S.path(`M${P(hair([-150, -930]))} Q${P(hair([-120, -1030]))} ${P(hair([-50, -1058]))}`, lineOnly(16, c.hatHi));
  if (!back) {
    const a = hair([-92, -928]), b = hair([84, -958]);
    o += sticker('star', a[0], a[1], 1, -14, '#FF6FA8') + sticker('bubble', b[0], b[1], 1, 0, '#6FD3FF');
  } else {
    const a = hair([70, -940]);
    o += sticker('heart', a[0], a[1], 1, 12, '#FF4D6D');
  }
  return o;
}
function hardhatBrim(hair, feat, c, back) {
  const top = back ? -868 : -860, bot = back ? -828 : -812;
  let o = S.path(`M${P(hair([-206, -868]))} Q${P(feat([0, top + 8]))} ${P(hair([206, -868]))} L${P(hair([212, -842]))} Q${P(feat([0, bot]))} ${P(hair([-212, -842]))} Z`, outline(c.hatShade));
  o += S.path(`M${P(hair([-196, -860]))} Q${P(feat([0, top + 14]))} ${P(hair([196, -860]))}`, lineOnly(5, c.hatHi));
  return o;
}
Object.assign(L.HAIR, {
  hardhat: {
    browY: -800, nametagY: -1185, fill: 'hat',
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-162, -860], [162, -860], [168, -712], [140, -692], [-140, -692], [-168, -712]], 26), outline(c.hair));
      o += pigtail(hair, -1, c, shade) + pigtail(hair, 1, c, shade);
      o += pencil(hair([150, -812]), hair([262, -858]), 15, c.pencil || '#FFC93C');
      return o;
    },
    front: (hair) => mapPoly(hair, HH_DOME, 28),
    details: (hair, feat, c, shade) => hardhatDetails(hair, c, shade, false),
    over(hair, feat, c) {
      const fr = [[134, -800], [108, -824], [80, -796], [46, -822], [12, -797], [-22, -824], [-56, -798], [-90, -824], [-120, -800], [-138, -814]];
      let o = S.path(poly([hair([-146, -862]), hair([146, -862]), ...fr.map(feat)], 6), outline(c.hair));
      o += S.path(`M${P(feat([-80, -840]))} L${P(feat([-90, -820]))} M${P(feat([30, -842]))} L${P(feat([46, -820]))}`, lineOnly(4));
      return o + hardhatBrim(hair, feat, c, false);
    },
    side: () => poly([[-206, -846], [-202, -930], [-154, -1012], [-52, -1064], [62, -1060], [152, -1006], [184, -920], [180, -846]], 30),
    sideBehind: (c) => S.g(pigtail(ID, 1, c, true), 'translate(-12 -14) rotate(-8 150 -770)'),
    sideOver(c) {
      let o = S.path(poly([[0, -848], [182, -848], [190, -720], [162, -680], [64, -690], [30, -760]], 20), outline(c.hair));
      o += S.path('M70 -840 Q90 -760 70 -700 M120 -840 Q140 -760 130 -690', lineOnly(4.5));
      o += S.g(pigtail(ID, 1, c, true), 'translate(-30 10) rotate(10 146 -770)');
      o += S.path(poly([[-178, -852], [-104, -852], [-108, -804], [-128, -822], [-150, -800], [-170, -820]], 6), outline(c.hair));
      o += pencil([-24, -742], [96, -800], 15, c.pencil || '#FFC93C');
      o += S.path('M-176 -900 Q-120 -1010 0 -1040 Q120 -1034 168 -930', lineOnly(5, c.hatShade));
      o += sticker('star', -96, -950, 0.95, -20, '#FF6FA8') + sticker('bubble', 70, -980, 0.9, 0, '#6FD3FF');
      o += S.path(poly([[-272, -834], [-236, -866], [198, -866], [214, -846], [196, -832], [-180, -832]], 12), outline(c.hatShade));
      o += S.path('M-232 -858 L190 -858', lineOnly(5, c.hatHi));
      return o;
    },
    back: () => null,
    backOver(c) {
      let o = S.path(poly([[-166, -862], [166, -862], [172, -690], [120, -662], [60, -680], [0, -660], [-60, -680], [-120, -662], [-172, -690]], 22), outline(c.hair));
      o += S.path('M-80 -850 Q-90 -760 -70 -676 M0 -850 L0 -666 M80 -850 Q90 -760 70 -676', lineOnly(4.5));
      o += pigtail(ID, -1, c, true) + pigtail(ID, 1, c, true);
      o += clipped(poly(HH_DOME, 28), c.hat, hardhatDetails(ID, c, true, true));
      return o + hardhatBrim(ID, ID, c, true);
    },
  },

  // Dex: electric-blue spikes swept up and to the right, lighter tips
  proSpikes: {
    browY: -792, nametagY: -1215,
    front(hair, feat) {
      const outer = [[-150, -762], [-166, -846], [-236, -890], [-172, -936], [-206, -1034], [-118, -996], [-82, -1108], [-14, -1010], [56, -1126], [92, -1006], [184, -1072], [164, -962], [246, -926], [172, -872], [156, -762]];
      const fringe = [[132, -790], [106, -838], [78, -792], [42, -846], [10, -798], [-26, -850], [-58, -800], [-94, -842], [-120, -794], [-140, -812]];
      return poly([...outer.map(hair), ...fringe.map(feat)], 8);
    },
    details(hair, feat, c, shade) {
      let o = tipGrad(c, -250, -1132, 500, 172, -960, -1080);
      o += S.path(`M${P(hair([-180, -1000]))} Q${P(hair([0, -1060]))} ${P(hair([220, -990]))}`, lineOnly(9, c.hairShade));
      if (shade) for (const [a, b] of [[[-150, -940], [-112, -990]], [[-60, -990], [-78, -1080]], [[40, -1000], [52, -1100]], [[130, -980], [168, -1040]]]) o += S.path(`M${P(hair(a))} L${P(hair(b))}`, lineOnly(12, '#FFFFFF66'));
      o += S.path(`M${P(feat([-64, -846]))} Q${P(hair([-40, -940]))} ${P(hair([-14, -1006]))} M${P(feat([30, -846]))} Q${P(hair([60, -930]))} ${P(hair([92, -1002]))} M${P(hair([-130, -880]))} Q${P(hair([-150, -930]))} ${P(hair([-172, -934]))}`, lineOnly(5));
      return o;
    },
    side: () => poly([[-176, -806], [-204, -880], [-150, -900], [-200, -992], [-112, -972], [-92, -1086], [-12, -1004], [50, -1116], [92, -1002], [186, -1044], [164, -944], [238, -902], [174, -850], [180, -760], [150, -690], [70, -704], [34, -762], [-60, -796], [-124, -806]], 8),
    sideOver(c) {
      const d = poly([[-176, -806], [-204, -880], [-150, -900], [-200, -992], [-112, -972], [-92, -1086], [-12, -1004], [50, -1116], [92, -1002], [186, -1044], [164, -944], [238, -902], [174, -850], [180, -760], [150, -690], [70, -704], [34, -762], [-60, -796], [-124, -806]], 8);
      const id = S.uid('dxs');
      return S.clipDef(id, S.path(d)) + S.g(tipGrad(c, -210, -1122, 452, 172, -950, -1070) + S.path('M-200 -980 Q0 -1050 230 -930', lineOnly(9, c.hairShade)) +
        S.path('M-120 -900 Q-60 -960 -12 -1000 M-20 -840 Q40 -930 90 -1000 M60 -780 Q130 -860 170 -930', lineOnly(5)), null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    },
    back: () => poly(mirror([[-156, -735], [-170, -850], [-238, -896], [-172, -940], [-200, -1036], [-114, -994], [-76, -1110], [-12, -1010], [58, -1124], [92, -1004], [182, -1070], [162, -962], [244, -928], [172, -870], [156, -735], [120, -704], [60, -690], [0, -706], [-60, -690], [-120, -704]]).reverse(), 8),
    backOver(c) {
      const d = poly(mirror([[-156, -735], [-170, -850], [-238, -896], [-172, -940], [-200, -1036], [-114, -994], [-76, -1110], [-12, -1010], [58, -1124], [92, -1004], [182, -1070], [162, -962], [244, -928], [172, -870], [156, -735], [120, -704], [60, -690], [0, -706], [-60, -690], [-120, -704]]).reverse(), 8);
      const id = S.uid('dxb');
      return S.clipDef(id, S.path(d)) + S.g(tipGrad(c, -250, -1130, 500, 170, -960, -1080) + S.path('M-220 -990 Q0 -1060 180 -1000', lineOnly(9, c.hairShade)) +
        S.path('M-60 -720 Q-40 -900 12 -1006 M60 -720 Q80 -860 114 -990 M-130 -760 Q-150 -880 -90 -1000', lineOnly(5)), null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    },
  },

  // Pip: green dinosaur hood (face opening, teeth on the brim, eyes on top, soft spikes)
  dinoHood: {
    browY: -780, nametagY: -1140, fill: 'top',
    behind(hair, feat, c) {
      return spike(...hair([-64, -990]), 64, 30, -24, c.spike) + spike(...hair([64, -990]), 64, 30, 24, c.spike) + spike(...hair([0, -1004]), 84, 36, 0, c.spike);
    },
    front(hair, feat) {
      const outer = [[-188, -560], [-194, -760], [-178, -902], [-122, -986], [-40, -1014], [40, -1014], [122, -986], [178, -902], [194, -760], [188, -560]];
      const inner = [[132, -568], [136, -788], [98, -820], [0, -830], [-98, -820], [-136, -788], [-132, -568]];
      return poly([...outer.map(hair), ...inner.map(feat)], 22);
    },
    details(hair, feat, c, shade) {
      let o = '';
      if (shade) o += S.path(`M${P(hair([-150, -930]))} Q${P(hair([-90, -1000]))} ${P(hair([0, -1006]))}`, lineOnly(16, '#FFFFFF55'));
      o += S.path(`M${P(feat([-152, -580]))} L${P(feat([-156, -790]))} Q${P(feat([-120, -846]))} ${P(feat([0, -850]))} Q${P(feat([120, -846]))} ${P(feat([156, -790]))} L${P(feat([152, -580]))}`, { fill: 'none', stroke: c.topShade, 'stroke-width': 5, 'stroke-dasharray': '10 9', 'stroke-linecap': 'round' });
      return o;
    },
    over(hair, feat, c) {
      let o = '';
      for (const x of [-84, -50, -16, 18, 52, 86]) {
        const a = feat([x - 15, -824 + Math.abs(x) * 0.08]), b = feat([x + 15, -824 + Math.abs(x + 15) * 0.08]), tip = feat([x, -800 + Math.abs(x) * 0.08]);
        o += S.path(`M${P(a)} L${P(tip)} L${P(b)} Z`, outline('#FFFFFF', 4.5));
      }
      for (const sx of [-1, 1]) {
        const e = hair([sx * 72, -918]);
        o += S.path(`M${f(e[0] - 32)} ${f(e[1] - 18)} Q${f(e[0])} ${f(e[1] - 46)} ${f(e[0] + 32)} ${f(e[1] - 18)}`, lineOnly(8, c.topShade));
        o += S.circle(e[0], e[1], 25, outline('#FFFFFF', 6)) + S.circle(e[0] + sx * 3, e[1] + 5, 12, { fill: LINE }) + S.circle(e[0] + sx * 3 - 4, e[1], 4, { fill: '#FFFFFF' });
        const n = feat([sx * 26, -858]);
        o += S.ellipse(n[0], n[1], 6, 4, { fill: c.topShade });
      }
      return o;
    },
    side: () => poly([[-180, -826], [-160, -934], [-80, -1004], [60, -1006], [160, -950], [204, -820], [200, -660], [172, -572], [100, -552], [-8, -556], [-28, -680], [-52, -790], [-122, -818]], 24),
    sideBehind(c) {
      return spike(-60, -1000, 64, 28, -10, c.spike) + spike(40, -1004, 72, 30, 14, c.spike) + spike(132, -972, 66, 30, 44, c.spike) + spike(188, -890, 58, 28, 70, c.spike) + spike(206, -790, 50, 26, 88, c.spike);
    },
    sideOver(c) {
      let o = '';
      for (const x of [-170, -140, -110]) o += S.path(`M${x - 13} -822 L${x} -798 L${x + 13} -822 Z`, outline('#FFFFFF', 4.5));
      o += S.path('M-110 -942 Q-80 -972 -44 -950', lineOnly(8, c.topShade));
      o += S.circle(-76, -918, 24, outline('#FFFFFF', 6)) + S.circle(-86, -912, 11, { fill: LINE }) + S.circle(-90, -917, 4, { fill: '#FFFFFF' });
      o += S.ellipse(-164, -866, 7, 4, { fill: c.topShade });
      o += S.path('M-42 -800 Q-20 -680 -10 -566', { fill: 'none', stroke: c.topShade, 'stroke-width': 5, 'stroke-dasharray': '10 9', 'stroke-linecap': 'round' });
      return o;
    },
    back: () => null,
    backOver(c) {
      let o = spike(-64, -990, 64, 30, -24, c.spike) + spike(64, -990, 64, 30, 24, c.spike) + spike(0, -1004, 84, 36, 0, c.spike);
      const d = poly([[-190, -562], [-194, -760], [-178, -902], [-122, -986], [-40, -1014], [40, -1014], [122, -986], [178, -902], [194, -760], [190, -562], [100, -548], [0, -544], [-100, -548]], 24);
      o += clipped(d, c.top, S.path('M-150 -930 Q-90 -1000 0 -1006', lineOnly(16, '#FFFFFF55')));
      for (const [y, h] of [[-900, 40], [-820, 36], [-740, 32], [-664, 28]]) o += spike(0, y, h, h * 0.62, 0, c.spike, 5);
      return o;
    },
  },

  // Grandpa Otto: tweedy flat cap over a bald head, white tufts above the ears
  flatCap: {
    browY: -790, nametagY: -1100, fill: 'hat',
    behind(hair, feat, c) {
      let o = '';
      for (const sx of [-1, 1]) o += tuft(hair, sx, c);
      return o;
    },
    front: (hair) => mapPoly(hair, [[-178, -842], [-184, -894], [-160, -950], [-82, -988], [0, -996], [82, -988], [160, -950], [184, -894], [178, -842]], 30),
    details(hair, feat, c, shade) {
      let o = '';
      for (let r = 0; r < 4; r++) for (let i = -4; i <= 4; i++) {
        const p = hair([i * 40 + (r % 2) * 20, -968 + r * 34]);
        o += S.path(`M${f(p[0] - 7)} ${f(p[1] - 6)} L${f(p[0] + 7)} ${f(p[1] + 6)}`, lineOnly(3.5, c.hatShade));
      }
      if (shade) o += S.path(`M${P(hair([-150, -930]))} Q${P(hair([-80, -990]))} ${P(hair([20, -990]))}`, lineOnly(16, c.hatHi));
      o += S.path(`M${P(hair([-178, -872]))} Q${P(feat([0, -890]))} ${P(hair([178, -872]))}`, lineOnly(5, c.hatShade));
      return o;
    },
    over(hair, feat, c) {
      let o = S.path(`M${P(hair([-156, -866]))} Q${P(feat([0, -880]))} ${P(hair([156, -866]))} L${P(hair([164, -846]))} Q${P(feat([0, -822]))} ${P(hair([-164, -846]))} Z`, outline(c.hatShade));
      const b = feat([0, -882]);
      return o + S.circle(b[0], b[1], 9, outline(c.hatShade, 4.5));
    },
    side: () => poly([[176, -852], [180, -912], [130, -970], [20, -998], [-110, -992], [-200, -952], [-226, -902], [-196, -866], [-140, -864]], 26),
    sideOver(c) {
      let o = sideFringe(c);
      o += S.path('M-200 -900 Q-60 -960 176 -890', lineOnly(5, c.hatShade));
      for (let r = 0; r < 3; r++) for (let i = -4; i <= 3; i++) o += S.path(`M${i * 44 + (r % 2) * 22 - 7} ${-962 + r * 32} l14 12`, lineOnly(3.5, c.hatShade));
      o += S.path(poly([[-150, -872], [-238, -870], [-254, -852], [-232, -842], [-140, -848]], 10), outline(c.hatShade));
      o += S.circle(-196, -880, 8, outline(c.hatShade, 4.5));
      if (c.beard) o += beardSide(c);
      return o;
    },
    back: () => null,
    backOver(c) {
      let o = backFringe(c);
      o += clipped(poly([[-178, -842], [-184, -894], [-160, -950], [-82, -988], [0, -996], [82, -988], [160, -950], [184, -894], [178, -842]], 30), c.hat,
        S.path('M-150 -930 Q-80 -990 20 -990', lineOnly(16, c.hatHi)) + S.path('M0 -996 L0 -846', lineOnly(5, c.hatShade)));
      return o;
    },
  },

  // Dad: beige fishing bucket hat with a lure on the band
  bucketHat: {
    browY: -794, nametagY: -1120, fill: 'hat',
    behind(hair, feat, c) {
      return S.path(mapPoly(hair, [[-152, -860], [152, -860], [156, -722], [138, -704], [-138, -704], [-156, -722]], 20), outline(c.hair));
    },
    front: (hair) => mapPoly(hair, [[-150, -880], [-146, -956], [-120, -1006], [-40, -1024], [40, -1024], [120, -1006], [146, -956], [150, -880]], 26),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(hair([-60, -1018]))} Q${P(hair([-90, -950]))} ${P(hair([-92, -880]))} M${P(hair([60, -1018]))} Q${P(hair([90, -950]))} ${P(hair([92, -880]))}`, lineOnly(4.5, c.hatShade));
      if (shade) o += S.path(`M${P(hair([-130, -960]))} Q${P(hair([-80, -1012]))} ${P(hair([0, -1018]))}`, lineOnly(14, c.hatHi));
      return o;
    },
    over(hair, feat, c) {
      let o = S.path(mapPoly(hair, [[-152, -918], [152, -918], [154, -880], [-154, -880]], 6), outline(c.hatBand));
      o += lure(feat([86, -900]));
      o += S.path(`M${P(hair([-152, -890]))} L${P(hair([152, -890]))} L${P(hair([224, -836]))} Q${P(feat([0, -806]))} ${P(hair([-224, -836]))} Z`, outline(c.hat));
      o += S.path(`M${P(hair([-190, -850]))} Q${P(feat([0, -832]))} ${P(hair([190, -850]))}`, { fill: 'none', stroke: c.hatShade, 'stroke-width': 4, 'stroke-dasharray': '9 7', 'stroke-linecap': 'round' });
      o += S.path(`M${P(hair([-218, -834]))} Q${P(feat([0, -810]))} ${P(hair([218, -834]))}`, lineOnly(6, c.hatShade));
      return o;
    },
    side: () => poly([[-152, -884], [-148, -962], [-110, -1012], [0, -1028], [110, -1012], [150, -962], [156, -884]], 24),
    sideOver(c) {
      let o = S.path(poly([[70, -840], [152, -840], [158, -740], [124, -720], [88, -740]], 16), outline(c.hair));
      o += S.path(poly([[-154, -918], [156, -918], [158, -880], [-156, -880]], 6), outline(c.hatBand)) + lure([-90, -900]);
      o += S.path(poly([[-156, -892], [158, -892], [240, -830], [226, -818], [-226, -818], [-240, -830]], 10), outline(c.hat));
      o += S.path('M-200 -840 L200 -840', { fill: 'none', stroke: c.hatShade, 'stroke-width': 4, 'stroke-dasharray': '9 7' });
      if (c.beard) o += beardSide(c);
      return o;
    },
    back: () => null,
    backOver(c) {
      let o = S.path(poly([[-152, -860], [152, -860], [156, -722], [120, -700], [0, -710], [-120, -700], [-156, -722]], 18), outline(c.hair));
      o += clipped(poly([[-150, -880], [-146, -956], [-120, -1006], [-40, -1024], [40, -1024], [120, -1006], [146, -956], [150, -880]], 26), c.hat, S.path('M-130 -960 Q-80 -1012 0 -1018', lineOnly(14, c.hatHi)));
      o += S.path(poly([[-152, -918], [152, -918], [154, -880], [-154, -880]], 6), outline(c.hatBand));
      o += S.path('M-152 -890 L152 -890 L224 -836 Q0 -800 -224 -836 Z', outline(c.hat));
      o += S.path('M-190 -850 Q0 -826 190 -850', { fill: 'none', stroke: c.hatShade, 'stroke-width': 4, 'stroke-dasharray': '9 7' });
      return o;
    },
  },

  // Dad without the hat: short brown hair with a cowlick
  dadHair: {
    browY: -794, nametagY: -1090,
    front(hair, feat) {
      const outer = [[-150, -772], [-158, -864], [-126, -942], [-40, -982], [70, -978], [140, -930], [158, -860], [150, -772], [134, -778], [130, -846]];
      const line = [[96, -868], [40, -880], [-20, -876], [-80, -860], [-120, -826], [-134, -778]];
      return poly([...outer.map(hair), ...line.map(feat)], 14);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-60, -866]))} Q${P(hair([-30, -930]))} ${P(hair([40, -972]))} M${P(feat([40, -878]))} Q${P(hair([100, -910]))} ${P(hair([140, -900]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-120, -920]))} Q${P(hair([-60, -970]))} ${P(hair([20, -976]))}`, lineOnly(14, c.hairHi));
      return o;
    },
    over(hair, feat, c) {
      const p = hair([24, -976]);
      return S.path(`M${f(p[0] - 14)} ${f(p[1] + 6)} Q${f(p[0] - 6)} ${f(p[1] - 44)} ${f(p[0] + 30)} ${f(p[1] - 36)} Q${f(p[0] + 10)} ${f(p[1] - 22)} ${f(p[0] + 14)} ${f(p[1] + 4)} Z`, outline(c.hair, 6));
    },
    side: () => poly([[-160, -834], [-150, -924], [-60, -980], [70, -974], [150, -906], [158, -776], [110, -764], [80, -840], [-100, -866]], 18),
    sideOver(c) {
      return S.path('M20 -986 Q30 -1030 64 -1020 Q44 -1010 46 -984 Z', outline(c.hair, 6)) + (c.beard ? beardSide(c) : '');
    },
    back: () => poly([[-156, -760], [-160, -880], [-100, -968], [100, -968], [160, -880], [156, -760], [80, -742], [0, -752], [-80, -742]], 24),
  },

  // Mom: dark shoulder-length hair pulled up into a messy bun with a pencil through it
  messyBun: {
    browY: -802, nametagY: -1200,
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-164, -880], [164, -880], [170, -690], [144, -654], [-144, -654], [-170, -690]], 40), outline(c.hair));
      const b = hair([22, -1012]);
      o += bunBlob(b[0], b[1], c, shade);
      return o;
    },
    front(hair, feat) {
      const outer = [[-162, -644], [-168, -852], [-122, -952], [-30, -984], [30, -984], [122, -952], [168, -852], [162, -644], [138, -652], [132, -800]];
      const inner = [[100, -842], [44, -868], [0, -874], [-44, -868], [-100, -842], [-132, -800], [-138, -652]];
      return poly([...outer.map(hair), ...inner.map(feat)], 16);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([0, -874]))} L${P(hair([0, -986]))}`, lineOnly(5));
      o += S.path(`M${P(feat([-60, -862]))} Q${P(hair([-110, -900]))} ${P(hair([-150, -800]))} M${P(feat([60, -862]))} Q${P(hair([110, -900]))} ${P(hair([150, -800]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-120, -920]))} Q${P(hair([-70, -970]))} ${P(hair([-14, -978]))} M${P(hair([20, -978]))} Q${P(hair([80, -970]))} ${P(hair([124, -924]))}`, lineOnly(13, c.hairHi));
      return o;
    },
    over(hair, feat, c) {
      // two loose strands at the temples
      const a = hair([-142, -820]), b = hair([140, -826]);
      return S.path(`M${P(a)} Q${f(a[0] - 26)} ${f(a[1] + 70)} ${f(a[0] - 4)} ${f(a[1] + 130)} M${P(b)} Q${f(b[0] + 30)} ${f(b[1] + 60)} ${f(b[0] + 8)} ${f(b[1] + 120)}`, lineOnly(6, LINE)) +
        S.path(`M${P(a)} Q${f(a[0] - 26)} ${f(a[1] + 70)} ${f(a[0] - 4)} ${f(a[1] + 130)} M${P(b)} Q${f(b[0] + 30)} ${f(b[1] + 60)} ${f(b[0] + 8)} ${f(b[1] + 120)}`, lineOnly(2.5, c.hairHi));
    },
    side: () => poly([[-176, -802], [-150, -932], [-40, -986], [90, -966], [162, -882], [168, -680], [124, -650], [62, -700], [22, -792], [-80, -832], [-140, -822]], 22),
    sideBehind: (c) => bunBlob(96, -1000, c, true),
    back: () => poly([[-166, -662], [-168, -872], [-92, -972], [92, -972], [168, -872], [166, -662], [100, -642], [0, -654], [-100, -642]], 30),
    backOver(c) {
      let o = S.path('M-120 -680 Q-70 -860 -10 -950 M120 -680 Q70 -860 10 -950 M0 -660 L0 -950', lineOnly(4.5));
      o += bunBlob(0, -1010, c, true) + S.ellipse(0, -948, 46, 15, outline(c.accent || '#FF8FA8', 5));
      return o;
    },
  },

  // Brenda the anchor: huge glossy bouffant
  bouffant: {
    browY: -806, nametagY: -1250,
    behind(hair, feat, c, shade) {
      const pts = [[-206, -650], [-244, -712], [-246, -870], [-214, -1010], [-130, -1110], [0, -1146], [130, -1110], [214, -1010], [246, -870], [244, -712], [206, -650], [150, -668], [-150, -668]].map(hair);
      let o = S.path(poly(pts, 44), outline(c.hair));
      for (const sx of [-1, 1]) {
        const p = hair([sx * 236, -664]);
        o += S.path(`M${f(p[0] - sx * 30)} ${f(p[1] - 20)} Q${f(p[0] + sx * 40)} ${f(p[1] - 10)} ${f(p[0] + sx * 46)} ${f(p[1] - 52)} Q${f(p[0] + sx * 60)} ${f(p[1] + 14)} ${f(p[0] - sx * 10)} ${f(p[1] + 14)} Z`, outline(c.hair));
      }
      if (shade) o += S.path(`M${P(hair([-226, -900]))} Q${P(hair([-200, -1060]))} ${P(hair([-60, -1124]))}`, lineOnly(20, c.hairHi)) + S.path(`M${P(hair([214, -760]))} Q${P(hair([236, -880]))} ${P(hair([206, -980]))}`, lineOnly(14, c.hairShade));
      return o;
    },
    front(hair, feat) {
      const outer = [[-170, -664], [-184, -858], [-150, -966], [-60, -1018], [60, -1018], [150, -966], [184, -858], [170, -664], [140, -672], [136, -800]];
      const inner = [[116, -842], [70, -872], [10, -880], [-50, -868], [-96, -846], [-128, -812], [-138, -672]];
      return poly([...outer.map(hair), ...inner.map(feat)], 18);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-110, -846]))} Q${P(hair([-40, -940]))} ${P(hair([150, -940]))} M${P(feat([-20, -874]))} Q${P(hair([60, -930]))} ${P(hair([170, -880]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-140, -930]))} Q${P(hair([-60, -1008]))} ${P(hair([60, -1000]))}`, lineOnly(18, c.hairHi)) + S.ellipse(...hair([-70, -960]), 30, 10, { fill: '#FFFFFF', opacity: 0.85, transform: `rotate(-24 ${P(hair([-70, -960])).replace(' ', ' ')})` });
      return o;
    },
    side: () => poly([[-178, -810], [-170, -940], [-80, -1050], [60, -1090], [180, -1040], [240, -920], [246, -760], [220, -660], [160, -640], [80, -680], [30, -790], [-80, -838], [-140, -830]], 30),
    sideOver(c) {
      return S.path('M-150 -940 Q-60 -1050 80 -1070', lineOnly(18, c.hairHi)) + S.path('M-60 -830 Q60 -900 200 -760 M20 -790 Q120 -800 220 -700', lineOnly(4.5)) +
        S.path('M226 -680 Q276 -680 270 -730 Q296 -660 220 -650 Z', outline(c.hair));
    },
    back: () => poly([[-206, -650], [-244, -712], [-246, -870], [-214, -1010], [-130, -1110], [0, -1146], [130, -1110], [214, -1010], [246, -870], [244, -712], [206, -650], [150, -668], [-150, -668]], 44),
    backOver(c) {
      let o = '';
      for (const sx of [-1, 1]) o += S.path(`M${sx * 206} -684 Q${sx * 276} -674 ${sx * 282} -716 Q${sx * 296} -650 ${sx * 226} -650 Z`, outline(c.hair));
      o += S.path('M-160 -1000 Q0 -1080 160 -1000 M-200 -800 Q0 -760 200 -800', lineOnly(4.5));
      return o;
    },
  },

  // streamer: backwards cap
  backCap: {
    browY: -790, nametagY: -1210, fill: 'cap',
    behind(hair, feat, c) {
      let o = S.path(mapPoly(hair, [[-160, -846], [160, -846], [162, -742], [136, -728], [-136, -728], [-162, -742]], 18), outline(c.hair));
      // the visor points away from camera: it only peeks out behind the far side when the head turns
      const at = Math.abs(hair([100, 0])[0] - hair([-100, 0])[0] - 200) / 9, dir = hair([0, 0])[0] >= 0 ? 1 : -1;
      if (at > 0.05) { const v = hair([-dir * 130 * Math.min(1, at * 1.6), -850]); o += S.ellipse(v[0], v[1], 150, 24, outline(c.capBrim || c.capShade)); }
      return o;
    },
    front: (hair) => mapPoly(hair, [[-166, -828], [-168, -892], [-142, -972], [-72, -1022], [0, -1032], [72, -1022], [142, -972], [168, -892], [166, -828]], 30),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(hair([0, -1030]))} Q${P(hair([-70, -960]))} ${P(hair([-76, -830]))} M${P(hair([0, -1030]))} Q${P(hair([70, -960]))} ${P(hair([76, -830]))}`, lineOnly(4.5, c.capShade));
      if (shade) o += S.path(`M${P(hair([-140, -930]))} Q${P(hair([-90, -1010]))} ${P(hair([-10, -1020]))}`, lineOnly(15, c.capHi || '#FFFFFF55'));
      return o;
    },
    over(hair, feat, c) {
      let o = S.path(mapPoly(hair, [[-168, -858], [168, -858], [168, -826], [-168, -826]], 8), outline(c.capShade));
      const m = feat([0, -828]);
      o += S.path(`M${f(m[0] - 48)} ${f(m[1] + 2)} A48 48 0 0 1 ${f(m[0] + 48)} ${f(m[1] + 2)} Z`, outline(c.hair, 6));
      o += S.path(`M${f(m[0] - 26)} ${f(m[1] - 4)} Q${f(m[0] - 10)} ${f(m[1] - 30)} ${f(m[0] + 4)} ${f(m[1] - 6)} M${f(m[0] + 6)} ${f(m[1] - 4)} Q${f(m[0] + 18)} ${f(m[1] - 26)} ${f(m[0] + 30)} ${f(m[1] - 4)}`, lineOnly(4.5));
      o += S.rect(m[0] - 50, m[1] - 22, 100, 12, 4, outline('#2A2A33', 4)) + S.circle(m[0] - 20, m[1] - 16, 3, { fill: '#888' }) + S.circle(m[0] + 20, m[1] - 16, 3, { fill: '#888' });
      const t = hair([0, -1030]);
      o += S.circle(t[0], t[1], 11, outline(c.capShade, 5));
      return o;
    },
    side: () => poly([[-170, -832], [-168, -902], [-120, -990], [0, -1032], [112, -1004], [162, -932], [170, -832]], 26),
    sideOver(c) {
      let o = S.path(poly([[-20, -836], [70, -836], [70, -742], [0, -752]], 12), outline(c.hair));
      o += S.path(poly([[-170, -862], [170, -862], [170, -830], [-170, -830]], 8), outline(c.capShade));
      o += S.path(poly([[150, -864], [314, -858], [324, -840], [304, -830], [150, -832]], 12), outline(c.capBrim || c.capShade));
      o += S.path('M0 -1030 Q10 -950 4 -864', lineOnly(4.5, c.capShade)) + S.circle(0, -1030, 10, outline(c.capShade, 5));
      return o;
    },
    back: () => null,
    backOver(c) {
      let o = clipped(poly([[-166, -828], [-168, -892], [-142, -972], [-72, -1022], [0, -1032], [72, -1022], [142, -972], [168, -892], [166, -828]], 30), c.cap,
        S.path('M-140 -930 Q-90 -1010 -10 -1020', lineOnly(15, c.capHi || '#FFFFFF55')) + S.path('M0 -1030 Q-70 -960 -76 -830 M0 -1030 Q70 -960 76 -830', lineOnly(4.5, c.capShade)));
      o += crownLogo(0, -930, 1, c.capLogo || '#FFD21F');
      o += S.path(poly([[-168, -858], [168, -858], [168, -826], [-168, -826]], 8), outline(c.capShade));
      o += S.ellipse(0, -820, 180, 32, outline(c.capBrim || c.capShade)) + S.ellipse(0, -826, 150, 14, { fill: '#000', opacity: 0.14 });
      return o;
    },
  },

  // gas-station cashier: red cap with a fuel-drop logo, shaggy hair underneath
  logoCap: {
    browY: -772, nametagY: -1100, fill: 'cap',
    behind(hair, feat, c) {
      return S.path(mapPoly(hair, [[-162, -846], [162, -846], [176, -760], [160, -704], [178, -660], [140, -670], [-140, -670], [-178, -660], [-160, -704], [-176, -760]], 14), outline(c.hair));
    },
    front: (hair) => mapPoly(hair, [[-166, -828], [-168, -892], [-142, -972], [-72, -1022], [0, -1032], [72, -1022], [142, -972], [168, -892], [166, -828]], 30),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(hair([0, -1030]))} L${P(hair([0, -980]))}`, lineOnly(4.5, c.capShade));
      if (shade) o += S.path(`M${P(hair([-140, -930]))} Q${P(hair([-90, -1010]))} ${P(hair([-10, -1020]))}`, lineOnly(15, c.capHi || '#FFFFFF55'));
      const lg = feat([0, -918]);
      o += S.circle(lg[0], lg[1], 40, outline('#FFFFFF', 6)) + dropLogo(lg[0], lg[1], 1, c.capLogo || c.cap);
      return o;
    },
    over(hair, feat, c) {
      let o = '';
      for (const x of [-96, -60, -20]) { const p = feat([x, -818]); o += S.path(`M${f(p[0] - 16)} ${f(p[1] - 4)} L${f(p[0] - 4)} ${f(p[1] + 26)} L${f(p[0] + 16)} ${f(p[1] - 4)} Z`, outline(c.hair, 5)); }
      o += S.path(mapPoly(hair, [[-168, -856], [168, -856], [168, -826], [-168, -826]], 8), outline(c.capShade));
      o += S.path(`M${P(hair([-182, -832]))} Q${P(feat([0, -852]))} ${P(hair([182, -832]))} Q${P(feat([0, -770]))} ${P(hair([-182, -832]))} Z`, outline(c.capBrim || c.capShade));
      o += S.path(`M${P(hair([-150, -826]))} Q${P(feat([0, -800]))} ${P(hair([150, -826]))}`, lineOnly(6, '#00000022'));
      return o;
    },
    side: () => poly([[-168, -832], [-162, -922], [-100, -1002], [20, -1032], [120, -1002], [166, -922], [170, -832]], 26),
    sideOver(c) {
      let o = S.path(poly([[30, -836], [172, -836], [190, -720], [204, -636], [160, -650], [116, -700], [50, -720]], 14), outline(c.hair));
      o += S.path(poly([[-170, -860], [172, -860], [172, -830], [-170, -830]], 8), outline(c.capShade));
      o += S.path(poly([[-166, -852], [-300, -842], [-316, -826], [-292, -816], [-160, -822]], 12), outline(c.capBrim || c.capShade));
      o += S.circle(-118, -930, 30, outline('#FFFFFF', 5)) + dropLogo(-118, -930, 0.75, c.capLogo || c.cap);
      return o;
    },
    back: () => null,
    backOver(c) {
      let o = S.path(poly([[-166, -836], [166, -836], [176, -700], [192, -616], [140, -636], [60, -624], [0, -644], [-60, -624], [-140, -636], [-192, -616], [-176, -700]], 16), outline(c.hair));
      o += S.path('M-100 -820 Q-110 -720 -120 -640 M0 -820 L0 -650 M100 -820 Q110 -720 120 -640', lineOnly(4.5));
      o += clipped(poly([[-166, -828], [-168, -892], [-142, -972], [-72, -1022], [0, -1032], [72, -1022], [142, -972], [168, -892], [166, -828]], 30), c.cap, S.path('M-140 -930 Q-90 -1010 -10 -1020', lineOnly(15, c.capHi || '#FFFFFF55')));
      o += S.path(poly([[-168, -856], [168, -856], [168, -826], [-168, -826]], 8), outline(c.capShade));
      o += S.path('M-46 -828 A46 46 0 0 1 46 -828 Z', outline(c.hair, 6)) + S.rect(-50, -856, 100, 12, 4, outline('#2A2A33', 4));
      return o;
    },
  },

  // Mr. Fig: bald dome, fluffy side hair, three brave comb-over strands
  horseshoe: {
    browY: -792, nametagY: -1070,
    behind(hair, feat, c) {
      let o = '';
      for (const sx of [-1, 1]) o += tuft(hair, sx, c, 1.1);
      return o;
    },
    front: () => null,
    over(hair, feat, c) {
      const sh = hair([-66, -858]);
      let o = S.ellipse(sh[0], sh[1], 38, 13, { fill: '#FFFFFF', opacity: 0.75, transform: `rotate(-14 ${f(sh[0])} ${f(sh[1])})` });
      o += S.path(`M${P(hair([-120, -858]))} Q${P(hair([-20, -890]))} ${P(hair([110, -866]))} M${P(hair([-112, -836]))} Q${P(hair([0, -868]))} ${P(hair([124, -848]))} M${P(hair([-96, -874]))} Q${P(hair([-10, -902]))} ${P(hair([92, -880]))}`, lineOnly(5, c.hair));
      return o;
    },
    side: () => null,
    sideOver(c) {
      let o = sideFringe(c);
      o += S.ellipse(-60, -860, 36, 12, { fill: '#FFFFFF', opacity: 0.75, transform: 'rotate(-12 -60 -860)' });
      o += S.path('M-120 -860 Q-20 -896 120 -870 M-100 -840 Q0 -876 134 -852', lineOnly(5, c.hair));
      return o;
    },
    back: () => null,
    backOver(c) {
      return backFringe(c) +
        S.path('M-120 -862 Q-20 -896 110 -870', lineOnly(5, c.hair));
    },
  },

  // ---- crowd styles
  ponytail: {
    browY: -800, nametagY: -1120,
    behind(hair, feat, c) {
      const a = hair([150, -930]);
      return S.path(`M${f(a[0] - 40)} ${f(a[1] - 10)} Q${f(a[0] + 90)} ${f(a[1] - 40)} ${f(a[0] + 80)} ${f(a[1] + 140)} Q${f(a[0] + 64)} ${f(a[1] + 220)} ${f(a[0] + 20)} ${f(a[1] + 250)} Q${f(a[0] + 30)} ${f(a[1] + 150)} ${f(a[0] - 10)} ${f(a[1] + 60)} Z`, outline(c.hair)) +
        S.ellipse(a[0] + 4, a[1] + 14, 18, 26, outline(c.accent || '#FF6B9A', 5));
    },
    front(hair, feat) {
      const outer = [[-150, -720], [-162, -860], [-110, -950], [0, -978], [110, -950], [162, -860], [150, -720], [134, -730], [132, -820]];
      const fringe = [[96, -846], [30, -856], [-40, -840], [-100, -814], [-136, -760]];
      return poly([...outer.map(hair), ...fringe.map(feat)], 16);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-90, -820]))} Q${P(hair([0, -930]))} ${P(hair([140, -900]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-110, -920]))} Q${P(hair([-30, -966]))} ${P(hair([60, -960]))}`, lineOnly(14, c.hairHi));
      return o;
    },
    side: () => poly([[-174, -800], [-150, -926], [-40, -980], [90, -962], [158, -880], [164, -720], [110, -700], [60, -770], [-80, -826], [-140, -818]], 22),
    sideBehind: (c) => S.path('M120 -940 Q260 -940 250 -760 Q240 -660 200 -620 Q210 -720 170 -800 Z', outline(c.hair)) + S.ellipse(150, -926, 18, 28, outline(c.accent || '#FF6B9A', 5)),
    back: () => poly([[-162, -700], [-166, -870], [-100, -966], [100, -966], [166, -870], [162, -700], [80, -690], [0, -700], [-80, -690]], 26),
    backOver: (c) => S.path('M-30 -930 Q-60 -800 -20 -620 Q0 -580 20 -620 Q60 -800 30 -930 Z', outline(c.hair)) + S.ellipse(0, -920, 34, 18, outline(c.accent || '#FF6B9A', 5)),
  },
  puff: {
    browY: -806, nametagY: -1180,
    behind(hair, feat, c) {
      const cs = [[-150, -880, 64], [-100, -980, 70], [0, -1012, 76], [100, -980, 70], [150, -880, 64], [-160, -780, 50], [160, -780, 50]];
      return puffs(cs.map(([x, y, r]) => [...hair([x, y]), r]), c.hair);
    },
    front(hair, feat) {
      const outer = [[-160, -740, 0], [-170, -880, 0], [-110, -960, 0], [0, -990, 0], [110, -960, 0], [170, -880, 0], [160, -740, 0]].map(([x, y, b]) => [...hair([x, y]), b]);
      const fringe = [[132, -770, 12], [120, -820, 14], [70, -846, 14], [12, -852, 14], [-48, -846, 14], [-104, -826, 12], [-134, -776, 0]].map(([x, y, b]) => [...feat([x, y]), b]);
      return fluffy([...outer, ...fringe]);
    },
    details: (hair, feat, c, shade) => (shade ? S.path(`M${P(feat([-120, -890]))} Q${P(feat([-40, -930]))} ${P(feat([40, -926]))}`, lineOnly(12, c.hairHi)) : ''),
    side: () => poly([[-176, -820], [-190, -920], [-120, -1030], [20, -1076], [160, -1020], [230, -900], [220, -760], [160, -690], [90, -720], [30, -800], [-90, -840]], 40),
    back: () => poly([[-210, -760], [-226, -900], [-160, -1030], [0, -1086], [160, -1030], [226, -900], [210, -760], [140, -700], [0, -690], [-140, -700]], 50),
  },
  buzz: {
    browY: -790, nametagY: -1060,
    front(hair, feat) {
      const outer = [[-146, -790], [-150, -880], [-110, -932], [0, -946], [110, -932], [150, -880], [146, -790], [132, -800]];
      const line = [[120, -846], [60, -862], [0, -866], [-60, -862], [-120, -846], [-132, -800]];
      return poly([...outer.map(hair), ...line.map(feat)], 18);
    },
    details: (hair, feat, c, shade) => (shade ? S.path(`M${P(hair([-110, -900]))} Q${P(hair([-40, -940]))} ${P(hair([50, -936]))}`, lineOnly(12, c.hairHi)) : ''),
    side: () => poly([[-156, -846], [-140, -910], [-60, -946], [70, -942], [150, -890], [156, -760], [110, -740], [80, -830], [-100, -856]], 20),
    back: () => poly([[-150, -760], [-154, -880], [-100, -940], [100, -940], [154, -880], [150, -760], [80, -742], [0, -750], [-80, -742]], 24),
  },
  swoop: {
    browY: -790, nametagY: -1100,
    front(hair, feat) {
      const outer = [[-150, -760], [-162, -870], [-120, -960], [-20, -998], [100, -984], [170, -930], [196, -880], [162, -862], [152, -760], [134, -772], [128, -830]];
      const fringe = [[90, -826], [30, -836], [-30, -830], [-80, -810], [-120, -784], [-110, -830], [-136, -800], [-138, -770]];
      return poly([...outer.map(hair), ...fringe.map(feat)], 12);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-100, -808]))} Q${P(hair([0, -900]))} ${P(hair([170, -900]))} M${P(feat([0, -834]))} Q${P(hair([80, -900]))} ${P(hair([180, -920]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-120, -930]))} Q${P(hair([-40, -986]))} ${P(hair([60, -984]))}`, lineOnly(14, c.hairHi));
      return o;
    },
    side: () => poly([[-196, -820], [-170, -930], [-60, -994], [80, -980], [156, -900], [158, -760], [110, -746], [80, -830], [-120, -840]], 18),
    back: () => poly([[-156, -750], [-162, -880], [-100, -980], [100, -980], [162, -880], [156, -750], [80, -732], [0, -742], [-80, -732]], 24),
  },
  longStraight: {
    browY: -802, nametagY: -1110,
    behind(hair, feat, c) {
      return S.path(mapPoly(hair, [[-166, -880], [166, -880], [180, -540], [166, -500], [150, -530], [130, -510], [-130, -510], [-150, -530], [-166, -500], [-180, -540]], 12), outline(c.hair));
    },
    front(hair, feat) {
      const outer = [[-166, -600], [-170, -860], [-120, -956], [-20, -984], [20, -984], [120, -956], [170, -860], [166, -600], [162, -536], [150, -582], [140, -548], [132, -610], [130, -800]];
      const inner = [[100, -846], [36, -870], [0, -874], [-36, -870], [-100, -846], [-130, -800], [-132, -610], [-140, -548], [-150, -582], [-162, -536]];
      return poly([...outer.map(hair), ...inner.map(feat)], 8);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([0, -874]))} L${P(hair([0, -984]))} M${P(hair([-150, -800]))} L${P(hair([-150, -580]))} M${P(hair([150, -800]))} L${P(hair([150, -580]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-120, -920]))} Q${P(hair([-70, -970]))} ${P(hair([-14, -978]))}`, lineOnly(13, c.hairHi));
      return o;
    },
    side: () => poly([[-176, -806], [-150, -934], [-40, -986], [90, -966], [162, -882], [176, -570], [130, -540], [60, -560], [30, -790], [-80, -834], [-140, -824]], 22),
    back: () => poly([[-172, -560], [-170, -870], [-94, -972], [94, -972], [170, -870], [172, -560], [140, -532], [0, -540], [-140, -532]], 30),
  },
});

function bunBlob(x, y, c, shade) {
  let o = puffs([[x, y, 74], [x - 66, y + 10, 34], [x + 60, y - 30, 36], [x + 10, y - 66, 32], [x - 40, y - 54, 28]], c.hair);
  o += S.path(`M${f(x - 50)} ${f(y + 16)} Q${f(x)} ${f(y - 50)} ${f(x + 56)} ${f(y)} M${f(x - 30)} ${f(y + 44)} Q${f(x + 20)} ${f(y - 4)} ${f(x + 60)} ${f(y + 34)}`, lineOnly(4.5));
  if (shade) o += S.path(`M${f(x - 40)} ${f(y - 40)} Q${f(x)} ${f(y - 74)} ${f(x + 40)} ${f(y - 50)}`, lineOnly(11, c.hairHi));
  o += S.path(`M${f(x + 46)} ${f(y - 74)} q26 -10 22 -32 q-4 -14 -16 -8 M${f(x - 92)} ${f(y + 4)} q-22 -4 -20 -24`, lineOnly(5));
  o += pencil([x - 96, y + 34], [x + 104, y - 74], 15, c.pencil || '#FFC93C');
  return o;
}
function lure(p) {
  const [x, y] = p;
  return S.path(`M${f(x - 22)} ${f(y)} Q${f(x - 4)} ${f(y - 16)} ${f(x + 18)} ${f(y - 2)} Q${f(x - 2)} ${f(y + 14)} ${f(x - 22)} ${f(y)} Z`, outline('#FF4D4D', 4)) +
    S.path(`M${f(x - 4)} ${f(y - 10)} L${f(x - 4)} ${f(y + 8)}`, lineOnly(5, '#FFFFFF')) + S.circle(x + 9, y - 3, 3, { fill: LINE }) +
    S.path(`M${f(x - 22)} ${f(y)} q-10 4 -8 16 q4 6 10 0`, lineOnly(3.5, '#7A8090'));
}
function dropLogo(x, y, s, col) {
  return S.path(`M${f(x)} ${f(y - 26 * s)} Q${f(x + 22 * s)} ${f(y + 2 * s)} ${f(x + 18 * s)} ${f(y + 12 * s)} A${f(19 * s)} ${f(19 * s)} 0 1 1 ${f(x - 18 * s)} ${f(y + 12 * s)} Q${f(x - 22 * s)} ${f(y + 2 * s)} ${f(x)} ${f(y - 26 * s)} Z`, outline(col, 4.5)) +
    S.ellipse(x - 6 * s, y + 6 * s, 4 * s, 7 * s, { fill: '#FFFFFF', opacity: 0.8 });
}
function crownLogo(x, y, s, col) {
  const d = `M${f(x - 34 * s)} ${f(y + 18 * s)} L${f(x - 40 * s)} ${f(y - 20 * s)} L${f(x - 16 * s)} ${f(y - 2 * s)} L${f(x)} ${f(y - 30 * s)} L${f(x + 16 * s)} ${f(y - 2 * s)} L${f(x + 40 * s)} ${f(y - 20 * s)} L${f(x + 34 * s)} ${f(y + 18 * s)} Z`;
  return S.path(d, outline(col, 5)) + S.circle(x, y + 6 * s, 5 * s, { fill: '#FF3B6B' });
}

// ---------------------------------------------------------------- beards (front: 'top' stage, side: from the hat's sideOver, back: dress())
function beardFront(hair, feat, c) {
  const big = (c.beardType || 'big') === 'big';
  const M = (x, y, b) => { const p = Math.abs(x) >= 128 ? hair([x, y]) : feat([x, y]); return [p[0], p[1], b]; };
  const pts = big
    ? [M(-146, -736), M(-128, -736), M(-120, -676), M(-84, -654), M(-40, -652), M(0, -660), M(40, -652), M(84, -654), M(120, -676), M(128, -736), M(146, -736), M(152, -650, 10), M(152, -570, 16), M(130, -508, 16), M(80, -466, 16), M(0, -448, 16), M(-80, -466, 16), M(-130, -508, 16), M(-152, -570, 10), M(-152, -650)]
    : [M(-146, -744), M(-130, -744), M(-124, -672), M(-92, -646), M(-40, -650), M(0, -656), M(40, -650), M(92, -646), M(124, -672), M(130, -744), M(146, -744), M(148, -640, 6), M(126, -578, 8), M(80, -540, 8), M(0, -526, 8), M(-80, -540, 8), M(-126, -578, 6), M(-148, -640)];
  const d = fluffy(pts);
  let inner = '';
  if (big) {
    inner += S.rect(-200, -520, 400, 100, 0, { fill: c.beardShade, opacity: 0.8 });
    const q = (x, y) => P(feat([x, y]));
    inner += S.path(`M${q(-90, -560)} q16 18 4 40 M${q(-30, -520)} q14 16 4 34 M${q(40, -528)} q16 16 4 36 M${q(100, -570)} q12 18 0 38`, lineOnly(4, c.beardShade));
  } else {
    inner += S.rect(-200, -566, 400, 60, 0, { fill: c.beardShade, opacity: 0.7 });
  }
  let o = clipped(d, c.beard, inner, 6.5);
  if (!big) { const mp = feat([0, -596]); o += S.ellipse(mp[0], mp[1], 50 * (1 - 0.15 * Math.abs(feat([0, 0])[0]) / 40), 25, { fill: c.skin }); }
  // moustache
  const m = feat([0, -628]);
  const w = big ? 1 : 0.82;
  const half = (sx) => `M${f(m[0])} ${f(m[1] - 10)} C${f(m[0] + sx * 34 * w)} ${f(m[1] - 34)} ${f(m[0] + sx * 92 * w)} ${f(m[1] - 30)} ${f(m[0] + sx * 112 * w)} ${f(m[1] + 4)} C${f(m[0] + sx * 92 * w)} ${f(m[1] + 22)} ${f(m[0] + sx * 50 * w)} ${f(m[1] + 18)} ${f(m[0] + sx * 22 * w)} ${f(m[1] + 12)} Q${f(m[0] + sx * 6)} ${f(m[1] + 8)} ${f(m[0])} ${f(m[1] - 2)} Z`;
  o += S.path(half(-1) + ' ' + half(1), outline(c.beard, 6));
  o += S.path(`M${f(m[0] - 70 * w)} ${f(m[1] - 14)} Q${f(m[0] - 40 * w)} ${f(m[1] - 24)} ${f(m[0] - 16)} ${f(m[1] - 12)}`, lineOnly(5, '#FFFFFF88'));
  return o;
}
function beardSide(c) {
  const big = (c.beardType || 'big') === 'big';
  const pts = big
    ? [[-12, -742], [30, -742], [44, -650, 10], [30, -560, 16], [-30, -486, 16], [-116, -470, 16], [-176, -516, 14], [-184, -596, 0], [-168, -640], [-110, -652], [-50, -670]]
    : [[-12, -748], [30, -748], [40, -650, 6], [14, -572, 8], [-60, -534, 8], [-146, -540, 8], [-178, -580, 0], [-172, -636], [-110, -652], [-50, -668]];
  let o = clipped(fluffy(pts), c.beard, S.rect(-260, big ? -530 : -574, 400, 120, 0, { fill: c.beardShade, opacity: 0.8 }), 6.5);
  if (!big) o += S.ellipse(-140, -597, 30, 19, { fill: c.skin });
  o += big ? S.path(`M-112 -644 C-130 -662 -172 -656 -186 -630 C-174 -612 -150 -614 -132 -618 Q-116 -622 -112 -636 Z`, outline(c.beard, 6))
    : S.path(`M-116 -640 C-132 -654 -164 -650 -176 -630 C-166 -616 -146 -618 -130 -620 Q-118 -624 -116 -634 Z`, outline(c.beard, 6));
  return o;
}
function beardBack(c) {
  const big = (c.beardType || 'big') === 'big';
  const pts = big ? [[-146, -640], [146, -640], [152, -580, 16], [128, -512, 16], [60, -462, 16], [-60, -462, 16], [-128, -512, 16], [-152, -580, 0]]
    : [[-144, -640], [144, -640], [146, -600, 8], [100, -540, 8], [-100, -540, 8], [-146, -600, 0]];
  return S.path(fluffy(pts), outline(c.beard, 6.5));
}

// ---------------------------------------------------------------- glasses, headset, earrings
function specsFront(spec, feat, at, dir) {
  const col = spec.col || '#2A2A33';
  const kNear = 1 - 0.04 * at, kFar = 1 - 0.3 * at;
  const kL = dir > 0 ? kNear : kFar, kR = dir > 0 ? kFar : kNear;
  let o = '';
  if (spec.type === 'rect') {
    const y = spec.y ?? -712, w = spec.w ?? 104, h = spec.h ?? 76, x = spec.x ?? 60;
    const eL = feat([-x, y]), eR = feat([x, y]);
    const lens = (cx, k) => S.rect(cx - (w / 2) * k, y - h / 2, w * k, h, spec.r ?? 16, { fill: '#DDF4FF', 'fill-opacity': 0.22, stroke: col, 'stroke-width': spec.sw ?? 9 }) +
      S.path(`M${f(cx - w * 0.3 * k)} ${f(y + h * 0.2)} L${f(cx - w * 0.06 * k)} ${f(y - h * 0.3)}`, lineOnly(6, '#FFFFFFAA'));
    o += lens(eL[0], kL) + lens(eR[0], kR);
    o += S.path(`M${f(eL[0] + (w / 2) * kL)} ${f(y - 8)} Q${f((eL[0] + eR[0]) / 2)} ${f(y - 18)} ${f(eR[0] - (w / 2) * kR)} ${f(y - 8)}`, lineOnly(spec.sw ?? 8, col));
    return o;
  }
  const y = spec.y ?? -706, r = spec.r ?? 66, x = spec.x ?? 66;
  const eL = feat([-x, y]), eR = feat([x, y]);
  const lens = (cx, k) => S.ellipse(cx, y, r * k, r, { fill: '#DDF4FF', 'fill-opacity': 0.2, stroke: col, 'stroke-width': spec.sw ?? 10 }) +
    S.path(`M${f(cx - r * 0.62 * k)} ${f(y - r * 0.18)} Q${f(cx - r * 0.5 * k)} ${f(y - r * 0.56)} ${f(cx - r * 0.12 * k)} ${f(y - r * 0.66)}`, lineOnly(6, '#FFFFFFB0'));
  o += lens(eL[0], kL) + lens(eR[0], kR);
  o += S.path(`M${f(eL[0] + r * kL - 2)} ${f(y - 10)} Q${f((eL[0] + eR[0]) / 2)} ${f(y - 26)} ${f(eR[0] - r * kR + 2)} ${f(y - 10)}`, lineOnly(spec.sw ? spec.sw - 1 : 9, col));
  return o;
}
function specsSide(spec) {
  const col = spec.col || '#2A2A33';
  if (spec.type === 'rect') {
    const y = spec.y ?? -712, h = spec.h ?? 76;
    return S.path(`M-110 ${y - 10} L30 ${y - 16}`, lineOnly(spec.sw ?? 8, col)) +
      S.rect(-178, y - h / 2, 48, h, 12, { fill: '#DDF4FF', 'fill-opacity': 0.22, stroke: col, 'stroke-width': spec.sw ?? 9 });
  }
  const y = spec.y ?? -706, r = spec.r ?? 66;
  return S.path(`M-114 ${y - 20} L28 ${y - 26}`, lineOnly(spec.sw ? spec.sw - 1 : 9, col)) +
    S.ellipse(-156, y, r * 0.42, r, { fill: '#DDF4FF', 'fill-opacity': 0.2, stroke: col, 'stroke-width': spec.sw ?? 10 }) +
    S.path(`M-170 ${y - 30} Q-166 ${y - 52} -150 ${y - 58}`, lineOnly(6, '#FFFFFFB0'));
}
function headsetFront(hs, hair, feat) {
  const col = hs.col || '#1EA7FF', base = hs.base || '#1B1D26';
  const top = hs.top ?? -1060;
  const a = hair([-178, -770]), b = hair([178, -770]);
  const cy = 2 * top - (a[1] + b[1]) / 2;
  const cx = (a[0] + b[0]) / 2;
  let o = S.path(`M${P(a)} Q${f(cx)} ${f(cy)} ${P(b)}`, lineOnly(30, LINE)) + S.path(`M${P(a)} Q${f(cx)} ${f(cy)} ${P(b)}`, lineOnly(18, base));
  o += S.path(`M${P(a)} Q${f(cx)} ${f(cy)} ${P(b)}`, { ...lineOnly(6, col), pathLength: 100, 'stroke-dasharray': '0 34 32 100' });
  for (const sx of [-1, 1]) {
    const p = hair([sx * 176, -728]);
    o += S.path(S.roundedPath([[p[0] - 34, p[1] - 74], [p[0] + 34, p[1] - 74], [p[0] + 34, p[1] + 74], [p[0] - 34, p[1] + 74]], 28), outline(base, 6));
    o += S.path(S.roundedPath([[p[0] + sx * 6 - 12, p[1] - 52], [p[0] + sx * 6 + 12, p[1] - 52], [p[0] + sx * 6 + 12, p[1] + 52], [p[0] + sx * 6 - 12, p[1] + 52]], 10), { fill: col });
    o += S.path(`M${f(p[0] - 18)} ${f(p[1] - 54)} L${f(p[0] - 18)} ${f(p[1] - 20)}`, lineOnly(5, '#FFFFFF55'));
  }
  if (hs.mic !== false) {
    const s = hair([-180, -680]), e = feat([-86, -622]);
    o += S.path(`M${P(s)} Q${f(s[0] + 10)} ${f(e[1] + 10)} ${P(e)}`, lineOnly(14, LINE)) + S.path(`M${P(s)} Q${f(s[0] + 10)} ${f(e[1] + 10)} ${P(e)}`, lineOnly(6, base));
    o += S.ellipse(e[0], e[1], 15, 13, outline(base, 5)) + S.circle(e[0] - 3, e[1] - 3, 4, { fill: col });
  }
  return o;
}
function headsetSide(hs) {
  const col = hs.col || '#1EA7FF', base = hs.base || '#1B1D26';
  const top = hs.top ?? -1060;
  let o = S.path(`M70 -790 Q86 ${top + 40} 6 ${top}`, lineOnly(30, LINE)) + S.path(`M70 -790 Q86 ${top + 40} 6 ${top}`, lineOnly(18, base));
  o += S.path(S.roundedPath([[22, -806], [118, -806], [118, -650], [22, -650]], 40), outline(base, 6));
  o += S.circle(70, -728, 40, { fill: col }) + S.circle(70, -728, 24, { fill: base }) + S.path('M40 -790 L40 -756', lineOnly(5, '#FFFFFF55'));
  if (hs.mic !== false) {
    o += S.path('M40 -690 Q-60 -620 -148 -634', lineOnly(14, LINE)) + S.path('M40 -690 Q-60 -620 -148 -634', lineOnly(6, base));
    o += S.ellipse(-156, -634, 16, 14, outline(base, 5)) + S.circle(-160, -638, 4, { fill: col });
  }
  return o;
}
function headsetBack(hs) {
  const col = hs.col || '#1EA7FF', base = hs.base || '#1B1D26';
  const top = hs.top ?? -1060;
  const cy = 2 * top + 770;
  let o = S.path(`M-178 -770 Q0 ${cy} 178 -770`, lineOnly(30, LINE)) + S.path(`M-178 -770 Q0 ${cy} 178 -770`, lineOnly(18, base)) +
    S.path(`M-178 -770 Q0 ${cy} 178 -770`, { ...lineOnly(6, col), pathLength: 100, 'stroke-dasharray': '0 34 32 100' });
  for (const sx of [-1, 1]) {
    o += S.path(S.roundedPath([[sx * 176 - 34, -802], [sx * 176 + 34, -802], [sx * 176 + 34, -654], [sx * 176 - 34, -654]], 28), outline(base, 6));
    o += S.path(S.roundedPath([[sx * 182 - 12, -780], [sx * 182 + 12, -780], [sx * 182 + 12, -676], [sx * 182 - 12, -676]], 10), { fill: col });
  }
  return o;
}
const pearl = (x, y, r = 12) => S.circle(x, y, r, outline('#FFF8EE', 4)) + S.circle(x - r * 0.3, y - r * 0.3, r * 0.3, { fill: '#FFFFFF' });

// chain looks2's head-accessory hook: new accessories for the front view
const headAcc2 = L2.headAcc;
L2.headAcc = function headAcc(style, stage, hair, feat, fx) {
  let o = headAcc2(style, stage, hair, feat, fx);
  const a = style.acc || {}, c = style.col;
  const at = Math.abs(fx) / 40, dir = fx >= 0 ? 1 : -1;
  if (stage === 'top') {
    if (c.beard) o += beardFront(hair, feat, c);
    if (a.headset3) o += headsetFront(a.headset3, hair, feat);
  } else if (stage === 'face') {
    if (a.specs) o += specsFront(a.specs, feat, at, dir);
    if (a.pearls) for (const sx of [-1, 1]) { const p = hair([sx * 150, -612]); o += pearl(p[0], p[1]); }
    if (a.eyebags) for (const sx of [-1, 1]) { const p = feat([sx * 60, -630]); o += S.path(`M${f(p[0] - 38)} ${f(p[1])} Q${f(p[0])} ${f(p[1] + 18)} ${f(p[0] + 38)} ${f(p[1])}`, lineOnly(6, a.eyebags)); }
  }
  return o;
};

// ---------------------------------------------------------------- outfits (inside the torso clip)
const TOPS3 = ['overalls', 'proJersey', 'dinoHoodie', 'shawlCardigan', 'polo', 'cableKnit', 'blazer', 'streamTee', 'vest', 'sweaterVest'];
const txt = (s, x, y, size, fill, sw = 0.12, stroke = LINE) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, stroke, 'stroke-width': size * sw, 'paint-order': 'stroke', 'text-anchor': 'middle', 'stroke-linejoin': 'round' }, s);
function hemRib(c, B, W, col) {
  let o = S.rect(-W - 10, B - 24, 2 * W + 20, 26, 0, { fill: col || c.topShade });
  let d = '';
  for (let x = -W + 6; x < W; x += 15) d += `M${x} ${B - 22} L${x} ${B}`;
  return o + S.path(d, lineOnly(3, c.top)) + S.path(`M${-W - 10} ${B - 24} L${W + 10} ${B - 24}`, lineOnly(4));
}
function crewNeck(cx, k, T, c, rib) {
  let o = S.path(`M${f(cx - 40 * k)} ${T - 6} Q${f(cx)} ${T + 30} ${f(cx + 40 * k)} ${T - 6} Z`, outline(c.skin, 5));
  if (rib) o += S.path(`M${f(cx - 48 * k)} ${T - 4} Q${f(cx)} ${T + 42} ${f(cx + 48 * k)} ${T - 4}`, lineOnly(9, rib)) + S.path(`M${f(cx - 54 * k)} ${T - 4} Q${f(cx)} ${T + 50} ${f(cx + 54 * k)} ${T - 4}`, lineOnly(4));
  return o;
}
function outfit3(style, t, shade, back, T, B, W) {
  const c = style.col;
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  const top = style.top;
  let o = '';
  if (top === 'overalls') {
    let st = '';
    for (let y = T + 18; y < B; y += 38) st += `M${-W - 10} ${y} h${2 * W + 20} v17 h${-2 * W - 20} Z `;
    o += S.path(st, { fill: c.stripe });
    const den = c.denim, stitch = { fill: 'none', stroke: c.stitch, 'stroke-width': 3.5, 'stroke-dasharray': '8 6' };
    if (!back) {
      o += crewNeck(cx, k, T, c, null);
      for (const sx of [-1, 1]) {
        o += S.path(poly([[cx + sx * 44 * k - 14, -462], [cx + sx * 44 * k + 14, -462], [sx * 70 + 16, T - 12], [sx * 70 - 16, T - 12]], 3), outline(den, 5));
        o += S.path(`M${f(cx + sx * 44 * k)} -462 L${sx * 70} ${T - 12}`, stitch);
      }
      o += S.path(poly([[cx - 64 * k, -470], [cx + 64 * k, -470], [cx + 66 * k, -360], [cx - 66 * k, -360]], 10), outline(den, 6));
      o += S.rect(-W - 10, -372, 2 * W + 20, B - -372 + 10, 0, { fill: den }) + S.path(`M${-W - 10} -372 L${f(cx - 64 * k)} -372 M${f(cx + 64 * k)} -372 L${W + 10} -372`, lineOnly(5));
      o += S.path(poly([[cx - 54 * k, -460], [cx + 54 * k, -460], [cx + 56 * k, -370], [cx - 56 * k, -370]], 6), stitch);
      // bib pocket with a tiny wrench
      o += S.g(S.path('M-6 -30 L-6 6 M6 -30 L6 6', lineOnly(9, LINE)) + S.path('M0 -32 L0 4', lineOnly(9, '#C9CED8')) + S.path('M-14 -40 a14 14 0 1 0 28 0 l-8 0 l0 8 l-12 0 l0 -8 Z', outline('#C9CED8', 4.5)), `translate(${f(cx + 18 * k)} -412) rotate(12)`);
      o += S.path(poly([[cx - 36 * k, -426], [cx + 36 * k, -426], [cx + 34 * k, -380], [cx - 34 * k, -380]], 8), outline(c.denimShade || den, 5));
      o += S.path(`M${f(cx - 36 * k)} -414 L${f(cx + 36 * k)} -414`, stitch);
      for (const sx of [-1, 1]) o += S.circle(cx + sx * 44 * k, -458, 9, outline(c.button || '#FFC93C', 4)) + S.circle(cx + sx * 44 * k - 2, -461, 3, { fill: '#FFFFFF' });
      o += S.path(`M${-W + 18} -350 L${-W + 18} ${B} M${W - 18} -350 L${W - 18} ${B}`, stitch);
    } else {
      for (const sx of [-1, 1]) o += S.path(`M${sx * 72} ${T - 10} L${-sx * 30} -380`, lineOnly(30, LINE)) + S.path(`M${sx * 72} ${T - 10} L${-sx * 30} -380`, lineOnly(22, den));
      o += S.path(poly([[-W - 10, -390], [W + 10, -390], [W + 10, B + 10], [-W - 10, B + 10]], 2), outline(den, 5));
      o += S.path(poly([[-40, -408], [40, -408], [36, -364], [-36, -364]], 8), outline(c.denimShade || den, 5));
      o += S.path(poly([[-74, -366], [-14, -366], [-16, -320], [-72, -320]], 6), stitch) + S.path(poly([[14, -366], [74, -366], [72, -320], [16, -320]], 6), stitch);
    }
  } else if (top === 'proJersey') {
    o += S.rect(-W - 10, T - 10, 38, B - T + 20, 0, { fill: c.panel }) + S.rect(W - 28, T - 10, 38, B - T + 20, 0, { fill: c.panel });
    o += S.path(`M${-W + 28} ${T} L${-W + 28} ${B} M${W - 28} ${T} L${W - 28} ${B}`, lineOnly(4));
    if (!back) {
      o += S.path(`M${f(cx - 36 * k)} ${T - 6} L${f(cx)} ${T + 52} L${f(cx + 36 * k)} ${T - 6} Z`, { fill: c.skin });
      o += S.path(`M${f(cx - 40 * k)} ${T - 6} L${f(cx)} ${T + 56} L${f(cx + 40 * k)} ${T - 6}`, lineOnly(16, LINE)) + S.path(`M${f(cx - 40 * k)} ${T - 6} L${f(cx)} ${T + 56} L${f(cx + 40 * k)} ${T - 6}`, lineOnly(9, c.panel));
      o += txt('PRO', cx - 46 * k, -452, 38, c.panel, 0.16);
      o += txt('1', cx + 4, -334, 128, '#FFFFFF', 0.1, LINE) + S.path(`M${f(cx + 46 * k)} -472 l8 -18 l8 18 l-8 18 Z`, { fill: c.panel });
    } else {
      o += S.path(`M${-50} ${T - 6} Q0 ${T + 16} 50 ${T - 6}`, lineOnly(9, c.panel));
      o += txt(style.backName || 'DEX', 0, -460, 44, c.panel, 0.16) + txt('1', 0, -330, 140, '#FFFFFF', 0.1);
    }
    o += S.rect(-W - 10, B - 20, 2 * W + 20, 22, 0, { fill: c.panel }) + S.path(`M${-W - 10} ${B - 20} L${W + 10} ${B - 20}`, lineOnly(4));
  } else if (top === 'dinoHoodie') {
    if (!back) {
      o += S.path(`M${f(cx - 66 * k)} ${T - 8} Q${f(cx)} ${T + 46} ${f(cx + 66 * k)} ${T - 8} Z`, outline(c.topShade, 5));
      o += S.path(poly([[cx - 60 * k, -482], [cx + 60 * k, -482], [cx + 68 * k, B + 20], [cx - 68 * k, B + 20]], 40), outline(c.belly, 5));
      for (const y of [-444, -404, -364]) o += S.path(`M${f(cx - 52 * k)} ${y} Q${f(cx)} ${y + 10} ${f(cx + 52 * k)} ${y}`, lineOnly(4.5, c.bellyLine || '#E8C98A'));
    } else {
      for (const [y, h] of [[-470, 34], [-410, 30], [-354, 26]]) o += spike(0, y, h, h * 0.62, 0, c.spike, 5);
    }
    o += S.rect(-W - 10, B - 22, 2 * W + 20, 24, 0, { fill: c.topShade }) + S.path(`M${-W - 10} ${B - 22} L${W + 10} ${B - 22}`, lineOnly(4));
  } else if (top === 'shawlCardigan') {
    if (!back) {
      o += S.path(`M${f(cx - 58 * k)} ${T - 10} L${f(cx + 58 * k)} ${T - 10} L${f(cx + 6)} -392 L${f(cx - 6)} -392 Z`, { fill: c.shirt });
      for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 20} L${f(cx + sx * 34 * k)} ${T - 6} L${f(cx + sx * 30 * k)} ${T + 34} Z`, outline(c.shirt, 4));
      o += S.path(`M${f(cx)} ${T + 22} L${f(cx)} -400`, lineOnly(3, c.shirtShade || '#9FBCE0'));
      for (const sx of [-1, 1]) {
        o += S.path(poly([[cx + sx * 56 * k, T - 12], [cx + sx * 92 * k, T - 12], [cx + sx * 26 * k, -372], [cx + sx * 2, -392]], 6), outline(c.collar || c.topShade, 5));
        o += S.path(`M${f(cx + sx * 74 * k)} ${T - 8} L${f(cx + sx * 16 * k)} -382`, lineOnly(3.5, c.topShade));
      }
      o += S.path(`M${f(cx)} -386 L${f(cx)} ${B}`, lineOnly(5));
      for (const y of [-360, -330]) o += S.circle(cx - 16 * k, y, 9, outline(c.button || '#7A4E2C', 4)) + S.circle(cx - 18 * k, y - 2, 2.5, { fill: '#FFFFFF88' });
      for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 34 * k, -370], [cx + sx * 84 * k, -370], [cx + sx * 84 * k, -330], [cx + sx * 34 * k, -330]], 6), outline(c.topShade, 4.5));
    } else {
      o += S.path(`M-62 ${T - 10} Q0 ${T + 30} 62 ${T - 10}`, lineOnly(22, LINE)) + S.path(`M-62 ${T - 10} Q0 ${T + 30} 62 ${T - 10}`, lineOnly(15, c.collar || c.topShade));
    }
    let rib = '';
    for (let x = -W + 10; x < W; x += 26) rib += `M${x} ${T + 70} L${x} ${B - 30} `;
    o += S.path(rib, lineOnly(2.5, c.topShade));
    o += hemRib(c, B, W);
  } else if (top === 'polo') {
    if (!back) {
      o += S.path(`M${f(cx - 30 * k)} ${T - 6} Q${f(cx)} ${T + 20} ${f(cx + 30 * k)} ${T - 6} Z`, { fill: c.skin });
      o += S.path(poly([[cx - 14 * k, T + 6], [cx + 14 * k, T + 6], [cx + 14 * k, T + 92], [cx - 14 * k, T + 92]], 4), outline(c.topShade, 4.5));
      for (const y of [T + 32, T + 64]) o += S.circle(cx, y, 5.5, outline('#FFFFFF', 2.5));
      for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 4, T + 14], [cx + sx * 50 * k, T - 12], [cx + sx * 62 * k, T + 30], [cx + sx * 22 * k, T + 40]], 4), outline(c.collar || c.top, 5));
      const lx = cx + 54 * k, ly = -446;
      o += S.path(`M${f(lx - 18)} ${ly} Q${f(lx)} ${ly - 14} ${f(lx + 14)} ${ly} Q${f(lx)} ${ly + 14} ${f(lx - 18)} ${ly} Z M${f(lx + 12)} ${ly} L${f(lx + 24)} ${ly - 10} L${f(lx + 24)} ${ly + 10} Z`, outline(c.logo || '#E9D3A0', 3));
    } else {
      o += S.path(`M-56 ${T - 6} Q0 ${T + 18} 56 ${T - 6}`, lineOnly(18, LINE)) + S.path(`M-56 ${T - 6} Q0 ${T + 18} 56 ${T - 6}`, lineOnly(11, c.collar || c.top));
    }
  } else if (top === 'cableKnit') {
    if (!back) o += crewNeck(cx, k, T, c, c.topShade);
    let d = '';
    for (const x0 of [-56, 0, 56]) {
      const x = cx + x0 * k;
      for (let y = T + 52; y < B - 40; y += 34) d += `M${f(x - 11)} ${y} Q${f(x + 13)} ${y + 17} ${f(x - 11)} ${y + 34} M${f(x + 11)} ${y} Q${f(x - 13)} ${y + 17} ${f(x + 11)} ${y + 34} `;
    }
    o += S.path(d, lineOnly(6, c.topShade));
    let side = '';
    for (const x0 of [-28, 28]) side += `M${f(cx + x0 * k)} ${T + 48} L${f(cx + x0 * k)} ${B - 30} `;
    o += S.path(side, lineOnly(3, c.topShade));
    o += hemRib(c, B, W);
  } else if (top === 'blazer') {
    if (!back) {
      o += S.path(`M${f(cx - 52 * k)} ${T - 10} L${f(cx + 52 * k)} ${T - 10} L${f(cx)} -400 Z`, { fill: c.shirt });
      if ((style.acc || {}).pearls) for (let i = 0; i <= 8; i++) {
        const u = i / 8, x = cx + (-34 + 68 * u) * k, y = T + 4 + Math.sin(u * Math.PI) * 34;
        o += S.circle(x, y, 7, outline('#FFF8EE', 2.5));
      }
      for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 50 * k, T - 12], [cx + sx * 92 * k, T - 12], [cx + sx * 74 * k, T + 46], [cx + sx * 92 * k, T + 64], [cx + sx * 8, -398]], 6), outline(c.topShade, 5));
      o += S.path(`M${f(cx)} -398 L${f(cx)} ${B}`, lineOnly(5));
      o += S.circle(cx + 2, -366, 10, outline(c.button || '#FFC93C', 4));
      for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 30 * k)} -338 L${f(cx + sx * 80 * k)} -338`, lineOnly(5));
    } else o += S.path(`M0 ${T + 20} L0 ${B}`, lineOnly(4, c.topShade));
  } else if (top === 'streamTee') {
    if (!back) {
      o += crewNeck(cx, k, T, c, c.topShade);
      o += crownLogo(cx, -440, 1.15, '#FFD21F');
      o += S.path(poly([[cx - 46 * k, -388], [cx + 46 * k, -388], [cx + 46 * k, -354], [cx - 46 * k, -354]], 16), outline('#FF3B4E', 4.5)) + S.circle(cx - 28 * k, -371, 6, { fill: '#FFFFFF' }) + txt('LIVE', cx + 8 * k, -360, 26, '#FFFFFF', 0);
    } else o += txt('GG', 0, -400, 80, c.topShade, 0.1);
  } else if (top === 'vest') {
    if (!back) {
      o += crewNeck(cx, k, T, c, null);
      for (const sx of [-1, 1]) {
        o += S.path(poly([[sx * (W + 12), -500], [cx + sx * 40 * k, T - 12], [cx + sx * 10, -430], [cx + sx * 8, B + 12], [sx * (W + 12), B + 12]], 6), outline(c.vest, 5));
      }
      o += S.path(poly([[cx + 30 * k, -444], [cx + 82 * k, -444], [cx + 82 * k, -414], [cx + 30 * k, -414]], 4), outline('#FFFFFF', 3.5)) + S.rect(cx + 30 * k, -444, 52 * k, 9, 0, { fill: c.vest }) + txt('HI!', cx + 56 * k, -419, 14, LINE, 0);
      o += S.circle(cx - 56 * k, -430, 16, outline('#FFFFFF', 3.5)) + dropLogo(cx - 56 * k, -430, 0.45, c.vest);
      for (const y of [-380, -340]) o += S.circle(cx - 20, y, 5, { fill: LINE });
    } else o += S.path(poly([[-W - 12, -500], [W + 12, -500], [W + 12, B + 12], [-W - 12, B + 12]], 4), outline(c.vest, 5));
  } else if (top === 'sweaterVest') {
    if (!back) {
      o += S.path(poly([[-W - 12, -496], [cx - 50 * k, T - 12], [cx, -436], [cx + 50 * k, T - 12], [W + 12, -496], [W + 12, B + 12], [-W - 12, B + 12]], 4), outline(c.vest, 5));
      o += S.path(`M${f(cx - 50 * k)} ${T - 10} L${f(cx)} -436 L${f(cx + 50 * k)} ${T - 10}`, lineOnly(16, LINE)) + S.path(`M${f(cx - 50 * k)} ${T - 10} L${f(cx)} -436 L${f(cx + 50 * k)} ${T - 10}`, lineOnly(9, c.vestTrim || c.topShade));
      let dia = '', dia2 = '', lines = '';
      for (const [row, y] of [[0, -392], [1, -334]]) for (const [i, x0] of [[0, -66], [1, 0], [2, 66]]) {
        const x = cx + x0 * k, dd = `M${f(x)} ${y - 30} L${f(x + 30 * k)} ${y} L${f(x)} ${y + 30} L${f(x - 30 * k)} ${y} Z `;
        if ((row + i) % 2) dia += dd; else dia2 += dd;
      }
      for (const x0 of [-99, -33, 33, 99]) lines += `M${f(cx + (x0 - 30) * k)} -452 L${f(cx + (x0 + 60) * k)} -302 M${f(cx + (x0 + 30) * k)} -452 L${f(cx + (x0 - 60) * k)} -302 `;
      o += S.path(dia, { fill: c.argyle1 }) + S.path(dia2, { fill: c.argyle2 }) + S.path(lines, { fill: 'none', stroke: c.argyleLine || '#FFFFFF', 'stroke-width': 2.5, 'stroke-dasharray': '6 6', opacity: 0.8 });
      for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 4} L${f(cx + sx * 38 * k)} ${T - 6} L${f(cx + sx * 30 * k)} ${T + 32} Z`, outline(c.top, 4));
      o += S.path(`M${f(cx)} ${T + 14} L${f(cx - 34)} ${T - 4} L${f(cx - 34)} ${T + 32} Z M${f(cx)} ${T + 14} L${f(cx + 34)} ${T - 4} L${f(cx + 34)} ${T + 32} Z`, outline(c.bow || '#3FA34D', 4.5)) + S.circle(cx, T + 14, 10, outline(c.bow || '#3FA34D', 4.5));
    } else o += S.path(poly([[-W - 12, -496], [W + 12, -496], [W + 12, B + 12], [-W - 12, B + 12]], 4), outline(c.vest, 5));
    o += hemRib({ ...c, top: c.vest, topShade: c.vestTrim || c.topShade }, B, W, c.vestTrim);
  }
  return o;
}
const outfit2Base = L2.outfit2;
L2.outfit2 = function outfit2(style, t, shade, back, T, B, W) {
  return outfit2Base(style, t, shade, back, T, B, W) + (TOPS3.includes(style.top) ? outfit3(style, t, shade, back, T, B, W) : '');
};

// side-view torso details (in the side torso clip); facing screen-left, front edge x=-62, back edge x=70
const SIDE_TD = S.roundedPath([[-62, -535], [70, -535], [70, -305], [-62, -305]], 16);
function outfitSide3(style) {
  const c = style.col;
  let o = '';
  switch (style.top) {
    case 'overalls': {
      let st = '';
      for (let y = -515; y < -305; y += 38) st += `M-80 ${y} h170 v17 h-170 Z `;
      o += S.path(st, { fill: c.stripe });
      o += S.path('M-80 -372 L90 -372 L90 -290 L-80 -290 Z', outline(c.denim, 5)) + S.path(poly([[-80, -470], [-30, -470], [-26, -360], [-80, -360]], 8), outline(c.denim, 5));
      o += S.path('M-40 -466 L46 -540', lineOnly(30, LINE)) + S.path('M-40 -466 L46 -540', lineOnly(22, c.denim)) + S.circle(-36, -462, 9, outline(c.button || '#FFC93C', 4));
      o += S.path('M40 -360 L40 -300', { fill: 'none', stroke: c.stitch, 'stroke-width': 3.5, 'stroke-dasharray': '8 6' });
      break;
    }
    case 'proJersey': o += S.rect(-6, -540, 40, 250, 0, { fill: c.panel }) + S.path('M-6 -540 L-6 -300 M34 -540 L34 -300', lineOnly(4)) + S.rect(-80, -326, 170, 22, 0, { fill: c.panel }); break;
    case 'dinoHoodie': o += S.path(poly([[-90, -480], [-36, -480], [-34, -290], [-90, -290]], 20), outline(c.belly, 5)) + S.rect(-80, -328, 170, 24, 0, { fill: c.topShade }); break;
    case 'shawlCardigan': o += S.path('M-70 -540 L-40 -540 L-50 -400 L-70 -400 Z', { fill: c.shirt }) + S.path('M-40 -544 L-6 -544 L-40 -380 L-62 -380 Z', outline(c.collar || c.topShade, 5)) + S.rect(-80, -330, 170, 26, 0, { fill: c.topShade }) + S.path('M-80 -330 L90 -330', lineOnly(4)) + S.path(poly([[-50, -372], [0, -372], [0, -334], [-50, -334]], 6), outline(c.topShade, 4.5)); break;
    case 'polo': o += S.path(poly([[-70, -540], [-10, -540], [-20, -500], [-66, -496]], 4), outline(c.collar || c.top, 5)); break;
    case 'cableKnit': { let d = ''; for (let y = -500; y < -340; y += 34) d += `M-11 ${y} Q13 ${y + 17} -11 ${y + 34} M11 ${y} Q-13 ${y + 17} 11 ${y + 34} `; o += S.path(d, lineOnly(6, c.topShade)) + S.rect(-80, -330, 170, 26, 0, { fill: c.topShade }) + S.path('M-80 -330 L90 -330', lineOnly(4)); break; }
    case 'blazer': o += S.path('M-70 -540 L-40 -540 L-60 -440 L-70 -440 Z', { fill: c.shirt }) + S.path('M-40 -544 L-10 -544 L-34 -470 L-20 -450 L-62 -400 L-70 -420 Z', outline(c.topShade, 5)); break;
    case 'vest': o += S.path(poly([[-80, -500], [40, -500], [60, -540], [90, -540], [90, -290], [-80, -290]], 4), outline(c.vest, 5)) + S.rect(-40, -470, 46, 28, 3, outline('#FFFFFF', 3.5)); break;
    case 'sweaterVest': o += S.path(poly([[-80, -500], [90, -500], [90, -290], [-80, -290]], 4), outline(c.vest, 5)) + S.path('M0 -440 L28 -400 L0 -360 L-28 -400 Z', { fill: c.argyle1 }) + S.rect(-80, -330, 170, 26, 0, { fill: c.vestTrim || c.topShade }); break;
    default: break;
  }
  return o;
}

// ---------------------------------------------------------------- legs: shorts, socks, rolled cuffs, shoe types
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul2 = (a, k) => [a[0] * k, a[1] * k];
function band(J, L, from, to, along = 1) {
  // quad across the limb between distances `from` and `to` measured from the hip along the thigh (along=1)
  // or measured up from the ankle along the shin (along=2)
  const W = 120; // keep inside the leg's real bounds: the volume filter region follows the bbox
  let a, b, n;
  if (along === 1) { a = add2(J.hip, mul2(L.u1, from)); b = add2(J.hip, mul2(L.u1, to)); n = L.n1; }
  else { a = add2(J.ankle, mul2(L.u2, -from)); b = add2(J.ankle, mul2(L.u2, -to)); n = L.n2; }
  return `M${P(add2(a, mul2(n, -W)))} L${P(add2(a, mul2(n, W)))} L${P(add2(b, mul2(n, W)))} L${P(add2(b, mul2(n, -W)))} Z`;
}
function bandLine(J, L, d, along, wOut, wIn) {
  if (along === 1) { const a = add2(J.hip, mul2(L.u1, d)); return `M${P(add2(a, mul2(L.n1, wOut)))} L${P(add2(a, mul2(L.n1, -wIn)))}`; }
  const a = add2(J.ankle, mul2(L.u2, -d));
  return `M${P(add2(a, mul2(L.n2, wOut)))} L${P(add2(a, mul2(L.n2, -wIn)))}`;
}
function legBody(style, J, wOut, wIn, shade, dim) {
  const c = style.col;
  const Lb = bentLimb(J, wOut, wIn, 24);
  const id = S.uid('lg3');
  const shorts = style.shorts;
  let inner = '';
  if (shorts) {
    inner += S.path(band(J, Lb, -80, shorts, 1), { fill: c.pants });
    if (shade) inner += S.path(band(J, Lb, shorts, shorts + 18, 1), { fill: c.skinShade, opacity: 0.6 });
  }
  if (shade) inner += S.path(band(J, Lb, -60, 44, 1), { fill: c.pantsShade });
  if (style.socks) inner += S.path(band(J, Lb, -10, 34, 2), { fill: style.socks }) + S.path(bandLine(J, Lb, 22, 2, 80, 80), lineOnly(3, '#00000022'));
  if (style.cuffs) inner += S.path(band(J, Lb, -10, 40, 2), { fill: style.cuffs }) + S.path(bandLine(J, Lb, 20, 2, 80, 80), lineOnly(3.5, c.pantsShade));
  if (dim) inner += S.rect(-300, -300, 600, 700, 0, { fill: '#000', opacity: 0.25 });
  let o = S.clipDef(id, S.path(Lb.d)) + S.path(Lb.d, { fill: shorts ? c.skin : c.pants }) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  if (Lb.crease && !(shorts && shorts > 120)) o += S.path(Lb.crease, lineOnly(5));
  o += S.path(Lb.d, outline('none'));
  if (shorts) o += S.path(bandLine(J, Lb, shorts, 1, wOut[0] + 6, wIn[0] + 6), lineOnly(SW));
  if (style.socks) o += S.path(bandLine(J, Lb, 34, 2, wOut[2] + 2, wIn[2] + 2), lineOnly(5));
  if (style.cuffs) o += S.path(bandLine(J, Lb, 40, 2, wOut[2] + 4, wIn[2] + 4), lineOnly(5.5));
  const cid = S.uid('cuff3');
  const cut = S.clipDef(cid, S.el('rect', { x: -700, y: -1400, width: 1400, height: 1408, transform: `translate(${P(J.ankle)}) rotate(${f(J.foot)})` }));
  return cut + S.g(o, null, { 'clip-path': `url(#${cid})` });
}
const LIGHTS = ['#FFE14D', '#FF5FA2', '#4DE8FF'];
function shoe3(style, { x0, x1, back, dim, shade, toeCx, side }) {
  const c = style.col;
  const kind = style.shoe || 'sneaker';
  let s = '';
  if (kind === 'hightop') {
    const cx0 = side ? -52 : x0 + 2, cx1 = side ? 62 : x0 + 98;
    s += S.path(S.roundedPath([[cx0 + 4, -58], [cx1 - 4, -58], [cx1, 2], [cx0, 2]], 12), outline(dim ? (c.collarDim || c.toe) : (c.collar || c.toe)));
    s += S.path(`M${cx0 + 8} -50 L${cx1 - 8} -50`, lineOnly(6, '#FFFFFF')) + S.path(`M${(cx0 + cx1) / 2 - 16} -36 l32 14 M${(cx0 + cx1) / 2 + 16} -36 l-32 14`, lineOnly(5, '#FFFFFF'));
  }
  const soleD = S.roundedPath([[x0, -4], [x1, -4], [x1, 40], [x0, 40]], kind === 'loafer' ? 18 : 14);
  s += S.path(soleD, outline(dim ? c.soleShade : c.sole));
  if (c.soleBand) s += S.path(S.roundedPath([[x0 + 4, -1], [x1 - 4, -1], [x1 - 4, 14], [x0 + 4, 14]], 6), { fill: c.soleBand }) + S.path(soleD, outline('none'));
  if (shade) s += S.path(`M${x0 + 6} 30 L${x1 - 6} 30`, lineOnly(6, c.soleShade));
  if (kind === 'lightup') {
    const n = 3;
    for (let i = 0; i < n; i++) {
      const x = x0 + 22 + ((x1 - x0 - 44) * i) / (n - 1);
      s += S.circle(x, 28, 8, { fill: LIGHTS[i % 3], stroke: LINE, 'stroke-width': 3 }) + S.circle(x - 2, 26, 3, { fill: '#FFFFFF' });
    }
  }
  if (kind === 'loafer') {
    if (!back) s += S.path(`M${f(toeCx - 30)} 8 Q${f(toeCx)} -4 ${f(toeCx + 30)} 8`, lineOnly(5, c.soleShade));
  } else if (!back) {
    s += S.path(`M${f(toeCx - 42)} -2 A42 37 0 0 1 ${f(toeCx + 42)} -2 Z`, outline(c.toe));
    if (c.toe !== c.sole) s += S.path(`M${f(toeCx - 22)} -18 Q${f(toeCx)} -30 ${f(toeCx + 22)} -18`, lineOnly(4.5, '#fff'));
  }
  return s;
}
function makeLeg3(style) {
  return function leg({ shade = true, dim = false, toeShift = 0, back = false, J } = {}) {
    const straight = style.pantsShape === 'straight';
    let o = legBody(style, J, straight ? [42, 46, 54] : [42, 74, 103], [40, 40, 40], shade, dim);
    const x1 = straight ? 94 : 107;
    const s = shoe3(style, { x0: -44, x1, back, dim, shade, toeCx: (straight ? 24 : 30) + toeShift, side: false });
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}
function makeLegSide3(style) {
  const c = style.col;
  return function legSide({ shade = true, dim = false, J } = {}) {
    const straight = style.pantsShape === 'straight';
    let o = legBody(style, J, straight ? [62, 64, 68] : [64, 74, 85], straight ? [56, 58, 62] : [58, 69, 80], shade, dim);
    const s = shoe3({ ...style, col: { ...c, toe: c.toe === c.sole ? (dim ? c.soleShade : c.sole) : c.toe } }, { x0: -138, x1: 88, back: false, dim, shade, toeCx: -86, side: true });
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}

// ---------------------------------------------------------------- arms: striped sleeves, fingerless gloves
function makeArm3(style) {
  const c = style.col;
  return function arm({ shade = true, dim = false, view = 'front' } = {}) {
    const id = S.uid('arm3');
    const side = view === 'side';
    const d = side ? S.roundedPath([[-40, -20], [40, -20], [40, 248], [-40, 248]], 18) : S.roundedPath([[-30, -18], [30, -18], [40, 268], [-40, 268]], 17);
    const sleeveY = style.sleeve === 'long' ? (side ? 206 : 226) : style.sleeve === 'none' ? -40 : (side ? 100 : 112);
    const sc = c.sleeve || c.top;
    let inner = '';
    if (style.sleeve !== 'none') {
      inner += S.rect(-60, -40, 120, sleeveY + 40, 0, { fill: sc });
      if (style.sleevePattern) {
        let st = '';
        for (let y = -2; y < sleeveY - 10; y += 38) st += `M-60 ${y} h120 v17 h-120 Z `;
        inner += S.path(st, { fill: style.sleevePattern });
      }
      if (style.sleeve === 'long') inner += S.rect(-60, sleeveY - 18, 120, 18, 0, { fill: c.cuff || c.topShade || '#0003' }) + S.path(`M-60 ${sleeveY - 18} L60 ${sleeveY - 18}`, lineOnly(4.5));
    }
    if (style.gloves) {
      const g0 = side ? 176 : 198, g1 = side ? 232 : 254;
      inner += S.rect(-60, g0, 120, g1 - g0, 0, { fill: style.gloves.col }) + S.path(`M-60 ${g0} L60 ${g0} M-60 ${g1} L60 ${g1}`, lineOnly(4.5));
      if (style.gloves.trim) inner += S.rect(-60, g0 + 8, 120, 8, 0, { fill: style.gloves.trim });
    }
    if (shade) inner += S.rect(side ? 22 : 20, -40, 40, 330, 0, { fill: '#000', opacity: 0.07 });
    if (style.sleeve !== 'none') inner += S.path(`M-60 ${sleeveY} L60 ${sleeveY}`, lineOnly(SW));
    if (dim) inner += S.rect(-60, -40, 120, 330, 0, { fill: '#000', opacity: 0.14 });
    return S.clipDef(id, S.path(d)) + S.path(d, { fill: c.skin }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
  };
}

// ---------------------------------------------------------------- dino tail
function dinoTail(c, view, t = 0) {
  const sp = c.spike;
  if (view === 'side') {
    let o = '';
    for (const [x, y, h, a] of [[96, -350, 34, 30], [146, -318, 30, 50], [190, -280, 24, 66]]) o += spike(x, y, h, h * 0.7, a, sp, 5);
    return o + S.path('M40 -380 Q150 -380 236 -262 Q246 -246 228 -250 Q140 -300 40 -300 Z', outline(c.top));
  }
  if (view === 'back') {
    let o = S.path('M-46 -340 Q-40 -250 0 -170 Q8 -158 16 -170 Q40 -250 46 -340 Z', outline(c.top));
    for (const [y, h] of [[-300, 30], [-250, 26], [-206, 20]]) o += spike(0, y, h, h * 0.62, 0, sp, 5);
    return o;
  }
  const dir = t > 0.05 ? -1 : t < -0.05 ? 1 : -1;
  return S.g(S.path('M-40 -370 Q-150 -360 -214 -262 Q-222 -246 -204 -252 Q-130 -300 -40 -310 Z', outline(c.top)) + spike(-150, -338, 26, 18, -50, sp, 5), dir < 0 ? null : 'scale(-1 1)');
}

// ---------------------------------------------------------------- dress(): wrap a design so every view gets the extras
function resolveLike(style, face) {
  const fr = F.resolveFace(face);
  const name = typeof face === 'string' ? face : face && face.name;
  const explicitMouth = face && typeof face === 'object' && face.mouth;
  if ((!name || name === 'neutral') && !explicitMouth && style.neutralMouth) fr.mouth = style.neutralMouth;
  return fr;
}
// missing front tooth: [top, bottom] of the visible upper teeth for each mouth (mouth-local units)
const GAP = { grin: [-6, 2], bigGrin: [-9, 4], B: [-4, 3], C: [-6, 0], D: [-8, 0], H: [-6, -4], scream: [-30, -18], teeth: [-16, -1] };
function toothGap(mouth, m, sx, sy) {
  const g = GAP[mouth];
  if (!g) return '';
  return S.rect(m[0] + 3 * sx, m[1] + g[0] * sy, 15 * sx, (g[1] - g[0]) * sy, 2, { fill: C.mouth });
}
function bushyBrow(outer, inner, col) {
  const mid = [(inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2 - 12];
  const d = `M${P(outer)} Q${P(mid)} ${P(inner)}`;
  const tuft = `M${P(outer)} q${f((outer[0] - inner[0]) * 0.18)} 4 ${f((outer[0] - inner[0]) * 0.26)} 16`;
  return S.path(d + ' ' + tuft, lineOnly(32, LINE)) + S.path(d + ' ' + tuft, lineOnly(20, col)) + S.path(d, lineOnly(5, '#FFFFFF'));
}
function dress(d) {
  const st = d.style, c = st.col, a = st.acc || {};
  const H = L.HAIR[st.hair] || L.HAIR.none;
  if (st.shorts || st.socks || st.cuffs || st.shoe) { d.leg = makeLeg3(st); d.legSide = makeLegSide3(st); }
  if (st.gloves || st.sleevePattern) d.arm = makeArm3(st);
  if (TOPS3.includes(st.top) || st.tail) {
    const ts0 = d.torsoSide, t0 = d.torso;
    d.torsoSide = (shade) => {
      let o = st.tail ? dinoTail(c, 'side') : '';
      o += ts0(shade);
      const add = outfitSide3(st);
      if (add) { const id = S.uid('ts3'); o += S.clipDef(id, S.path(SIDE_TD)) + S.g(add, null, { 'clip-path': `url(#${id})` }) + S.path(SIDE_TD, outline('none')); }
      if (st.top === 'sweaterVest') o += S.path('M-62 -516 L-96 -536 L-96 -500 Z', outline(c.bow || '#3FA34D', 4.5)) + S.circle(-66, -516, 9, outline(c.bow || '#3FA34D', 4.5));
      return o;
    };
    if (st.tail) d.torso = (t, shade, back = false) => (back ? t0(t, shade, back) + dinoTail(c, 'back') : dinoTail(c, 'front', t) + t0(t, shade, back));
  }
  const h0 = d.head, hs0 = d.headSide, hb0 = d.headBack;
  if (a.bushyBrows || a.toothGap) {
    d.head = (face, t, shade) => {
      let o = h0(face, t, shade);
      const fr = resolveLike(st, face);
      const m = hm(t);
      if (a.bushyBrows) {
        const by = H.browY ?? -790, base = st.browBase || {};
        for (const sx of [-1, 1]) {
          const k = sx < 0 ? 'L' : 'R', b = fr.brows[k] || [0, 0], bb = base[k] || [0, 0];
          o += bushyBrow(m.feat([sx * 104, by + 8 + b[1] + bb[1]]), m.feat([sx * 14, by + b[0] + bb[0]]), a.bushyBrows);
        }
      }
      if (a.toothGap) o += toothGap(fr.mouth, m.feat([0, -598]), 1 - 0.15 * m.at, 1);
      return o;
    };
  }
  if (a.specs || a.headset3 || a.pearls || a.bushyBrows || a.toothGap) {
    d.headSide = (face, shade) => {
      let o = hs0(face, shade);
      const fr = resolveLike(st, face);
      if (a.specs) o += specsSide(a.specs);
      if (a.headset3) o += headsetSide(a.headset3);
      if (a.pearls) o += pearl(36, -612);
      if (a.bushyBrows) {
        const by = H.browY ?? -790, b = fr.brows.L || [0, 0], bb = (st.browBase || {}).L || [0, 0];
        o += bushyBrow([-74, by + 8 + b[1] + bb[1]], [-168, by + b[0] + bb[0]], a.bushyBrows);
      }
      if (a.toothGap) o += toothGap(fr.mouth, [-132, -600], 0.55, 1);
      return o;
    };
  }
  if (c.beard || a.headset3 || a.pearls) {
    d.headBack = (face, shade) => {
      let o = (c.beard ? beardBack(c) : '') + (a.pearls ? pearl(-150, -612) + pearl(150, -612) : '') + hb0(face, shade);
      if (a.headset3) o += headsetBack(a.headset3);
      return o;
    };
  }
  return d;
}

// ---------------------------------------------------------------- props
// Grandpa's ring of a hundred keys, in BODY space: hangs from (x, y) (default: his right hip, front view).
// swing: degrees of jingle; gold: highlight the golden key (true) or hide it (false).
function keyRing({ x = 74, y = -322, s = 1, swing = 0, gold = true, n = 9 } = {}) {
  let o = S.path('M0 -16 L0 6', lineOnly(7, '#7A5A3A'));
  const R = 22;
  let keys = '';
  for (let i = 0; i < n; i++) {
    const a = (-60 + (120 * i) / (n - 1)) * Math.PI / 180;
    const bx = Math.sin(a) * R, by = 28 + Math.cos(a) * R;
    const isGold = gold && i === Math.floor(n / 2) + 1;
    const col = isGold ? '#FFC93C' : ['#C9CED8', '#B7A27A', '#A9B4C2'][i % 3];
    const len = 46 + (i % 3) * 8;
    const k = S.circle(0, 0, 9, outline(col, 4)) + S.circle(0, 0, 3, { fill: LINE }) + S.rect(-4, 8, 8, len, 2, outline(col, 4)) + S.rect(3, 8 + len - 18, 9, 6, 1, outline(col, 3)) + S.rect(3, 8 + len - 8, 7, 6, 1, outline(col, 3));
    keys += S.g(k, `translate(${f(bx)} ${f(by)}) rotate(${f((a * 180) / Math.PI * -0.9)})`);
  }
  o += keys + S.circle(0, 28, R, { fill: 'none', stroke: LINE, 'stroke-width': 9 }) + S.circle(0, 28, R, { fill: 'none', stroke: '#C9CED8', 'stroke-width': 4 });
  if (gold) o += S.path(F.starPath(14, 92, 9), { fill: '#FFF6C0', opacity: 0.9 });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(swing)}) scale(${f(s)})`);
}
// Grandpa's mop / walking stick. Stands with its head on the floor at (x, y); body units; rot tilts it.
function mop({ x = 0, y = 0, s = 1, rot = 0, len = 760, bow = false } = {}) {
  let o = S.rect(-11, -len, 22, len - 30, 8, outline('#B07A45', 6)) + S.path(`M-3 ${-len + 20} L-3 -60`, lineOnly(4, '#D9A36A'));
  o += S.rect(-46, -54, 92, 30, 10, outline('#5B8DEF', 6));
  let strands = '';
  for (let i = -5; i <= 5; i++) strands += `M${i * 9} -28 Q${i * 13 + 4} -6 ${i * 16} 6 `;
  o += S.path(strands, lineOnly(16, LINE)) + S.path(strands, lineOnly(9, '#EDE6D6'));
  if (bow) o += S.path(`M0 ${-len + 60} l-34 -20 l0 40 Z M0 ${-len + 60} l34 -20 l0 40 Z`, outline('#FF5FA2', 5)) + S.circle(0, -len + 60, 9, outline('#FF5FA2', 5));
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}

module.exports = { dress, keyRing, mop, pencil, sticker, puffs, fluffy, TOPS3, outfit3, makeLeg3, makeLegSide3, makeArm3 };
