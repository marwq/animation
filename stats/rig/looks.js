// Extra looks for the R6 kid family: hair styles, dot eyes, stroke brows, outfits, accessories.
// All coordinates are in the shared character space (front view; side views face screen-left).
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const { f } = S;

const SW = C.lineW;
const LINE = C.line;
const outline = (fill, w = SW) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const lineOnly = (w = SW, color = LINE) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const P = (p) => `${f(p[0])} ${f(p[1])}`;
const poly = (pts, r = 6) => S.roundedPath(pts, r);

// ---------------------------------------------------------------- dot eyes
function dotEye(cx, cy, spec = {}, side = -1) {
  const inner = -side;
  const type = spec.type || 'open';
  if (type === 'happy') return S.path(`M${f(cx - 22)} ${f(cy + 8)} Q${f(cx)} ${f(cy - 26)} ${f(cx + 22)} ${f(cy + 8)}`, lineOnly(9));
  if (type === 'closed') return S.path(`M${f(cx - 22)} ${f(cy)} Q${f(cx)} ${f(cy + 12)} ${f(cx + 22)} ${f(cy)}`, lineOnly(9));
  if (type === 'squint') return S.pline([[cx - inner * 16, cy - 18], [cx + inner * 12, cy], [cx - inner * 16, cy + 18]], lineOnly(9));
  if (type === 'x') return S.path(`M${f(cx - 15)} ${f(cy - 15)} L${f(cx + 15)} ${f(cy + 15)} M${f(cx + 15)} ${f(cy - 15)} L${f(cx - 15)} ${f(cy + 15)}`, lineOnly(9));
  if (type === 'star') return S.path(F.starPath(cx, cy, 28), { fill: C.star, stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  if (type === 'heart') return S.path(F.heartPath(cx, cy, 20), { fill: C.heart, stroke: LINE, 'stroke-width': 5 });
  if (type === 'robux') return F.robuxIcon(cx, cy, 26);
  if (type === 'swirl') {
    let d = `M${f(cx)} ${f(cy)}`;
    for (let i = 1; i <= 40; i++) { const t = i / 40, a = t * 2.4 * Math.PI * 2; d += ` L${f(cx + Math.cos(a) * 24 * t)} ${f(cy + Math.sin(a) * 24 * t)}`; }
    return S.path(d, lineOnly(5));
  }
  const k = S.clamp(spec.pupil ?? 1, 0.4, 1.8);
  const rx = 17 * k, ry = 25 * k;
  const look = spec.look || [0, 0];
  const ex = cx + look[0] * 9, ey = cy + look[1] * 7;
  const up = S.clamp(spec.upper || 0, 0, 1), lo = S.clamp(spec.lower || 0, 0, 1);
  if (up + lo >= 0.95) return S.path(`M${f(cx - 22)} ${f(cy + 2)} Q${f(cx)} ${f(cy + 10)} ${f(cx + 22)} ${f(cy + 2)}`, lineOnly(9));
  const tU = spec.tilt || 0;
  const yU = ey - ry + 2 * ry * up, yL = ey + ry - 2 * ry * lo;
  const yAt = (x) => yU + tU * 0.6 * ((x - ex) / rx) * inner;
  const xa = ex - rx - 10, xb = ex + rx + 10;
  const id = S.uid('de');
  let o = S.clipDef(id, S.poly([[xa, yAt(xa)], [xb, yAt(xb)], [xb, yL], [xa, yL]]));
  let body = S.ellipse(ex, ey, rx, ry, { fill: LINE });
  if (spec.sparkle || k >= 1.2) body += S.circle(ex - rx * 0.32, ey - ry * 0.42, 5.5 * k, { fill: '#fff' }) + S.circle(ex + rx * 0.3, ey + ry * 0.3, 2.6 * k, { fill: '#fff' });
  else body += S.circle(ex - rx * 0.3, ey - ry * 0.4, 4.6 * k, { fill: '#fff' });
  o += S.g(body, null, { 'clip-path': `url(#${id})` });
  if (up > 0.05) o += S.path(`M${f(ex - rx - 7)} ${f(yAt(ex - rx - 7))} L${f(ex + rx + 7)} ${f(yAt(ex + rx + 7))}`, lineOnly(6.5));
  return o;
}

// ---------------------------------------------------------------- stroke brows
function strokeBrows(feat, by, brows = {}, base = {}, color = LINE, w = 12) {
  let o = '';
  for (const side of [-1, 1]) {
    const k = side < 0 ? 'L' : 'R';
    const b = brows[k] || [0, 0], bb = base[k] || [0, 0];
    const inner = feat([side * 16, by + b[0] + bb[0]]);
    const outer = feat([side * 84, by + 6 + b[1] + bb[1]]);
    const mid = [(inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2 - 9];
    o += S.path(`M${P(outer)} Q${P(mid)} ${P(inner)}`, lineOnly(w, color));
  }
  return o;
}

// ---------------------------------------------------------------- hair styles
const HAIR = {
  spiky: {
    browY: -758,
    nametagY: -1130,
    front(hair, feat) {
      const outer = [[-146, -735], [-158, -815], [-216, -872], [-160, -890], [-166, -972], [-98, -936], [-34, -1070], [20, -962], [116, -1018], [120, -934], [212, -892], [164, -846], [152, -735]].map(hair);
      const fringe = [[130, -770], [106, -818], [82, -786], [48, -830], [16, -792], [-20, -832], [-54, -796], [-90, -830], [-116, -788], [-136, -800]].map(feat);
      return poly([...outer, ...fringe], 7);
    },
    details(hair, feat, c, shade) {
      let o = '';
      if (shade) {
        for (const [a, b] of [[[-70, -930], [-46, -1010]], [[44, -942], [96, -992]], [[-120, -880], [-160, -940]], [[130, -880], [178, -900]]]) {
          const p = hair(a), q = hair(b);
          o += S.path(`M${P(p)} L${P(q)}`, lineOnly(13, c.hairHi));
        }
      }
      const l = [hair([-120, -840]), hair([-20, -900]), hair([110, -850])];
      o += S.path(`M${P(feat([-60, -830]))} Q${P(l[1])} ${P(hair([40, -990]))} M${P(feat([40, -828]))} Q${P(hair([90, -880]))} ${P(hair([150, -905]))}`, lineOnly(5));
      return o;
    },
    side(c) {
      return poly([[-150, -792], [-178, -860], [-196, -930], [-122, -914], [-112, -1012], [-40, -944], [22, -1036], [62, -934], [142, -962], [150, -862], [162, -782], [140, -700], [62, -716], [16, -762], [-60, -800], [-118, -806]], 7);
    },
    back(c) {
      return poly([[-152, -735], [-160, -850], [-212, -876], [-160, -892], [-118, -1018], [-20, -962], [34, -1070], [98, -936], [166, -972], [160, -890], [216, -872], [158, -815], [146, -735], [118, -716], [60, -704], [0, -720], [-60, -704], [-118, -716]], 7);
    },
  },

  quiff: {
    browY: -770,
    nametagY: -1120,
    front(hair, feat) {
      const outer = [[-146, -770], [-162, -862], [-142, -930], [-92, -992], [-12, -1042], [78, -1064], [152, -1054], [132, -1022], [204, -1012], [178, -984], [226, -952], [168, -940], [162, -862], [150, -770]].map(hair);
      const line = [[128, -800], [90, -828], [40, -842], [-8, -840], [-46, -810], [-64, -768], [-82, -812], [-118, -812], [-134, -796]].map(feat);
      return poly([...outer, ...line], 9);
    },
    details(hair, feat, c, shade) {
      let o = '';
      if (shade) o += S.path(`M${P(hair([-110, -930]))} Q${P(hair([0, -1016]))} ${P(hair([150, -1010]))}`, lineOnly(16, c.hairHi));
      o += S.path(`M${P(feat([-56, -800]))} Q${P(hair([-30, -930]))} ${P(hair([120, -1030]))} M${P(feat([-10, -836]))} Q${P(hair([60, -930]))} ${P(hair([190, -990]))} M${P(hair([-120, -860]))} Q${P(hair([-80, -960]))} ${P(hair([40, -1040]))} M${P(feat([60, -836]))} Q${P(hair([120, -900]))} ${P(hair([200, -950]))}`, lineOnly(5));
      return o;
    },
    side() {
      return poly([[-150, -800], [-212, -930], [-186, -1012], [-70, -1056], [40, -1040], [20, -1010], [110, -1010], [92, -980], [156, -952], [162, -800], [150, -704], [70, -720], [22, -790], [-80, -804]], 10);
    },
    back() {
      return poly([[-150, -760], [-162, -870], [-120, -940], [-20, -1010], [120, -1030], [176, -972], [162, -870], [150, -760], [80, -730], [0, -744], [-80, -730]], 16);
    },
  },

  cap: {
    browY: -752,
    nametagY: -1080,
    front(hair, feat) {
      const a = hair([-164, -818]), b = hair([164, -818]), top = hair([0, -1150]);
      return `M${P(a)} Q${P(top)} ${P(b)} L${P(hair([164, -806]))} L${P(hair([-164, -806]))} Z`;
    },
    behind(hair, feat, c) {
      // short hair under the cap at the sides
      return S.path(poly([hair([-160, -820]), hair([-158, -720]), hair([-132, -740]), hair([132, -740]), hair([158, -720]), hair([160, -820])], 10), outline(c.hair));
    },
    details(hair, feat, c, shade) {
      let o = '';
      if (shade) o += S.path(`M${P(hair([-120, -900]))} Q${P(hair([0, -990]))} ${P(hair([120, -900]))}`, lineOnly(14, c.capHi || '#ffffff55'));
      o += S.path(`M${P(hair([0, -1000]))} L${P(hair([0, -840]))}`, lineOnly(4.5, c.capShade || '#0006'));
      return o;
    },
    over(hair, feat, c, style) {
      let o = S.path(`M${P(hair([-166, -842]))} L${P(hair([166, -842]))} L${P(hair([166, -806]))} L${P(hair([-166, -806]))} Z`, outline(c.capShade || c.cap));
      const cc = feat([0, -800]);
      o += S.ellipse(cc[0], cc[1] + 4, 176, 30, outline(c.capBrim || c.capShade || c.cap));
      o += S.ellipse(cc[0], cc[1] - 2, 150, 14, { fill: '#000', opacity: 0.12 });
      const lg = feat([0, -914]);
      o += S.circle(lg[0], lg[1], 36, outline('#fff', 6)) + S.path(F.starPath(lg[0], lg[1] + 2, 24), { fill: c.capLogo || c.cap, stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
      return o;
    },
    side(c) {
      return `M-160 -820 Q-120 -1000 40 -1000 Q150 -990 160 -820 Z`;
    },
    sideOver(c) {
      return S.path(S.roundedPath([[-300, -834], [-120, -834], [-120, -804], [-300, -804]], 14), outline(c.capBrim || c.capShade || c.cap)) +
        S.path('M-170 -846 L166 -846 L166 -810 L-170 -810 Z', outline(c.capShade || c.cap)) +
        S.path(poly([[110, -810], [158, -810], [160, -720], [96, -706]], 8), outline(c.hair));
    },
    back(c) {
      return `M-164 -818 Q0 -1150 164 -818 L164 -806 L-164 -806 Z`;
    },
    backOver(c) {
      return S.path('M-166 -842 L166 -842 L166 -806 L-166 -806 Z', outline(c.capShade || c.cap)) +
        S.path('M-40 -842 Q0 -880 40 -842 Z', { fill: c.hair, stroke: LINE, 'stroke-width': 5 }) +
        S.path(poly([[-160, -806], [160, -806], [156, -720], [-156, -720]], 14), outline(c.hair));
    },
  },

  buns: {
    browY: null,
    nametagY: -1090,
    front(hair, feat) {
      const M = (p) => P(p);
      return `M${M(hair([-156, -660]))} L${M(hair([-162, -850]))} Q${M(hair([0, -1036]))} ${M(hair([162, -850]))} L${M(hair([156, -660]))} L${M(hair([128, -650]))} L${M(hair([132, -790]))}` +
        ` L${M(feat([110, -792]))} Q${M(feat([82, -770]))} ${M(feat([56, -792]))} Q${M(feat([28, -770]))} ${M(feat([0, -794]))} Q${M(feat([-28, -770]))} ${M(feat([-56, -792]))} Q${M(feat([-82, -770]))} ${M(feat([-110, -792]))}` +
        ` L${M(hair([-132, -790]))} L${M(hair([-128, -650]))} Z`;
    },
    behind(hair, feat, c, shade) {
      let o = S.path(poly([hair([-160, -900]), hair([160, -900]), hair([160, -640]), hair([-160, -640])], 60), outline(c.hair));
      for (const sx of [-1, 1]) {
        const b = hair([sx * 112, -972]);
        o += S.circle(b[0], b[1], 58, outline(c.hair));
        if (shade) o += S.path(`M${f(b[0] - 30)} ${f(b[1] - 26)} Q${f(b[0])} ${f(b[1] - 50)} ${f(b[0] + 30)} ${f(b[1] - 26)}`, lineOnly(12, c.hairHi));
        o += S.path(`M${f(b[0] - 26)} ${f(b[1] + 10)} Q${f(b[0])} ${f(b[1] - 26)} ${f(b[0] + 28)} ${f(b[1] + 6)}`, lineOnly(5));
        const tie = hair([sx * 96, -918]);
        o += S.ellipse(tie[0], tie[1], 34, 14, outline(c.accent || '#fff', 5));
      }
      return o;
    },
    details(hair, feat, c, shade) {
      let o = '';
      if (shade) o += S.path(`M${P(hair([-120, -905]))} Q${P(hair([0, -975]))} ${P(hair([120, -905]))}`, lineOnly(14, c.hairHi));
      o += S.path(`M${P(hair([-140, -780]))} L${P(hair([-142, -670]))} M${P(hair([140, -780]))} L${P(hair([142, -670]))}`, lineOnly(5));
      return o;
    },
    side() {
      return poly([[-176, -790], [-160, -900], [-60, -985], [80, -960], [150, -880], [158, -680], [110, -640], [40, -660], [24, -780], [-60, -800], [-130, -800]], 20);
    },
    sideBehind(c) {
      return S.circle(70, -1000, 58, outline(c.hair)) + S.ellipse(60, -950, 30, 13, outline(c.accent || '#fff', 5));
    },
    back() {
      return poly([[-160, -640], [-162, -850], [-90, -960], [90, -960], [162, -850], [160, -640], [80, -628], [0, -640], [-80, -628]], 30);
    },
    backOver(c) {
      let o = '';
      for (const sx of [-1, 1]) o += S.circle(sx * 112, -972, 58, outline(c.hair)) + S.ellipse(sx * 96, -918, 34, 14, outline(c.accent || '#fff', 5));
      return o;
    },
  },

  none: { browY: -756, front: () => null, side: () => null, back: () => null, details: () => '' },
};

// headphones over the head (front)
function headphones(hair, col) {
  const a = hair([-172, -760]), b = hair([172, -760]), top = hair([0, -1130]);
  let o = S.path(`M${P(a)} Q${P(top)} ${P(b)}`, lineOnly(22, LINE)) + S.path(`M${P(a)} Q${P(top)} ${P(b)}`, lineOnly(12, col));
  for (const sx of [-1, 1]) {
    const p = hair([sx * 168, -730]);
    o += S.path(S.roundedPath([[p[0] - 24, p[1] - 58], [p[0] + 24, p[1] - 58], [p[0] + 24, p[1] + 58], [p[0] - 24, p[1] + 58]], 18), outline(col, 6));
    o += S.path(S.roundedPath([[p[0] - 12, p[1] - 40], [p[0] + 12, p[1] - 40], [p[0] + 12, p[1] + 40], [p[0] - 12, p[1] + 40]], 10), { fill: '#000', opacity: 0.25 });
  }
  return o;
}

// gold chain with an egg pendant (on the torso)
function chain(cx, T, col = '#FFC52E') {
  let o = S.path(`M${f(cx - 50)} ${T + 2} Q${f(cx)} ${T + 96} ${f(cx + 50)} ${T + 2}`, lineOnly(11, LINE));
  o += S.path(`M${f(cx - 50)} ${T + 2} Q${f(cx)} ${T + 96} ${f(cx + 50)} ${T + 2}`, { fill: 'none', stroke: col, 'stroke-width': 6, 'stroke-dasharray': '9 5', 'stroke-linecap': 'round' });
  const ex = cx, ey = T + 78;
  o += S.path(`M${f(ex)} ${f(ey - 20)} C${f(ex + 16)} ${f(ey - 20)} ${f(ex + 18)} ${f(ey + 8)} ${f(ex + 12)} ${f(ey + 16)} C${f(ex + 6)} ${f(ey + 24)} ${f(ex - 6)} ${f(ey + 24)} ${f(ex - 12)} ${f(ey + 16)} C${f(ex - 18)} ${f(ey + 8)} ${f(ex - 16)} ${f(ey - 20)} ${f(ex)} ${f(ey - 20)} Z`, outline(col, 5));
  o += S.circle(ex - 5, ey - 6, 4, { fill: '#fff', opacity: 0.8 });
  return o;
}

// ---------------------------------------------------------------- outfits (front torso details, inside the torso clip)
function outfitFront(style, t, shade, back, T, B, W) {
  const c = style.col;
  const at = Math.abs(t), dir = t >= 0 ? 1 : -1;
  const cx = dir * at * 30, k = 1 - 0.12 * at;
  const top = style.top;
  let o = '';
  const text = (s, x, y, size, fill) => S.el('text', { x, y, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, stroke: LINE, 'stroke-width': size * 0.12, 'paint-order': 'stroke', 'text-anchor': 'middle', 'stroke-linejoin': 'round' }, s);
  if (top === 'jersey') {
    o += S.rect(-W - 10, T - 10, 26, B - T + 20, 0, { fill: c.topShade }) + S.rect(W - 16, T - 10, 26, B - T + 20, 0, { fill: c.topShade });
    if (!back) {
      o += S.path(`M${f(cx - 36 * k)} ${T - 6} L${f(cx)} -480 L${f(cx + 36 * k)} ${T - 6} Z`, { fill: c.skin });
      o += S.path(`M${f(cx - 38 * k)} ${T - 4} L${f(cx)} -478 L${f(cx + 38 * k)} ${T - 4}`, lineOnly(10, c.trim));
      o += S.path(`M${f(cx - 46 * k)} ${T - 4} L${f(cx)} -466 L${f(cx + 46 * k)} ${T - 4}`, lineOnly(4, LINE));
      o += S.path(F.starPath(cx - 26 * k, -448, 13), outline(c.trim, 3.5)) + S.path(F.starPath(cx + 26 * k, -448, 13), outline(c.trim, 3.5));
      o += text(style.number || '7', cx, -340, 118, c.trim);
    } else {
      o += text((style.backName || '').toUpperCase(), 0, -470, 40, c.trim);
      o += text(style.number || '7', 0, -334, 140, c.trim);
    }
  } else if (top === 'varsity') {
    if (!back) {
      o += S.rect(cx - 6, T, 12, B - T, 0, { fill: c.topShade });
      for (const y of [-490, -440, -390, -340]) o += S.circle(cx, y, 6, outline(c.trim2, 3));
      o += S.path(`M${f(cx - 52 * k)} ${T - 10} Q${f(cx)} ${T + 40} ${f(cx + 52 * k)} ${T - 10} L${f(cx + 38 * k)} ${T - 10} Q${f(cx)} ${T + 22} ${f(cx - 38 * k)} ${T - 10} Z`, outline(c.trim2, 4));
      o += S.path(`M${f(cx - 44 * k)} ${T + 4} Q${f(cx)} ${T + 34} ${f(cx + 44 * k)} ${T + 4}`, lineOnly(4, c.trim));
      o += text(style.letter || 'E', cx - 50 * k, -400, 84, c.trim);
    } else {
      o += text(style.backName || 'EGGLORD', 0, -424, 34, c.trim);
      o += text('#1', 0, -350, 64, c.trim2);
    }
    o += S.rect(-W - 10, B - 30, 2 * W + 20, 34, 0, { fill: c.trim2 }) + S.rect(-W - 10, B - 20, 2 * W + 20, 8, 0, { fill: c.top });
  } else if (top === 'hoodie') {
    if (!back) {
      o += S.path(`M${f(cx - 70 * k)} ${T - 6} Q${f(cx)} ${T + 34} ${f(cx + 70 * k)} ${T - 6}`, outline(c.topShade, 5));
      o += S.path(`M${f(cx - 18 * k)} ${T + 14} L${f(cx - 22 * k)} -452 M${f(cx + 18 * k)} ${T + 14} L${f(cx + 22 * k)} -452`, lineOnly(5, c.trim || '#fff'));
      o += S.circle(cx - 22 * k, -448, 5, { fill: c.trim || '#fff' }) + S.circle(cx + 22 * k, -448, 5, { fill: c.trim || '#fff' });
      o += S.path(S.roundedPath([[cx - 62 * k, -400], [cx + 62 * k, -400], [cx + 74 * k, -330], [cx - 74 * k, -330]], 14), outline(c.topShade, 5));
      if (style.chestIcon) o += S.path(F.heartPath(cx + 50 * k, -470, 14), outline(style.chestIcon, 4));
    } else {
      o += S.path(`M-74 ${T - 6} Q0 ${T + 70} 74 ${T - 6}`, outline(c.topShade, 5));
    }
  } else if (top === 'tee') {
    if (!back) o += S.path(`M${f(cx - 34 * k)} ${T - 6} Q${f(cx)} ${T + 26} ${f(cx + 34 * k)} ${T - 6} Z`, outline(c.skin, 5));
  }
  if (shade) {
    o += S.rect(-W - 10, B - 26, 2 * W + 20, 30, 0, { fill: '#000', opacity: 0.1 });
    if (at > 0.02) o += S.rect(dir > 0 ? -W - 10 : W - 34 * at, T - 10, 34 * at + 10, B - T + 20, 0, { fill: '#000', opacity: 0.22 });
  }
  return o;
}

module.exports = { dotEye, strokeBrows, HAIR, headphones, chain, outfitFront };
