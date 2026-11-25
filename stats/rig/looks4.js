// Looks for the "What If You Had ADMIN COMMANDS in Real Life?" cast: new hair styles (registered into L.HAIR),
// head accessories (office headset, glasses chain, block brows, droopy brows, long beard), a parameterised
// torso / arm / leg set (width, tops, skirts and robes that fall over the legs, fists, bell sleeves, track
// stripes, duck pyjamas, slippers...), the ADMIN's light head / crown / cape / aura, and props
// (Zoe's sticker laptop, Mom's sticky notes, Principal Pratt's mug, Granny's fire trail).
//
// dress4(design) swaps a makeDesign() design's body parts for the looks4 ones and adds the accessories to every view.
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const L = require('./looks');
const L2 = require('./looks2');
const L3 = require('./looks3');
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
const { puffs, fluffy } = L3;
const clipped = (d, fill, inner, w = SW) => {
  const id = S.uid('l4');
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
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
// little curl strokes on a cluster of puffs
const curlMarks = (pts, r, w = 4.5, col = LINE) => S.path(pts.map(([x, y, , k = 1]) => `M${f(x - r * 0.42 * k)} ${f(y + 3)} Q${f(x)} ${f(y - r * 0.55 * k)} ${f(x + r * 0.4 * k)} ${f(y + 5)}`).join(' '), lineOnly(w, col));

// ====================================================================== HAIR
Object.assign(L.HAIR, {
  // Zoe: chin-length purple bob, blunt bangs, a yellow lightning clip
  zoeBob: {
    browY: -786, nametagY: -1100,
    behind(hair, feat, c) {
      return S.path(mapPoly(hair, [[-172, -880], [172, -880], [186, -680], [204, -606], [170, -596], [-170, -596], [-204, -606], [-186, -680]], 22), outline(c.hair));
    },
    front(hair, feat) {
      const outer = [[-172, -618], [-182, -720], [-184, -812], [-166, -904], [-112, -962], [-30, -982], [40, -980], [116, -958], [168, -900], [186, -812], [184, -720], [176, -626], [204, -604], [168, -594], [140, -606], [136, -796]];
      const fringe = [[124, -818], [100, -806], [84, -822], [34, -824], [18, -808], [2, -824], [-46, -824], [-62, -806], [-78, -822], [-124, -818], [-136, -796], [-140, -606], [-168, -594], [-204, -604]];
      return poly([...outer.map(hair), ...fringe.map((p) => (Math.abs(p[0]) > 138 ? hair(p) : feat(p)))], 10);
    },
    details(hair, feat, c, shade) {
      let o = '';
      if (shade) o += S.path(`M${P(hair([-146, -900]))} Q${P(hair([-60, -972]))} ${P(hair([50, -968]))}`, lineOnly(15, c.hairHi)) + S.rect(-260, -644, 520, 50, 0, { fill: c.hairShade });
      let d = '';
      for (const x of [-100, -30, 60]) d += `M${P(feat([x, -826]))} Q${P(hair([x * 0.9 + 10, -880]))} ${P(hair([x * 0.6 + 20, -950]))} `;
      d += `M${P(hair([-156, -860]))} Q${P(hair([-172, -740]))} ${P(hair([-160, -640]))} M${P(hair([156, -860]))} Q${P(hair([172, -740]))} ${P(hair([160, -640]))}`;
      d += `M${P(hair([10, -982]))} Q${P(hair([0, -930]))} ${P(feat([-20, -870]))}`;
      return o + S.path(d, lineOnly(4.5));
    },
    over(hair, feat, c) {
      const p = hair([-150, -868]);
      const bolt = 'M6 -30 L-16 4 L-2 4 L-8 30 L18 -6 L4 -6 Z';
      return S.path(bolt, { ...outline(c.clip || '#FFD23F', 5), transform: `translate(${P(p)}) rotate(-20)` });
    },
    side: () => poly([[-192, -808], [-178, -902], [-98, -970], [30, -984], [136, -936], [176, -830], [184, -700], [178, -626], [206, -600], [160, -590], [40, -592], [12, -640], [2, -762], [-28, -806], [-120, -818]], 16),
    sideOver(c) {
      return S.path('M40 -976 Q110 -880 120 -650 M-120 -900 Q-40 -940 40 -976', lineOnly(4.5)) +
        S.path('M-6 -800 L-28 -766 L-18 -766 L-22 -740 L-4 -772 L-14 -772 Z', outline(c.clip || '#FFD23F', 4));
    },
    back: () => poly([[-184, -700], [-186, -830], [-150, -930], [-70, -976], [70, -976], [150, -930], [186, -830], [184, -700], [178, -626], [206, -602], [160, -590], [0, -588], [-160, -590], [-206, -602], [-178, -626]], 18),
    backOver: () => S.path('M-120 -920 Q-150 -780 -140 -620 M0 -970 L0 -600 M120 -920 Q150 -780 140 -620', lineOnly(4.5)),
  },

  // Brick: backwards trucker cap (mesh rear panels face us, snap strap over the forehead), buzz cut underneath
  truckerBack: {
    browY: -772, nametagY: -1120, fill: 'cap',
    behind(hair, feat, c) {
      let o = S.path(mapPoly(hair, [[-160, -846], [160, -846], [164, -742], [146, -730], [-146, -730], [-164, -742]], 18), outline(c.hair));
      const at = Math.abs(hair([100, 0])[0] - hair([-100, 0])[0] - 200) / 9, dir = hair([0, 0])[0] >= 0 ? 1 : -1;
      if (at > 0.05) { const k = Math.min(1, at * 1.6), v = hair([-dir * 150 * k, -846]); o += S.ellipse(v[0] - dir * 30 * k, v[1], 40 + 70 * k, 20, outline(c.capBrim)); }
      return o;
    },
    front: (hair) => mapPoly(hair, [[-168, -836], [-170, -902], [-146, -978], [-76, -1028], [0, -1038], [76, -1028], [146, -978], [170, -902], [168, -836]], 30),
    details(hair, feat, c, shade) {
      // mesh: rows of little holes (one path)
      let d = '';
      for (let r = 0; r < 5; r++) for (let i = -6; i <= 6; i++) {
        const p = hair([i * 26 + (r % 2) * 13, -870 - r * 26]);
        d += `M${f(p[0] - 4.5)} ${f(p[1])} a4.5 4.5 0 1 0 9 0 a4.5 4.5 0 1 0 -9 0 Z `;
      }
      let o = S.path(d, { fill: c.capShade });
      o += S.path(`M${P(hair([0, -1036]))} Q${P(hair([-80, -960]))} ${P(hair([-86, -836]))} M${P(hair([0, -1036]))} Q${P(hair([80, -960]))} ${P(hair([86, -836]))}`, lineOnly(4.5, c.capShade));
      if (shade) o += S.path(`M${P(hair([-140, -940]))} Q${P(hair([-90, -1014]))} ${P(hair([-10, -1026]))}`, lineOnly(15, c.capHi));
      return o;
    },
    over(hair, feat, c) {
      let o = S.path(mapPoly(hair, [[-170, -866], [170, -866], [170, -832], [-170, -832]], 8), outline(c.capBand || c.capShade));
      const m = feat([0, -834]);
      o += S.path(`M${f(m[0] - 52)} ${f(m[1] + 2)} A52 52 0 0 1 ${f(m[0] + 52)} ${f(m[1] + 2)} Z`, outline(c.hair, 6));
      o += S.path(`M${f(m[0] - 30)} ${f(m[1] - 6)} l10 -26 M${f(m[0] - 4)} ${f(m[1] - 6)} l6 -30 M${f(m[0] + 22)} ${f(m[1] - 6)} l2 -28`, lineOnly(4.5, c.hairShade));
      // plastic snap strap with holes
      o += S.rect(m[0] - 56, m[1] - 30, 112, 16, 6, outline(c.strap || '#2A2A33', 4.5));
      for (let i = 0; i < 5; i++) o += S.circle(m[0] - 38 + i * 19, m[1] - 22, 3.2, { fill: '#8A8A99' });
      const t = hair([0, -1036]);
      o += S.circle(t[0], t[1], 12, outline(c.capFront, 5));
      return o;
    },
    side: () => poly([[-172, -838], [-168, -910], [-118, -994], [0, -1036], [112, -1006], [164, -934], [172, -838]], 26),
    sideOver(c) {
      let o = S.path(poly([[-20, -842], [74, -842], [74, -740], [0, -752]], 12), outline(c.hair));
      o += clipped(poly([[20, -838], [12, -1000], [112, -1006], [164, -934], [172, -838]], 22), c.capFront, S.path('M30 -990 Q100 -1000 150 -930', lineOnly(12, '#FFFFFF44')));
      o += S.path(poly([[-172, -868], [172, -868], [172, -834], [-172, -834]], 8), outline(c.capBand || c.capShade));
      o += S.path(poly([[150, -870], [290, -866], [300, -848], [282, -836], [150, -836]], 10), outline(c.capBrim));
      o += S.circle(0, -1036, 11, outline(c.capFront, 5));
      return o;
    },
    back: () => poly([[-168, -836], [-170, -902], [-146, -978], [-76, -1028], [0, -1038], [76, -1028], [146, -978], [170, -902], [168, -836]], 30),
    backOver(c) {
      let o = clipped(poly([[-168, -836], [-170, -902], [-146, -978], [-76, -1028], [0, -1038], [76, -1028], [146, -978], [170, -902], [168, -836]], 30), c.capFront,
        S.path('M-140 -940 Q-90 -1014 -10 -1026', lineOnly(15, '#FFFFFF44')) + S.path('M0 -1036 Q-80 -960 -86 -836 M0 -1036 Q80 -960 86 -836', lineOnly(4.5, '#00000033')));
      o += brickLogo(0, -930, 1);
      o += S.path(poly([[-170, -866], [170, -866], [170, -832], [-170, -832]], 8), outline(c.capBand || c.capShade));
      o += S.ellipse(0, -824, 186, 30, outline(c.capBrim)) + S.ellipse(0, -830, 156, 13, { fill: '#000', opacity: 0.14 });
      o += S.circle(0, -1036, 12, outline(c.capFront, 5));
      return o;
    },
  },

  // Dad: shiny dome, short neat dark hair at the sides and back, one brave curl on top
  dadDome: {
    browY: -792, nametagY: -1040,
    behind(hair, feat, c) {
      let o = '';
      for (const sx of [-1, 1]) {
        const pts = [[136, -850], [156, -842], [166, -790], [162, -720], [148, -690], [136, -700]].map(([x, y]) => hair([sx * x, y]));
        o += S.path(poly(sx < 0 ? pts.reverse() : pts, 10), outline(c.hair));
      }
      return o;
    },
    front: () => null,
    over(hair, feat, c) {
      const sh = hair([-60, -862]);
      let o = S.ellipse(sh[0], sh[1], 44, 14, { fill: '#FFFFFF', opacity: 0.7, transform: `rotate(-12 ${P(sh)})` });
      o += S.circle(sh[0] + 52, sh[1] - 4, 6, { fill: '#FFFFFF', opacity: 0.7 });
      const p = hair([18, -888]);
      o += S.path(`M${f(p[0] - 6)} ${f(p[1] + 4)} Q${f(p[0] - 10)} ${f(p[1] - 44)} ${f(p[0] + 22)} ${f(p[1] - 40)} Q${f(p[0] + 34)} ${f(p[1] - 22)} ${f(p[0] + 14)} ${f(p[1] - 18)}`, lineOnly(13, LINE)) +
        S.path(`M${f(p[0] - 6)} ${f(p[1] + 4)} Q${f(p[0] - 10)} ${f(p[1] - 44)} ${f(p[0] + 22)} ${f(p[1] - 40)} Q${f(p[0] + 34)} ${f(p[1] - 22)} ${f(p[0] + 14)} ${f(p[1] - 18)}`, lineOnly(6, c.hair));
      return o;
    },
    side: () => null,
    sideOver(c) {
      let o = S.path(poly([[10, -842], [130, -858], [162, -800], [158, -700], [120, -676], [44, -690], [26, -760]], 16), outline(c.hair));
      o += S.ellipse(-70, -864, 40, 13, { fill: '#FFFFFF', opacity: 0.7, transform: 'rotate(-10 -70 -864)' });
      o += S.path('M-16 -884 Q-24 -930 8 -928 Q20 -912 0 -906', lineOnly(13, LINE)) + S.path('M-16 -884 Q-24 -930 8 -928 Q20 -912 0 -906', lineOnly(6, c.hair));
      return o;
    },
    back: () => null,
    backOver(c) {
      let o = S.path(poly([[-160, -846], [160, -846], [166, -720], [110, -684], [0, -676], [-110, -684], [-166, -720]], 30), outline(c.hair));
      o += S.path('M-100 -820 q10 30 0 60 M0 -820 q10 30 0 60 M100 -820 q10 30 0 60', lineOnly(4, c.hairShade));
      o += S.ellipse(-40, -868, 46, 13, { fill: '#FFFFFF', opacity: 0.6 });
      return o;
    },
  },

  // Mom: sleek centre-parted hair, high neat ponytail with a scrunchie
  ponyNeat: {
    browY: -800, nametagY: -1130,
    behind(hair, feat, c, shade) {
      const pts = [[70, -990], [150, -1040], [228, -1002], [262, -912], [258, -808], [232, -720], [246, -650], [204, -688], [194, -770], [204, -868], [176, -936], [104, -958]].map(hair);
      let o = S.path(poly(pts, 22), outline(c.hair));
      o += S.path(`M${P(hair([170, -1000]))} Q${P(hair([238, -940]))} ${P(hair([228, -760]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([150, -1024]))} Q${P(hair([220, -1000]))} ${P(hair([244, -920]))}`, lineOnly(11, c.hairHi));
      const b = hair([104, -984]);
      o += puffs([[b[0] - 18, b[1] + 8, 24], [b[0] + 4, b[1] - 10, 26], [b[0] + 22, b[1] + 12, 22]], c.accent);
      return o;
    },
    front(hair, feat) {
      const outer = [[-160, -716], [-166, -860], [-112, -958], [0, -986], [112, -958], [166, -860], [160, -716], [136, -726], [134, -800]];
      const inner = [[112, -836], [54, -870], [0, -878], [-54, -870], [-112, -836], [-134, -800], [-136, -726]];
      return poly([...outer.map(hair), ...inner.map(feat)], 16);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([0, -878]))} L${P(hair([0, -986]))} M${P(feat([-60, -866]))} Q${P(hair([-120, -890]))} ${P(hair([-150, -760]))} M${P(feat([60, -866]))} Q${P(hair([120, -890]))} ${P(hair([150, -760]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-124, -920]))} Q${P(hair([-74, -968]))} ${P(hair([-14, -978]))} M${P(hair([20, -978]))} Q${P(hair([80, -968]))} ${P(hair([126, -922]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-176, -804], [-150, -930], [-40, -984], [90, -966], [160, -890], [166, -744], [120, -724], [64, -780], [-90, -834], [-140, -826]], 22),
    sideBehind(c) {
      return S.path(poly([[90, -990], [190, -1010], [262, -930], [270, -800], [248, -700], [262, -630], [216, -664], [204, -760], [190, -890], [120, -940]], 22), outline(c.hair)) +
        puffs([[110, -990, 26], [132, -1010, 24], [136, -972, 22]], c.accent);
    },
    back: () => poly([[-162, -720], [-166, -870], [-96, -970], [96, -970], [166, -870], [162, -720], [80, -704], [0, -712], [-80, -704]], 28),
    backOver(c) {
      let o = S.path('M-120 -730 Q-80 -880 -20 -960 M120 -730 Q80 -880 20 -960', lineOnly(4.5));
      o += S.path(poly([[-34, -990], [34, -990], [44, -820], [30, -660], [0, -620], [-30, -660], [-44, -820]], 22), outline(c.hair));
      o += S.path('M0 -960 L0 -650', lineOnly(4.5)) + puffs([[-22, -992, 24], [0, -1010, 26], [22, -992, 24]], c.accent);
      return o;
    },
  },

  // Granny: fluffy white curls all around
  granCurls: {
    browY: -800, nametagY: -1120,
    behind(hair, feat, c, shade) {
      const cs = [[-150, -880, 58], [-104, -958, 60], [-36, -996, 60], [36, -996, 60], [104, -958, 60], [150, -880, 58], [-170, -800, 50], [170, -800, 50], [-166, -726, 42], [166, -726, 42]];
      const q = cs.map(([x, y, r]) => [...hair([x, y]), r]);
      return puffs(q, c.hair) + curlMarks(q.filter((_, i) => i % 2 === 0), 50, 4.5, c.hairShade);
    },
    front: () => null,
    over(hair, feat, c, style) {
      const cs = [[-118, -866, 34], [-62, -886, 36], [0, -894, 36], [62, -886, 36], [118, -866, 34], [-144, -820, 28], [144, -820, 28]];
      const q = cs.map(([x, y, r]) => [...(Math.abs(x) > 130 ? hair([x, y]) : feat([x, y])), r]);
      let o = puffs(q, c.hair) + curlMarks(q, 34, 4.5, c.hairShade);
      const hi = feat([-70, -900]);
      o += S.path(`M${f(hi[0] - 20)} ${f(hi[1])} Q${f(hi[0])} ${f(hi[1] - 16)} ${f(hi[0] + 22)} ${f(hi[1] - 6)}`, lineOnly(8, '#FFFFFF'));
      return o;
    },
    side: () => null,
    sideOver(c) {
      const cs = [[-156, -864, 30], [-150, -820, 26], [-112, -920, 44], [-50, -970, 56], [40, -984, 58], [120, -940, 56], [166, -860, 50], [170, -770, 44], [150, -700, 36], [104, -772, 40]];
      return puffs(cs, c.hair) + curlMarks(cs, 44, 4.5, c.hairShade);
    },
    back: () => null,
    backOver(c) {
      const cs = [[-150, -880, 58], [-96, -962, 60], [-28, -998, 60], [44, -996, 60], [106, -956, 60], [152, -880, 58], [-172, -790, 50], [172, -790, 50], [-124, -726, 48], [-42, -712, 50], [40, -716, 50], [122, -728, 48], [-10, -830, 72], [-96, -842, 60], [92, -826, 60], [-50, -910, 64], [50, -906, 64], [0, -760, 64], [-90, -770, 56], [90, -766, 56]];
      return puffs(cs, c.hair) + curlMarks([cs[0], cs[2], cs[5], cs[7], cs[9], cs[11]], 44, 4.5, c.hairShade) + S.path('M-120 -800 q18 -14 36 -4 M60 -760 q16 -12 30 0', lineOnly(4, c.hairShade));
    },
  },

  // Granny at speed: the curls blown back into a streaming cloud
  granCurlsFast: {
    browY: -800, nametagY: -1140,
    behind(hair, feat, c) {
      const cs = [[-160, -900, 50], [-120, -990, 56], [-40, -1040, 62], [50, -1046, 62], [130, -1000, 58], [176, -920, 52], [-176, -820, 40], [186, -830, 42], [196, -1090, 40], [-80, -1100, 44], [40, -1120, 46], [124, -1110, 38]];
      const q = cs.map(([x, y, r]) => [...hair([x, y]), r]);
      let o = puffs(q, c.hair) + curlMarks(q.filter((_, i) => i % 3 === 0), 50, 4.5, c.hairShade);
      o += S.path(`M${P(hair([-200, -1060]))} l-60 -40 M${P(hair([220, -1040]))} l60 -50 M${P(hair([0, -1150]))} l0 -60`, lineOnly(8, '#FFFFFF')) +
        S.path(`M${P(hair([-200, -1060]))} l-60 -40 M${P(hair([220, -1040]))} l60 -50 M${P(hair([0, -1150]))} l0 -60`, { ...lineOnly(3, c.hairShade) });
      return o;
    },
    front: () => null,
    over(hair, feat, c) {
      const cs = [[-110, -880, 30], [-52, -896, 32], [8, -902, 32], [66, -894, 32], [120, -876, 30]];
      const q = cs.map(([x, y, r]) => [...feat([x, y]), r]);
      return puffs(q, c.hair) + curlMarks(q, 30, 4, c.hairShade);
    },
    side: () => null,
    sideOver(c) {
      // curls stream far behind (character faces screen-left, wind blows them to the right)
      const cs = [[-150, -846, 30], [-100, -916, 42], [-30, -966, 50], [60, -980, 54], [150, -950, 56], [240, -920, 52], [320, -900, 44], [390, -888, 36], [170, -850, 50], [250, -840, 42], [320, -836, 34], [120, -780, 40], [200, -770, 32]];
      let o = puffs(cs, c.hair) + curlMarks(cs.filter((_, i) => i % 2 === 0), 44, 4.5, c.hairShade);
      o += S.path('M440 -900 L540 -904 M420 -840 L500 -838 M380 -780 L450 -776', lineOnly(8, '#FFFFFF')) + S.path('M440 -900 L540 -904 M420 -840 L500 -838 M380 -780 L450 -776', lineOnly(3, c.hairShade));
      return o;
    },
    back: () => null,
    backOver(c) {
      const cs = [[-150, -900, 56], [-100, -990, 60], [-30, -1040, 62], [40, -1050, 62], [110, -1000, 58], [156, -900, 56], [0, -860, 74], [-100, -840, 58], [100, -840, 58], [-50, -1110, 46], [50, -1120, 46]];
      return puffs(cs, c.hair) + curlMarks(cs.filter((_, i) => i % 2 === 0), 50, 4.5, c.hairShade);
    },
  },

  // the old man: bald dome, flyaway white wisps standing out at the sides, three wisps on top
  wispy: {
    browY: -790, nametagY: -1080,
    behind(hair, feat, c) {
      let o = '';
      for (const sx of [-1, 1]) {
        const raw = [[132, -862, 0], [176, -896, 8], [176, -862, 0], [226, -870, 8], [204, -832, 0], [244, -810, 8], [206, -790, 0], [236, -750, 8], [192, -748, 0], [206, -708, 6], [160, -716, 0], [134, -728, 0]];
        let q = raw.map(([x, y, b]) => [...hair([sx * x, y]), b]);
        if (sx < 0) { q = q.slice().reverse(); q = q.map((p, i) => [p[0], p[1], q[(i + 1) % q.length][2]]); }
        o += S.path(fluffy(q), outline(c.hair)) + S.path(`M${P(hair([sx * 150, -840]))} q${sx * 24} -2 ${sx * 40} -18 M${P(hair([sx * 150, -780]))} q${sx * 24} 0 ${sx * 40} -10`, lineOnly(4, c.hairShade));
      }
      return o;
    },
    front: () => null,
    over(hair, feat, c) {
      const sh = hair([-54, -860]);
      let o = S.ellipse(sh[0], sh[1], 40, 13, { fill: '#FFFFFF', opacity: 0.75, transform: `rotate(-12 ${P(sh)})` });
      const w = (x0, h, k) => { const p = hair([x0, -888]); return `M${P(p)} C${f(p[0] - 6 * k)} ${f(p[1] - h * 0.5)} ${f(p[0] + 24 * k)} ${f(p[1] - h)} ${f(p[0] + 8 * k)} ${f(p[1] - h * 1.1)} Q${f(p[0] - 10 * k)} ${f(p[1] - h * 1.05)} ${f(p[0] - 4 * k)} ${f(p[1] - h * 0.86)}`; };
      const d = w(-30, 64, 1) + ' ' + w(4, 84, -1) + ' ' + w(36, 58, 1);
      o += S.path(d, lineOnly(13, LINE)) + S.path(d, lineOnly(6, c.hair));
      return o;
    },
    side: () => null,
    sideOver(c) {
      let o = '';
      if (c.longBeard) o += beardLongSide(c);
      o += S.path(fluffy([[20, -834, 6], [100, -868, 8], [150, -900, 0], [160, -862, 0], [214, -868, 8], [196, -830, 0], [236, -810, 8], [200, -790, 0], [228, -748, 8], [186, -748, 0], [196, -706, 6], [140, -696, 6], [60, -712, 6], [24, -770, 0]]), outline(c.hair));
      o += S.path('M80 -820 q20 -6 40 -24 M100 -760 q20 -2 40 -16', lineOnly(4, c.hairShade));
      o += S.ellipse(-60, -862, 38, 12, { fill: '#FFFFFF', opacity: 0.75, transform: 'rotate(-10 -60 -862)' });
      const d = 'M-10 -884 C-16 -930 14 -964 -2 -978 Q-20 -972 -14 -950 M26 -880 C30 -920 60 -930 46 -946';
      o += S.path(d, lineOnly(13, LINE)) + S.path(d, lineOnly(6, c.hair));
      return o;
    },
    back: () => null,
    backOver(c) {
      let o = S.path(fluffy([[-146, -812, 8], [-70, -800, 8], [0, -796, 8], [70, -800, 8], [146, -812, 0], [176, -826, 0], [166, -790, 0], [184, -756, 0], [160, -730, 0], [170, -690, 0], [150, -650, 0], [150, -610, 0], [110, -590, 0], [70, -604, 0], [36, -586, 0], [0, -602, 0], [-36, -586, 0], [-70, -604, 0], [-110, -590, 0], [-150, -610, 0], [-150, -650, 0], [-170, -690, 0], [-160, -730, 0], [-184, -756, 0], [-166, -790, 0], [-176, -826, 0]]), outline(c.hair));
      o += S.path('M-110 -770 q12 30 2 70 M-40 -770 q12 40 2 90 M40 -770 q12 40 2 90 M110 -770 q12 30 2 70', lineOnly(4, c.hairShade));
      const d = 'M-20 -888 C-26 -940 4 -960 -12 -980 M24 -886 C28 -930 58 -936 44 -952';
      o += S.path(d, lineOnly(13, LINE)) + S.path(d, lineOnly(6, c.hair));
      return o;
    },
  },

  // Rex Ratings: tall glossy pompadour with a silver streak
  pompadour: {
    browY: -800, nametagY: -1180,
    front(hair, feat) {
      const outer = [[-150, -790], [-162, -880], [-156, -960], [-104, -1040], [-10, -1094], [100, -1100], [178, -1056], [194, -1000], [164, -970], [162, -880], [152, -790], [134, -798], [128, -856]];
      const line = [[80, -874], [20, -884], [-50, -880], [-110, -852], [-134, -796]];
      return poly([...outer.map(hair), ...line.map(feat)], 14);
    },
    details(hair, feat, c, shade) {
      let o = '';
      o += S.path(`M${P(feat([-110, -852]))} Q${P(hair([-110, -1000]))} ${P(hair([60, -1080]))} M${P(feat([-30, -882]))} Q${P(hair([-10, -990]))} ${P(hair([150, -1050]))} M${P(feat([50, -880]))} Q${P(hair([90, -960]))} ${P(hair([180, -1000]))}`, lineOnly(4.5));
      o += S.path(`M${P(feat([-70, -868]))} Q${P(hair([-70, -1000]))} ${P(hair([90, -1074]))}`, lineOnly(16, c.hairStreak));
      if (shade) o += S.path(`M${P(hair([-140, -950]))} Q${P(hair([-90, -1030]))} ${P(hair([-10, -1070]))}`, lineOnly(14, c.hairHi)) + S.ellipse(...hair([30, -1060]), 26, 9, { fill: '#FFFFFF', opacity: 0.85, transform: `rotate(-14 ${P(hair([30, -1060]))})` });
      return o;
    },
    side: () => poly([[-196, -906], [-206, -990], [-140, -1074], [0, -1100], [120, -1060], [164, -960], [160, -780], [110, -770], [80, -856], [-100, -872], [-160, -868]], 22),
    sideOver(c) {
      return S.path('M-150 -900 Q-120 -1040 40 -1084 M-60 -872 Q-40 -990 100 -1060', lineOnly(4.5)) + S.path('M-110 -890 Q-80 -1020 60 -1070', lineOnly(14, c.hairStreak)) + S.ellipse(-60, -1060, 26, 9, { fill: '#FFFFFF', opacity: 0.85, transform: 'rotate(-20 -60 -1060)' });
    },
    back: () => poly([[-152, -772], [-162, -890], [-114, -1010], [0, -1066], [114, -1010], [162, -890], [152, -772], [0, -752]], 26),
    backOver: () => S.path('M-100 -1000 Q-40 -880 -60 -790 M40 -1040 Q60 -900 40 -770', lineOnly(4.5)),
  },

  // Mr. Gray: flat grey side part, receding temples
  grayPart: {
    browY: -796, nametagY: -1060,
    front(hair, feat) {
      const outer = [[-148, -786], [-156, -880], [-110, -952], [-10, -972], [100, -960], [154, -900], [150, -786], [134, -792], [126, -860]];
      const line = [[96, -884], [40, -872], [-10, -890], [-50, -900], [-90, -868], [-130, -840], [-134, -792]];
      return poly([...outer.map(hair), ...line.map(feat)], 12);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-50, -900]))} Q${P(hair([-60, -940]))} ${P(hair([-56, -968]))}`, lineOnly(5));
      o += S.path(`M${P(hair([-30, -950]))} Q${P(hair([60, -950]))} ${P(hair([140, -900]))} M${P(hair([-90, -930]))} Q${P(hair([-120, -900]))} ${P(hair([-140, -830]))}`, lineOnly(4, c.hairShade));
      if (shade) o += S.path(`M${P(hair([10, -960]))} Q${P(hair([80, -950]))} ${P(hair([130, -906]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-150, -880], [-120, -940], [-20, -970], [90, -956], [154, -896], [158, -784], [110, -770], [80, -850], [-110, -884]], 16),
    back: () => poly([[-154, -760], [-158, -880], [-100, -962], [100, -962], [158, -880], [154, -760], [80, -742], [0, -750], [-80, -742]], 24),
  },

  // Principal Pratt: severe flat-top crew cut
  flatTop: {
    browY: -800, nametagY: -1120,
    front(hair, feat) {
      const outer = [[-150, -804], [-158, -930], [-152, -1036], [152, -1036], [158, -930], [150, -804], [134, -810], [128, -866]];
      const line = [[96, -876], [-96, -876], [-128, -866], [-134, -810]];
      return poly([...outer.map(hair), ...line.map(feat)], 10);
    },
    details(hair, feat, c, shade) {
      let d = '';
      for (let x = -130; x <= 130; x += 20) d += `M${P(hair([x, -1030]))} L${P(hair([x, -1008]))} `;
      let o = S.path(d, lineOnly(4, c.hairShade));
      if (shade) o += S.rect(-200, -1060, 400, 30, 0, { fill: c.hairHi, opacity: 0.8 }) + S.path(`M${P(hair([-150, -980]))} L${P(hair([-150, -880]))}`, lineOnly(12, c.hairShade));
      return o;
    },
    side: () => poly([[-160, -870], [-170, -1036], [150, -1036], [160, -900], [158, -790], [110, -780], [80, -860], [-110, -876]], 12),
    sideOver: (c) => S.rect(-170, -1036, 320, 22, 6, { fill: c.hairHi, opacity: 0.8 }) + S.path('M-170 -1036 L150 -1036', lineOnly(SW)),
    back: () => poly([[-152, -770], [-158, -930], [-152, -1036], [152, -1036], [158, -930], [152, -770], [0, -752]], 12),
  },

  // Coach Hale: forward baseball cap with an "H", grey sides
  coachCap: {
    browY: -770, nametagY: -1090, fill: 'cap',
    behind(hair, feat, c) {
      return S.path(mapPoly(hair, [[-162, -840], [162, -840], [164, -726], [146, -712], [-146, -712], [-164, -726]], 16), outline(c.hair));
    },
    front: (hair) => mapPoly(hair, [[-166, -830], [-168, -900], [-142, -976], [-72, -1024], [0, -1034], [72, -1024], [142, -976], [168, -900], [166, -830]], 30),
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(hair([0, -1032]))} L${P(hair([0, -990]))} M${P(hair([-60, -1020]))} Q${P(hair([-110, -950]))} ${P(hair([-120, -840]))} M${P(hair([60, -1020]))} Q${P(hair([110, -950]))} ${P(hair([120, -840]))}`, lineOnly(4.5, c.capShade));
      if (shade) o += S.path(`M${P(hair([-140, -930]))} Q${P(hair([-90, -1010]))} ${P(hair([-10, -1020]))}`, lineOnly(15, c.capHi));
      const lg = feat([0, -916]);
      o += txt('H', lg[0], lg[1] + 30, 92, c.capLogo, { stroke: LINE, 'stroke-width': 9, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
      return o;
    },
    over(hair, feat, c) {
      const m = feat([0, -836]);
      let o = S.path(mapPoly(hair, [[-168, -856], [168, -856], [168, -826], [-168, -826]], 8), outline(c.capShade));
      o += S.path(`M${P(hair([-178, -834]))} Q${f(m[0])} ${f(m[1] - 22)} ${P(hair([178, -834]))} Q${f(m[0])} ${f(m[1] + 70)} ${P(hair([-178, -834]))} Z`, outline(c.capBrim));
      o += S.path(`M${P(hair([-140, -826]))} Q${f(m[0])} ${f(m[1] + 34)} ${P(hair([140, -826]))}`, lineOnly(5, '#00000030'));
      const t = hair([0, -1034]);
      return o + S.circle(t[0], t[1], 11, outline(c.capShade, 5));
    },
    side: () => poly([[-168, -836], [-162, -924], [-100, -1004], [20, -1034], [120, -1004], [166, -924], [170, -836]], 26),
    sideOver(c) {
      let o = S.path(poly([[40, -840], [172, -840], [176, -720], [130, -700], [60, -716]], 14), outline(c.hair));
      o += S.path(poly([[-170, -862], [172, -862], [172, -832], [-170, -832]], 8), outline(c.capShade));
      o += S.path('M-166 -856 Q-260 -852 -320 -820 Q-300 -806 -160 -824 Z', outline(c.capBrim));
      o += txt('H', -100, -900, 64, c.capLogo, { stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' });
      return o + S.circle(10, -1034, 10, outline(c.capShade, 5));
    },
    back: () => null,
    backOver(c) {
      let o = S.path(poly([[-162, -840], [162, -840], [166, -720], [100, -700], [0, -706], [-100, -700], [-166, -720]], 18), outline(c.hair));
      o += clipped(poly([[-166, -830], [-168, -900], [-142, -976], [-72, -1024], [0, -1034], [72, -1024], [142, -976], [168, -900], [166, -830]], 30), c.cap, S.path('M-140 -930 Q-90 -1010 -10 -1020', lineOnly(15, c.capHi)));
      o += S.path(poly([[-168, -856], [168, -856], [168, -826], [-168, -826]], 8), outline(c.capShade));
      o += S.path('M-46 -828 A46 46 0 0 1 46 -828 Z', outline(c.hair, 6)) + S.rect(-50, -858, 100, 14, 5, outline(c.capShade, 4));
      return o;
    },
  },

  // ---------------------------------------------------------------- crowd styles (new)
  crop: {
    browY: -792, nametagY: -1080,
    front(hair, feat) {
      const outer = [[-148, -790], [-156, -880], [-110, -952], [0, -978], [110, -952], [156, -880], [148, -790], [134, -798], [130, -846]];
      const fr = [[110, -850], [86, -828], [70, -852], [40, -830], [20, -858], [-10, -832], [-36, -858], [-66, -832], [-90, -856], [-116, -836], [-134, -798]];
      return poly([...outer.map(hair), ...fr.map(feat)], 8);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-40, -846]))} L${P(hair([-30, -920]))} M${P(feat([40, -840]))} L${P(hair([50, -920]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-110, -920]))} Q${P(hair([-40, -966]))} ${P(hair([40, -962]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-160, -830], [-150, -920], [-60, -972], [70, -968], [150, -900], [156, -780], [110, -768], [80, -836], [-100, -850]], 14),
    back: () => poly([[-152, -762], [-156, -880], [-100, -962], [100, -962], [156, -880], [152, -762], [80, -744], [0, -752], [-80, -744]], 22),
  },
  curlTop: {
    browY: -790, nametagY: -1110,
    behind(hair, feat, c) {
      return S.path(mapPoly(hair, [[-150, -880], [150, -880], [152, -760], [136, -748], [-136, -748], [-152, -760]], 18), outline(c.hairShade));
    },
    front: () => null,
    over(hair, feat, c) {
      const cs = [[-118, -888, 36], [-60, -918, 40], [0, -930, 40], [60, -918, 40], [118, -888, 36], [-88, -964, 34], [-20, -984, 36], [48, -980, 36], [104, -950, 30], [-130, -846, 26], [130, -846, 26]];
      const q = cs.map(([x, y, r]) => [...(Math.abs(x) > 128 ? hair([x, y]) : feat([x, y])), r]);
      return puffs(q, c.hair) + curlMarks(q.filter((_, i) => i % 2 === 0), 36, 4.5);
    },
    side: () => poly([[-150, -860], [-120, -900], [60, -900], [150, -880], [156, -770], [110, -756], [60, -820], [-100, -860]], 16),
    sideOver(c) {
      const cs = [[-150, -880, 32], [-100, -930, 40], [-30, -970, 42], [50, -970, 42], [120, -930, 40], [150, -880, 34]];
      return puffs(cs, c.hair) + curlMarks(cs, 40, 4.5);
    },
    back: () => poly([[-150, -760], [-154, -880], [-100, -930], [100, -930], [154, -880], [150, -760], [0, -748]], 22),
    backOver(c) {
      const cs = [[-120, -900, 38], [-60, -940, 42], [0, -960, 42], [60, -940, 42], [120, -900, 38], [-40, -990, 34], [40, -990, 34]];
      return puffs(cs, c.hair) + curlMarks(cs, 40, 4.5);
    },
  },
  twists: {
    browY: -790, nametagY: -1120,
    behind(hair, feat, c) {
      return S.path(mapPoly(hair, [[-150, -880], [150, -880], [152, -760], [136, -748], [-136, -748], [-152, -760]], 18), outline(c.hair));
    },
    front(hair, feat) {
      const outer = [[-148, -800], [-156, -890], [-110, -940], [0, -956], [110, -940], [156, -890], [148, -800], [134, -806], [128, -852]];
      const line = [[100, -862], [0, -872], [-100, -862], [-134, -806]];
      return poly([...outer.map(hair), ...line.map(feat)], 14);
    },
    details: (hair, feat, c, shade) => (shade ? S.path(`M${P(hair([-110, -910]))} Q${P(hair([-40, -946]))} ${P(hair([40, -946]))}`, lineOnly(10, c.hairHi)) : ''),
    over(hair, feat, c) {
      let d = '';
      for (const [x, y, a] of [[-120, -930, -30], [-74, -958, -16], [-26, -968, -4], [24, -968, 6], [72, -958, 18], [118, -932, 30], [-96, -986, -20], [-48, -1000, -8], [2, -1004, 2], [52, -998, 12], [98, -982, 24]]) {
        const p = hair([x, y]);
        d += `M${f(p[0] - 14)} ${f(p[1] + 26)} Q${f(p[0] - 16)} ${f(p[1] - 20)} ${f(p[0] + Math.sin((a * Math.PI) / 180) * 24)} ${f(p[1] - 30)} Q${f(p[0] + 18)} ${f(p[1] - 14)} ${f(p[0] + 14)} ${f(p[1] + 26)} Z `;
      }
      return S.path(d, outline(c.hair, 5.5)) + S.path(d, { fill: 'none', stroke: c.hairHi, 'stroke-width': 3, opacity: 0.6 });
    },
    side: () => poly([[-156, -846], [-140, -920], [-60, -950], [70, -946], [150, -894], [156, -770], [110, -756], [80, -830], [-100, -856]], 18),
    sideOver(c) {
      let d = '';
      for (const [x, y] of [[-110, -940], [-60, -966], [-10, -980], [40, -980], [90, -964], [130, -930], [-30, -1010], [30, -1012], [80, -996]]) d += `M${x - 14} ${y + 26} Q${x - 16} ${y - 20} ${x + 6} ${y - 30} Q${x + 18} ${y - 14} ${x + 14} ${y + 26} Z `;
      return S.path(d, outline(c.hair, 5.5));
    },
    back: () => poly([[-152, -760], [-156, -880], [-100, -950], [100, -950], [156, -880], [152, -760], [0, -748]], 22),
    backOver(c) {
      let d = '';
      for (const [x, y] of [[-120, -930], [-70, -960], [-20, -972], [30, -972], [80, -960], [124, -930], [-96, -990], [-44, -1004], [8, -1008], [60, -1000], [104, -984]]) d += `M${x - 14} ${y + 26} Q${x - 16} ${y - 20} ${x + 2} ${y - 30} Q${x + 18} ${y - 14} ${x + 14} ${y + 26} Z `;
      return S.path(d, outline(c.hair, 5.5));
    },
  },
  twinTails: {
    browY: -800, nametagY: -1100,
    behind(hair, feat, c, shade) {
      let o = S.path(mapPoly(hair, [[-164, -880], [164, -880], [168, -720], [140, -700], [-140, -700], [-168, -720]], 30), outline(c.hair));
      for (const sx of [-1, 1]) {
        const pts = [[150, -760], [196, -760], [232, -700], [240, -620], [226, -548], [204, -520], [190, -580], [176, -660], [150, -712]].map(([x, y]) => hair([sx * x, y]));
        o += S.path(poly(sx < 0 ? pts.reverse() : pts, 18), outline(c.hair));
        const b = hair([sx * 176, -752]);
        o += S.circle(b[0], b[1], 20, outline(c.accent, 5)) + S.circle(b[0] - 6, b[1] - 6, 5, { fill: '#FFFFFF', opacity: 0.8 });
      }
      return o;
    },
    front(hair, feat) {
      const outer = [[-160, -720], [-166, -860], [-112, -956], [0, -982], [112, -956], [166, -860], [160, -720], [136, -726], [134, -800]];
      const fr = [[120, -810], [40, -820], [-40, -820], [-120, -810], [-136, -726]];
      return poly([...outer.map(hair), ...fr.map(feat)], 12);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-60, -820]))} L${P(hair([-56, -880]))} M${P(feat([40, -820]))} L${P(hair([38, -880]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-120, -920]))} Q${P(hair([-40, -970]))} ${P(hair([50, -966]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-176, -810], [-150, -930], [-40, -980], [90, -962], [160, -880], [166, -720], [110, -700], [60, -770], [-90, -820], [-140, -816]], 20),
    sideBehind: (c) => S.path(poly([[120, -770], [200, -760], [236, -680], [240, -580], [210, -520], [190, -600], [176, -690]], 18), outline(c.hair)) + S.circle(150, -760, 20, outline(c.accent, 5)),
    back: () => poly([[-164, -710], [-168, -870], [-96, -970], [96, -970], [168, -870], [164, -710], [80, -696], [0, -704], [-80, -696]], 26),
    backOver(c) {
      let o = S.path('M0 -960 L0 -710', lineOnly(4.5));
      for (const sx of [-1, 1]) {
        const pts = [[130, -760], [196, -760], [232, -700], [240, -620], [226, -548], [204, -520], [190, -580], [176, -660], [140, -712]].map(([x, y]) => [sx * x, y]);
        o += S.path(poly(sx < 0 ? pts.reverse() : pts, 18), outline(c.hair)) + S.circle(sx * 170, -752, 20, outline(c.accent, 5));
      }
      return o;
    },
  },
  lowBun: {
    browY: -800, nametagY: -1090,
    behind(hair, feat, c) {
      return S.path(mapPoly(hair, [[-162, -880], [162, -880], [166, -700], [140, -680], [-140, -680], [-166, -700]], 30), outline(c.hair));
    },
    front(hair, feat) {
      const outer = [[-160, -700], [-166, -860], [-112, -956], [0, -982], [112, -956], [166, -860], [160, -700], [136, -710], [134, -790]];
      const fr = [[118, -820], [70, -856], [10, -870], [-60, -850], [-108, -814], [-130, -770], [-136, -710]];
      return poly([...outer.map(hair), ...fr.map(feat)], 18);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-90, -836]))} Q${P(hair([-20, -930]))} ${P(hair([130, -900]))} M${P(feat([20, -866]))} Q${P(hair([90, -900]))} ${P(hair([150, -820]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-120, -910]))} Q${P(hair([-60, -964]))} ${P(hair([20, -972]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-176, -800], [-150, -930], [-40, -982], [90, -964], [160, -884], [166, -720], [110, -700], [60, -770], [-90, -830], [-140, -822]], 22),
    sideBehind: (c) => S.circle(160, -700, 54, outline(c.hair)) + S.path('M130 -700 Q160 -740 196 -706', lineOnly(4.5)),
    back: () => poly([[-164, -700], [-168, -870], [-96, -970], [96, -970], [168, -870], [164, -700], [80, -684], [0, -692], [-80, -684]], 26),
    backOver: (c) => S.path('M-110 -720 Q-60 -880 -10 -960 M110 -720 Q60 -880 10 -960', lineOnly(4.5)) + S.circle(0, -690, 60, outline(c.hair)) + S.path('M-36 -690 Q0 -730 38 -694 M-30 -660 Q0 -690 34 -664', lineOnly(4.5)),
  },
  mohawk: {
    browY: -782, nametagY: -1150,
    behind(hair, feat, c) {
      return S.path(mapPoly(hair, [[-146, -860], [146, -860], [150, -760], [136, -748], [-136, -748], [-150, -760]], 18), { fill: c.hairShade, stroke: LINE, 'stroke-width': SW });
    },
    front(hair) {
      return poly([[-46, -884], [-60, -960], [-44, -1040], [-10, -1084], [30, -1070], [50, -1010], [52, -940], [44, -884]].map(hair), 16);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(hair([-30, -890]))} Q${P(hair([-30, -990]))} ${P(hair([0, -1070]))} M${P(hair([24, -890]))} Q${P(hair([30, -990]))} ${P(hair([30, -1060]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-40, -960]))} L${P(hair([-26, -1040]))}`, lineOnly(10, c.hairHi));
      return o;
    },
    side: () => poly([[-120, -880], [-150, -960], [-80, -1050], [20, -1076], [120, -1040], [160, -940], [150, -870], [60, -900], [-40, -900]], 22),
    sideOver: (c) => S.path(poly([[-60, -880], [150, -870], [156, -760], [110, -750], [70, -830]], 14), { fill: c.hairShade, stroke: LINE, 'stroke-width': SW }),
    back: () => poly([[-150, -760], [-154, -880], [-46, -900], [-50, -1000], [0, -1070], [50, -1000], [46, -900], [154, -880], [150, -760], [0, -748]], 18),
  },
  sidePart: {
    browY: -792, nametagY: -1090,
    front(hair, feat) {
      const outer = [[-150, -774], [-158, -870], [-120, -948], [-30, -982], [80, -976], [150, -920], [158, -800], [150, -774], [134, -780], [130, -846]];
      const line = [[96, -862], [30, -878], [-40, -870], [-60, -900], [-100, -846], [-134, -780]];
      return poly([...outer.map(hair), ...line.map(feat)], 14);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(feat([-60, -900]))} Q${P(hair([-62, -950]))} ${P(hair([-50, -978]))} M${P(feat([10, -876]))} Q${P(hair([80, -920]))} ${P(hair([150, -880]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([0, -966]))} Q${P(hair([80, -960]))} ${P(hair([130, -916]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-160, -840], [-150, -924], [-60, -978], [70, -972], [150, -906], [158, -776], [110, -764], [80, -840], [-100, -862]], 18),
    back: () => poly([[-156, -760], [-160, -880], [-100, -968], [100, -968], [160, -880], [156, -760], [80, -742], [0, -752], [-80, -742]], 24),
  },
  longWave: {
    browY: -802, nametagY: -1110,
    behind(hair, feat, c) {
      const pts = [[-170, -880, 0], [170, -880, 0], [184, -760, 10], [196, -640, 10], [186, -540, 0], [150, -520, 0], [-150, -520, 0], [-186, -540, 0], [-196, -640, 10], [-184, -760, 10]].map(([x, y, b]) => [...hair([x, y]), b]);
      return S.path(fluffy(pts), outline(c.hair)) + S.path(`M${P(hair([-176, -660]))} q16 30 -4 64 M${P(hair([176, -660]))} q-16 30 4 64`, lineOnly(4.5));
    },
    front(hair, feat) {
      const outer = [[-166, -620], [-172, -840], [-120, -952], [-20, -986], [100, -966], [168, -870], [166, -620], [136, -636], [130, -800]];
      const fr = [[90, -846], [20, -868], [-50, -848], [-110, -806], [-134, -640]];
      return poly([...outer.map(hair), ...fr.map(feat)], 18);
    },
    details(hair, feat, c, shade) {
      let o = S.path(`M${P(hair([-40, -980]))} Q${P(feat([-20, -900]))} ${P(feat([-110, -806]))} M${P(hair([40, -976]))} Q${P(feat([80, -900]))} ${P(feat([130, -790]))}`, lineOnly(4.5));
      if (shade) o += S.path(`M${P(hair([-120, -920]))} Q${P(hair([-60, -970]))} ${P(hair([10, -976]))}`, lineOnly(12, c.hairHi));
      return o;
    },
    side: () => poly([[-176, -800], [-156, -930], [-50, -990], [90, -970], [162, -880], [186, -640], [164, -540], [100, -560], [60, -700], [20, -800], [-100, -830]], 24),
    back: () => poly([[-196, -620], [-176, -860], [-100, -980], [100, -980], [176, -860], [196, -620], [170, -530], [0, -540], [-170, -530]], 34),
  },
  shaved: {
    browY: -790, nametagY: -1040,
    front(hair, feat) {
      const outer = [[-144, -800], [-148, -880], [-108, -924], [0, -934], [108, -924], [148, -880], [144, -800], [132, -806]];
      const line = [[120, -850], [0, -866], [-120, -850], [-132, -806]];
      return poly([...outer.map(hair), ...line.map(feat)], 18);
    },
    details: () => '',
    side: () => poly([[-150, -856], [-130, -910], [-50, -934], [70, -930], [146, -886], [152, -780], [110, -768], [80, -840], [-100, -862]], 20),
    back: () => poly([[-148, -770], [-152, -880], [-100, -930], [100, -930], [152, -880], [148, -770], [0, -756]], 22),
  },
});

