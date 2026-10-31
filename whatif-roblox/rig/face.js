// Face library: eyes, mouths (incl. lip-sync visemes), brow presets, face FX
// and named expressions. Everything is drawn in hero "head space"
// (origin at the feet, head roughly y -950..-560).
'use strict';

const S = require('./svg');
const C = require('./palette');
const { f } = S;

const LW = C.line;
const SW = C.lineW;
const stroke = (w = SW) => ({ fill: 'none', stroke: LW, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const filled = (fill, w = SW) => ({ fill, stroke: LW, 'stroke-width': w, 'stroke-linejoin': 'round' });

// ---------------------------------------------------------------- pupils
function starPath(cx, cy, R, r = R * 0.48, n = 5, rot = -90) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rr = i % 2 ? r : R;
    p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return S.roundedPath(p, R * 0.08);
}

function heartPath(cx, cy, s) {
  return `M${f(cx)} ${f(cy + s * 0.9)} C${f(cx - s * 1.5)} ${f(cy - s * 0.1)} ${f(cx - s * 0.9)} ${f(cy - s * 1.25)} ${f(cx)} ${f(cy - s * 0.45)} ` +
    `C${f(cx + s * 0.9)} ${f(cy - s * 1.25)} ${f(cx + s * 1.5)} ${f(cy - s * 0.1)} ${f(cx)} ${f(cy + s * 0.9)} Z`;
}

// Robux-style icon: rounded hexagon ring with a square core.
function robuxIcon(cx, cy, R, color = C.gold, outline = LW, w = 5) {
  const hex = [];
  for (let i = 0; i < 6; i++) {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    hex.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  }
  const hexIn = hex.map(([x, y]) => [cx + (x - cx) * 0.6, cy + (y - cy) * 0.6]);
  const q = R * 0.24;
  const ring = S.roundedPath(hex, R * 0.18) + ' ' + S.roundedPath(hexIn.slice().reverse(), R * 0.1);
  return S.path(ring, { fill: color, stroke: outline, 'stroke-width': w, 'fill-rule': 'evenodd', 'stroke-linejoin': 'round' }) +
    S.rect(cx - q, cy - q, q * 2, q * 2, q * 0.25, { fill: color, stroke: outline, 'stroke-width': w });
}

function spiral(cx, cy, R, turns = 2.6) {
  let d = `M${f(cx)} ${f(cy)}`;
  const steps = 60;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const a = t * turns * Math.PI * 2;
    d += ` L${f(cx + Math.cos(a) * R * t)} ${f(cy + Math.sin(a) * R * t)}`;
  }
  return S.path(d, stroke(6));
}

function pupilShape(kind, px, py, pr, sparkle) {
  switch (kind) {
    case 'star':
      return S.path(starPath(px, py, 30), { fill: C.star, stroke: LW, 'stroke-width': 5, 'stroke-linejoin': 'round' });
    case 'heart':
      return S.path(heartPath(px, py, 22), { fill: C.heart, stroke: LW, 'stroke-width': 5 });
    case 'robux':
      return robuxIcon(px, py, 30);
    case 'coin':
      return S.circle(px, py, 27, { fill: C.gold, stroke: LW, 'stroke-width': 5 }) +
        S.circle(px, py, 17, { fill: 'none', stroke: C.goldShade, 'stroke-width': 4 });
    default: {
      let s = S.circle(px, py, pr, { fill: LW });
      if (sparkle && pr >= 13) {
        s += S.circle(px - pr * 0.35, py - pr * 0.38, pr * 0.34, { fill: '#fff' });
        s += S.circle(px + pr * 0.3, py + pr * 0.3, pr * 0.15, { fill: '#fff' });
      }
      return s;
    }
  }
}

