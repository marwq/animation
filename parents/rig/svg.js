// Small SVG string helpers shared by the rig, props and scenes.
'use strict';

const f = (n) => {
  const v = Math.round(n * 100) / 100;
  return Object.is(v, -0) ? '0' : String(v);
};

const pts = (arr) => arr.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

function attrs(o = {}) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${typeof v === 'number' ? f(v) : v}"`)
    .join(' ');
}

const el = (tag, a = {}, inner) =>
  inner === undefined ? `<${tag} ${attrs(a)}/>` : `<${tag} ${attrs(a)}>${inner}</${tag}>`;

const g = (inner, transform, extra = {}) =>
  el('g', { transform: transform || undefined, ...extra }, inner);

const poly = (arr, a = {}) => el('polygon', { points: pts(arr), ...a });
const pline = (arr, a = {}) => el('polyline', { points: pts(arr), fill: 'none', ...a });
const path = (d, a = {}) => el('path', { d, ...a });
const ellipse = (cx, cy, rx, ry, a = {}) => el('ellipse', { cx, cy, rx, ry, ...a });
const circle = (cx, cy, r, a = {}) => el('circle', { cx, cy, r, ...a });
const rect = (x, y, w, h, rx = 0, a = {}) => el('rect', { x, y, width: w, height: h, rx, ...a });

// Path from points with optional per-vertex corner rounding (quadratic fillets).
function roundedPath(points, r = 0, close = true) {
  if (!r) return 'M' + points.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + (close ? ' Z' : '');
  const n = points.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const rr = Array.isArray(p[2]) ? 0 : p[2] ?? r;
    const v1 = [prev[0] - p[0], prev[1] - p[1]];
    const v2 = [next[0] - p[0], next[1] - p[1]];
    const l1 = Math.hypot(...v1) || 1;
    const l2 = Math.hypot(...v2) || 1;
    const k1 = Math.min(rr, l1 / 2) / l1;
    const k2 = Math.min(rr, l2 / 2) / l2;
    const a = [p[0] + v1[0] * k1, p[1] + v1[1] * k1];
    const b = [p[0] + v2[0] * k2, p[1] + v2[1] * k2];
    d += (i === 0 ? 'M' : ' L') + `${f(a[0])} ${f(a[1])} Q${f(p[0])} ${f(p[1])} ${f(b[0])} ${f(b[1])}`;
  }
  return d + (close ? ' Z' : '');
}

// Unique ids for clipPaths/gradients inside one rendered document.
let _id = 0;
const uid = (p = 'u') => `${p}${++_id}`;
const resetIds = () => { _id = 0; };

function clipDef(id, inner) {
  return el('clipPath', { id }, inner);
}

// ---- math / easing ----
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
const ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};

module.exports = {
  f, pts, attrs, el, g, poly, pline, path, ellipse, circle, rect, roundedPath,
  uid, resetIds, clipDef, clamp, lerp, inv, ease,
};