// Brick's logo: a little red brick with mortar lines
function brickLogo(x, y, s = 1) {
  let o = S.rect(x - 40 * s, y - 24 * s, 80 * s, 48 * s, 6 * s, outline('#D9432F', 5));
  o += S.path(`M${f(x - 40 * s)} ${f(y)} L${f(x + 40 * s)} ${f(y)} M${f(x - 6 * s)} ${f(y - 24 * s)} L${f(x - 6 * s)} ${f(y)} M${f(x + 18 * s)} ${f(y)} L${f(x + 18 * s)} ${f(y + 24 * s)} M${f(x - 26 * s)} ${f(y)} L${f(x - 26 * s)} ${f(y + 24 * s)}`, lineOnly(4, '#7A1E14'));
  return o + S.path(`M${f(x - 30 * s)} ${f(y - 14 * s)} L${f(x - 14 * s)} ${f(y - 14 * s)}`, lineOnly(4, '#FFFFFF88'));
}

// ====================================================================== BEARD (old man) + BROWS
function beardLongFront(hair, feat, c) {
  const M = (x, y, b = 0) => { const p = Math.abs(x) >= 128 ? hair([x, y]) : feat([x, y]); return [p[0], p[1], b]; };
  const pts = [M(-146, -770), M(-128, -770), M(-120, -684), M(-84, -652), M(-40, -642), M(0, -648), M(40, -642), M(84, -652), M(120, -684), M(128, -770), M(146, -770),
    M(156, -680, 10), M(146, -580, 12), M(118, -490, 12), M(70, -410, 10), M(18, -350, 0), M(0, -330, 0), M(-30, -370, 8), M(-80, -420, 10), M(-124, -496, 12), M(-150, -584, 12), M(-158, -680, 10)];
  const q = (x, y) => P(feat([x, y]));
  let inner = S.path(`M${q(-200, -440)} L${q(200, -440)} L${q(200, -300)} L${q(-200, -300)} Z`, { fill: c.beardShade, opacity: 0.8 });
  inner += S.path(`M${q(-100, -600)} q-10 60 10 110 M${q(-50, -560)} q-6 60 14 120 M${q(10, -560)} q-6 70 10 150 M${q(70, -580)} q2 60 -10 110 M${q(110, -620)} q4 50 -6 80`, lineOnly(4, c.beardShade));
  let o = clipped(fluffy(pts), c.beard, inner, 6.5);
  // curled moustache
  const m = feat([0, -630]);
  const half = (sx) => `M${f(m[0])} ${f(m[1] - 10)} C${f(m[0] + sx * 34)} ${f(m[1] - 36)} ${f(m[0] + sx * 96)} ${f(m[1] - 30)} ${f(m[0] + sx * 112)} ${f(m[1] + 10)} C${f(m[0] + sx * 118)} ${f(m[1] + 30)} ${f(m[0] + sx * 98)} ${f(m[1] + 34)} ${f(m[0] + sx * 92)} ${f(m[1] + 18)} C${f(m[0] + sx * 70)} ${f(m[1] + 10)} ${f(m[0] + sx * 40)} ${f(m[1] + 18)} ${f(m[0] + sx * 16)} ${f(m[1] + 12)} Q${f(m[0] + sx * 4)} ${f(m[1] + 8)} ${f(m[0])} ${f(m[1] - 2)} Z`;
  o += S.path(half(-1) + ' ' + half(1), outline(c.beard, 6));
  o += S.path(`M${f(m[0] - 74)} ${f(m[1] - 16)} Q${f(m[0] - 40)} ${f(m[1] - 28)} ${f(m[0] - 16)} ${f(m[1] - 14)}`, lineOnly(5, '#FFFFFF'));
  return o;
}
function beardLongSide(c) {
  const pts = [[-12, -770], [30, -770], [44, -660, 10], [24, -560, 12], [-20, -470, 12], [-84, -380, 8], [-112, -350, 0], [-120, -400, 8], [-156, -480, 10], [-180, -566, 0], [-176, -640], [-120, -654], [-60, -672]];
  let o = clipped(fluffy(pts), c.beard, S.rect(-260, -470, 400, 160, 0, { fill: c.beardShade, opacity: 0.8 }) + S.path('M-140 -600 q-6 60 10 120 M-80 -600 q-10 80 -10 150', lineOnly(4, c.beardShade)), 6.5);
  o += S.path('M-112 -640 C-130 -664 -176 -660 -196 -626 C-206 -600 -186 -594 -180 -610 C-164 -622 -140 -612 -126 -616 Q-114 -622 -112 -636 Z', outline(c.beard, 6));
  return o;
}
function beardLongBack(c) {
  let o = '';
  for (const sx of [-1, 1]) o += S.path(fluffy([[sx * 120, -660, 0], [sx * 156, -650, sx * 8], [sx * 158, -580, sx * 8], [sx * 120, -540, 0]].map(([x, y, b]) => [x, y, Math.abs(b)])), outline(c.beard, 6.5));
  return o;
}
// thick blocky brows (Brick); expression offsets b = [innerDy, outerDy]
function blockBrow(inner, outer, col, th = 22) {
  const d = `M${P(inner)} L${P(outer)} L${f(outer[0])} ${f(outer[1] - th)} L${f(inner[0])} ${f(inner[1] - th * 0.9)} Z`;
  return S.path(d, { fill: col, stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
}
// long droopy fluffy brows (old man)
function droopBrow(inner, outer, sx, col) {
  const mid = [(inner[0] + outer[0]) / 2, Math.min(inner[1], outer[1]) - 16];
  const tail = [outer[0] + sx * 22, outer[1] + 44];
  const d = `M${P(inner)} Q${P(mid)} ${P(outer)} Q${f(outer[0] + sx * 22)} ${f(outer[1] + 10)} ${P(tail)}`;
  return S.path(d, lineOnly(30, LINE)) + S.path(d, lineOnly(19, col)) + S.path(`M${f(inner[0] + sx * 10)} ${f(inner[1] - 4)} Q${f(mid[0])} ${f(mid[1] + 4)} ${f(outer[0] - sx * 6)} ${f(outer[1] - 2)}`, lineOnly(4, '#D8D6E0'));
}
const resolveLike = (style, face) => {
  const fr = F.resolveFace(face);
  const name = typeof face === 'string' ? face : face && face.name;
  const explicitMouth = face && typeof face === 'object' && face.mouth;
  if ((!name || name === 'neutral') && !explicitMouth && style.neutralMouth) fr.mouth = style.neutralMouth;
  return fr;
};

// ====================================================================== HEAD ACCESSORIES (front view hook)
function officeHeadsetFront(hs, hair, feat) {
  const col = hs.col || '#2B2E3A', acc = hs.acc || '#36C2F2';
  const a = hair([-164, -760]), b = hair([164, -760]);
  const band = `M${P(a)} Q${f((a[0] + b[0]) / 2)} -1080 ${P(b)}`;
  let o = S.path(band, lineOnly(20, LINE)) + S.path(band, lineOnly(10, col));
  const p = hair([-168, -736]), q = hair([170, -744]);
  o += S.path(S.roundedPath([[p[0] - 26, p[1] - 52], [p[0] + 26, p[1] - 52], [p[0] + 26, p[1] + 52], [p[0] - 26, p[1] + 52]], 22), outline(col, 6));
  o += S.path(S.roundedPath([[p[0] - 10, p[1] - 34], [p[0] + 4, p[1] - 34], [p[0] + 4, p[1] + 34], [p[0] - 10, p[1] + 34]], 7), { fill: acc });
  o += S.path(S.roundedPath([[q[0] - 14, q[1] - 30], [q[0] + 14, q[1] - 30], [q[0] + 14, q[1] + 30], [q[0] - 14, q[1] + 30]], 12), outline(col, 5));
  if (hs.mic !== false) {
    const s = hair([-176, -690]), e = feat([-78, -612]);
    const boom = `M${P(s)} Q${f(s[0] + 6)} ${f(e[1] + 6)} ${P(e)}`;
    o += S.path(boom, lineOnly(13, LINE)) + S.path(boom, lineOnly(6, col));
    o += S.ellipse(e[0], e[1], 18, 15, outline('#3A3D4A', 5)) + S.circle(e[0] - 4, e[1] - 4, 4, { fill: '#FF4D5E' });
  }
  return o;
}
function officeHeadsetSide(hs) {
  const col = hs.col || '#2B2E3A', acc = hs.acc || '#36C2F2';
  let o = S.path('M64 -790 Q84 -930 -30 -916', lineOnly(20, LINE)) + S.path('M64 -790 Q84 -930 -30 -916', lineOnly(10, col));
  o += S.path(S.roundedPath([[28, -800], [104, -800], [104, -664], [28, -664]], 34), outline(col, 6)) + S.circle(66, -732, 22, { fill: acc });
  if (hs.mic !== false) o += S.path('M40 -690 Q-60 -610 -156 -626', lineOnly(13, LINE)) + S.path('M40 -690 Q-60 -610 -156 -626', lineOnly(6, col)) + S.ellipse(-162, -626, 18, 15, outline('#3A3D4A', 5)) + S.circle(-166, -630, 4, { fill: '#FF4D5E' });
  return o;
}
function officeHeadsetBack(hs) {
  const col = hs.col || '#2B2E3A';
  let o = S.path('M-164 -760 Q0 -1080 164 -760', lineOnly(20, LINE)) + S.path('M-164 -760 Q0 -1080 164 -760', lineOnly(10, col));
  o += S.path(S.roundedPath([[142, -788], [194, -788], [194, -684], [142, -684]], 22), outline(col, 6)) + S.path(S.roundedPath([[-184, -774], [-156, -774], [-156, -714], [-184, -714]], 12), outline(col, 5));
  return o;
}
// glasses chain (Granny): beaded loop from the temples round the neck
function specChainFront(feat, hair, col) {
  const a = feat([-110, -704]), b = feat([110, -704]);
  const d = `M${P(a)} Q${f(a[0] - 46)} ${f(a[1] + 110)} ${f(a[0] + 10)} -536 Q${f((a[0] + b[0]) / 2)} -500 ${f(b[0] - 10)} -536 Q${f(b[0] + 46)} ${f(b[1] + 110)} ${P(b)}`;
  return S.path(d, lineOnly(9, LINE)) + S.path(d, { fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' });
}
const headAcc3 = L2.headAcc;
L2.headAcc = function headAcc(style, stage, hair, feat, fx) {
  let o = headAcc3(style, stage, hair, feat, fx);
  const a = style.acc || {}, c = style.col;
  if (stage === 'top') {
    if (c.longBeard) o += beardLongFront(hair, feat, c);
    if (a.officeHeadset) o += officeHeadsetFront(a.officeHeadset, hair, feat);
  } else if (stage === 'face') {
    if (a.specChain) o += specChainFront(feat, hair, a.specChain);
    if (a.cheekBlush) for (const sx of [-1, 1]) { const p = feat([sx * 92, -628]); o += S.ellipse(p[0], p[1], 26, 11, { fill: a.cheekBlush, opacity: 0.55 }); }
    if (a.stubble) { const p = feat([0, -600]); o += S.path(`M${f(p[0] - 110)} ${f(p[1] - 30)} Q${f(p[0])} ${f(p[1] + 80)} ${f(p[0] + 110)} ${f(p[1] - 30)} L${f(p[0] + 120)} ${f(p[1] + 40)} L${f(p[0] - 120)} ${f(p[1] + 40)} Z`, { fill: a.stubble, opacity: 0.22 }); }
  }
  return o;
};

// ====================================================================== OUTFITS (front, inside the torso clip)
const hem = (B, W, col, line = true) => S.rect(-W - 10, B - 24, 2 * W + 20, 26, 0, { fill: col }) + (line ? S.path(`M${-W - 10} ${B - 24} L${W + 10} ${B - 24}`, lineOnly(4)) : '');
function cursorIcon(x, y, s = 1, fill = '#FFFFFF') {
  const d = 'M0 0 L0 58 L14 45 L24 66 L35 61 L25 40 L43 40 Z';
  return S.path(d, { fill, stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round', transform: `translate(${f(x)} ${f(y)}) scale(${f(s)})` });
}
function tieShape(cx, k, T, col, stripe, len = 170) {
  let o = S.path(`M${f(cx - 15 * k)} ${T + 30} L${f(cx + 15 * k)} ${T + 30} L${f(cx + 22 * k)} ${T + len} L${f(cx)} ${T + len + 24} L${f(cx - 22 * k)} ${T + len} Z`, outline(col, 5));
  if (stripe) {
    let d = '';
    for (let y = T + 50; y < T + len; y += 30) d += `M${f(cx - 22 * k)} ${y + 12} L${f(cx + 22 * k)} ${y - 6} `;
    const id = S.uid('tie');
    o += S.clipDef(id, S.path(`M${f(cx - 15 * k)} ${T + 30} L${f(cx + 15 * k)} ${T + 30} L${f(cx + 22 * k)} ${T + len} L${f(cx)} ${T + len + 24} L${f(cx - 22 * k)} ${T + len} Z`)) + S.g(S.path(d, lineOnly(8, stripe)), null, { 'clip-path': `url(#${id})` });
  }
  o += S.path(`M${f(cx - 22 * k)} ${T + 4} L${f(cx + 22 * k)} ${T + 4} L${f(cx + 15 * k)} ${T + 34} L${f(cx - 15 * k)} ${T + 34} Z`, outline(col, 5));
  return o;
}
function sticky(x, y, s, rot, text, col = '#FFE45C') {
  let o = S.path('M-40 -40 L40 -40 L40 30 L30 40 L-40 40 Z', { fill: col, stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  o += S.path('M40 30 L30 30 L30 40', { fill: '#E8C53A', stroke: LINE, 'stroke-width': 3.5, 'stroke-linejoin': 'round' });
  o += S.rect(-40, -40, 80, 14, 0, { fill: '#000', opacity: 0.06 });
  if (text) o += S.el('text', { x: 0, y: 8, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': text.length > 6 ? 15 : text.length > 4 ? 20 : 24, fill: '#3A3550', 'text-anchor': 'middle' }, text);
  else o += S.path('M-26 -14 L26 -14 M-26 2 L20 2 M-26 18 L10 18', lineOnly(4, '#3A3550'));
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function plaidLines(W, T, B, c) {
  let a = '', b = '';
  for (let x = -W; x <= W; x += 40) a += `M${x} ${T - 10} L${x} ${B + 10} `;
  for (let y = T + 10; y <= B; y += 40) a += `M${-W - 10} ${y} L${W + 10} ${y} `;
  for (let x = -W + 20; x <= W; x += 40) b += `M${x} ${T - 10} L${x} ${B + 10} `;
  for (let y = T + 30; y <= B; y += 40) b += `M${-W - 10} ${y} L${W + 10} ${y} `;
  return S.path(a, lineOnly(12, c.plaid1 || c.topShade)) + S.path(b, { ...lineOnly(4, c.plaid2 || '#FFFFFF'), opacity: 0.55 });
}
// rows of tiny "code" on the Admin's robe: one path per colour, rows scroll with phase
function codeRows(x0, x1, y0, y1, phase = 0, seed = 0, gap = 24, w = 6) {
  let g = '', y = '', z = '';
  const off = ((phase % 1) + 1) % 1 * gap;
  const row0 = Math.floor(phase);
  for (let yy = y0 - off, r = 0; yy < y1 + gap; yy += gap, r++) {
    const id = r + row0 + seed * 31;
    let x = x0 + 8 + Math.floor(hash(id * 1.3) * 3) * 18;
    let n = 0;
    while (x < x1 - 10 && n < 6) {
      const len = 14 + Math.floor(hash(id * 7.7 + n * 3.1) * 5) * 12;
      const xe = Math.min(x + len, x1 - 6);
      const pick = hash(id * 2.9 + n * 5.3);
      const seg = `M${f(x)} ${f(yy)} L${f(xe)} ${f(yy)} `;
      if (pick < 0.42) g += seg; else if (pick < 0.75) y += seg; else z += seg;
      x = xe + 12 + Math.floor(hash(id + n) * 2) * 14;
      n++;
      if (hash(id * 4.4 + n) > 0.8) break;
    }
  }
  return (g ? S.path(g, { ...lineOnly(w, '#4CC98A'), opacity: 0.55 }) : '') + (y ? S.path(y, { ...lineOnly(w, '#E9B949'), opacity: 0.62 }) : '') + (z ? S.path(z, { ...lineOnly(w, '#B9C2D6'), opacity: 0.45 }) : '');
}
const ADMIN = { phase: 0, glow: 0 }; // per-draw state set by cast.draw.admin (code scroll, glow)

function outfit4(style, t, shade, back, T, B, W) {
  const c = style.col;
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  let o = '';
  switch (style.top) {
    case 'cursorHoodie':
      if (!back) {
        o += S.path(`M${f(cx - 74 * k)} ${T - 8} Q${f(cx)} ${T + 50} ${f(cx + 74 * k)} ${T - 8} L${f(cx + 50 * k)} ${T - 8} Q${f(cx)} ${T + 24} ${f(cx - 50 * k)} ${T - 8} Z`, outline(c.topShade, 5));
        o += S.path(`M${f(cx - 18 * k)} ${T + 20} L${f(cx - 22 * k)} -472 M${f(cx + 18 * k)} ${T + 20} L${f(cx + 22 * k)} -472`, lineOnly(5, c.trim));
        o += S.rect(cx - 27 * k, -474, 10, 16, 3, outline(c.trim, 3)) + S.rect(cx + 17 * k, -474, 10, 16, 3, outline(c.trim, 3));
        o += cursorIcon(cx - 18 * k, -452, 0.95, '#FFFFFF');
        o += S.path(S.roundedPath([[cx - 70 * k, -378], [cx + 70 * k, -378], [cx + 84 * k, -320], [cx - 84 * k, -320]], 14), outline(c.topShade, 5));
      } else {
        o += S.path(`M-84 ${T - 6} Q-90 ${T + 120} 0 ${T + 130} Q90 ${T + 120} 84 ${T - 6} Z`, outline(c.topShade, 5)) + S.path(`M-60 ${T + 10} Q0 ${T + 70} 60 ${T + 10}`, lineOnly(4, c.top));
      }
      o += hem(B, W, c.topShade);
      break;
    case 'tank': {
      // bare shoulders and a scooped neck, ribbed vest
      const skinD = (sx) => `M${sx * (W + 12)} ${T - 12} L${f(cx + sx * 54 * k)} ${T - 12} Q${f(cx + sx * 60 * k)} -462 ${sx * (W + 12)} -430 Z`;
      if (!back) {
        let rib = '';
        for (let x = -W + 12; x < W; x += 18) rib += `M${x} -470 L${x} ${B} `;
        o += S.path(rib, lineOnly(3, c.topShade));
        o += S.path(skinD(-1) + ' ' + skinD(1), { fill: c.skin, stroke: LINE, 'stroke-width': 6 });
        o += S.path(`M${f(cx - 36 * k)} ${T - 10} Q${f(cx)} ${T + 66} ${f(cx + 36 * k)} ${T - 10} Z`, outline(c.skin, 6));
        o += brickLogo(cx + 4, -404, 0.9);
        o += S.path(`M${f(cx - 30 * k)} -446 Q${f(cx - 4)} -440 ${f(cx - 10 * k)} -460`, lineOnly(3.5, c.topShade));
      } else {
        o += S.path(skinD(-1) + ' ' + skinD(1), { fill: c.skin, stroke: LINE, 'stroke-width': 6 });
        o += S.path(`M-40 ${T - 10} Q0 ${T + 40} 40 ${T - 10} Z`, outline(c.skin, 6));
      }
      o += hem(B, W, c.topShade);
      break;
    }
    case 'wfhShirt':
      if (!back) {
        o += S.path(`M${f(cx - 36 * k)} ${T - 6} L${f(cx)} ${T + 30} L${f(cx + 36 * k)} ${T - 6} Z`, { fill: c.skin });
        o += S.path(`M${f(cx)} ${T + 30} L${f(cx)} ${B}`, lineOnly(3, c.topShade));
        for (const y of [-430, -380, -330]) o += S.circle(cx + 1, y, 4.5, { fill: '#FFFFFF', stroke: c.topShade, 'stroke-width': 2 });
        o += S.path(S.roundedPath([[cx + 38 * k, -476], [cx + 82 * k, -476], [cx + 82 * k, -430], [cx + 38 * k, -430]], 5), outline('none', 4));
        o += S.rect(cx + 46 * k, -496, 8, 26, 3, outline('#2B6CE0', 3)) + S.rect(cx + 60 * k, -492, 8, 22, 3, outline('#E8453C', 3));
        o += S.ellipse(cx - 56 * k, -372, 15, 10, { fill: '#9A6A3E', opacity: 0.45 }) + S.circle(cx - 40 * k, -360, 4, { fill: '#9A6A3E', opacity: 0.45 });
        o += S.g(tieShape(cx, k, T, c.tie, c.tieStripe, 168), `rotate(${f(5 * dir)} ${f(cx)} ${T + 10})`);
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 6} L${f(cx + sx * 46 * k)} ${T - 10} L${f(cx + sx * 38 * k)} ${T + 36} Z`, outline(c.collar, 4.5));
      } else {
        o += S.path(`M-56 ${T - 6} Q0 ${T + 20} 56 ${T - 6}`, lineOnly(18, LINE)) + S.path(`M-56 ${T - 6} Q0 ${T + 20} 56 ${T - 6}`, lineOnly(11, c.collar));
        o += S.path(`M${-W} ${T + 60} Q0 ${T + 74} ${W} ${T + 60}`, lineOnly(3.5, c.topShade));
      }
      o += S.path(`M${-W - 10} ${B - 14} Q0 ${B - 30} ${W + 10} ${B - 14}`, lineOnly(3.5, c.topShade));
      break;
    case 'apronTop':
      if (!back) {
        o += S.path(`M${f(cx - 34 * k)} ${T - 6} Q${f(cx)} ${T + 26} ${f(cx + 34 * k)} ${T - 6} Z`, outline(c.skin, 5));
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 34 * k)} ${T - 6} Q${f(cx + sx * 48 * k)} ${T + 20} ${f(cx + sx * 6)} ${T + 30} Q${f(cx + sx * 30 * k)} ${T + 6} ${f(cx + sx * 34 * k)} ${T - 6} Z`, outline(c.collar, 4));
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 46 * k)} ${T - 10} L${f(cx + sx * 64 * k)} -478`, lineOnly(16, LINE)) + S.path(`M${f(cx + sx * 46 * k)} ${T - 10} L${f(cx + sx * 64 * k)} -478`, lineOnly(9, c.apron));
        o += S.path(poly([[cx - 74 * k, -482], [cx + 74 * k, -482], [cx + 80 * k, B + 20], [cx - 80 * k, B + 20]], 10), outline(c.apron, 5.5));
        o += S.path(poly([[cx - 64 * k, -472], [cx + 64 * k, -472], [cx + 70 * k, B + 20], [cx - 70 * k, B + 20]], 8), { fill: 'none', stroke: c.apronTrim, 'stroke-width': 3.5, 'stroke-dasharray': '7 6' });
        o += sticky(cx + 30 * k, -420, 0.62, 8, 'TODO');
      } else {
        for (const sx of [-1, 1]) o += S.path(`M${sx * 60} ${T - 10} L${-sx * 70} -330`, lineOnly(16, LINE)) + S.path(`M${sx * 60} ${T - 10} L${-sx * 70} -330`, lineOnly(9, c.apron));
      }
      break;
    case 'grannyCard':
      if (!back) {
        o += S.rect(cx - 44 * k, T - 10, 88 * k, B - T + 20, 0, { fill: c.inner });
        // lace collar
        let lace = '';
        for (let i = -3; i <= 3; i++) if (i) lace += `M${f(cx + i * 15 * k - 9)} ${T + 2} a9 9 0 1 0 18 0 `;
        o += S.path(lace, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 3.5 });
        o += S.circle(cx, T + 34, 11, outline(c.brooch || '#2FB5A8', 4)) + S.circle(cx - 3, T + 31, 3.5, { fill: '#FFFFFF' });
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 44 * k, T - 12], [cx + sx * 70 * k, T - 12], [cx + sx * 50 * k, B + 12], [cx + sx * 40 * k, B + 12]], 4), outline(c.topShade, 5));
        for (const y of [-470, -420, -370]) o += S.circle(cx - 48 * k, y, 7, outline(c.button || '#FFFFFF', 3.5));
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 62 * k, -386], [cx + sx * 96 * k, -386], [cx + sx * 96 * k, -330], [cx + sx * 62 * k, -330]], 6), outline(c.topShade, 4.5));
        o += S.path(`M${f(cx + 70 * k)} -386 q6 -26 18 -18 q4 -20 14 -6 l-2 24 Z`, outline('#FFFFFF', 3.5));
      }
      o += hem(B, W, c.topShade);
      break;
    case 'oldCard':
      if (!back) {
        o += S.rect(cx - 40 * k, T - 10, 80 * k, B - T + 20, 0, { fill: c.inner });
        o += S.path(`M${f(cx - 20 * k)} ${T - 8} L${f(cx)} ${T + 30} L${f(cx + 20 * k)} ${T - 8}`, lineOnly(5, c.innerShade || c.topShade));
        for (const sx of [-1, 1]) o += S.path(poly([[cx + sx * 40 * k, T - 12], [cx + sx * 66 * k, T - 12], [cx + sx * 40 * k, B + 12], [cx + sx * 30 * k, B + 12]], 4), outline(c.topShade, 5));
        for (const y of [-430, -370]) o += S.rect(cx - 44 * k - 6, y - 14, 12, 28, 6, outline(c.button || '#9A6A3E', 3.5)) + S.path(`M${f(cx - 44 * k)} ${y} L${f(cx - 10 * k)} ${y}`, lineOnly(3, LINE));
        let rib = '';
        for (let x = -W + 10; x < W; x += 22) rib += `M${x} ${T + 40} L${x} ${B} `;
        o += S.path(rib, lineOnly(2.5, c.topShade));
      } else {
        let rib = '';
        for (let x = -W + 10; x < W; x += 22) rib += `M${x} ${T + 10} L${x} ${B} `;
        o += S.path(rib, lineOnly(2.5, c.topShade)) + S.path(`M-60 ${T - 8} Q0 ${T + 24} 60 ${T - 8}`, lineOnly(16, LINE)) + S.path(`M-60 ${T - 8} Q0 ${T + 24} 60 ${T - 8}`, lineOnly(9, c.topShade));
      }
      break;
    case 'suit4':
      if (!back) {
        o += S.path(`M${f(cx - 46 * k)} ${T - 6} L${f(cx)} ${T + 150} L${f(cx + 46 * k)} ${T - 6} Z`, { fill: c.shirt });
        o += tieShape(cx, k, T, c.tie, c.tieStripe, 140);
        const ov = style.suitKind === 'double' ? 10 : 0;
        o += S.path(`M${f(cx - 46 * k)} ${T - 6} L${f(cx - 4 + ov)} ${T + 160} L${f(cx - 72 * k)} ${T + 58} Z`, outline(c.topShade, 5)) + S.path(`M${f(cx + 46 * k)} ${T - 6} L${f(cx + 4 + ov)} ${T + 160} L${f(cx + 72 * k)} ${T + 58} Z`, outline(c.topShade, 5));
        if (style.suitKind === 'double') {
          o += S.path(`M${f(cx + 14)} ${T + 156} L${f(cx + 70 * k)} ${B}`, lineOnly(5));
          for (const y of [-350, -320]) for (const sx of [-1, 1]) o += S.circle(cx + sx * 26 * k, y, 6.5, outline(c.button || '#E9C25A', 3));
        } else {
          o += S.path(`M${f(cx)} ${T + 160} L${f(cx)} ${B}`, lineOnly(4.5));
          for (const y of [B - 64, B - 30]) o += S.circle(cx - 8, y, 6, { fill: LINE });
        }
        if (c.pocket) o += S.path(`M${f(cx - 88 * k)} ${T + 66} l14 -18 l10 16 l10 -14 l8 16 Z`, outline(c.pocket, 3.5)) + S.path(`M${f(cx - 92 * k)} ${T + 66} L${f(cx - 46 * k)} ${T + 66}`, lineOnly(4));
        if (style.crest) o += crest(cx - 66 * k, T + 96, 0.8, c.crest || '#E9C25A');
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 36 * k)} ${B - 46} L${f(cx + sx * 84 * k)} ${B - 46}`, lineOnly(4.5));
      } else o += S.path(`M0 ${T + 20} L0 ${B}`, lineOnly(4, c.topShade));
      break;
    case 'tracksuit':
      o += S.rect(-W - 10, T - 10, 30, B - T + 20, 0, { fill: c.panel }) + S.rect(W - 20, T - 10, 30, B - T + 20, 0, { fill: c.panel });
      o += S.path(`M${-W + 20} ${T} L${-W + 20} ${B} M${W - 20} ${T} L${W - 20} ${B}`, lineOnly(4));
      if (!back) {
        o += S.path(poly([[cx - 52 * k, T - 12], [cx + 52 * k, T - 12], [cx + 44 * k, T + 22], [cx - 44 * k, T + 22]], 8), outline(c.topShade, 5));
        o += S.path(`M${f(cx)} ${T + 20} L${f(cx)} ${B}`, lineOnly(9, LINE)) + S.path(`M${f(cx)} ${T + 20} L${f(cx)} ${B}`, { ...lineOnly(4, '#C9CED8'), 'stroke-dasharray': '4 4' });
        o += S.rect(cx - 6, T + 24, 12, 26, 4, outline('#C9CED8', 3.5));
        // lanyard + whistle
        const lan = `M${f(cx - 40 * k)} ${T - 10} Q${f(cx - 26)} -440 ${f(cx + 6)} -428 M${f(cx + 40 * k)} ${T - 10} Q${f(cx + 30)} -440 ${f(cx + 6)} -428`;
        o += S.path(lan, lineOnly(11, LINE)) + S.path(lan, lineOnly(6, c.lanyard));
        if (!style.whistleUp) o += whistleShape(cx + 6, -414, 1);
        o += S.path(`M${f(cx + 40 * k)} -470 l10 -20 l10 20 Z`, outline(c.panel, 3));
      } else {
        o += txt('COACH', 0, -420, 54, c.panel, { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
      }
      o += hem(B, W, c.topShade);
      break;
    case 'codeRobe': {
      o += S.rect(-W - 10, T - 10, 2 * W + 20, B - T + 20, 0, { fill: c.top });
      o += codeRows(-W, W, T + 20, B, ADMIN.phase, back ? 3 : 1, 22, 6);
      if (!back) {
        o += S.path(`M${f(cx - 60 * k)} ${T - 10} L${f(cx)} ${T + 120} L${f(cx + 60 * k)} ${T - 10} Z`, { fill: c.inner });
        o += S.path(`M${f(cx - 60 * k)} ${T - 10} L${f(cx)} ${T + 120} L${f(cx + 60 * k)} ${T - 10}`, lineOnly(20, LINE)) + S.path(`M${f(cx - 60 * k)} ${T - 10} L${f(cx)} ${T + 120} L${f(cx + 60 * k)} ${T - 10}`, lineOnly(11, c.gold));
        o += S.circle(cx, T + 128, 14, outline(c.gem || '#4FD1FF', 5)) + S.circle(cx - 4, T + 124, 4, { fill: '#FFFFFF' });
      }
      // sash
      o += S.rect(-W - 10, B - 40, 2 * W + 20, 34, 0, { fill: c.gold }) + S.path(`M${-W - 10} ${B - 40} L${W + 10} ${B - 40} M${-W - 10} ${B - 6} L${W + 10} ${B - 6}`, lineOnly(5));
      if (!back) o += S.rect(cx - 22, B - 46, 44, 46, 8, outline(c.goldShade, 5)) + S.rect(cx - 10, B - 34, 20, 22, 4, { fill: c.gold });
      break;
    }
    // ---- crowd tops
    case 'raglan':
      if (!back) o += S.path(`M${f(cx - 36 * k)} ${T - 6} Q${f(cx)} ${T + 30} ${f(cx + 36 * k)} ${T - 6} Z`, outline(c.skin, 5)) + S.path(`M${f(cx - 44 * k)} ${T - 4} Q${f(cx)} ${T + 42} ${f(cx + 44 * k)} ${T - 4}`, lineOnly(8, c.sleeve));
      o += S.path(`M${-W - 10} ${T + 70} L${-W + 34} ${T - 10} L${-W - 10} ${T - 10} Z M${W + 10} ${T + 70} L${W - 34} ${T - 10} L${W + 10} ${T - 10} Z`, outline(c.sleeve, 5));
      if (!back && style.number) o += txt(style.number, cx, -360, 90, c.sleeve, { stroke: LINE, 'stroke-width': 9, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
      break;
    case 'stripeTee': {
      let st = '';
      for (let y = T + 30; y < B; y += 44) st += `M${-W - 10} ${y} h${2 * W + 20} v18 h${-2 * W - 20} Z `;
      o += S.path(st, { fill: c.stripe });
      if (!back) o += S.path(`M${f(cx - 36 * k)} ${T - 6} Q${f(cx)} ${T + 30} ${f(cx + 36 * k)} ${T - 6} Z`, outline(c.skin, 5));
      break;
    }
    case 'zipHoodie':
      if (!back) {
        o += S.path(`M${f(cx - 70 * k)} ${T - 6} Q${f(cx)} ${T + 34} ${f(cx + 70 * k)} ${T - 6}`, outline(c.topShade, 5));
        o += S.path(`M${f(cx)} ${T + 24} L${f(cx)} ${B}`, lineOnly(8, LINE)) + S.path(`M${f(cx)} ${T + 24} L${f(cx)} ${B}`, { ...lineOnly(3, '#D8DCE6'), 'stroke-dasharray': '4 4' });
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 30 * k)} -390 L${f(cx + sx * 80 * k)} -390 L${f(cx + sx * 80 * k)} -330`, lineOnly(4.5));
        o += S.path(`M${f(cx - 20 * k)} ${T + 16} L${f(cx - 24 * k)} -462 M${f(cx + 20 * k)} ${T + 16} L${f(cx + 24 * k)} -462`, lineOnly(5, c.trim || '#FFFFFF'));
      } else o += S.path(`M-74 ${T - 6} Q0 ${T + 70} 74 ${T - 6}`, outline(c.topShade, 5));
      o += hem(B, W, c.topShade);
      break;
    case 'plaid':
      o += plaidLines(W, T, B, c);
      if (!back) {
        o += S.path(`M${f(cx)} ${T + 20} L${f(cx)} ${B}`, lineOnly(4.5));
        for (const y of [-450, -400, -350]) o += S.circle(cx - 8, y, 5, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 2.5 });
        for (const sx of [-1, 1]) o += S.path(`M${f(cx + sx * 4)} ${T + 6} L${f(cx + sx * 46 * k)} ${T - 10} L${f(cx + sx * 38 * k)} ${T + 36} Z`, outline(c.topShade, 4.5));
      }
      break;
    case 'puffer': {
      let q = '';
      for (let y = T + 46; y < B; y += 46) q += `M${-W - 10} ${y} Q0 ${y + 10} ${W + 10} ${y} `;
      o += S.path(q, lineOnly(5, c.topShade));
      if (!back) {
        o += S.path(poly([[cx - 56 * k, T - 14], [cx + 56 * k, T - 14], [cx + 50 * k, T + 30], [cx - 50 * k, T + 30]], 10), outline(c.topShade, 5));
        o += S.path(`M${f(cx)} ${T + 30} L${f(cx)} ${B}`, lineOnly(5));
      }
      break;
    }
    default: break;
  }
  return o;
}
function whistleShape(x, y, s = 1, rot = 0) {
  return S.g(S.path('M-22 -14 L18 -14 Q30 -14 30 0 Q30 14 18 14 L-4 14 A16 16 0 0 1 -22 -14 Z', outline('#C9CED8', 4.5)) + S.rect(18, -20, 22, 12, 3, outline('#C9CED8', 4)) + S.circle(-6, 2, 6, { fill: LINE }) + S.path('M-14 -8 L12 -8', lineOnly(3, '#FFFFFF')),
    `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function crownPin(x, y, s = 1) {
  const d = `M${f(-24 * s)} ${f(14 * s)} L${f(-28 * s)} ${f(-14 * s)} L${f(-12 * s)} ${f(-2 * s)} L0 ${f(-22 * s)} L${f(12 * s)} ${f(-2 * s)} L${f(28 * s)} ${f(-14 * s)} L${f(24 * s)} ${f(14 * s)} Z`;
  return S.g(S.path(d, outline('#FFC93C', 4)) + S.circle(0, 6 * s, 4 * s, { fill: '#FF4D6D' }), `translate(${f(x)} ${f(y)})`);
}
function crest(x, y, s, col) {
  return S.g(S.path('M-26 -30 L26 -30 L26 4 Q26 26 0 36 Q-26 26 -26 4 Z', outline(col, 4)) + S.path('M-14 -12 L14 -12 M-14 4 L14 4', lineOnly(4, '#7A1E2E')) + S.path(F.starPath(0, -20, 6), { fill: '#FFFFFF' }), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// side-view torso details (inside the side torso clip); facing screen-left, front edge x0, back edge x1
function outfitSide4(style, x0, x1) {
  const c = style.col;
  let o = '';
  switch (style.top) {
    case 'cursorHoodie': o += S.path(`M${x1 - 70} -548 Q${x1 + 10} -540 ${x1 + 10} -460 Q${x1 - 30} -470 ${x1 - 60} -500 Z`, outline(c.topShade, 5)) + S.path(poly([[x0 - 10, -378], [x0 + 60, -378], [x0 + 60, -320], [x0 - 10, -320]], 10), outline(c.topShade, 5)) + hem(-306, 80, c.topShade); break;
    case 'tank': o += S.path(`M${x0 + 10} -545 L${x1 - 14} -545 Q${x1 - 30} -470 ${(x0 + x1) / 2} -450 Q${x0 + 30} -470 ${x0 + 10} -545 Z`, { fill: c.skin, stroke: LINE, 'stroke-width': 6 }) + hem(-306, 80, c.topShade); break;
    case 'wfhShirt': o += S.path(`M${x0 - 10} -548 L${x0 + 34} -548 L${x0 + 10} -506 Z`, outline(c.collar, 4.5)) + tieShape(x0 + 6, 0.5, -533, c.tie, null, 150) + S.path(`M${x0 - 10} -320 Q0 -330 ${x1 + 10} -320`, lineOnly(3.5, c.topShade)); break;
    case 'apronTop': o += S.path(poly([[x0 - 12, -490], [x0 + 18, -490], [x0 + 18, -290], [x0 - 12, -290]], 4), outline(c.apron, 5)) + S.path(`M${x0 + 10} -490 L${x1 - 20} -545`, lineOnly(16, LINE)) + S.path(`M${x0 + 10} -490 L${x1 - 20} -545`, lineOnly(9, c.apron)) + S.path(`M${x0} -330 L${x1 + 10} -330`, lineOnly(14, LINE)) + S.path(`M${x0} -330 L${x1 + 10} -330`, lineOnly(8, c.apron)); break;
    case 'grannyCard': o += S.path(`M${x0 - 10} -545 L${x0 + 26} -545 L${x0 + 4} -300 L${x0 - 10} -300 Z`, outline(c.topShade, 4.5)) + S.path(poly([[x0 + 20, -386], [x0 + 70, -386], [x0 + 70, -330], [x0 + 20, -330]], 6), outline(c.topShade, 4.5)) + hem(-306, 80, c.topShade); break;
    case 'oldCard': o += S.path(`M${x0 - 10} -545 L${x0 + 26} -545 L${x0 + 6} -300 L${x0 - 10} -300 Z`, outline(c.topShade, 4.5)) + S.rect(x0 + 4, -420, 12, 28, 6, outline(c.button || '#9A6A3E', 3.5)); break;
    case 'suit4': o += S.path(`M${x0 - 10} -545 L${x0 + 18} -545 L${x0 - 2} -440 L${x0 - 10} -440 Z`, { fill: c.shirt }) + S.path(`M${x0 + 18} -548 L${x0 + 46} -548 L${x0 + 20} -470 L${x0 + 34} -450 L${x0 - 2} -400 L${x0 - 10} -420 Z`, outline(c.topShade, 5)); break;
    case 'tracksuit': o += S.rect(-14, -545, 30, 260, 0, { fill: c.panel }) + S.path('M-14 -545 L-14 -290 M16 -545 L16 -290', lineOnly(4)) + S.path(poly([[x0 - 10, -552], [x1 - 30, -552], [x1 - 30, -514], [x0 - 10, -514]], 8), outline(c.topShade, 5)) + hem(-306, 80, c.topShade) + S.path(`M${x0 + 4} -514 Q${x0 - 4} -460 ${x0 + 2} -430`, lineOnly(11, LINE)) + S.path(`M${x0 + 4} -514 Q${x0 - 4} -460 ${x0 + 2} -430`, lineOnly(6, c.lanyard)); break;
    case 'codeRobe': o += codeRows(x0 - 10, x1 + 10, -520, -306, ADMIN.phase, 2, 22, 6) + S.rect(x0 - 10, -346, x1 - x0 + 20, 34, 0, { fill: c.gold }) + S.path(`M${x0 - 10} -346 L${x1 + 10} -346 M${x0 - 10} -312 L${x1 + 10} -312`, lineOnly(5)) + S.path(`M${x0 - 10} -545 L${x0 + 30} -545 L${x0 - 6} -440`, lineOnly(18, LINE)) + S.path(`M${x0 - 10} -545 L${x0 + 30} -545 L${x0 - 6} -440`, lineOnly(10, c.gold)); break;
    case 'raglan': o += S.path(`M${x0 - 10} -470 L${x0 + 40} -545 L${x1 + 10} -545 L${x1 + 10} -470 Z`, outline(c.sleeve, 5)); break;
    case 'stripeTee': { let st = ''; for (let y = -503; y < -306; y += 44) st += `M${x0 - 10} ${y} h${x1 - x0 + 20} v18 h${x0 - x1 - 20} Z `; o += S.path(st, { fill: c.stripe }); break; }
    case 'zipHoodie': o += S.path(`M${x1 - 70} -548 Q${x1 + 10} -540 ${x1 + 10} -460 Q${x1 - 30} -470 ${x1 - 60} -500 Z`, outline(c.topShade, 5)) + hem(-306, 80, c.topShade); break;
    case 'plaid': o += plaidLines(80, -545, -300, c); break;
    case 'puffer': { let q = ''; for (let y = -487; y < -306; y += 46) q += `M${x0 - 10} ${y} Q0 ${y + 10} ${x1 + 10} ${y} `; o += S.path(q, lineOnly(5, c.topShade)); break; }
    default: break;
  }
  return o;
}

// ====================================================================== EXTENSIONS: skirts, aprons, long cardigans, robes (over or under the legs)
// style.ext = { kind: 'skirt'|'apron'|'coat'|'robe', top, len, flare, col, shade, trim, under }
function extFront(style, t, shade, back) {
  const e = style.ext, c = style.col;
  if (!e) return '';
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  const W = style.torsoW || 100;
  const y0 = e.top ?? -330, y1 = y0 + e.len;
  let o = '';
  if (e.kind === 'apron') {
    if (back) return '';
    const d = poly([[cx - 82 * k, y0], [cx + 82 * k, y0], [cx + (82 + e.flare) * k, y1], [cx - (82 + e.flare) * k, y1]], 12);
    let inner = S.path(poly([[cx - 60 * k, y0 + 60], [cx + 60 * k, y0 + 60], [cx + 62 * k, y0 + 120], [cx - 62 * k, y0 + 120]], 8), outline(e.col, 4.5)) + S.path(`M${f(cx)} ${y0 + 60} L${f(cx)} ${y0 + 120}`, lineOnly(4));
    inner += S.path(poly([[cx - 74 * k, y0 + 6], [cx + 74 * k, y0 + 6], [cx + (74 + e.flare) * k, y1 - 8], [cx - (74 + e.flare) * k, y1 - 8]], 8), { fill: 'none', stroke: e.trim, 'stroke-width': 3.5, 'stroke-dasharray': '7 6' });
    if (shade) inner += S.rect(cx - 100 * k, y1 - 26, 200 * k, 30, 0, { fill: '#000', opacity: 0.1 });
    o += clipped(d, e.col, inner);
    o += sticky(cx + 34 * k, y0 + 70, 0.5, -10, 'MILK') + sticky(cx - 40 * k, y0 + 132, 0.42, 14, null);
    o += S.path(`M${-W - 6} ${y0 - 4} L${W + 6} ${y0 - 4}`, lineOnly(16, LINE)) + S.path(`M${-W - 6} ${y0 - 4} L${W + 6} ${y0 - 4}`, lineOnly(9, e.col));
    return o;
  }
  const wTop = W + (e.inset || 0), wBot = W + e.flare;
  const d = e.kind === 'robe'
    ? `M${-wTop} ${y0} L${wTop} ${y0} L${wBot} ${y1 - 10} Q${f(wBot * 0.5)} ${y1 + 8} 0 ${y1} Q${f(-wBot * 0.5)} ${y1 + 8} ${-wBot} ${y1 - 10} Z`
    : poly([[-wTop, y0], [wTop, y0], [wBot, y1], [-wBot, y1]], 14);
  let inner = '';
  if (e.kind === 'robe') {
    inner += codeRows(-wBot, wBot, y0 + 30, y1, ADMIN.phase + 7, back ? 5 : 4, 26, 7);
    if (!back) inner += S.rect(cx - 30 * k, y0, 60 * k, e.len + 20, 0, { fill: e.inner || c.inner }) + S.path(`M${f(cx - 30 * k)} ${y0} L${f(cx - 30 * k)} ${y1 + 10} M${f(cx + 30 * k)} ${y0} L${f(cx + 30 * k)} ${y1 + 10}`, lineOnly(16, LINE)) + S.path(`M${f(cx - 30 * k)} ${y0} L${f(cx - 30 * k)} ${y1 + 10} M${f(cx + 30 * k)} ${y0} L${f(cx + 30 * k)} ${y1 + 10}`, lineOnly(8, c.gold));
    inner += S.rect(-wBot - 20, y1 - 34, 2 * wBot + 40, 60, 0, { fill: c.gold }) + S.path(`M${-wBot - 20} ${y1 - 34} Q0 ${y1 - 18} ${wBot + 20} ${y1 - 34}`, lineOnly(5));
    if (shade) for (const x of [-0.55, 0.55]) inner += S.path(`M${f(x * wTop)} ${y0 + 20} L${f(x * wBot)} ${y1 - 40}`, lineOnly(6, '#D6D2E4'));
  } else if (e.kind === 'skirt') {
    if (shade) inner += S.rect(-wBot - 10, y1 - 24, 2 * wBot + 20, 30, 0, { fill: '#000', opacity: 0.1 });
    for (const x of [-0.5, 0, 0.5]) inner += S.path(`M${f(cx + x * wTop * 0.8)} ${y0 + 10} L${f(cx + x * wBot * 0.9)} ${y1}`, lineOnly(4, e.shade));
    if (e.trim) inner += S.rect(-wBot - 10, y1 - 22, 2 * wBot + 20, 12, 0, { fill: e.trim });
  } else if (e.kind === 'coat') {
    if (!back) {
      inner += S.rect(cx - 40 * k, y0, 80 * k, e.len, 0, { fill: c.pants }) + S.path(`M${f(cx - 40 * k)} ${y0} L${f(cx - 36 * k)} ${y1} M${f(cx + 40 * k)} ${y0} L${f(cx + 36 * k)} ${y1}`, lineOnly(5));
      for (const sx of [-1, 1]) inner += S.path(poly([[cx + sx * 54 * k, y0 + 16], [cx + sx * 96 * k, y0 + 16], [cx + sx * 98 * k, y0 + 60], [cx + sx * 54 * k, y0 + 60]], 6), outline(e.shade, 4.5));
    }
    let rib = '';
    for (let x = -wBot; x < wBot; x += 22) rib += `M${x} ${y0} L${x} ${y1} `;
    inner += S.path(rib, lineOnly(2.5, e.shade)) + S.rect(-wBot - 10, y1 - 22, 2 * wBot + 20, 24, 0, { fill: e.shade }) + S.path(`M${-wBot - 10} ${y1 - 22} L${wBot + 10} ${y1 - 22}`, lineOnly(4));
  }
  o += clipped(d, e.col, inner);
  // the old man's secret: a tiny golden crown pin on his cardigan pocket
  if (e.pin && !back) o += crownPin(cx + 76 * k, y0 + 12, 0.7);
  return o;
}
function extSide(style, x0, x1) {
  const e = style.ext, c = style.col;
  if (!e) return '';
  const y0 = e.top ?? -330, y1 = y0 + e.len;
  if (e.kind === 'apron') return S.path(poly([[x0 - 14, y0], [x0 + 16, y0], [x0 + 16 - e.flare * 0.5, y1], [x0 - 14 - e.flare * 0.6, y1]], 6), outline(e.col, 5));
  const d = e.kind === 'robe'
    ? `M${x0 - 8} ${y0} L${x1 + 8} ${y0} L${x1 + e.flare * 0.9} ${y1 - 6} Q${(x0 + x1) / 2} ${y1 + 10} ${x0 - e.flare * 0.7} ${y1 - 6} Z`
    : poly([[x0 - 8, y0], [x1 + 8, y0], [x1 + e.flare * 0.7, y1], [x0 - e.flare * 0.6, y1]], 14);
  let inner = '';
  if (e.kind === 'robe') inner += codeRows(x0 - e.flare, x1 + e.flare, y0 + 30, y1, ADMIN.phase + 3, 6, 26, 7) + S.rect(x0 - e.flare - 10, y1 - 34, x1 - x0 + 2 * e.flare + 20, 60, 0, { fill: c.gold }) + S.path(`M${x0 - e.flare - 10} ${y1 - 34} L${x1 + e.flare + 10} ${y1 - 34}`, lineOnly(5)) + S.path(`M${x0 + 4} ${y0} L${x0 - e.flare * 0.6 + 6} ${y1}`, lineOnly(16, LINE)) + S.path(`M${x0 + 4} ${y0} L${x0 - e.flare * 0.6 + 6} ${y1}`, lineOnly(8, c.gold));
  else if (e.kind === 'skirt') { inner += S.path(`M0 ${y0 + 10} L10 ${y1}`, lineOnly(4, e.shade)); if (e.trim) inner += S.rect(x0 - e.flare, y1 - 22, x1 - x0 + 2 * e.flare, 12, 0, { fill: e.trim }); }
  else if (e.kind === 'coat') { let rib = ''; for (let x = x0 - 40; x < x1 + 40; x += 22) rib += `M${x} ${y0} L${x} ${y1} `; inner += S.path(rib, lineOnly(2.5, e.shade)) + S.rect(x0 - e.flare, y1 - 22, x1 - x0 + 2 * e.flare, 24, 0, { fill: e.shade }) + S.path(poly([[x0 + 4, y0 + 16], [x0 + 50, y0 + 16], [x0 + 50, y0 + 60], [x0 + 4, y0 + 60]], 6), outline(e.shade, 4.5)); }
  return clipped(d, e.col, inner);
}

// ====================================================================== TORSO
function makeTorso4(style) {
  const c = style.col;
  const W = style.torsoW || 100, Wb = W - (style.taper || 0);
  return function torso(t, shade, back = false) {
    const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
    const T = -533, B = -306;
    let o = '';
    if (style.top === 'codeRobe') o += adminCollar(t, back, c);
    if (style.ext && style.ext.under) o += extFront(style, t, shade, back);
    const id = S.uid('t4');
    const d = poly([[-W, T], [W, T], [Wb, B], [-Wb, B]], 16);
    let inner = outfit4(style, t, shade, back, T, B, W);
    if (shade) {
      inner += S.rect(-W - 10, B - 26, 2 * W + 20, 30, 0, { fill: '#000', opacity: 0.1 });
      if (at > 0.02) inner += S.rect(dir > 0 ? -W - 10 : W - 34 * at, T - 10, 34 * at + 10, B - T + 20, 0, { fill: '#000', opacity: 0.22 });
    }
    o += S.clipDef(id, S.path(d)) + S.path(d, { fill: c.top }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    if (style.ext && !style.ext.under) o += extFront(style, t, shade, back);
    if (style.top === 'codeRobe' && back) o += adminCapeBack(c);
    return o;
  };
}
function makeTorsoSide4(style) {
  const c = style.col;
  const k = (style.torsoW || 100) / 100;
  const x0 = -62 * k, x1 = 70 * k;
  return function torsoSide(shade) {
    let o = '';
    if (style.top === 'codeRobe') o += adminCollarSide(c);
    if (style.ext && style.ext.under) o += extSide(style, x0, x1);
    const td = S.roundedPath([[x0, -535], [x1, -535], [x1, -305], [x0, -305]], 16);
    const tid = S.uid('ts4');
    let inner = S.rect(x0 - 18, -545, 40, 260, 0, { fill: c.topShade || c.top, opacity: 0.6 }) + outfitSide4(style, x0, x1);
    if (shade) inner += S.rect(x0 - 10, -330, x1 - x0 + 20, 30, 0, { fill: '#000', opacity: 0.12 });
    o += S.clipDef(tid, S.path(td)) + S.path(td, { fill: c.top }) + S.g(inner, null, { 'clip-path': `url(#${tid})` }) + S.path(td, outline('none'));
    if (style.ext && !style.ext.under) o += extSide(style, x0, x1);
    if (style.top === 'tracksuit' && !style.whistleUp) o += whistleShape(x0 - 4, -420, 0.9, 80);
    return o;
  };
}

// ====================================================================== ARMS: width, fists, bell sleeves, track stripes, elbow patches
function makeArm4(style) {
  const c = style.col;
  const kw = style.armW || 1;
  return function arm({ shade = true, dim = false, view = 'front' } = {}) {
    const side = view === 'side';
    const hw0 = (side ? 40 : 30) * kw, hw1 = 40 * kw, len = side ? 248 : 268;
    let o = '';
    if (style.sleeve === 'bell') {
      // the Admin: glowing hand under a flared code sleeve with a gold cuff
      o += S.path(S.roundedPath([[-30, 160], [30, 160], [36, len + 4], [-36, len + 4]], 18), outline(c.skin));
      o += S.path(S.roundedPath([[-14, len - 26], [14, len - 26], [14, len - 4], [-14, len - 4]], 8), { fill: '#FFFFFF' });
      const sd = `M${-hw0 - 2} -20 L${hw0 + 2} -20 L${hw1 + 34} ${len - 66} Q0 ${len - 46} ${-hw1 - 34} ${len - 66} Z`;
      let inner = codeRows(-hw1 - 40, hw1 + 40, 6, len - 80, ADMIN.phase + 11, side ? 9 : 8, 22, 6);
      inner += S.path(`M${-hw1 - 40} ${len - 92} Q0 ${len - 70} ${hw1 + 40} ${len - 92} L${hw1 + 40} ${len} L${-hw1 - 40} ${len} Z`, { fill: c.gold });
      inner += S.path(`M${-hw1 - 40} ${len - 92} Q0 ${len - 70} ${hw1 + 40} ${len - 92}`, lineOnly(5));
      if (shade) inner += S.rect(16, -40, 80, 330, 0, { fill: '#5A4A8A', opacity: 0.08 });
      if (dim) inner += S.rect(-100, -40, 200, 330, 0, { fill: '#000', opacity: 0.12 });
      return o + clipped(sd, c.sleeve, inner);
    }
    const id = S.uid('a4');
    const d = S.roundedPath([[-hw0, -18], [hw0, -18], [hw1, len], [-hw1, len]], 17);
    const sleeveY = style.sleeve === 'long' ? (side ? 206 : 226) : style.sleeve === 'none' ? -40 : (side ? 100 : 112);
    const sc = c.sleeve || c.top;
    let inner = '';
    if (style.sleeve !== 'none') {
      inner += S.rect(-hw1 - 6, -30, 2 * hw1 + 12, sleeveY + 30, 0, { fill: sc });
      if (style.trackStripe) inner += S.rect(side ? -8 : 8 * kw, -40, 10, sleeveY + 40, 0, { fill: style.trackStripe }) + S.rect(side ? 8 : 24 * kw, -40, 10, sleeveY + 40, 0, { fill: style.trackStripe });
      if (style.elbowPatch) inner += S.ellipse(side ? 0 : -4, 140, 22 * kw, 30, outline(style.elbowPatch, 4));
      if (style.sleeve === 'long') inner += S.rect(-hw1 - 6, sleeveY - 18, 2 * hw1 + 12, 18, 0, { fill: c.cuff || c.topShade || '#0003' }) + S.path(`M${-hw1 - 6} ${sleeveY - 18} L${hw1 + 6} ${sleeveY - 18}`, lineOnly(4.5));
      if (style.sleeve === 'short' && style.sleeveTrim) inner += S.rect(-hw1 - 6, sleeveY - 14, 2 * hw1 + 12, 14, 0, { fill: style.sleeveTrim });
    }
    if (shade) inner += S.rect((side ? 22 : 20) * kw, -30, 24 * kw, len + 30, 0, { fill: '#000', opacity: 0.07 });
    if (style.sleeve !== 'none') inner += S.path(`M${-hw1 - 6} ${sleeveY} L${hw1 + 6} ${sleeveY}`, lineOnly(SW));
    if (dim) inner += S.path(d, { fill: '#000', opacity: 0.14 });
    o += S.clipDef(id, S.path(d)) + S.path(d, { fill: c.skin }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, outline('none'));
    if (style.fist) {
      // a big blocky "brick" fist
      const fw = (side ? 50 : 52) * kw, f0 = len - 74, f1 = len + 22;
      const fd = S.roundedPath([[-fw, f0], [fw, f0], [fw + 2, f1], [-fw - 2, f1]], 18);
      let fi = '';
      if (shade) fi += S.rect(fw * 0.35, f0 - 10, fw, 120, 0, { fill: c.skinShade, opacity: 0.8 });
      if (dim) fi += S.rect(-100, f0 - 10, 200, 140, 0, { fill: '#000', opacity: 0.14 });
      o += clipped(fd, c.skin, fi);
      const kn = side ? `M${-fw + 10} ${f1 - 30} L${-fw + 30} ${f1 - 30} M${-fw + 6} ${f1 - 58} L${-fw + 28} ${f1 - 58}` : `M${-fw * 0.34} ${f1 - 4} L${-fw * 0.34} ${f1 - 26} M${fw * 0.02} ${f1 - 4} L${fw * 0.02} ${f1 - 28} M${fw * 0.38} ${f1 - 4} L${fw * 0.38} ${f1 - 26} M${-fw + 10} ${f0 + 24} Q${-fw * 0.2} ${f0 + 40} ${fw * 0.2} ${f0 + 22}`;
      o += S.path(kn, lineOnly(4.5, c.skinShade2 || '#9A6A4E'));
    }
    return o;
  };
}

// ====================================================================== LEGS: width, patterns (ducks, side stripe), tights, shoe kinds
const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul2 = (a, k) => [a[0] * k, a[1] * k];
function duck(x, y, s = 1, flipX = 1) {
  return S.g(S.ellipse(0, 4, 16, 11, { fill: '#FFD43B', stroke: LINE, 'stroke-width': 3 }) + S.circle(10, -8, 8, { fill: '#FFD43B', stroke: LINE, 'stroke-width': 3 }) + S.path('M16 -9 L26 -6 L16 -3 Z', { fill: '#FF8A1F', stroke: LINE, 'stroke-width': 2 }) + S.circle(12, -10, 1.8, { fill: LINE }),
    `translate(${f(x)} ${f(y)}) scale(${f(s * flipX)} ${f(s)})`);
}
function legBody4(style, J, wOut, wIn, shade, dim, sideView) {
  const c = style.col;
  const Lb = bentLimb(J, wOut, wIn, 24);
  const id = S.uid('lg4');
  let inner = '';
  if (shade) {
    const a = add2(J.hip, mul2(Lb.u1, -40)), b = add2(J.hip, mul2(Lb.u1, 44)), wq = Math.max(wOut[0], wIn[0]) + 14;
    inner += S.path(`M${P(add2(a, mul2(Lb.n1, -wq)))} L${P(add2(a, mul2(Lb.n1, wq)))} L${P(add2(b, mul2(Lb.n1, wq)))} L${P(add2(b, mul2(Lb.n1, -wq)))} Z`, { fill: c.pantsShade });
  }
  if (style.pattern === 'ducks') {
    const pts = [[0.35, 1, 0.2], [0.75, 1, -0.35], [0.4, 2, 0.15], [0.85, 2, -0.2]];
    for (const [u, seg, off] of pts) {
      const A = seg === 1 ? J.hip : J.knee, Bq = seg === 1 ? J.knee : J.ankle, n = seg === 1 ? Lb.n1 : Lb.n2;
      const p = add2(add2(A, mul2(add2(Bq, mul2(A, -1)), u)), mul2(n, off * 50));
      inner += duck(p[0], p[1], 0.9, sideView ? -1 : 1);
    }
  }
  if (style.pattern === 'stripe') {
    const off = sideView ? 0 : (wOut[1] - 16);
    const d = `M${P(add2(J.hip, mul2(Lb.n1, off)))} L${P(add2(J.knee, mul2(Lb.n1, off)))} L${P(add2(J.ankle, mul2(Lb.n2, off)))}`;
    inner += S.path(d, lineOnly(10, style.stripeCol || '#FFFFFF')) + S.path(`M${P(add2(J.hip, mul2(Lb.n1, off - 16)))} L${P(add2(J.knee, mul2(Lb.n1, off - 16)))} L${P(add2(J.ankle, mul2(Lb.n2, off - 16)))}`, lineOnly(10, style.stripeCol || '#FFFFFF'));
  }
  if (style.cuffCol) {
    const a = add2(J.ankle, mul2(Lb.u2, -40));
    const wc = Math.max(wOut[2], wIn[2]) + 10;
    inner += S.path(`M${P(add2(a, mul2(Lb.n2, -wc)))} L${P(add2(a, mul2(Lb.n2, wc)))} L${P(add2(J.ankle, mul2(Lb.n2, wc)))} L${P(add2(J.ankle, mul2(Lb.n2, -wc)))} Z`, { fill: style.cuffCol });
  }
  if (dim) inner += S.path(Lb.d, { fill: '#000', opacity: 0.25 });
  let o = S.clipDef(id, S.path(Lb.d)) + S.path(Lb.d, { fill: c.pants }) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  if (Lb.crease) o += S.path(Lb.crease, lineOnly(5));
  o += S.path(Lb.d, outline('none'));
  if (style.cuffCol) { const a = add2(J.ankle, mul2(Lb.u2, -40)); o += S.path(`M${P(add2(a, mul2(Lb.n2, wOut[2] + 2)))} L${P(add2(a, mul2(Lb.n2, -wIn[2] - 2)))}`, lineOnly(5)); }
  const cid = S.uid('cf4');
  const cut = S.clipDef(cid, S.el('rect', { x: -700, y: -1400, width: 1400, height: 1408, transform: `translate(${P(J.ankle)}) rotate(${f(J.foot)})` }));
  return cut + S.g(o, null, { 'clip-path': `url(#${cid})` });
}
function shoe4(style, { x0, x1, back, dim, shade, toeCx, side }) {
  const c = style.col;
  const kind = style.shoe || 'sneaker';
  const sole = dim ? c.soleShade : c.sole;
  let s = '';
  if (kind === 'fluffy') {
    // fluffy slipper with a pom-pom
    const d = S.roundedPath([[x0 - 4, -12], [x1 + 4, -12], [x1 + 4, 40], [x0 - 4, 40]], 22);
    s += S.path(d, outline(sole));
    s += S.path(`M${x0 - 2} 30 L${x1 + 2} 30`, lineOnly(6, c.soleShade));
    let fl = '';
    for (let x = x0 + 4; x < x1; x += 22) fl += `M${x} -10 a12 12 0 0 1 22 0 `;
    s += S.path(fl, { fill: c.toe, stroke: LINE, 'stroke-width': 4.5 });
    if (!back) s += S.circle(toeCx + (side ? 0 : 6), -16, 15, outline(c.pom || '#FFFFFF', 4.5));
    return s;
  }
  if (kind === 'slipper') {
    const d = S.roundedPath([[x0, -6], [x1, -6], [x1, 40], [x0, 40]], 20);
    s += S.path(d, outline(sole));
    s += S.path(`M${x0 + 6} 30 L${x1 - 6} 30`, lineOnly(6, c.soleShade));
    if (!back) s += S.path(`M${f(toeCx - 34)} 4 Q${f(toeCx)} -14 ${f(toeCx + 34)} 4`, lineOnly(5, c.toe));
    return s;
  }
  if (kind === 'boot') {
    s += S.path(S.roundedPath([[x0, -40], [x1 - 6, -40], [x1, 40], [x0, 40]], 16), outline(sole));
    s += S.path(`M${x0 + 4} -24 L${x1 - 4} -24`, lineOnly(10, c.toe));
    if (shade) s += S.path(`M${x0 + 6} 30 L${x1 - 6} 30`, lineOnly(6, c.soleShade));
    return s;
  }
  if (kind === 'hightop') {
    const cx0 = side ? -52 : x0 + 2, cx1 = side ? 62 : x0 + 98;
    s += S.path(S.roundedPath([[cx0 + 4, -62], [cx1 - 4, -62], [cx1, 2], [cx0, 2]], 12), outline(dim ? c.collarDim || c.collar : c.collar));
    s += S.path(`M${(cx0 + cx1) / 2 - 16} -50 l32 12 M${(cx0 + cx1) / 2 + 16} -50 l-32 12 M${(cx0 + cx1) / 2 - 16} -28 l32 12 M${(cx0 + cx1) / 2 + 16} -28 l-32 12`, lineOnly(5, '#FFFFFF'));
  }
  const soleD = S.roundedPath([[x0, kind === 'chunky' ? -10 : -4], [x1, kind === 'chunky' ? -10 : -4], [x1, 42], [x0, 42]], kind === 'dress' ? 18 : 14);
  s += S.path(soleD, outline(sole));
  if (c.soleBand) s += S.path(S.roundedPath([[x0 + 4, 10], [x1 - 4, 10], [x1 - 4, 26], [x0 + 4, 26]], 6), { fill: c.soleBand }) + S.path(soleD, outline('none'));
  if (shade) s += S.path(`M${x0 + 6} 32 L${x1 - 6} 32`, lineOnly(6, c.soleShade));
  if (kind === 'dress') {
    if (!back) s += S.path(`M${f(toeCx - 24)} 2 Q${f(toeCx)} -8 ${f(toeCx + 24)} 2`, lineOnly(5, '#FFFFFF88'));
    return s;
  }
  if (!back) {
    const r = kind === 'chunky' ? 48 : 42;
    s += S.path(`M${f(toeCx - r)} -2 A${r} ${r * 0.88} 0 0 1 ${f(toeCx + r)} -2 Z`, outline(c.toe));
    if (c.toe !== c.sole) s += S.path(`M${f(toeCx - 22)} -18 Q${f(toeCx)} -30 ${f(toeCx + 22)} -18`, lineOnly(4.5, '#fff'));
  }
  if (kind === 'chunky' && c.swoosh) s += S.path(side ? 'M-30 20 Q10 26 60 0' : `M${x0 + 10} 20 Q${(x0 + x1) / 2} 26 ${x1 - 10} 4`, lineOnly(7, c.swoosh));
  return s;
}
function makeLeg4(style) {
  const kw = style.legW || 1;
  return function leg({ shade = true, dim = false, toeShift = 0, back = false, J } = {}) {
    const straight = style.pantsShape !== 'wide';
    const wOut = (straight ? [42, 46, 54] : [42, 74, 103]).map((v) => v * kw), wIn = [40, 40, 40].map((v) => v * kw);
    let o = legBody4(style, J, wOut, wIn, shade, dim, false);
    const x1 = (straight ? 94 : 107) * kw + (style.shoe === 'chunky' ? 10 : 0), x0 = -44 * kw - (style.shoe === 'chunky' ? 6 : 0);
    const s = shoe4(style, { x0, x1, back, dim, shade, toeCx: (straight ? 24 : 30) * kw + toeShift, side: false });
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}
function makeLegSide4(style) {
  const c = style.col;
  const kw = style.legW || 1;
  return function legSide({ shade = true, dim = false, J } = {}) {
    const straight = style.pantsShape !== 'wide';
    const wOut = (straight ? [62, 64, 68] : [64, 74, 85]).map((v) => v * kw), wIn = (straight ? [56, 58, 62] : [58, 69, 80]).map((v) => v * kw);
    let o = legBody4(style, J, wOut, wIn, shade, dim, true);
    const sc = { ...style, col: { ...c, toe: c.toe === c.sole ? (dim ? c.soleShade : c.sole) : c.toe } };
    const ext = style.shoe === 'chunky' ? 14 : 0;
    const s = shoe4(sc, { x0: -138 * kw - ext, x1: 88 * kw, back: false, dim, shade, toeCx: -86 * kw - ext, side: true });
    return o + S.g(s, `translate(${P(J.ankle)}) rotate(${f(J.foot)})`);
  };
}

// ====================================================================== THE ADMIN: collar, light head, crown, cape, aura
function adminCollar(t, back, c) {
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1, cx = dir * at * 24;
  const d = back
    ? `M-150 -500 L-170 -640 Q0 -600 170 -640 L150 -500 Z`
    : `M${f(cx - 150)} -500 L${f(cx - 180)} -650 Q${f(cx - 100)} -600 ${f(cx - 70)} -540 L${f(cx + 70)} -540 Q${f(cx + 100)} -600 ${f(cx + 180)} -650 L${f(cx + 150)} -500 Z`;
  return clipped(d, c.sleeve, codeRows(-200, 200, -640, -500, ADMIN.phase + 5, 12, 20, 5) + S.path(back ? 'M-170 -640 Q0 -600 170 -640' : `M${f(cx - 180)} -650 Q${f(cx - 100)} -600 ${f(cx - 70)} -540 M${f(cx + 70)} -540 Q${f(cx + 100)} -600 ${f(cx + 180)} -650`, lineOnly(16, c.gold)));
}
function adminCollarSide(c) {
  const d = 'M-30 -500 L100 -500 L150 -660 Q60 -610 -10 -560 Z';
  return clipped(d, c.sleeve, codeRows(-40, 160, -650, -500, ADMIN.phase + 5, 13, 20, 5) + S.path('M150 -660 Q60 -610 -10 -560', lineOnly(16, c.gold)));
}
// glowing gold eye (no pupils): shape follows the expression's eye spec
function lightEye(cx, cy, rx, ry, spec, side, pulse) {
  const type = spec.type || 'open';
  const gold = '#FFC23A', hot = '#FFF6D0';
  const glow = (d) => S.path(d, { fill: 'none', stroke: '#FFD45A', 'stroke-width': 26, opacity: 0.35, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) + S.path(d, { fill: 'none', stroke: gold, 'stroke-width': 13, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) + S.path(d, { fill: 'none', stroke: hot, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  if (type === 'happy') return glow(`M${f(cx - rx * 0.8)} ${f(cy + 12)} Q${f(cx)} ${f(cy - ry * 1.1)} ${f(cx + rx * 0.8)} ${f(cy + 12)}`);
  if (type === 'closed') return glow(`M${f(cx - rx * 0.85)} ${f(cy)} Q${f(cx)} ${f(cy + 20)} ${f(cx + rx * 0.85)} ${f(cy)}`);
  if (type === 'squint') { const k = -side; return glow(`M${f(cx - k * rx * 0.6)} ${f(cy - 30)} L${f(cx + k * rx * 0.5)} ${f(cy)} L${f(cx - k * rx * 0.6)} ${f(cy + 30)}`); }
  if (type === 'x') { const a = rx * 0.5; return glow(`M${f(cx - a)} ${f(cy - a)} L${f(cx + a)} ${f(cy + a)} M${f(cx + a)} ${f(cy - a)} L${f(cx - a)} ${f(cy + a)}`); }
  if (type === 'swirl') { let d = `M${f(cx)} ${f(cy)}`; for (let i = 1; i <= 30; i++) { const u = i / 30, a = u * 2.4 * Math.PI * 2; d += ` L${f(cx + Math.cos(a) * rx * 0.8 * u)} ${f(cy + Math.sin(a) * ry * 0.7 * u)}`; } return glow(d); }
  if (['star', 'heart', 'robux', 'coin'].includes(type)) {
    const d = type === 'heart' ? F.heartPath(cx, cy, rx * 0.62) : F.starPath(cx, cy, rx * 0.9);
    return S.path(d, { fill: '#FFD45A', opacity: 0.35, stroke: '#FFD45A', 'stroke-width': 22, 'stroke-linejoin': 'round' }) + S.path(d, { fill: type === 'heart' ? '#FF7FA0' : gold, stroke: '#FFF0B0', 'stroke-width': 5, 'stroke-linejoin': 'round' });
  }
  // open: almond of light cut by the lids
  const k = S.clamp(spec.pupil ?? 1, 0.4, 1.8);
  const RX = rx * (0.9 + 0.12 * k), RY = ry * (k < 0.8 ? 1.25 : 0.85 + 0.15 * k) * (1 + 0.08 * pulse);
  const look = spec.look || [0, 0];
  const ex = cx + look[0] * 10, ey = cy + look[1] * 8;
  const up = S.clamp(spec.upper || 0, 0, 1), lo = S.clamp(spec.lower || 0, 0, 1), tU = spec.tilt || 0, inner = -side;
  const yU = (x) => ey - RY + 2 * RY * up + tU * ((x - ex) / RX) * inner;
  const yL = ey + RY - 2 * RY * lo;
  const pts = [];
  for (let i = 0; i <= 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const x = ex + Math.cos(a) * RX;
    let y = ey + Math.sin(a) * RY;
    y = Math.max(y, yU(x));
    y = Math.min(y, yL);
    pts.push([x, y]);
  }
  if (Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1])) < 8) return glow(`M${f(ex - RX * 0.85)} ${f(yL)} L${f(ex + RX * 0.85)} ${f(yL)}`);
  const d = 'M' + pts.map(P).join(' L') + ' Z';
  let o = S.path(d, { fill: '#FFD45A', opacity: 0.32 + 0.2 * pulse, stroke: '#FFD45A', 'stroke-width': 26 + 14 * pulse, 'stroke-linejoin': 'round' });
  o += S.path(d, { fill: gold, stroke: '#E89A12', 'stroke-width': 5, 'stroke-linejoin': 'round' });
  const core = pts.map(([x, y]) => [ex - RX * 0.12 + (x - ex) * 0.42, ey - RY * 0.12 + (y - ey) * 0.42]);
  o += S.path('M' + core.map(P).join(' L') + ' Z', { fill: hot, opacity: 0.95 });
  return o;
}
const MOUTH_OPEN = { B: 0.3, C: 0.5, D: 0.8, E: 0.62, F: 0.34, G: 0.2, H: 0.5, o: 0.4, O: 0.78, grin: 0.5, bigGrin: 0.82, scream: 1, wail: 0.9, yawn: 0.8, teeth: 0.36, uh: 0.25, tongue: 0.3 };
const FX_OK = ['question', 'exclaim', 'anger', 'sparkles', 'zzz', 'hearts', 'steam'];
function crownFront(hair, feat, c, plaque = true) {
  const pts = [[-150, -880], [-158, -1000], [-104, -950], [-56, -1046], [0, -982], [56, -1046], [104, -950], [158, -1000], [150, -880]].map(hair);
  let o = S.path(poly(pts, 6), outline(c.gold, 7));
  o += S.path(`M${P(hair([-140, -960]))} L${P(hair([-130, -900]))} M${P(hair([-60, -1010]))} L${P(hair([-56, -960]))}`, lineOnly(7, '#FFF0B0'));
  for (const [x, y, col] of [[-158, -1000, '#4FD1FF'], [-56, -1046, '#FF4D6D'], [56, -1046, '#FF4D6D'], [158, -1000, '#4FD1FF']]) { const p = hair([x, y]); o += S.circle(p[0], p[1], 15, outline(col, 5)) + S.circle(p[0] - 4, p[1] - 4, 4, { fill: '#FFFFFF' }); }
  o += S.path(mapPoly(hair, [[-162, -930], [162, -930], [162, -872], [-162, -872]], 10), outline(c.goldShade, 7));
  if (plaque) {
    const m = feat([0, -902]);
    const w = 108 * (1 - 0.15 * Math.abs(feat([0, 0])[0]) / 40);
    o += S.rect(m[0] - w, m[1] - 25, 2 * w, 50, 12, { fill: '#221D44', stroke: '#FFE58A', 'stroke-width': 5 });
    o += txt('ADMIN', m[0], m[1] + 15, 42, '#FFD45A', { textLength: f(w * 1.6), lengthAdjust: 'spacingAndGlyphs' });
  } else {
    for (const x of [-100, 0, 100]) { const p = hair([x, -901]); o += S.circle(p[0], p[1], 10, outline('#4FD1FF', 4)); }
  }
  return o;
}
function lightBlock(x0, x1, y0, y1, r, pulse, t = 0) {
  // flat halo layers + a cheap vertical linear gradient (radial gradients are far too slow to rasterise at size)
  const id = S.uid('alg');
  let o = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#FFFCEF"/><stop offset="1" stop-color="#FFEAB0"/></linearGradient>`;
  const sh = 3 * Math.sin(t * 5);
  for (const [g, op] of [[58 + sh, 0.12 + 0.08 * pulse], [34, 0.2 + 0.1 * pulse], [14, 0.42]]) o += S.path(S.roundedPath([[x0 - g, y0 - g], [x1 + g, y0 - g], [x1 + g, y1 + g], [x0 - g, y1 + g]], r + g), { fill: '#FFE7A0', opacity: f(op) });
  o += S.path(S.roundedPath([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], r), { fill: `url(#${id})`, stroke: '#FFE58A', 'stroke-width': 6 });
  o += S.path(S.roundedPath([[x0 + 40, y0 + 34], [x1 - 40, y0 + 34], [x1 - 40, y1 - 40], [x0 + 40, y1 - 40]], r), { fill: '#FFFFFF', opacity: 0.85 });
  return o;
}
// the Admin's head: drawn in the design's `over` hook (no volume filter): (face, turn, shade, view)
function adminHead(face, t, shade, view) {
  const c = { gold: '#FFC93C', goldShade: '#E7A21A' };
  const fr = F.resolveFace(face);
  const mouth = face && typeof face === 'object' ? face.mouth : null;
  const pulse = MOUTH_OPEN[mouth] || 0;
  const blink = fr.blink || 0;
  const withBlink = (e) => (blink > 0 && (!e.type || e.type === 'open') ? { ...e, upper: (e.upper || 0) + (1 - (e.upper || 0)) * blink } : e);
  const tt = ADMIN.phase;
  if (view === 'back') {
    return lightBlock(-140, 140, -890, -559, 46, pulse * 0.5, tt) + crownFront(ID, ID, c, false);
  }
  if (view === 'side') {
    let o = lightBlock(-165, 150, -885, -553, 44, pulse, tt);
    o += lightEye(-120, -712, 34, 46, withBlink(fr.eyeL), 1, pulse);
    const pts = [[-162, -878], [-170, -998], [-120, -950], [-60, -1046], [10, -982], [70, -1046], [120, -950], [158, -996], [150, -876]];
    o += S.path(poly(pts, 6), outline(c.gold, 7)) + S.path(poly([[-174, -930], [162, -930], [162, -872], [-174, -872]], 10), outline(c.goldShade, 7));
    o += S.rect(-188, -926, 40, 48, 10, { fill: '#221D44', stroke: '#FFE58A', 'stroke-width': 5 }) + S.circle(-60, -1046, 14, outline('#FF4D6D', 5)) + S.circle(70, -1046, 14, outline('#FF4D6D', 5));
    o += F.faceFx((fr.fx || []).filter((x) => FX_OK.includes(typeof x === 'string' ? x : x.type)), { fx: 0 });
    return o;
  }
  const { hair, feat, at, dir, fx } = hm(t);
  const hx = dir * 4 * at;
  let o = lightBlock(-140 + hx, 140 + hx, -890, -559, 46, pulse, tt);
  const eL = feat([-62, -716]), eR = feat([62, -716]);
  const kNear = 1 - 0.04 * at, kFar = 1 - 0.3 * at;
  o += lightEye(eL[0], eL[1], 46 * (dir > 0 ? kNear : kFar), 34, withBlink(fr.eyeL), -1, pulse);
  o += lightEye(eR[0], eR[1], 46 * (dir > 0 ? kFar : kNear), 34, withBlink(fr.eyeR), 1, pulse);
  if (pulse > 0.05) { const m = feat([0, -610]); o += S.ellipse(m[0], m[1], 70 * pulse, 10 + 14 * pulse, { fill: '#FFE7A0', opacity: f(0.55 * pulse) }); }
  o += crownFront(hair, feat, c, true);
  o += F.faceFx((fr.fx || []).filter((x) => FX_OK.includes(typeof x === 'string' ? x : x.type)), { fx });
  return o;
}
// the cape behind the body (front and side views), drawn by cast.draw.admin before the character; body space
function adminCape(view, t, c) {
  if (view === 'back') return '';
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const sway = 10 * Math.sin(ADMIN.phase * 1.3);
  const d = view === 'side'
    ? `M-10 -540 L110 -540 Q260 -300 ${f(330 + sway)} -20 Q200 10 60 -10 L40 -300 Z`
    : `M${f(-130 + dir * at * 20)} -548 L${f(130 + dir * at * 20)} -548 L${f(250 + sway)} -24 Q0 10 ${f(-250 + sway)} -24 Z`;
  const inner = codeRows(-300, 360, -520, 0, ADMIN.phase + 1, 15, 26, 7) + S.path(view === 'side' ? `M${f(330 + sway)} -20 Q200 10 60 -10` : `M${f(250 + sway)} -24 Q0 10 ${f(-250 + sway)} -24`, lineOnly(40, c.gold)) + S.rect(-400, -600, 800, 700, 0, { fill: '#2A2050', opacity: 0.07 });
  return clipped(d, c.cape || c.sleeve, inner);
}
// back view cape (over the body) — called by the robe torso in back view
function adminCapeBack(c) {
  const sway = 10 * Math.sin(ADMIN.phase * 1.3);
  const d = `M-140 -560 L140 -560 L${f(240 + sway)} -46 Q0 -20 ${f(-240 + sway)} -46 Z`;
  return clipped(d, c.cape || c.sleeve, codeRows(-260, 260, -530, -40, ADMIN.phase + 1, 15, 26, 7) + S.path(`M${f(240 + sway)} -46 Q0 -20 ${f(-240 + sway)} -46`, lineOnly(40, c.gold)) + S.path('M-60 -540 Q-80 -300 -120 -60 M60 -540 Q80 -300 120 -60', lineOnly(6, '#D6D2E4')));
}
function adminAura(glow, t = 0) {
  if (!(glow > 0.01)) return '';
  const g = S.clamp(glow, 0, 1), b = 1 + 0.03 * Math.sin(t * 2.2);
  let o = '';
  // stacked flat ellipses = soft cel-shaded glow (a radial gradient this big costs ~200 ms per frame)
  for (const [k, col, op] of [[1, '#FFD45A', 0.1], [0.84, '#FFDD72', 0.12], [0.68, '#FFE58A', 0.14], [0.52, '#FFEEAA', 0.16], [0.36, '#FFF6CF', 0.2]]) o += S.ellipse(0, -640, 560 * k * b, 880 * k * b, { fill: col, opacity: f(op * g) });
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + t * 0.15;
    const r0 = 380, r1 = 760 + 80 * Math.sin(i * 2.1 + t);
    rays += `M${f(Math.cos(a - 0.05) * r0)} ${f(-700 + Math.sin(a - 0.05) * r0)} L${f(Math.cos(a) * r1)} ${f(-700 + Math.sin(a) * r1)} L${f(Math.cos(a + 0.05) * r0)} ${f(-700 + Math.sin(a + 0.05) * r0)} Z `;
  }
  o += S.path(rays, { fill: '#FFF2C0', opacity: f(0.22 * g) });
  return o;
}

// ====================================================================== PROPS
// Zoe's laptop covered in stickers. Body or screen space; (x, y) = bottom centre of the base.
// open 0..1 (0 closed, 1 lid upright), face: 'lid' (we see the lid back with the stickers) | 'screen' (we see the screen); screen: svg drawn in a 200x130 box centred on (0,-75)
function zoeLaptop({ x = 0, y = 0, s = 1, rot = 0, open = 1, face = 'lid', screen = '', glow = true } = {}) {
  const k = S.clamp(open, 0, 1);
  let o = '';
  const base = S.roundedPath([[-130, -18], [130, -18], [140, 6], [-140, 6]], 8);
  if (face === 'screen') {
    o += S.path(base, outline('#B9BFCC', 6)) + S.path('M-60 -6 L60 -6', lineOnly(5, '#8A90A0'));
    if (k > 0.05) {
      const h = 160 * k;
      o += S.path(S.roundedPath([[-122, -18 - h], [122, -18 - h], [122, -18], [-122, -18]], 10), outline('#3A3F52', 6));
      const sid = S.uid('zsc');
      const sc = S.roundedPath([[-108, -18 - h + 12], [108, -18 - h + 12], [108, -28], [-108, -28]], 6);
      o += S.clipDef(sid, S.path(sc)) + S.path(sc, { fill: glow ? '#1B2040' : '#11131C' });
      o += S.g(S.g(screen, `translate(0 ${f(-18 - h / 2 + 2)}) scale(${f(1)} ${f(k)})`), null, { 'clip-path': `url(#${sid})` });
      if (glow) o += S.path(`M-90 ${f(-18 - h + 24)} L-50 ${f(-18 - h + 24)}`, lineOnly(6, '#FFFFFF33'));
    }
  } else {
    const h = 160 * k;
    o += S.path(base, outline('#B9BFCC', 6));
    if (k > 0.05) {
      const lid = S.roundedPath([[-122, -18 - h], [122, -18 - h], [122, -18], [-122, -18]], 10);
      let st = S.g(L3.sticker('star', -70, -110, 1.1, -12, '#FF6FA8') + L3.sticker('bolt', 60, -60, 1.2, 10, '#FFD23F') + L3.sticker('heart', 74, -126, 0.9, 14, '#FF4D6D') +
        L3.sticker('bubble', -20, -50, 1.0, 0, '#6FD3FF') + cursorIcon(-64, -72, 0.55, '#FFFFFF') + S.g(txt('</>', 0, 10, 30, '#3BD16F', { stroke: '#FFFFFF', 'stroke-width': 6, 'paint-order': 'stroke' }), 'translate(10 -122) rotate(-6)'), `translate(0 ${f(-18)}) scale(1 ${f(k)}) translate(0 18)`);
      o += clipped(lid, '#5A5F78', S.rect(-130, -200, 70, 200, 0, { fill: '#FFFFFF', opacity: 0.08 }) + st, 6);
    }
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// a single sticky note; text: a short word (or null for scribbles)
function stickyNote(x = 0, y = 0, s = 1, rot = 0, text = null, col = '#FFE45C') { return sticky(x, y, s, rot, text, col); }
// a pad of sticky notes (in Mom's hand)
function stickyStack({ x = 0, y = 0, s = 1, rot = 0, text = null, n = 5 } = {}) {
  let o = '';
  for (let i = n - 1; i >= 1; i--) o += S.path('M-40 -40 L40 -40 L40 40 L-40 40 Z', { fill: i % 2 ? '#F5D64A' : '#FFE45C', stroke: LINE, 'stroke-width': 4, transform: `translate(${f(i * 3)} ${f(i * 5)})` });
  o += sticky(0, 0, 1, 0, text);
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// Principal Pratt's mug ("WORLD'S OKAYEST PRINCIPAL"); steam 0..1, t animates it; (x, y) = bottom centre
function coffeeMug({ x = 0, y = 0, s = 1, rot = 0, steam = 1, t = 0, col = '#F4F1EA' } = {}) {
  let o = S.path('M44 -88 Q86 -88 86 -54 Q86 -22 44 -24', { fill: 'none', stroke: LINE, 'stroke-width': 20 }) + S.path('M44 -88 Q86 -88 86 -54 Q86 -22 44 -24', { fill: 'none', stroke: col, 'stroke-width': 9 });
  o += S.path(S.roundedPath([[-52, -116], [52, -116], [48, 0], [-48, 0]], 12), outline(col, 6.5));
  o += S.ellipse(0, -114, 48, 10, outline('#5A3A22', 4));
  o += S.rect(-40, -82, 80, 44, 6, { fill: '#7A1E2E' }) + txt('#1 BOSS?', 0, -52, 18, '#FFE58A');
  o += S.path('M-34 -104 L-30 -12', lineOnly(6, '#FFFFFF'));
  if (steam > 0.01) {
    let d = '';
    for (const [sx, ph] of [[-18, 0], [12, 1.7]]) d += `M${sx} -130 q${f(14 * Math.sin(t * 3 + ph))} -20 0 -40 q${f(-14 * Math.sin(t * 3 + ph))} -20 0 -40 `;
    o += S.path(d, { ...lineOnly(9, '#FFFFFF'), opacity: f(0.8 * steam) });
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// Granny's speed flames. Either a straight trail from (x, y) going backwards along `angle` (deg, 0 = trail to the right),
// or a path through pts [[x, y], ...] (pts[0] = Granny's end). w = width at the head, t animates the flicker.
function fireTrail({ x = 0, y = 0, len = 700, angle = 0, w = 110, t = 0, pts = null, alpha = 1 } = {}) {
  let path = pts;
  if (!path) {
    const a = (angle * Math.PI) / 180;
    path = Array.from({ length: 9 }, (_, i) => [x + Math.cos(a) * len * (i / 8), y + Math.sin(a) * len * (i / 8)]);
  }
  // resample to ~14 points along the polyline
  const segL = [];
  let tot = 0;
  for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segL.push(l); tot += l; }
  const N = 14, at = (u) => {
    let d = u * tot;
    for (let i = 0; i < segL.length; i++) {
      if (d <= segL[i] || i === segL.length - 1) { const k = segL[i] ? Math.min(1, d / segL[i]) : 0; return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k, path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]]; }
      d -= segL[i];
    }
    return path[path.length - 1];
  };
  const ribbon = (wk, wob, seed) => {
    const L1 = [], R = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const [px, py, dx, dy] = at(u);
      const l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      const flick = 1 + wob * Math.sin(t * 17 + i * 1.9 + seed) * (0.3 + u);
      const hw = (w / 2) * wk * Math.pow(1 - u, 0.75) * flick;
      const curl = wob * 18 * Math.sin(t * 9 + i * 0.8 + seed) * u;
      L1.push([px + nx * (hw + curl), py + ny * (hw + curl)]);
      R.push([px - nx * (hw - curl), py - ny * (hw - curl)]);
    }
    const [hx, hy, hdx, hdy] = at(0);
    const hl = Math.hypot(hdx, hdy) || 1;
    const nose = [hx - (hdx / hl) * w * 0.35 * wk, hy - (hdy / hl) * w * 0.35 * wk];
    let d = `M${P(L1[0])}`;
    for (let i = 1; i <= N; i++) { const p0 = L1[i - 1], p1 = L1[i]; d += ` Q${P(p0)} ${f((p0[0] + p1[0]) / 2)} ${f((p0[1] + p1[1]) / 2)}`; }
    d += ` L${P(L1[N])}`;
    for (let i = N - 1; i >= 0; i--) { const p0 = R[i + 1], p1 = R[i]; d += ` Q${P(p0)} ${f((p0[0] + p1[0]) / 2)} ${f((p0[1] + p1[1]) / 2)}`; }
    d += ` L${P(R[0])} Q${P(nose)} ${P(L1[0])} Z`;
    return d;
  };
  let o = S.path(ribbon(1.18, 0.22, 0), { fill: '#E8361F', stroke: LINE, 'stroke-width': 7, 'stroke-linejoin': 'round' });
  o += S.path(ribbon(0.82, 0.28, 2.1), { fill: '#FF8A1F' });
  o += S.path(ribbon(0.46, 0.34, 4.2), { fill: '#FFE14D' });
  let sp = '';
  for (let i = 0; i < 7; i++) {
    const u = ((i * 0.137 + t * 1.3) % 1);
    const [px, py, dx, dy] = at(Math.min(0.98, 0.15 + u * 0.85));
    const l = Math.hypot(dx, dy) || 1;
    const off = (hash(i * 3.3) - 0.5) * w * 1.6;
    const r = 7 * (1 - u) + 3;
    sp += `M${f(px - (dy / l) * off - r)} ${f(py + (dx / l) * off)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z `;
  }
  o += S.path(sp, { fill: '#FFD23F', stroke: LINE, 'stroke-width': 3 });
  return alpha < 1 ? S.g(o, null, { opacity: f(alpha) }) : o;
}

// ====================================================================== dress4()
function dress4(d) {
  const st = d.style, c = st.col, a = st.acc || {};
  const H = L.HAIR[st.hair] || L.HAIR.none;
  const W = st.torsoW || 100;
  d.torso = makeTorso4(st);
  d.torsoSide = makeTorsoSide4(st);
  d.arm = makeArm4(st);
  d.leg = makeLeg4(st);
  d.legSide = makeLegSide4(st);
  d.dims = { ...d.dims, shoulderX: W, hipX: Math.round(48 * (st.hipK || W / 100)), shadowR: Math.round(175 * Math.max(1, W / 100)) };
  if (st.thigh) Object.assign(d.dims, { thigh: st.thigh, shin: st.shin, sideThigh: st.thigh - 4, sideShin: st.shin - 2 });
  const h0 = d.head, hs0 = d.headSide, hb0 = d.headBack;
  const browBase = st.browBase || {};
  if (a.blockBrows || a.droopBrows) {
    d.head = (face, t, shade) => {
      let o = h0(face, t, shade);
      const fr = resolveLike(st, face), m = hm(t);
      const by = H.browY ?? -790;
      for (const sx of [-1, 1]) {
        const k = sx < 0 ? 'L' : 'R', b = fr.brows[k] || [0, 0], bb = browBase[k] || [0, 0];
        if (a.blockBrows) o += blockBrow(m.feat([sx * 14, by + 12 + b[0] + bb[0]]), m.feat([sx * 100, by + 4 + b[1] * 0.8 + bb[1]]), a.blockBrows);
        if (a.droopBrows) o += droopBrow(m.feat([sx * 16, by + b[0] * 0.8 + bb[0]]), m.feat([sx * 104, by + 8 + b[1] * 0.8 + bb[1]]), sx, a.droopBrows);
      }
      return o;
    };
  }
  if (a.blockBrows || a.droopBrows || a.officeHeadset || a.specChain || a.mustache) {
    d.headSide = (face, shade) => {
      let o = hs0(face, shade);
      const fr = resolveLike(st, face);
      const by = H.browY ?? -790, b = fr.brows.L || [0, 0], bb = browBase.L || [0, 0];
      if (a.blockBrows) o += blockBrow([-84, by + 12 + b[0] + bb[0]], [-176, by + 6 + b[1] * 0.8 + bb[1]], a.blockBrows);
      if (a.droopBrows) o += droopBrow([-90, by + b[0] * 0.8 + bb[0]], [-170, by + 8 + b[1] * 0.8 + bb[1]], -1, a.droopBrows);
      if (a.specChain) o += S.path('M-110 -700 Q-60 -600 -20 -540', lineOnly(9, LINE)) + S.path('M-110 -700 Q-60 -600 -20 -540', { fill: 'none', stroke: a.specChain, 'stroke-width': 5, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' });
      if (a.officeHeadset) o += officeHeadsetSide(a.officeHeadset);
      if (a.mustache) o += S.path('M-104 -640 C-118 -658 -152 -656 -170 -632 C-160 -616 -138 -618 -124 -620 Q-108 -624 -104 -636 Z', outline(a.mustache, 6));
      return o;
    };
  }
  if (c.longBeard || a.officeHeadset) {
    d.headBack = (face, shade) => {
      let o = (c.longBeard ? beardLongBack(c) : '') + hb0(face, shade);
      if (a.officeHeadset) o += officeHeadsetBack(a.officeHeadset);
      return o;
    };
  }
  return d;
}

module.exports = {
  dress4, outfit4, makeTorso4, makeTorsoSide4, makeArm4, makeLeg4, makeLegSide4,
  adminHead, adminCape, adminCapeBack, adminAura, ADMIN, codeRows,
  zoeLaptop, stickyNote, stickyStack, coffeeMug, fireTrail, whistleShape, cursorIcon, brickLogo, crownPin, duck,
};