// ---------------------------------------------------------------- eyes
// side: -1 screen-left eye, +1 screen-right eye. `inner` points to the nose.
function eye(cx, cy, rx, ry, spec = {}, side = -1, opts = {}) {
  const s = spec;
  const inner = -side;
  const type = s.type || 'open';

  if (type === 'happy') { // ^ ^
    return S.path(`M${f(cx - rx * 0.72)} ${f(cy + 14)} Q${f(cx)} ${f(cy - 52)} ${f(cx + rx * 0.72)} ${f(cy + 14)}`, stroke(8.5));
  }
  if (type === 'closed') { // relaxed closed lid
    return S.path(`M${f(cx - rx * 0.8)} ${f(cy + 4)} Q${f(cx)} ${f(cy + 26)} ${f(cx + rx * 0.8)} ${f(cy + 4)}`, stroke(8));
  }
  if (type === 'squint') { // > <
    const k = inner; // chevron points toward the nose
    return S.pline([[cx - k * rx * 0.55, cy - 34], [cx + k * rx * 0.45, cy], [cx - k * rx * 0.55, cy + 34]], stroke(9));
  }
  if (type === 'x') {
    const a = rx * 0.5;
    return S.path(`M${f(cx - a)} ${f(cy - a)} L${f(cx + a)} ${f(cy + a)} M${f(cx + a)} ${f(cy - a)} L${f(cx - a)} ${f(cy + a)}`, stroke(10));
  }

  // open-eye family: white ellipse, clipped by upper/lower lids
  const up = S.clamp(s.upper || 0, 0, 1);
  const lo = S.clamp(s.lower || 0, 0, 1);
  const tU = s.tilt || 0; // + = inner corner lower (angry)
  const tL = s.lowerTilt || 0;
  const yU = cy - ry + 2 * ry * up;
  const yL = cy + ry - 2 * ry * lo;
  if (yL - yU < ry * 0.1) {
    const y = (yU + yL) / 2;
    return S.path(`M${f(cx - rx * 0.85)} ${f(y)} Q${f(cx)} ${f(y + 10)} ${f(cx + rx * 0.85)} ${f(y)}`, stroke(8));
  }
  const xa = cx - rx - 14;
  const xb = cx + rx + 14;
  const yAtU = (x) => yU + tU * ((x - cx) / rx) * inner;
  const yAtL = (x) => yL + tL * ((x - cx) / rx) * inner;
  const cid = S.uid('eye');
  const eid = S.uid('eyi');
  let o = S.clipDef(cid, S.poly([[xa, yAtU(xa)], [xb, yAtU(xb)], [xb, yAtL(xb)], [xa, yAtL(xa)]]));
  o += S.clipDef(eid, S.ellipse(cx, cy, rx, ry));
  let body = S.ellipse(cx, cy, rx, ry, { fill: C.skin });

  // pupil
  const look = s.look || [0, 0];
  const lx = S.clamp(look[0] + (opts.lookBias || 0), -1, 1);
  const ly = S.clamp(look[1], -1, 1);
  const cross = s.cross ?? 1;
  const kind = s.pupilKind || (['star', 'heart', 'robux', 'coin'].includes(type) ? type : 'dot');
  const pr = 11 * (s.pupil ?? 1) * (opts.pupilScale || 1);
  let px, py;
  if (opts.sidePupil !== undefined) { // profile eye: pupil sits toward the front
    px = cx + rx * opts.sidePupil + rx * 0.25 * look[0];
    py = cy + 4 + ry * 0.5 * ly;
  } else if (kind === 'dot') {
    px = cx + rx * 0.55 * lx + rx * 0.5 * inner * cross * (1 - Math.abs(lx));
    py = cy + 5 + ry * 0.55 * ly;
  } else {
    px = cx + rx * 0.12 * inner + rx * 0.3 * lx;
    py = cy + 4 + ry * 0.3 * ly;
  }
  // keep pupil inside the white
  const mx = Math.max(4, rx - pr - 8), my = Math.max(4, ry - pr - 8);
  const dd = Math.hypot((px - cx) / mx, (py - cy) / my);
  if (kind === 'dot' && dd > 1) { px = cx + (px - cx) / dd; py = cy + (py - cy) / dd; }
  if (type === 'swirl') body += spiral(cx, cy + 2, Math.min(rx, ry) * 0.72);
  else body += pupilShape(kind, px, py, pr, s.sparkle);

  body += S.g(S.ellipse(cx, cy, rx, ry, { fill: 'none', stroke: LW, 'stroke-width': SW }));
  o += S.g(body, null, { 'clip-path': `url(#${cid})` });
  // lid lines (kept inside the eye)
  let lids = '';
  if (up > 0.01) lids += S.path(`M${f(xa)} ${f(yAtU(xa))} L${f(xb)} ${f(yAtU(xb))}`, stroke(SW));
  if (lo > 0.01) lids += S.path(`M${f(xa)} ${f(yAtL(xa))} L${f(xb)} ${f(yAtL(xb))}`, stroke(SW));
  if (lids) o += S.g(lids, null, { 'clip-path': `url(#${eid})` });
  return o;
}

// ---------------------------------------------------------------- mouths
// Each shape is authored around (0,0) with ~44 half-width, mapped by (cx,cy,sx,sy).
function mouth(type = 'line', cx = 0, cy = 0, sx = 1, sy = 1) {
  const X = (x) => f(cx + x * sx);
  const Y = (y) => f(cy + y * sy);
  const st = (d, w = SW) => S.path(d, stroke(w));
  const open = (d, extra = '') => {
    const id = S.uid('m');
    return S.clipDef(id, S.path(d)) +
      S.path(d, { fill: C.mouth }) +
      S.g(extra, null, { 'clip-path': `url(#${id})` }) +
      S.path(d, { fill: 'none', stroke: LW, 'stroke-width': SW, 'stroke-linejoin': 'round' });
  };
  const tongue = (x, y, rx, ry) => S.ellipse(cx + x * sx, cy + y * sy, rx * sx, ry * sy, { fill: C.tongue });
  const teeth = (y0, y1) => S.rect(cx - 80 * sx, cy + y0 * sy, 160 * sx, (y1 - y0) * sy, 0, { fill: C.teeth });
  const dShape = (w, top, depth, sag = 4) =>
    `M${X(-w)} ${Y(top)} Q${X(0)} ${Y(top + sag)} ${X(w)} ${Y(top)} Q${X(w * 0.92)} ${Y(depth)} ${X(0)} ${Y(depth + 2)} Q${X(-w * 0.92)} ${Y(depth)} ${X(-w)} ${Y(top)} Z`;
  const oval = (rx, ry, extra = '') => {
    const d = `M${X(-rx)} ${Y(0)} A${f(rx * sx)} ${f(ry * sy)} 0 1 0 ${X(rx)} ${Y(0)} A${f(rx * sx)} ${f(ry * sy)} 0 1 0 ${X(-rx)} ${Y(0)} Z`;
    return open(d, extra);
  };

  switch (type) {
    case 'line': return st(`M${X(-44)} ${Y(0)} L${X(44)} ${Y(0)}`);
    case 'short': return st(`M${X(-22)} ${Y(0)} L${X(22)} ${Y(0)}`);
    case 'smile': return st(`M${X(-42)} ${Y(-8)} Q${X(0)} ${Y(30)} ${X(42)} ${Y(-8)}`);
    case 'smallSmile': return st(`M${X(-28)} ${Y(-3)} Q${X(0)} ${Y(15)} ${X(28)} ${Y(-3)}`);
    case 'frown': return st(`M${X(-38)} ${Y(12)} Q${X(0)} ${Y(-18)} ${X(38)} ${Y(12)}`);
    case 'smirk': return st(`M${X(-36)} ${Y(6)} Q${X(6)} ${Y(12)} ${X(40)} ${Y(-14)}`);
    case 'wavy': return st(`M${X(-46)} ${Y(0)} Q${X(-34)} ${Y(-12)} ${X(-23)} ${Y(0)} Q${X(-11)} ${Y(12)} ${X(0)} ${Y(0)} Q${X(11)} ${Y(-12)} ${X(23)} ${Y(0)} Q${X(34)} ${Y(12)} ${X(46)} ${Y(0)}`, 6.5);
    case 'cat': return st(`M${X(-32)} ${Y(-6)} Q${X(-16)} ${Y(14)} ${X(0)} ${Y(-2)} Q${X(16)} ${Y(14)} ${X(32)} ${Y(-6)}`);
    case 'grin': return open(dShape(48, -10, 50), teeth(-16, 2) + tongue(0, 44, 28, 15));
    case 'bigGrin': return open(dShape(58, -14, 66, 6), teeth(-20, 4) + tongue(0, 60, 34, 20));
    case 'o': return oval(15, 19);
    case 'O': return oval(26, 34, tongue(0, 30, 20, 12));
    case 'scream': return open(`M${X(-40)} ${Y(-26)} Q${X(0)} ${Y(-42)} ${X(40)} ${Y(-26)} Q${X(50)} ${Y(50)} ${X(0)} ${Y(66)} Q${X(-50)} ${Y(50)} ${X(-40)} ${Y(-26)} Z`, teeth(-40, -18) + tongue(0, 56, 28, 16));
    case 'wail': return open(`M${X(-46)} ${Y(22)} Q${X(0)} ${Y(-34)} ${X(46)} ${Y(22)} Q${X(0)} ${Y(42)} ${X(-46)} ${Y(22)} Z`, tongue(0, 30, 24, 10));
    case 'yawn': return oval(22, 30, tongue(0, 26, 16, 10));
    case 'teeth': {
      const d = S.roundedPath([[cx - 48 * sx, cy - 18 * sy], [cx + 48 * sx, cy - 18 * sy], [cx + 48 * sx, cy + 18 * sy], [cx - 48 * sx, cy + 18 * sy]], 12);
      return S.path(d, filled(C.teeth)) +
        st(`M${X(-48)} ${Y(0)} L${X(48)} ${Y(0)} M${X(-22)} ${Y(-18)} L${X(-22)} ${Y(18)} M${X(0)} ${Y(-18)} L${X(0)} ${Y(18)} M${X(22)} ${Y(-18)} L${X(22)} ${Y(18)}`, 4.5);
    }
    case 'tongue':
      return S.path(`M${X(4)} ${Y(0)} Q${X(4)} ${Y(38)} ${X(22)} ${Y(38)} Q${X(40)} ${Y(38)} ${X(38)} ${Y(-2)}`, filled(C.tongue, 6)) +
        st(`M${X(21)} ${Y(4)} L${X(21)} ${Y(24)}`, 4) +
        st(`M${X(-40)} ${Y(-6)} Q${X(0)} ${Y(8)} ${X(44)} ${Y(-4)}`);
    case 'uh': return open(S.roundedPath([[cx - 22 * sx, cy - 7 * sy], [cx + 22 * sx, cy - 7 * sy], [cx + 22 * sx, cy + 7 * sy], [cx - 22 * sx, cy + 7 * sy]], 6));

    // ---- lip-sync visemes (Rhubarb Lip Sync letters) ----
    case 'X': return st(`M${X(-36)} ${Y(0)} Q${X(0)} ${Y(3)} ${X(36)} ${Y(0)}`);
    case 'A': return st(`M${X(-34)} ${Y(1)} Q${X(0)} ${Y(4)} ${X(34)} ${Y(1)}`, 8.5);
    case 'B': return open(dShape(36, -6, 16, -2), teeth(-12, 3));
    case 'C': return open(dShape(40, -8, 32, -3), teeth(-14, 0) + tongue(0, 30, 22, 9));
    case 'D': return open(dShape(46, -10, 50, -5), teeth(-16, 0) + tongue(0, 46, 28, 13));
    case 'E': return oval(25, 29, tongue(0, 25, 18, 10));
    case 'F': return oval(13, 15);
    case 'G':
      return st(`M${X(-34)} ${Y(5)} Q${X(0)} ${Y(9)} ${X(34)} ${Y(5)}`) +
        S.path(S.roundedPath([[cx - 18 * sx, cy - 8 * sy], [cx + 18 * sx, cy - 8 * sy], [cx + 18 * sx, cy + 5 * sy], [cx - 18 * sx, cy + 5 * sy]], 4), filled(C.teeth, 5));
    case 'H': return open(dShape(40, -8, 32, -3), teeth(-14, -4) + tongue(0, 6, 20, 11));
    default: return st(`M${X(-44)} ${Y(0)} L${X(44)} ${Y(0)}`);
  }
}

const VISEMES = ['X', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// ---------------------------------------------------------------- FX
function sweatDrop(x, y, s = 1) {
  const d = `M${f(x)} ${f(y - 34 * s)} Q${f(x + 22 * s)} ${f(y - 4 * s)} ${f(x + 16 * s)} ${f(y + 10 * s)} A${f(17 * s)} ${f(17 * s)} 0 1 1 ${f(x - 16 * s)} ${f(y + 10 * s)} Q${f(x - 22 * s)} ${f(y - 4 * s)} ${f(x)} ${f(y - 34 * s)} Z`;
  return S.path(d, filled(C.sweat, 5)) + S.ellipse(x - 6 * s, y + 4 * s, 4 * s, 7 * s, { fill: '#fff' });
}

function sparkle(x, y, r, color = C.star) {
  const d = `M${f(x)} ${f(y - r)} Q${f(x + r * 0.18)} ${f(y - r * 0.18)} ${f(x + r)} ${f(y)} Q${f(x + r * 0.18)} ${f(y + r * 0.18)} ${f(x)} ${f(y + r)} Q${f(x - r * 0.18)} ${f(y + r * 0.18)} ${f(x - r)} ${f(y)} Q${f(x - r * 0.18)} ${f(y - r * 0.18)} ${f(x)} ${f(y - r)} Z`;
  return S.path(d, { fill: color, stroke: LW, 'stroke-width': 4, 'stroke-linejoin': 'round' });
}

function markText(txt, x, y, size = 96, rot = 0, fill = '#fff') {
  return S.el('text', {
    x, y, 'font-family': 'Lilita One, Fredoka, sans-serif', 'font-size': size, fill,
    stroke: LW, 'stroke-width': 10, 'paint-order': 'stroke', 'stroke-linejoin': 'round',
    'text-anchor': 'middle', transform: rot ? `rotate(${rot} ${f(x)} ${f(y)})` : undefined,
  }, txt);
}

function angerMark(x, y, s = 1) {
  const a = 14 * s, b = 30 * s;
  const d = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sy]) =>
    `M${f(x + sx * a)} ${f(y + sy * b)} Q${f(x + sx * a)} ${f(y + sy * a)} ${f(x + sx * b)} ${f(y + sy * a)}`).join(' ');
  return S.path(d, { fill: 'none', stroke: '#E8243C', 'stroke-width': 9 * s, 'stroke-linecap': 'round' });
}

// fx entries are names or {type, ...}; coordinates in head space (front view)
function faceFx(list = [], ctx = {}) {
  const fx = ctx.fx || 0; // feature x shift (turn)
  let o = '';
  for (const raw of list) {
    const e = typeof raw === 'string' ? { type: raw } : raw;
    switch (e.type) {
      case 'sweat': o += sweatDrop((e.x ?? 168) + fx * 0.5, e.y ?? -880, e.s ?? 1); break;
      case 'sweat2': o += sweatDrop(172 + fx * 0.5, -890, 1) + sweatDrop(-176 + fx * 0.5, -840, 0.8); break;
      case 'blush':
        o += S.ellipse(-82 + fx, -640, 28, 12, { fill: C.blush, opacity: 0.6 }) + S.ellipse(82 + fx, -640, 28, 12, { fill: C.blush, opacity: 0.6 });
        break;
      case 'tears':
        for (const sx of [-1, 1]) {
          const x = sx * 64 + fx;
          o += S.path(`M${f(x - 10)} ${f(-660)} Q${f(x - 14)} ${f(-610)} ${f(x - 6)} ${f(-566)} L${f(x + 14)} ${f(-566)} Q${f(x + 10)} ${f(-612)} ${f(x + 12)} ${f(-660)} Z`, { fill: C.tear, stroke: LW, 'stroke-width': 4, opacity: 0.95 });
        }
        break;
      case 'question': o += markText('?', (e.x ?? 205) + fx * 0.3, e.y ?? -930, e.size ?? 110, e.rot ?? 12); break;
      case 'exclaim': o += markText('!', (e.x ?? 200) + fx * 0.3, e.y ?? -930, e.size ?? 120, e.rot ?? 10, '#FFD21F'); break;
      case 'anger': o += angerMark((e.x ?? 205) + fx * 0.5, e.y ?? -960, e.s ?? 1.1); break;
      case 'sparkles':
        o += sparkle(-230, -900, 26) + sparkle(235, -960, 34) + sparkle(250, -760, 20);
        break;
      case 'zzz': o += markText('z', 190, -930, 60, -10) + markText('Z', 240, -990, 84, -10); break;
      default: break;
    }
  }
  return o;
}

// ---------------------------------------------------------------- expressions
// brows: [innerDy, outerDy] per side (negative = up). They drive the hair V-notch.
const EXPR = {
  neutral:    { eyes: {}, brows: { L: [0, 0], R: [0, 0] }, mouth: 'line' },
  happy:      { eyes: { lower: 0.1, sparkle: true, pupil: 1.25 }, brows: { L: [-24, -8], R: [-24, -8] }, mouth: 'smile' },
  talkHappy:  { eyes: { lower: 0.08, pupil: 1.15, sparkle: true }, brows: { L: [-24, -8], R: [-24, -8] }, mouth: 'grin' },
  joy:        { eyes: { type: 'happy' }, brows: { L: [-30, -12], R: [-30, -12] }, mouth: 'bigGrin', fx: ['blush'] },
  excited:    { eyes: { type: 'star' }, brows: { L: [-40, -22], R: [-40, -22] }, mouth: 'bigGrin', fx: ['sparkles'] },
  amazed:     { eyes: { pupil: 1.7, sparkle: true }, brows: { L: [-40, -24], R: [-40, -24] }, mouth: 'O', fx: ['sparkles'] },
  shocked:    { eyes: { pupil: 0.5, cross: 0.4 }, brows: { L: [-46, -26], R: [-46, -26] }, mouth: 'O', fx: ['exclaim'] },
  scared:     { eyes: { pupil: 0.5, cross: 0.3 }, brows: { L: [-62, 14], R: [-62, 14] }, mouth: 'wavy', fx: ['sweat'] },
  scream:     { eyes: { pupil: 0.42, cross: 0.2 }, brows: { L: [-52, -20], R: [-52, -20] }, mouth: 'scream', fx: ['sweat2'] },
  angry:      { eyes: { upper: 0.3, tilt: 22 }, brows: { L: [16, -12], R: [16, -12] }, mouth: 'teeth', fx: ['anger'] },
  determined: { eyes: { upper: 0.2, tilt: 14, lower: 0.06 }, brows: { L: [10, -6], R: [10, -6] }, mouth: 'smirk' },
  sad:        { eyes: { upper: 0.24, tilt: -18, look: [0, 0.5] }, brows: { L: [-62, 16], R: [-62, 16] }, mouth: 'frown' },
  crying:     { eyes: { type: 'squint' }, brows: { L: [-62, 16], R: [-62, 16] }, mouth: 'wail', fx: ['tears'] },
  smug:       { eyes: { upper: 0.5, tilt: -4, look: [0.45, 0] }, brows: { L: [-8, -10], R: [-8, -10] }, mouth: 'smirk' },
  deadpan:    { eyes: { upper: 0.5 }, brows: { L: [0, 0], R: [0, 0] }, mouth: 'line' },
  nervous:    { eyes: { pupil: 0.75, look: [0.7, 0], cross: 0 }, brows: { L: [-50, 10], R: [-50, 10] }, mouth: 'teeth', fx: ['sweat'] },
  confused:   { eyeL: { pupil: 0.85 }, eyeR: { upper: 0.34, tilt: 10 }, brows: { L: [-34, -18], R: [12, 2] }, mouth: 'wavy', fx: ['question'] },
  sneaky:     { eyes: { upper: 0.46, tilt: 12, look: [0.95, 0], cross: 0 }, brows: { L: [12, -4], R: [12, -4] }, mouth: 'smirk' },
  yuck:       { eyes: { upper: 0.55, lower: 0.08 }, brows: { L: [-6, -4], R: [-6, -4] }, mouth: 'tongue' },
  dizzy:      { eyes: { type: 'swirl' }, brows: { L: [-30, 0], R: [-30, 0] }, mouth: 'wavy' },
  rich:       { eyes: { type: 'robux' }, brows: { L: [-36, -20], R: [-36, -20] }, mouth: 'bigGrin', fx: ['sparkles'] },
  love:       { eyes: { type: 'heart' }, brows: { L: [-36, -20], R: [-36, -20] }, mouth: 'grin', fx: ['blush'] },
  oof:        { eyes: { type: 'x' }, brows: { L: [-20, 0], R: [-20, 0] }, mouth: 'O' },
  sleepy:     { eyes: { upper: 0.72, tilt: -8 }, brows: { L: [-10, 6], R: [-10, 6] }, mouth: 'yawn', fx: ['zzz'] },
  cute:       { eyes: { pupil: 1.8, sparkle: true, cross: 0.6 }, brows: { L: [-34, -14], R: [-34, -14] }, mouth: 'cat', fx: ['blush'] },
};

function resolveFace(face) {
  if (!face) return resolveFace('neutral');
  if (typeof face === 'string') face = { name: face };
  const base = EXPR[face.name || 'neutral'] || EXPR.neutral;
  const eyes = { ...(base.eyes || {}), ...(face.eyes || {}) };
  return {
    eyeL: { ...eyes, ...(base.eyeL || {}), ...(face.eyeL || {}) },
    eyeR: { ...eyes, ...(base.eyeR || {}), ...(face.eyeR || {}) },
    brows: { ...(base.brows || {}), ...(face.brows || {}) },
    mouth: face.mouth || base.mouth || 'line',
    fx: face.fx !== undefined ? face.fx : (base.fx || []),
    blink: face.blink || 0,
  };
}

module.exports = { eye, mouth, faceFx, resolveFace, EXPR, VISEMES, robuxIcon, sparkle, sweatDrop, markText, starPath, heartPath };
