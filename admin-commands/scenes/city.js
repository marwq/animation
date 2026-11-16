// HEADER_PLACEHOLDER
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, hash, ln, T, TF } = K;
const E = K.E;
const LINE = '#151515';

// ---------------------------------------------------------------- tiny helpers
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const P = (d, a = {}) => (d ? S.path(d, a) : '');
const Ci = (x, y, r, a = {}) => S.circle(x, y, r, a);
const Ell = (x, y, rx, ry, a = {}) => S.ellipse(x, y, rx, ry, a);
const G = (inner, tfm, extra) => (inner ? S.g(inner, tfm, extra) : '');
const rp = (pts, r = 0) => S.roundedPath(pts, r);
const tf = (x, y, s = 1, rot = 0) => `translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const op = (fill, o) => ({ fill, opacity: f(clamp(o, 0, 1)) });
const olw = (fill, w = 5) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round' });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const outT = (txt, x, y, size, fill, sw = 8, extra = {}) => T(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const outTF = (txt, x, y, size, fill, sw = 6, extra = {}) => TF(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const blink = (t, rate, ph = 0) => (Math.floor(t * rate + ph) % 2 === 0 ? 1 : 0);
const rnd = (i, s = 0) => hash(i * 12.9898 + s * 78.233);
const sm = (a, b, v) => { const u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const wrap = (v, lo, hi) => lo + ((((v - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));

function hex2(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
// colour mix: mix('#ff0000', '#0000ff', 0.5)
function mix(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const A = hex2(a), B = hex2(b);
  return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join('');
}

// path-data builders: batch many shapes of one style into ONE <path> (cheap)
const dR = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
function dRR(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const a = `a${f(r)} ${f(r)} 0 0 1`;
  return `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}${a} ${f(r)} ${f(r)}v${f(h - 2 * r)}${a} ${f(-r)} ${f(r)}h${f(-(w - 2 * r))}${a} ${f(-r)} ${f(-r)}v${f(-(h - 2 * r))}${a} ${f(r)} ${f(-r)}Z`;
}
// all filled sub-paths wind CLOCKWISE (on screen) so unions of overlapping shapes never cancel into holes (nonzero rule)
const dC = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0Z`;
function dPoly(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
  const P_ = a < 0 ? pts.slice().reverse() : pts;
  return 'M' + P_.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';
}
// a limb as a filled quad between two points (silhouettes)
function dLimb(x1, y1, x2, y2, w) {
  const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2;
  return dPoly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]);
}

// ---------------------------------------------------------------- camera / layers (same conventions as the farm sets)
// visible world rectangle of a layer with parallax k
function vis(cam, k = 1) {
  cam = cam || {};
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540, sx = cam.sx || 0, sy = cam.sy || 0;
  const x = (cam.x || 0) * k, y = (cam.y || 0) * k;
  return { x0: fx + x - (fx + sx) / z, x1: fx + x + (1920 - fx - sx) / z, y0: fy + y - (fy + sy) / z, y1: fy + y + (1080 - fy - sy) / z, z };
}
const V = (cam, svg, k) => (svg ? S.g(svg, E.camTf(cam || {}, k)) : '');
// { bg, mid, fg, light }: light = colour washes, drawn LAST (over characters). String(L) = bg + mid + fg + light
function layers(bg = '', mid = '', fg = '', light = '', extra = {}) {
  const o = { bg, mid, fg, light, ...extra };
  Object.defineProperty(o, 'toString', { value() { return this.bg + this.mid + this.fg + this.light; }, enumerable: false });
  return o;
}
// rects that always cover the visible part of a layer
function band(cam, k, y0, y1, a) { const v = vis(cam, k); return R(v.x0 - 300, y0, v.x1 - v.x0 + 600, y1 - y0, 0, a); }
function fullRect(cam, k, a) { const v = vis(cam, k); return R(v.x0 - 300, v.y0 - 300, v.x1 - v.x0 + 600, v.y1 - v.y0 + 600, 0, a); }
// a wash over the whole frame, glued to layer k (so zoomed / panned / shaken cameras never show an unwashed edge)
const wash = (cam, col, o, k = 0) => (o > 0.004 ? V(cam, fullRect(cam, k, { fill: col, opacity: f(clamp(o, 0, 1)) }), k) : '');
// screen position of a layer point {x, y, k} seen through cam (e.g. where the tower roof is on screen right now)
function toScreen(cam, a) {
  cam = cam || {};
  const k = a.k ?? 1, z = 1 + ((cam.zoom ?? 1) - 1) * k, fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  return { x: fx + (cam.sx || 0) + z * (a.x - fx - (cam.x || 0) * k), y: fy + (cam.sy || 0) + z * (a.y - fy - (cam.y || 0) * k), z };
}
// slots of an endless filler strip (period px) visible in layer k, skipping the hand-made range [lo, hi)
function fillSlots(cam, k, lo, hi, period, fn) {
  const v = vis(cam, k);
  let o = '';
  for (let i = Math.floor((v.x0 - 320) / period); i <= Math.ceil((v.x1 + 320) / period); i++) {
    const x = i * period;
    if (x + period > lo && x < hi) continue;
    o += fn(i, x);
  }
  return o;
}
// inline vertical gradient (per frame, for colours that change with the time of day)
function vgrad(stops, id = S.uid('cityG')) {
  return { id, def: `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${f(a)}"` : ''}/>`).join('')}</linearGradient></defs>`, url: `url(#${id})` };
}

// ---------------------------------------------------------------- time-of-day palette
// opts.time: 0 day → 0.5 sunset → 1 night; opts.dawn 0..1 blends toward the soft dawn
const SKY_OFS = [0, 0.3, 0.58, 0.8, 1];
const PAL = {
  day: { sky: ['#2A82F2', '#4FA6FA', '#7EC6FF', '#AADCFF', '#D9F3FF'], far: '#9DB9E6', far2: '#BDD3F2', haze: '#E6F5FF', tint: '#FFFFFF', tintK: 0, lit: 0, glass: 1, cloud: '#FFFFFF', cloudSh: '#C6DEFA', road: '#5A6079', walk: '#C4C8D8', curb: '#9095AC', star: 0, wash: '#FFFFFF', washK: 0, neon: 0, sil: '#5A6FA0' },
  sunset: { sky: ['#33287A', '#8A3C9A', '#E4558C', '#FF8E62', '#FFC57C'], far: '#93589E', far2: '#C46E98', haze: '#FFA483', tint: '#DE5E8E', tintK: 0.32, lit: 0.38, glass: 0.75, cloud: '#FFB5C4', cloudSh: '#C2639A', road: '#4B3C64', walk: '#B58BA6', curb: '#7A5A84', star: 0.12, wash: '#FF5E9A', washK: 0.1, neon: 0.6, sil: '#4A2A66' },
  night: { sky: ['#070824', '#10103D', '#1E1650', '#321F66', '#4C2C7C'], far: '#2B245C', far2: '#3B2D6E', haze: '#4E2F80', tint: '#181640', tintK: 0.7, lit: 1, glass: 0.22, cloud: '#3A3478', cloudSh: '#231E52', road: '#24213E', walk: '#3B3662', curb: '#2B274E', star: 1, wash: '#27279A', washK: 0.15, neon: 1, sil: '#120F33' },
  dawn: { sky: ['#7F93E6', '#B9A2E4', '#F4AFC8', '#FFCDAE', '#FFE8B6'], far: '#B48FC6', far2: '#D6A8C8', haze: '#FFD3B2', tint: '#F59FB2', tintK: 0.2, lit: 0.12, glass: 0.85, cloud: '#FFE4EC', cloudSh: '#E9A6C3', road: '#685A7E', walk: '#D4B8C8', curb: '#9A82A8', star: 0.12, wash: '#FFB08A', washK: 0.07, neon: 0.1, sil: '#6A4E86' },
};
function blendPal(a, b, u) {
  if (u <= 0) return a;
  if (u >= 1) return b;
  const o = {};
  for (const k in a) {
    if (Array.isArray(a[k])) o[k] = a[k].map((c, i) => mix(c, b[k][i], u));
    else o[k] = typeof a[k] === 'number' ? lerp(a[k], b[k], u) : mix(a[k], b[k], u);
  }
  return o;
}
function palAt(time = 0, dawn = 0) {
  const tt = clamp(time, 0, 1);
  let p = tt <= 0.5 ? blendPal(PAL.day, PAL.sunset, tt * 2) : blendPal(PAL.sunset, PAL.night, tt * 2 - 1);
  if (dawn > 0) p = blendPal(p, PAL.dawn, clamp(dawn, 0, 1));
  return { ...p, time: tt, dawn: clamp(dawn, 0, 1) };
}
// building colour seen at this time of day
const bc = (col, p) => mix(col, p.tint, p.tintK);

// ---------------------------------------------------------------- DEFS (static patterns + gradients, ids `city*`)
function winTile(id, cw, ch, cols, rows, ww, wh, night, seed, big) {
  let o = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = c * cw + (cw - ww) / 2, y = r * ch + (ch - wh) / 2, v = rnd(r * 17 + c * 5, seed);
    if (!night) {
      o += `<rect x="${f(x)}" y="${f(y)}" width="${ww}" height="${wh}" rx="${big ? 3 : 1.5}" fill="#EAF7FF" opacity="0.5"/>`;
      if (big) {
        o += `<rect x="${f(x + 3)}" y="${f(y + 3)}" width="${f(ww * 0.22)}" height="${f(wh * 0.45)}" rx="1.5" fill="#FFFFFF" opacity="0.65"/>`;
        if (v < 0.22) o += `<rect x="${f(x)}" y="${f(y)}" width="${ww}" height="${f(wh * 0.45)}" rx="2" fill="#3A4A6A" opacity="0.18"/>`;
      }
      continue;
    }
    const col = v < 0.38 ? '#FFD45A' : v < 0.5 ? '#FFB347' : v < 0.57 ? '#9FEBFF' : v < 0.62 ? '#FF9BD8' : null;
    if (!col) { o += `<rect x="${f(x)}" y="${f(y)}" width="${ww}" height="${wh}" rx="1.5" fill="#0C0A26" opacity="0.35"/>`; continue; }
    o += `<rect x="${f(x)}" y="${f(y)}" width="${ww}" height="${wh}" rx="${big ? 3 : 1.5}" fill="${col}"/>`;
    if (big) {
      o += `<rect x="${f(x)}" y="${f(y)}" width="${ww}" height="${f(wh * 0.3)}" rx="3" fill="#FFFFFF" opacity="0.35"/>`;
      if (rnd(r * 3 + c, seed + 9) < 0.18) o += `<path d="M${f(x + ww * 0.3)} ${f(y + wh)} v${f(-wh * 0.28)} q0 ${f(-wh * 0.16)} ${f(ww * 0.2)} ${f(-wh * 0.16)} q${f(ww * 0.2)} 0 ${f(ww * 0.2)} ${f(wh * 0.16)} v${f(wh * 0.28)}Z M${f(x + ww * 0.5)} ${f(y + wh * 0.5)} m-${f(ww * 0.11)} 0 a${f(ww * 0.11)} ${f(ww * 0.11)} 0 1 0 ${f(ww * 0.22)} 0 a${f(ww * 0.11)} ${f(ww * 0.11)} 0 1 0 -${f(ww * 0.22)} 0" fill="#3A2440" opacity="0.8"/>`;
      else if (rnd(r * 5 + c, seed + 11) < 0.25) o += `<path d="M${f(x)} ${f(y)} h${f(ww * 0.3)} q-${f(ww * 0.05)} ${f(wh * 0.5)} -${f(ww * 0.3)} ${f(wh)}Z M${f(x + ww)} ${f(y)} h-${f(ww * 0.3)} q${f(ww * 0.05)} ${f(wh * 0.5)} ${f(ww * 0.3)} ${f(wh)}Z" fill="#E0605A" opacity="0.55"/>`;
    }
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${cw * cols}" height="${ch * rows}">${o}</pattern>`;
}
function starTile() {
  let o = '';
  for (let i = 0; i < 26; i++) {
    const x = rnd(i, 61) * 520, y = rnd(i, 62) * 380, r = 1.2 + rnd(i, 63) * 2.2;
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#FFF6E0" opacity="${f(0.45 + rnd(i, 64) * 0.5)}"/>`;
  }
  o += '<path d="M260 120 l4 -14 l4 14 l14 4 l-14 4 l-4 14 l-4 -14 l-14 -4Z M70 300 l3 -10 l3 10 l10 3 l-10 3 l-3 10 l-3 -10 l-10 -3Z" fill="#FFFFFF" opacity="0.9"/>';
  return `<pattern id="cityStars" patternUnits="userSpaceOnUse" width="520" height="380">${o}</pattern>`;
}
function latTile(id, col) {
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="32" height="32"><path d="M0 0L32 32M32 0L0 32M0 0H32M0 32H32" stroke="#151515" stroke-width="6"/><path d="M0 0L32 32M32 0L0 32M0 0H32M0 32H32" stroke="${col}" stroke-width="3"/></pattern>`;
}
function knitTile() {
  const cols = ['#E8705E', '#F2C14E', '#6DBE8A', '#7FA8E0', '#C58BD8', '#F29BB8'];
  let o = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x = c * 40, y = r * 40, a = cols[(r * 2 + c) % 6], b = cols[(r * 2 + c + 3) % 6];
    o += `<rect x="${x}" y="${y}" width="40" height="40" fill="#F6E8C8"/><rect x="${x + 4}" y="${y + 4}" width="32" height="32" rx="3" fill="${a}"/><rect x="${x + 11}" y="${y + 11}" width="18" height="18" rx="3" fill="${b}"/><rect x="${x + 16}" y="${y + 16}" width="8" height="8" rx="2" fill="#F6E8C8"/>`;
    o += `<path d="M${x + 6} ${y + 8} h28 M${x + 6} ${y + 32} h28" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="3 3" opacity="0.5"/>`;
  }
  return `<pattern id="cityKnit" patternUnits="userSpaceOnUse" width="120" height="120">${o}</pattern>`;
}

// tiny city thumbnails (monitor screens). cm = colour map (identity or green phosphor)
const greenify = (c) => { const [r, g, b] = hex2(c); const l = (0.3 * r + 0.59 * g + 0.11 * b) / 255; return mix('#06240F', '#B9FFB4', Math.pow(l, 0.9)); };
const ID = (c) => c;
function thumb(kind, x, y, w, h, cm = ID, t = 0) {
  const X = (u) => x + u * w, Y = (v) => y + v * h;
  const bl = (pts) => dPoly(pts.map(([u, v]) => [X(u), Y(v)]));
  const sky = (top, bot) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h * 0.6)}" fill="${cm(top)}"/><rect x="${f(x)}" y="${f(y + h * 0.6)}" width="${f(w)}" height="${f(h * 0.4)}" fill="${cm(bot)}"/>`;
  const sky1 = (c) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${cm(c)}"/>`;
  const skyline = (seed, hMin, hMax, col, winCol, n = 7) => {
    let d = '', wd = '';
    let u = 0;
    for (let i = 0; u < 1; i++) {
      const bw = 0.08 + rnd(i, seed) * 0.12, bh = hMin + rnd(i, seed + 1) * (hMax - hMin);
      d += dR(X(u), Y(1 - bh), bw * w, bh * h + 1);
      if (winCol) for (let j = 0; j < 4; j++) if (rnd(i * 7 + j, seed + 2) < 0.6) wd += dR(X(u + bw * 0.25) + (j % 2) * bw * w * 0.35, Y(1 - bh + 0.08 + Math.floor(j / 2) * 0.12), Math.max(1.5, bw * w * 0.18), Math.max(1.5, h * 0.05));
      u += bw + (rnd(i, seed + 3) < 0.3 ? 0.02 : 0);
      if (i > n * 3) break;
    }
    return `<path d="${d}" fill="${cm(col)}"/>` + (wd ? `<path d="${wd}" fill="${cm(winCol)}"/>` : '');
  };
  switch (kind) {
    case 'day': return sky('#6CC0FF', '#A8DDFF') + `<circle cx="${f(X(0.8))}" cy="${f(Y(0.22))}" r="${f(h * 0.1)}" fill="${cm('#FFE97A')}"/>` + skyline(3, 0.25, 0.7, '#3E6FB8', '#BFE4FF');
    case 'night': return sky1('#16164A') + `<circle cx="${f(X(0.2))}" cy="${f(Y(0.22))}" r="${f(h * 0.11)}" fill="${cm('#FFF3C8')}"/>` + skyline(5, 0.3, 0.75, '#2C2A66', '#FFD45A');
    case 'sunset': return sky('#7A3E9A', '#FF8A6A') + `<circle cx="${f(X(0.55))}" cy="${f(Y(0.62))}" r="${f(h * 0.16)}" fill="${cm('#FFD27A')}"/>` + skyline(7, 0.15, 0.55, '#4E2A66', '#FFB45A');
    case 'snow': {
      let d = '';
      for (let i = 0; i < 6; i++) d += dC(X(rnd(i, 71)), Y(rnd(i, 72) * 0.6), Math.max(1.5, h * 0.02));
      return sky1('#B9C9E2') + skyline(9, 0.2, 0.6, '#5E6E92', '#FFE7A0') + `<path d="${bl([[0, 0.62], [0.2, 0.55], [0.45, 0.66], [0.7, 0.52], [1, 0.6], [1, 1], [0, 1]])}" fill="${cm('#F4F8FF')}" opacity="0.9"/><path d="${d}" fill="${cm('#FFFFFF')}"/>`;
    }
    case 'desert': return sky('#FFC98A', '#FFE2B0') + `<circle cx="${f(X(0.25))}" cy="${f(Y(0.3))}" r="${f(h * 0.12)}" fill="${cm('#FFF2B0')}"/><path d="${bl([[0.45, 0.85], [0.62, 0.38], [0.79, 0.85]]) + bl([[0.7, 0.85], [0.8, 0.55], [0.92, 0.85]])}" fill="${cm('#D9954E')}"/><rect x="${f(x)}" y="${f(Y(0.84))}" width="${f(w)}" height="${f(h * 0.16)}" fill="${cm('#E8B26A')}"/><path d="M${f(X(0.18))} ${f(Y(0.86))} v${f(-h * 0.32)} M${f(X(0.18))} ${f(Y(0.56))} l${f(-w * 0.07)} ${f(h * 0.05)} M${f(X(0.18))} ${f(Y(0.56))} l${f(w * 0.07)} ${f(h * 0.05)}" stroke="${cm('#3E8A4A')}" stroke-width="${f(Math.max(2, w * 0.03))}" stroke-linecap="round"/>`;
    case 'bridge': return sky('#8FD0FF', '#B9E4FF') + `<rect x="${f(x)}" y="${f(Y(0.7))}" width="${f(w)}" height="${f(h * 0.3)}" fill="${cm('#2F7FD0')}"/>` + skyline(11, 0.15, 0.45, '#6C86B8', null) + `<path d="M${f(X(0.25))} ${f(Y(0.95))} V${f(Y(0.2))} M${f(X(0.75))} ${f(Y(0.95))} V${f(Y(0.2))} M${f(X(0))} ${f(Y(0.62))} H${f(X(1))} M${f(X(0))} ${f(Y(0.5))} Q${f(X(0.25))} ${f(Y(0.18))} ${f(X(0.25))} ${f(Y(0.2))} Q${f(X(0.5))} ${f(Y(0.6))} ${f(X(0.75))} ${f(Y(0.2))} Q${f(X(1))} ${f(Y(0.4))} ${f(X(1))} ${f(Y(0.5))}" stroke="${cm('#E0483C')}" stroke-width="${f(Math.max(2, w * 0.022))}" fill="none"/>`;
    case 'needle': return sky('#A9DAFF', '#D4EEFF') + skyline(13, 0.15, 0.5, '#5A6A9A', '#DCEFFF') + `<path d="M${f(X(0.62))} ${f(Y(1))} L${f(X(0.66))} ${f(Y(0.3))} L${f(X(0.7))} ${f(Y(1))}Z ${dRR(X(0.58), Y(0.24), w * 0.16, h * 0.08, h * 0.04)} M${f(X(0.66))} ${f(Y(0.24))} V${f(Y(0.06))}" fill="${cm('#E8EEF8')}" stroke="${cm('#3A4A6A')}" stroke-width="${f(Math.max(1.5, w * 0.012))}"/>`;
    case 'beach': return sky1('#7AD0FF') + `<rect x="${f(x)}" y="${f(Y(0.55))}" width="${f(w)}" height="${f(h * 0.25)}" fill="${cm('#1F9AE0')}"/><path d="${bl([[0, 0.8], [0.4, 0.72], [1, 0.82], [1, 1], [0, 1]])}" fill="${cm('#F6D99A')}"/>` + `<path d="${dR(X(0.55), Y(0.3), w * 0.12, h * 0.26) + dR(X(0.7), Y(0.22), w * 0.14, h * 0.34) + dR(X(0.86), Y(0.36), w * 0.1, h * 0.2)}" fill="${cm('#F2A27A')}"/><path d="M${f(X(0.2))} ${f(Y(0.82))} Q${f(X(0.22))} ${f(Y(0.55))} ${f(X(0.3))} ${f(Y(0.4))}" stroke="${cm('#8A5A3A')}" stroke-width="${f(Math.max(2, w * 0.025))}" fill="none"/><path d="M${f(X(0.3))} ${f(Y(0.4))} q${f(-w * 0.12)} ${f(-h * 0.02)} ${f(-w * 0.16)} ${f(h * 0.1)} M${f(X(0.3))} ${f(Y(0.4))} q${f(w * 0.12)} ${f(-h * 0.04)} ${f(w * 0.16)} ${f(h * 0.08)} M${f(X(0.3))} ${f(Y(0.4))} q${f(-w * 0.02)} ${f(-h * 0.12)} ${f(-w * 0.1)} ${f(-h * 0.12)}" stroke="${cm('#3EA85A')}" stroke-width="${f(Math.max(2, w * 0.03))}" fill="none" stroke-linecap="round"/>`;
    case 'park': return sky('#8AD2FF', '#C2EAFF') + skyline(17, 0.3, 0.7, '#7A8CC8', '#E0F2FF') + `<path d="${bl([[0, 0.78], [0.3, 0.7], [0.6, 0.76], [1, 0.7], [1, 1], [0, 1]])}" fill="${cm('#5CC46A')}"/><path d="${dC(X(0.2), Y(0.68), h * 0.09) + dC(X(0.32), Y(0.7), h * 0.07) + dC(X(0.78), Y(0.66), h * 0.09)}" fill="${cm('#2E9C4E')}"/>`;
    default: return sky1('#203040');
  }
}
const MON_STYLES = { beige: ['#DCCFB0', '#B4A585'], grey: ['#ADABA4', '#87857E'], dark: ['#57525F', '#3C3845'], wood: ['#9A6440', '#764A2C'], cream: ['#EDE3CC', '#C9BC9C'] };
// a CRT monitor housing; returns svg + the screen rect
function monHousing(x, y, w, h, style = 'beige') {
  const [c, sh] = MON_STYLES[style] || MON_STYLES.beige;
  const sx = x + 12, sy = y + 12, sw = w - 24, shh = h - 40;
  let o = `<rect x="${f(x + 3)}" y="${f(y + 3)}" width="${f(w - 6)}" height="${f(h - 6)}" rx="12" fill="${c}" stroke="#151515" stroke-width="4"/>`;
  o += `<rect x="${f(x + 3)}" y="${f(y + h - 30)}" width="${f(w - 6)}" height="27" rx="10" fill="${sh}"/>`;
  o += `<circle cx="${f(x + w - 26)}" cy="${f(y + h - 16)}" r="5" fill="${sh}" stroke="#151515" stroke-width="2.5"/><circle cx="${f(x + w - 44)}" cy="${f(y + h - 16)}" r="4" fill="${sh}" stroke="#151515" stroke-width="2.5"/><rect x="${f(x + 16)}" y="${f(y + h - 19)}" width="10" height="5" rx="2" fill="#5CFF8A"/>`;
  return { o, sx, sy, sw, sh: shh };
}
function monTile(id, cm) {
  const M = [
    [0, 0, 200, 150, 'beige', 'day'], [200, 0, 150, 150, 'grey', 'night'], [350, 0, 180, 150, 'dark', 'sunset'], [530, 0, 130, 150, 'cream', 'snow'],
    [0, 150, 140, 150, 'wood', 'beach'], [140, 150, 190, 150, 'beige', 'bridge'], [330, 150, 160, 150, 'grey', 'desert'], [490, 150, 170, 150, 'dark', 'needle'],
    [0, 300, 170, 150, 'grey', 'park'], [170, 300, 160, 150, 'cream', 'sunset'], [330, 300, 200, 150, 'wood', 'night'], [530, 300, 130, 150, 'beige', 'day'],
  ];
  let o = '<rect width="660" height="450" fill="#2A1E26"/>';
  for (const [x, y, w, h, st, kind] of M) {
    const hs = monHousing(x, y, w, h, st);
    o += hs.o + `<rect x="${f(hs.sx)}" y="${f(hs.sy)}" width="${f(hs.sw)}" height="${f(hs.sh)}" rx="8" fill="#000"/>`;
    o += thumb(kind, hs.sx + 3, hs.sy + 3, hs.sw - 6, hs.sh - 6, cm);
    o += `<path d="M${f(hs.sx + 8)} ${f(hs.sy + hs.sh - 8)} L${f(hs.sx + hs.sw * 0.4)} ${f(hs.sy + 8)} L${f(hs.sx + hs.sw * 0.55)} ${f(hs.sy + 8)} L${f(hs.sx + 26)} ${f(hs.sy + hs.sh - 8)}Z" fill="#FFFFFF" opacity="0.12"/>`;
    o += `<rect x="${f(hs.sx)}" y="${f(hs.sy)}" width="${f(hs.sw)}" height="${f(hs.sh)}" rx="8" fill="none" stroke="#151515" stroke-width="3"/>`;
  }
  // shelf planks between the rows
  o += '<rect x="0" y="146" width="660" height="10" fill="#6A4A3A"/><rect x="0" y="296" width="660" height="10" fill="#6A4A3A"/><rect x="0" y="446" width="660" height="4" fill="#6A4A3A"/>';
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="660" height="450">${o}</pattern>`;
}
function plankTile() {
  let o = '<rect width="320" height="64" fill="#8A5634"/>';
  o += '<rect y="0" width="320" height="32" fill="#9A633E"/><path d="M0 32H320M0 64H320M110 0V32M260 0V32M40 32V64M200 32V64" stroke="#5E3A22" stroke-width="3"/>';
  o += '<path d="M20 12 q30 -4 60 0 M150 20 q40 4 80 0 M70 46 q30 -5 70 0 M230 52 q30 4 60 0" stroke="#6E4428" stroke-width="2" fill="none" opacity="0.6"/>';
  return `<pattern id="cityPlank" patternUnits="userSpaceOnUse" width="320" height="64">${o}</pattern>`;
}

const DEFS = `<defs>
${starTile()}
${winTile('cityWinFarD', 16, 22, 10, 8, 7, 11, false, 1, false)}
${winTile('cityWinFarN', 16, 22, 10, 8, 7, 11, true, 2, false)}
${winTile('cityWinMidD', 32, 40, 8, 6, 18, 26, false, 3, true)}
${winTile('cityWinMidN', 32, 40, 8, 6, 18, 26, true, 4, true)}
${winTile('cityWinNearD', 48, 60, 6, 5, 30, 40, false, 5, true)}
${winTile('cityWinNearN', 48, 60, 6, 5, 30, 40, true, 6, true)}
${latTile('cityLatD', '#FFC21F')}
${latTile('cityLatN', '#8A6A2A')}
${knitTile()}
${monTile('cityMonA', ID)}
${monTile('cityMonG', greenify)}
${plankTile()}
<pattern id="cityCrowd" patternUnits="userSpaceOnUse" width="24" height="16"><circle cx="5" cy="5" r="3.2" fill="#FF6B6B"/><circle cx="14" cy="11" r="3.2" fill="#FFD34E"/><circle cx="21" cy="4" r="3.2" fill="#6FD3FF"/><circle cx="2" cy="13" r="3" fill="#FFFFFF"/></pattern>
<pattern id="cityAwn" patternUnits="userSpaceOnUse" width="40" height="10"><rect width="20" height="10" fill="#FFFFFF" opacity="0.75"/></pattern>
<pattern id="cityTar" patternUnits="userSpaceOnUse" width="240" height="90"><path d="M0 45H240M0 90H240M80 0V45M200 45V90" stroke="#000" stroke-width="3" opacity="0.12"/><ellipse cx="150" cy="22" rx="30" ry="7" fill="#000" opacity="0.06"/><ellipse cx="40" cy="70" rx="22" ry="5" fill="#FFF" opacity="0.06"/></pattern>
<pattern id="cityBrick" patternUnits="userSpaceOnUse" width="64" height="32"><path d="M0 16H64M0 32H64M32 0V16M0 16V32M64 16V32" stroke="#000" stroke-width="3" opacity="0.18"/></pattern>
<pattern id="citySand" patternUnits="userSpaceOnUse" width="200" height="44"><path d="M0 14 q25 -8 50 0 t50 0 M100 34 q25 -8 50 0 t50 0" stroke="#B8702E" stroke-width="3" fill="none" opacity="0.22"/></pattern>
<pattern id="cityWaves" patternUnits="userSpaceOnUse" width="220" height="70"><path d="M20 20 q12 -10 24 0 q12 10 24 0 M130 52 q12 -10 24 0 q12 10 24 0" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.45"/></pattern>
<pattern id="cityScan" patternUnits="userSpaceOnUse" width="6" height="6"><rect width="6" height="2" fill="#000" opacity="0.22"/></pattern>
<pattern id="cityKeys" patternUnits="userSpaceOnUse" width="26" height="20"><rect x="2" y="2" width="22" height="16" rx="4" fill="#F4ECD8"/><rect x="2" y="13" width="22" height="5" rx="2" fill="#C9BC9C"/></pattern>
<pattern id="cityCode" patternUnits="userSpaceOnUse" width="90" height="60"><path d="M8 10h22M36 10h10M52 10h28M14 24h30M50 24h16M8 38h12M26 38h34M66 38h14M18 52h20M44 52h30" stroke="#8FE8FF" stroke-width="4" stroke-linecap="round" opacity="0.55"/></pattern>
<linearGradient id="cityBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF0" stop-opacity="0.85"/><stop offset="0.45" stop-color="#FFE9A8" stop-opacity="0.3"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></linearGradient>
<linearGradient id="cityAdminWash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8DD" stop-opacity="0.6"/><stop offset="0.5" stop-color="#FFF0C0" stop-opacity="0.18"/><stop offset="1" stop-color="#FFF0C0" stop-opacity="0.04"/></linearGradient>
<linearGradient id="cityGoldBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE68A"/><stop offset="0.5" stop-color="#FFD03A"/><stop offset="1" stop-color="#F0B000"/></linearGradient>
<linearGradient id="cityLampCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD99A" stop-opacity="0.5"/><stop offset="1" stop-color="#FFC060" stop-opacity="0"/></linearGradient>
<linearGradient id="cityConeCool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8FAFF" stop-opacity="0.45"/><stop offset="1" stop-color="#9FE8FF" stop-opacity="0"/></linearGradient>
<linearGradient id="cityEdgeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#140A10" stop-opacity="0.6"/><stop offset="1" stop-color="#140A10" stop-opacity="0"/></linearGradient>
<linearGradient id="cityEdgeR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#140A10" stop-opacity="0.6"/><stop offset="1" stop-color="#140A10" stop-opacity="0"/></linearGradient>
<linearGradient id="cityDarkDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A0618" stop-opacity="0.75"/><stop offset="1" stop-color="#0A0618" stop-opacity="0"/></linearGradient>
<linearGradient id="cityDarkUp" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#140A10" stop-opacity="0.55"/><stop offset="1" stop-color="#140A10" stop-opacity="0"/></linearGradient>
<linearGradient id="cityOcean" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A5FC8"/><stop offset="0.45" stop-color="#2390E6"/><stop offset="1" stop-color="#3CC6E8"/></linearGradient>
<linearGradient id="cityShallow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FF0E8"/><stop offset="1" stop-color="#3CC6E8"/></linearGradient>
<linearGradient id="citySnowSh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#CFE0F5"/></linearGradient>
<linearGradient id="cityCloudSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D8E8FF"/></linearGradient>
<radialGradient id="cityGlowW"><stop offset="0" stop-color="#FFE6A8" stop-opacity="0.9"/><stop offset="1" stop-color="#FFC060" stop-opacity="0"/></radialGradient>
<radialGradient id="cityGlowGold"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="0.3" stop-color="#FFF2B8" stop-opacity="0.75"/><stop offset="1" stop-color="#FFD34E" stop-opacity="0"/></radialGradient>
<radialGradient id="cityGlowCool"><stop offset="0" stop-color="#C9F6FF" stop-opacity="0.85"/><stop offset="1" stop-color="#7FE0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="cityGlowPink"><stop offset="0" stop-color="#FF8AD8" stop-opacity="0.8"/><stop offset="1" stop-color="#FF4FB8" stop-opacity="0"/></radialGradient>
<radialGradient id="cityGlowGreen"><stop offset="0" stop-color="#B6FFC0" stop-opacity="0.8"/><stop offset="1" stop-color="#46F58C" stop-opacity="0"/></radialGradient>
<radialGradient id="cityGlowRed"><stop offset="0" stop-color="#FF7A7A" stop-opacity="0.9"/><stop offset="1" stop-color="#FF2E4D" stop-opacity="0"/></radialGradient>
</defs>`;

// ================================================================ PROPS (plain svg strings)
// All props: opts.tint + opts.tintK darken/colour them toward a time-of-day tint (city() passes its palette).
const tinter = (opts) => (opts.tint && opts.tintK ? (c) => mix(c, opts.tint, opts.tintK) : (c) => c);

// ---------------------------------------------------------------- crack(x, y, r, k): the sky cracking like glass
// k 0..1 = spread (rays grow from the centre, then branches and the "spider-web" rings); r = full radius in px.
// Light pours out of the lines and the shattered hole. opts { glow 0..1, rot }.
const CRACK = (() => {
  const N = 12, rays = [];
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2 + (rnd(i, 31) - 0.5) * 0.42;
    const len = 0.42 + rnd(i, 32) * 0.58;
    const pts = [[Math.cos(a0) * 0.05, Math.sin(a0) * 0.05]];
    for (let j = 1; j <= 5; j++) {
      const a = a0 + (rnd(i * 9 + j, 33) - 0.5) * 0.34, d = 0.05 + (len - 0.05) * j / 5;
      pts.push([Math.cos(a) * d, Math.sin(a) * d]);
    }
    rays.push({ pts, delay: rnd(i, 34) * 0.35 });
  }
  const branches = [];
  rays.forEach((r, i) => [2, 3, 4].forEach((j) => {
    if (rnd(i * 5 + j, 35) > 0.62) return;
    const p = r.pts[j], a = Math.atan2(p[1], p[0]) + (rnd(i + j * 3, 36) < 0.5 ? -1 : 1) * (0.5 + rnd(i * 3 + j, 37) * 0.5), l = 0.07 + rnd(i * 7 + j, 38) * 0.13;
    branches.push({ i, j, pts: [p, [p[0] + Math.cos(a + 0.25) * l * 0.5, p[1] + Math.sin(a + 0.25) * l * 0.5], [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l]] });
  }));
  const rings = [];
  [1, 3].forEach((j) => {
    for (let i = 0; i < N; i++) {
      if (rnd(i * 11 + j, 39) > 0.78) continue;
      const a = rays[i].pts[j], b = rays[(i + 1) % N].pts[j], s = 1 + (rnd(i + j, 40) - 0.3) * 0.3;
      rings.push({ i, j, pts: [a, [(a[0] + b[0]) / 2 * s, (a[1] + b[1]) / 2 * s], b] });
    }
  });
  const hole = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, d = i % 2 ? 0.03 + rnd(i, 41) * 0.02 : 0.06 + rnd(i, 41) * 0.04; hole.push([Math.cos(a) * d, Math.sin(a) * d]); }
  return { N, rays, branches, rings, hole };
})();
function partialLine(pts, u) {
  const n = pts.length - 1, e = clamp(u, 0, 1) * n;
  if (e <= 0) return null;
  const i = Math.floor(e), out = pts.slice(0, i + 1), fr = e - i;
  if (fr > 0 && i < n) out.push([lerp(pts[i][0], pts[i + 1][0], fr), lerp(pts[i][1], pts[i + 1][1], fr)]);
  return out;
}
function crackD(r, k) {
  const ev = CRACK.rays.map((ray) => clamp((k - ray.delay * 0.55) / (1 - ray.delay * 0.55), 0, 1));
  const line = (pts) => (pts ? 'M' + pts.map((q) => `${f(q[0] * r)} ${f(q[1] * r)}`).join('L') : '');
  let d = '';
  CRACK.rays.forEach((ray, i) => { d += line(partialLine(ray.pts, ev[i])); });
  CRACK.branches.forEach((b) => { const u = ev[b.i] * 5 - b.j; if (u > 0) d += line(partialLine(b.pts, u * 1.6)); });
  CRACK.rings.forEach((g) => { const u = Math.min(ev[g.i], ev[(g.i + 1) % CRACK.N]) * 5 - g.j - 0.4; if (u > 0) d += line(partialLine(g.pts, u * 1.3)); });
  return d;
}
function crack(x, y, r, k, opts = {}) {
  if (!(k > 0)) return '';
  const { glow = 1, rot = 0 } = opts;
  const d = crackD(r, k), sw = clamp(r / 420, 0.45, 2.4);
  let o = '';
  if (glow > 0) o += Ci(0, 0, r * (0.22 + 0.32 * k), { fill: 'url(#cityGlowGold)', opacity: f(0.8 * glow * Math.min(1, k * 2)) });
  o += P(d, ln(34 * sw, '#FFE9A0', 0.25 * glow));
  o += P(d, ln(13 * sw, LINE, 0.4));
  o += P(d, ln(8.5 * sw, '#FFC93C'));
  o += P(d, ln(3.4 * sw, '#FFFFFF'));
  const hk = ease.outBack(clamp(k * 2.4, 0, 1));
  if (hk > 0.01) o += P(dPoly(CRACK.hole.map(([a, b]) => [a * r * hk, b * r * hk])), { fill: '#FFFFFF', stroke: '#FFC93C', 'stroke-width': f(6 * sw), 'stroke-linejoin': 'round' });
  if (k > 0.35) {
    // shards of "sky glass" drifting out of the hole
    const u = clamp((k - 0.35) / 0.65, 0, 1);
    let sd = '';
    for (let i = 0; i < 5; i++) {
      const a = rnd(i, 42) * Math.PI * 2, dd = r * (0.1 + 0.12 * u + rnd(i, 43) * 0.05), s2 = r * (0.02 + rnd(i, 44) * 0.02);
      const cx = Math.cos(a) * dd, cy = Math.sin(a) * dd + u * r * 0.08 * (1 + i % 2);
      sd += dPoly([[cx - s2, cy - s2 * 0.6], [cx + s2 * 1.2, cy - s2 * 0.2], [cx - s2 * 0.2, cy + s2 * 1.1]]);
    }
    o += P(sd, { fill: '#DDF4FF', stroke: '#FFC93C', 'stroke-width': f(3 * sw), 'stroke-linejoin': 'round', opacity: f(1 - u * 0.4) });
  }
  return G(o, tf(x, y, 1, rot));
}

// ---------------------------------------------------------------- server message (grey system window floating in the sky)
// serverMsg(x, y, w, line, k, opts) — (x, y) centre; k pop-in 0..1; opts { h, title, neon 0..1, col (neon colour), s, size }
function serverMsg(x, y, w, line, k = 1, opts = {}) {
  const sc = ease.outBack(clamp(k, 0, 1)) * (opts.s || 1);
  if (sc < 0.01) return '';
  const h = opts.h || 118, title = opts.title || 'SERVER MESSAGE', neon = opts.neon || 0, ncol = opts.col || '#FF4FD8';
  let o = '';
  if (neon > 0.02) o += R(-w / 2 - 9, -h / 2 - 9, w + 18, h + 18, 24, { fill: 'none', stroke: ncol, 'stroke-width': 12, opacity: f(0.5 * neon) });
  o += R(-w / 2 + 9, -h / 2 + 11, w, h, 16, op('#000', 0.22));
  o += R(-w / 2, -h / 2, w, h, 16, { fill: '#E6E9F0', stroke: neon > 0.5 ? mix(LINE, ncol, 0.6 * neon) : LINE, 'stroke-width': 5 });
  o += P(`M${f(-w / 2)} ${f(-h / 2 + 40)}V${f(-h / 2 + 16)}q0 -16 16 -16H${f(w / 2 - 16)}q16 0 16 16V${f(-h / 2 + 40)}Z`, { fill: '#5A6478' });
  o += TF(esc(title), -w / 2 + 16, -h / 2 + 28, 19, '#FFFFFF', { 'text-anchor': 'start', 'letter-spacing': 1.5 });
  o += Ci(w / 2 - 22, -h / 2 + 20, 9, olw('#FF5A5A', 3));
  const iy = 20;
  o += P(`M${f(-w / 2 + 40)} ${iy - 22}L${f(-w / 2 + 63)} ${iy + 17}H${f(-w / 2 + 17)}Z`, olw('#FFD21F', 4)) + T('!', -w / 2 + 40, iy + 13, 28, '#151515');
  o += TF(esc(line), -w / 2 + 78, iy + 11, opts.size || 25, '#2A3140', { 'text-anchor': 'start' });
  return G(o, tf(x, y, sc, opts.rot || 0));
}

// ---------------------------------------------------------------- little people / dogs / cars (cheap)
const SKINS = ['#F5CFA8', '#E0A878', '#B87A50', '#8A5634', '#FFE0C4'];
const SHIRTS = ['#FF6B6B', '#4FC3F7', '#FFD54F', '#7ED957', '#B388FF', '#FF9F43', '#F06292', '#26C6DA', '#FFFFFF'];
const HAIRS = ['#3A2418', '#6A3A1E', '#1E1A22', '#C8862E', '#E8E0D0', '#B84B02'];
// tiny pedestrian (~44 px tall at s 1), (x, y) = feet. ph = walk phase; fly 0..1 flails the arms up
function tinyPerson(x, y, s, i, ph, fly = 0, rot = 0, tint = (c) => c) {
  const sw = Math.sin(ph) * 5 * (1 - fly), fl = Math.sin(ph * 2.3) * 6 * fly;
  const legs = `M-3 -15L${f(-4 - sw)} 0M3 -15L${f(4 + sw)} 0`;
  const arms = fly > 0.05 ? `M-5 -26L${f(-11 - fl)} ${f(-36 - fl)}M5 -26L${f(11 - fl)} ${f(-37 + fl)}` : `M-6 -26L${f(-8 + sw * 0.6)} -16M6 -26L${f(8 - sw * 0.6)} -16`;
  let o = P(legs + arms, ln(4.2, tint('#2A2633')));
  o += R(-7, -30, 14, 17, 4, { fill: tint(SHIRTS[i % SHIRTS.length]), stroke: LINE, 'stroke-width': 2.2 });
  o += R(-6.5, -43, 13, 13, 4, { fill: tint(SKINS[i % SKINS.length]), stroke: LINE, 'stroke-width': 2.2 });
  return G(o, tf(x, y, s, rot));
}
// flyer(x, y, s, rot, opts): a blocky person flailing in the air (~110 px tall at s 1; (x, y) = belly).
// opts { t, shirt, pants, skin, hair, seed, tint, tintK }
function flyer(x, y, s = 1, rot = 0, opts = {}) {
  const tc = tinter(opts), sd = opts.seed || 0, t = opts.t || 0;
  const shirt = tc(opts.shirt || SHIRTS[sd % SHIRTS.length]), pants = tc(opts.pants || '#3A4A8A'), skin = tc(opts.skin || SKINS[sd % SKINS.length]), hair = tc(opts.hair || HAIRS[sd % HAIRS.length]);
  const a = Math.sin(t * 7 + sd) * 8, b = Math.sin(t * 6 + sd * 2) * 9;
  const armD = `M-13 -12L${f(-30 - a * 0.4)} ${f(-36 + a)}M13 -12L${f(31 + a * 0.4)} ${f(-34 - a)}`;
  const legD = `M-7 14L${f(-15 + b * 0.5)} ${f(42 + b * 0.3)}M7 14L${f(16 + b * 0.5)} ${f(40 - b * 0.3)}`;
  let o = P(armD + legD, ln(13, LINE));
  o += P(legD, ln(7.5, pants)) + P(armD, ln(7.5, skin));
  o += R(-16, -20, 32, 38, 7, { fill: shirt, stroke: LINE, 'stroke-width': 3 });
  o += R(-19, -58, 38, 36, 10, { fill: skin, stroke: LINE, 'stroke-width': 3 });
  o += P('M-20 -44V-52q0 -8 9 -8h22q9 0 9 8v8q-6 -7 -16 -7q-14 0 -24 7Z', { fill: hair, stroke: LINE, 'stroke-width': 2.5 });
  o += P(dC(-7, -36, 3.2) + dC(7, -36, 3.2) + dC(0, -27, 3.4), { fill: '#151515' });
  return G(o, tf(x, y, s, rot));
}
// dog(x, y, s, rot, opts): a paddling dog (~100 px long at s 1; (x, y) = belly). opts { t, col, flip, seed, tint, tintK }
function dog(x, y, s = 1, rot = 0, opts = {}) {
  const tc = tinter(opts), t = opts.t || 0, col = tc(opts.col || '#C98A4A'), dk = mix(col, '#000000', 0.3);
  const pd = Math.sin(t * 9 + (opts.seed || 0)) * 7;
  const limbs = `M-24 8L${f(-30 + pd)} 26M-10 8L${f(-12 - pd)} 26M12 8L${f(10 + pd)} 26M24 8L${f(30 - pd)} 25M-34 -4Q-52 ${f(-18 + pd)} -48 -26`;
  let o = P(limbs, ln(10, LINE)) + P(limbs, ln(5.5, col));
  o += R(-38, -16, 66, 30, 14, { fill: col, stroke: LINE, 'stroke-width': 3 });
  o += R(14, -38, 38, 32, 11, { fill: col, stroke: LINE, 'stroke-width': 3 });
  o += P('M22 -36Q14 -30 16 -14Q26 -20 28 -34Z', { fill: dk, stroke: LINE, 'stroke-width': 2.5 });
  o += P(dC(40, -27, 3) + dC(51, -20, 3.6), { fill: '#151515' }) + P('M12 -10H28', ln(5, tc('#E8453C')));
  return G(o, `${tf(x, y, s, rot)}${opts.flip ? ' scale(-1 1)' : ''}`);
}
// car(x, y, s, opts): side view, faces right (opts.flip faces left). (x, y) = ground under the middle; ~124 x 60 at s 1.
// opts { col, lights 0..1, rot, tint, tintK }
function car(x, y, s = 1, opts = {}) {
  const tc = tinter(opts), col = tc(opts.col || '#FF5A5A'), L0 = opts.lights || 0;
  let o = '';
  if (L0 > 0.05) o += P('M58 -24L200 -46L200 0Z', { fill: '#FFF6C8', opacity: f(0.16 * L0) });
  o += P('M-60 -14Q-62 -34 -40 -36L-26 -36L-12 -56Q-8 -60 0 -60L26 -60Q32 -60 36 -54L46 -36L52 -35Q63 -32 62 -14Z', { fill: col, stroke: LINE, 'stroke-width': 3.5, 'stroke-linejoin': 'round' });
  o += P('M-20 -38L-9 -54H6V-38Z M12 -38V-54H26L36 -38Z', { fill: tc('#A9DDF5'), stroke: LINE, 'stroke-width': 2.5 });
  o += P('M-56 -24H58', ln(3, mix(col, '#FFFFFF', 0.35)));
  o += P(dC(-34, -12, 12.5) + dC(34, -12, 12.5), { fill: '#2A2633', stroke: LINE, 'stroke-width': 3 }) + P(dC(-34, -12, 5) + dC(34, -12, 5), { fill: '#C9CED8' });
  o += P(dC(57, -26, 4.2), { fill: L0 > 0.3 ? '#FFF6C8' : '#FFE9A0', stroke: LINE, 'stroke-width': 2 }) + P(dR(-62, -31, 6, 9), { fill: '#FF3B4E' });
  return G(o, `${tf(x, y, s, opts.rot || 0)}${opts.flip ? ' scale(-1 1)' : ''}`);
}

// ---------------------------------------------------------------- bus(x, y, s, rot, opts)
// A cheerful city bus, side view facing right. (x, y) = ground under the middle; ~640 x 260 px at s 1.
// opts { flip, t (wheel spin / bob), lights 0..1 (headlight glow), passengers (true), wave 0..1 (passengers wave), label, tint, tintK }
function bus(x, y, s = 1, rot = 0, opts = {}) {
  const tc = tinter(opts), { flip = false, lights = 0, wave = 0, passengers = true, label = '42' } = opts, t = opts.t || 0;
  const body = tc('#FFB52E'), skirt = tc('#F08A24'), glass = tc('#3D5480'), chrome = tc('#C9CED8');
  let o = '';
  if (lights > 0.02) o += Ci(300, -86, 78, { fill: 'url(#cityGlowW)', opacity: f(lights) });
  o += R(-300, -250, 600, 206, 38, olw(body, 6));
  o += P('M-297 -104H297V-80Q297 -47 262 -47H-262Q-297 -47 -297 -80Z', { fill: skirt });
  o += R(-298, -116, 596, 13, 0, { fill: tc('#E0403A') }) + R(-268, -241, 510, 14, 7, op('#FFFFFF', 0.4));
  let win = '', heads = '', hair = '', glare = '';
  for (let i = 0; i < 4; i++) {
    const wx = -272 + i * 98;
    win += dRR(wx, -214, 84, 80, 12);
    glare += dPoly([[wx + 12, -140], [wx + 34, -208], [wx + 48, -208], [wx + 26, -140]]);
    if (passengers) {
      const cx = wx + 42 + Math.sin(t * 2 + i) * 3, hy = -152 + Math.sin(t * 5 + i * 2) * 3;
      heads += dRR(cx - 19, hy - 19, 38, 36, 10);
      hair += `M${f(cx - 19)} ${f(hy - 8)}v-3q0 -8 8 -8h22q8 0 8 8v3q-8 -4 -19 -4q-11 0 -19 4Z`;
      if (wave > 0.02 && i % 2 === 0) heads += dC(cx + 26, hy - 26 - wave * 10 + Math.sin(t * 12 + i) * 6 * wave, 8);
    }
  }
  o += P(win, { fill: glass, stroke: LINE, 'stroke-width': 4.5 });
  if (passengers) o += P(heads, { fill: tc('#F2C9A0'), stroke: LINE, 'stroke-width': 3 }) + P(hair, { fill: tc('#4A2E22') });
  o += P(glare, op('#FFFFFF', 0.22));
  o += R(126, -214, 70, 160, 10, olw(glass, 4.5)) + P('M161 -212V-56', ln(3.5)) + R(130, -200, 10, 70, 4, op('#FFFFFF', 0.25));
  o += P('M214 -214H264Q292 -214 294 -186L297 -124H214Z', { fill: glass, stroke: LINE, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }) + P('M226 -130L250 -206H262L238 -130Z', op('#FFFFFF', 0.25));
  const sign = R(220, -246, 70, 26, 6, { fill: '#151515' }) + TF(esc(label), 255, -226, 20, '#FFD84D');
  o += flip ? G(sign, 'translate(510 0) scale(-1 1)') : sign;
  o += R(286, -98, 14, 22, 5, olw(tc('#FFF6C8'), 3)) + R(-302, -110, 12, 34, 4, olw(tc('#FF4A4A'), 3));
  o += R(-314, -66, 46, 18, 8, olw(chrome, 4)) + R(268, -66, 50, 18, 8, olw(chrome, 4));
  o += P('M296 -200L318 -206V-176', ln(5)) + R(310, -182, 14, 26, 5, olw('#2B2A33', 3));
  // wheels with arches
  const W = [-188, 188];
  o += P(W.map((wx) => `M${wx - 50} -46A50 50 0 0 1 ${wx + 50} -46Z`).join(''), { fill: '#2B2A33' });
  o += P(W.map((wx) => dC(wx, -38, 40)).join(''), { fill: tc('#2B2A33'), stroke: LINE, 'stroke-width': 5 });
  o += W.map((wx) => G(Ci(0, 0, 17, { fill: chrome, stroke: LINE, 'stroke-width': 3.5 }) + P('M-10 0H10M0 -10V10', ln(3.5, '#7A8090')), `translate(${wx} -38) rotate(${f(t * 300)})`)).join('');
  return G(o, `${tf(x, y + Math.sin(t * 3) * 2, s, rot)}${flip ? ' scale(-1 1)' : ''}`);
}

// ---------------------------------------------------------------- bathtubGuy(x, y, s, rot, opts)
// A man in a claw-foot bathtub, flying (he was taking a bath when "fly all" hit). Same s as the rig cast
// (his head ≈ a rig head at the same s). (x, y) = bottom of the tub (between the feet); tub ≈ 860 x 330 px at s 1.
// opts { t, face: 'shock'|'happy', duck (true), drip (true), flip, tint, tintK }
function bathtubGuy(x, y, s = 1, rot = 0, opts = {}) {
  const tc = tinter(opts), { face = 'shock', duck = true, drip = true, flip = false } = opts, t = opts.t || 0;
  const skin = tc('#F5CFA8'), skinSh = tc('#E0AE86'), tub = tc('#F6F8FC'), tubSh = tc('#D3DCEA');
  let o = '';
  // faucet
  o += P('M-412 -352V-432Q-412 -472 -372 -472H-330V-444', ln(34, LINE)) + P('M-412 -352V-432Q-412 -472 -372 -472H-330V-444', ln(22, tc('#C9D2E0')));
  // man: arm with back-scrubber (behind head), shoulders, head
  const br = Math.sin(t * 3) * 6;
  o += G(P('M0 0L-30 -250', ln(26, LINE)) + P('M0 0L-30 -250', ln(15, tc('#B9773E'))) + G(R(-60, -40, 120, 70, 30, olw(tc('#FFD84D'), 7)) + P('M-50 30v22M-30 30v24M-10 30v24M10 30v24M30 30v24M50 30v22', ln(7, tc('#E8A23A'))), 'translate(-30 -270) rotate(-15)'), `translate(-250 -520) rotate(${f(-20 + br)})`);
  o += P('M-170 -440L-250 -520', ln(70, LINE)) + P('M-170 -440L-250 -520', ln(56, skin)) + Ci(-250, -520, 40, olw(skin, 7));
  o += R(-210, -470, 340, 200, 70, olw(skin, 8)) + P('M-90 -420q10 -14 20 0M-40 -410q10 -14 20 0M-120 -400q10 -14 20 0', ln(5, tc('#7A4A2A')));
  o += R(-220, -810, 380, 350, 84, olw(skin, 8));
  // shower cap with frill
  o += P('M-242 -700Q-250 -892 -40 -900Q170 -892 182 -700Z', olw(tc('#FF8FC0'), 8));
  let frill = '';
  for (let i = 0; i < 9; i++) frill += dC(-232 + i * 51.5, -700, 24);
  o += P(frill, { fill: tc('#FFB3D6'), stroke: LINE, 'stroke-width': 6 }) + P('M-150 -830q30 -30 70 -36', ln(12, '#FFFFFF', 0.6));
  // face
  const shock = face === 'shock';
  o += P(`M-170 ${shock ? -666 : -650}q40 -22 76 -6M10 ${shock ? -672 : -656}q38 -16 72 6`, ln(11));
  o += Ell(-110, -590, 46, shock ? 56 : 48, olw('#FFFFFF', 7)) + Ell(30, -590, 46, shock ? 56 : 48, olw('#FFFFFF', 7));
  o += shock ? P(dC(-104, -588, 10) + dC(36, -588, 10), { fill: '#151515' }) : P(dC(-100, -584, 16) + dC(40, -584, 16), { fill: '#151515' });
  o += Ell(-40, -530, 40, 34, olw(skinSh, 7));
  o += P('M-40 -506q-50 -10 -96 24q30 6 50 -2q22 -6 46 -22q24 16 46 22q20 8 50 2q-46 -34 -96 -24Z', olw(tc('#6A3A1E'), 6));
  o += shock ? Ell(-40, -460, 26, 30, olw('#4B1020', 6)) : P('M-80 -470q40 30 80 0', ln(9));
  o += P(dC(-170, -520, 24) + dC(100, -520, 24), op('#FF8FA3', 0.45));
  // foam
  let foam = '';
  for (let i = 0; i < 13; i++) foam += dC(-372 + i * 62, -356 - rnd(i, 51) * 30, 40 + rnd(i, 52) * 26);
  for (let i = 0; i < 4; i++) { const u = (t * 0.6 + i / 4) % 1; foam += dC(-260 + i * 170 + Math.sin(t * 2 + i) * 20, -440 - u * 260, 10 + u * 12); }
  o += P(foam, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 6 });
  // tub
  o += P('M-404 -334H404L376 -92Q360 0 262 0H-262Q-360 0 -376 -92Z', olw(tub, 8));
  o += P('M-372 -150Q-352 -40 -262 -40H262Q352 -40 372 -150L366 -92Q352 -6 262 -6H-262Q-352 -6 -366 -92Z', { fill: tubSh });
  o += R(-432, -356, 864, 48, 24, olw('#FFFFFF', 8)) + R(-400, -346, 300, 12, 6, { fill: tc('#DDE6F2') });
  const foot = (fx) => P(`M${fx - 34} -4Q${fx - 44} 40 ${fx - 22} 58H${fx + 22}Q${fx + 44} 40 ${fx + 34} -4Z`, olw(tc('#F2C14E'), 6));
  o += foot(-262) + foot(262);
  if (duck) o += G(P(`${dRR(-44, -44, 88, 50, 24)}${dC(26, -60, 24)}`, olw(tc('#FFD84D'), 6)) + P('M46 -64L70 -58L46 -50Z', olw(tc('#FF8A2A'), 4)) + Ci(32, -66, 5, { fill: '#151515' }), `translate(300 -352) rotate(${f(Math.sin(t * 2.4) * 6)})`);
  if (drip) {
    let dd = '';
    for (let i = 0; i < 3; i++) { const u = (t * 0.9 + i * 0.33) % 1; dd += `M${-140 + i * 140} ${f(10 + u * 220)}q-12 18 0 26q12 -8 0 -26Z`; }
    o += P(dd, { fill: tc('#7FD3FF'), stroke: LINE, 'stroke-width': 4 });
  }
  return G(o, `${tf(x, y, s, rot)}${flip ? ' scale(-1 1)' : ''}`);
}

// ---------------------------------------------------------------- waterTower(x, y, s, opts)
// The classic wooden rooftop water tank on steel legs. (x, y) = ground under the middle; ~200 x 420 px at s 1.
// opts.tip 0..1 = tips over to the right (pivot = right foot; opts.flip tips to the left), water spills past ~.45.
// opts { tip, t, flip, tint, tintK }
function bumpK(u) { return u > 0 && u < 0.4 ? Math.sin((u / 0.4) * Math.PI) : 0; }
function waterTower(x, y, s = 1, opts = {}) {
  const tc = tinter(opts), tip = clamp(opts.tip || 0, 0, 1), t = opts.t || 0;
  const wood = tc('#C9834A'), woodSh = tc('#A3653A'), steel = tc('#5E5468'), roof = tc('#8A5A3A');
  const legs = 'M-70 0L-58 -150M70 0L58 -150M-24 0L-22 -150M24 0L22 -150';
  let o = P(legs, ln(15, LINE)) + P(legs, ln(8, steel));
  o += P('M-64 -10L56 -140M64 -10L-56 -140M-62 -76H62', ln(5, mix(steel, '#000000', 0.3)));
  o += R(-94, -166, 188, 18, 5, olw(tc('#7A5A42'), 5));
  o += R(-82, -332, 164, 170, 16, olw(wood, 6)) + P('M-50 -326V-166M-16 -328V-164M18 -328V-164M52 -326V-166', ln(3, woodSh, 0.7));
  o += R(34, -330, 44, 166, 12, op('#000', 0.14));
  o += P('M-82 -300H82M-82 -244H82M-82 -190H82', ln(7, tc('#4E5468')));
  o += P('M-98 -326L0 -406L98 -326Z', olw(roof, 6)) + P('M0 -406L98 -326H30Z', op('#000', 0.15)) + Ci(0, -412, 9, olw(tc('#4E5468'), 3));
  o += P('M-62 -150V-326M-46 -150V-326M-62 -176H-46M-62 -206H-46M-62 -236H-46M-62 -266H-46M-62 -296H-46', ln(3.5, tc('#3A3040')));
  if (tip > 0.45) {
    const u = clamp((tip - 0.45) / 0.55, 0, 1), a = f(Math.min(1, u * 3));
    o += P(`M60 -330Q${f(120 + u * 60)} ${f(-420 - u * 20)} ${f(200 + u * 120)} ${f(-300 + u * 40)}Q${f(150 + u * 60)} -370 76 -320Z`, { fill: '#6FD0FF', stroke: LINE, 'stroke-width': 4, opacity: a });
    let dd = '';
    for (let i = 0; i < 4; i++) dd += dC(170 + i * 40 + u * 80, -330 + Math.sin(t * 8 + i) * 12 + i * 18, 9 - i);
    o += P(dd, { fill: '#9FE4FF', stroke: LINE, 'stroke-width': 3, opacity: a });
  }
  const ang = ease.in(tip) * 100 + Math.sin(t * 14) * 2 * bumpK(tip);
  return G(G(o, ang ? `rotate(${f(ang)} 70 0)` : null), opts.flip ? `${tf(x, y, s)} scale(-1 1)` : tf(x, y, s));
}

// ---------------------------------------------------------------- blimp(x, y, s, opts)
// A friendly blimp with a side banner. (x, y) = centre of the envelope; ~600 x 240 px at s 1, faces right.
// opts { text ('NEWS 7'), t, lights 0..1 (night nav lights + lit banner), flip, rot, tint, tintK }
function blimp(x, y, s = 1, opts = {}) {
  const tc = tinter(opts), { text = 'NEWS 7', lights = 0, flip = false, rot = 0 } = opts, t = opts.t || 0;
  const env = tc('#F2F4F8'), sh = tc('#C9D0DC'), red = tc('#E8453C');
  let o = P('M-196 -66L-296 -138L-270 -36Z M-196 66L-296 138L-270 36Z M-226 -14L-324 0L-226 14Z', olw(red, 6));
  o += R(-62, 82, 124, 42, 14, olw(tc('#5A6478'), 5)) + P(dR(-46, 92, 22, 16) + dR(-14, 92, 22, 16) + dR(18, 92, 22, 16), { fill: lights > 0.3 ? '#FFE6A0' : tc('#A9DDF5') });
  o += G(Ell(0, 0, 8, 30, { fill: tc('#3A3F55'), opacity: 0.7 }), `translate(-74 104) scale(${f(Math.max(0.15, Math.abs(Math.sin(t * 20))))} 1)`);
  o += Ell(0, 0, 262, 98, olw(env, 7));
  o += P('M-252 26A262 98 0 0 0 252 26Q0 70 -252 26Z', { fill: sh });
  o += P('M196 -64A262 98 0 0 1 196 64Q222 0 196 -64Z', { fill: red });
  o += P('M-200 -50Q-70 -94 110 -74', ln(12, '#FFFFFF', 0.75));
  o += R(-160, -44, 300, 88, 22, olw(lights > 0.2 ? mix(tc('#2E7BFF'), '#4FA0FF', lights) : tc('#2E7BFF'), 5));
  const ban = TF(esc(text), -10, 16, 46, lights > 0.2 ? mix('#FFFFFF', '#FFF6C8', lights) : '#FFFFFF');
  o += flip ? G(ban, 'translate(-20 0) scale(-1 1)') : ban;
  if (lights > 0.02) o += P(dC(-258, 0, 8), { fill: '#FF3B4E', opacity: f(lights * blink(t, 1.5)) }) + P(dC(150, 72, 7), { fill: '#5CFF8A', opacity: f(lights * blink(t, 1.5, 1)) });
  return G(o, `${tf(x, y + Math.sin(t * 1.1) * 6, s, rot)}${flip ? ' scale(-1 1)' : ''}`);
}

// ---------------------------------------------------------------- mailman(x, y, s, opts)
// The mailman, flying with his satchel spilling letters. Same s as the rig cast (s .5 ≈ 475 px tall); (x, y) = feet.
// opts { t, face: 'shock'|'happy', letters 0..1 (envelopes fluttering out), rot, flip, tint, tintK }
function mailman(x, y, s = 1, opts = {}) {
  const tc = tinter(opts), { face = 'shock', letters = 1, rot = 0, flip = false } = opts, t = opts.t || 0;
  const skin = tc('#F2C9A0'), blue = tc('#8CC0F2'), navy = tc('#2B4A8A'), bag = tc('#A0663A');
  const kick = Math.sin(t * 6) * 14, flap = Math.sin(t * 8) * 12;
  const leg = (hx, ang) => G(R(-34, 0, 68, 210, 28, olw(skin, 7)) + R(-36, 120, 72, 92, 16, olw('#FFFFFF', 7)) + R(-46, 196, 104, 48, 20, olw(tc('#2A2633'), 7)), `translate(${hx} -330) rotate(${f(ang)})`);
  const arm = (sx, ang) => G(R(-34, -16, 68, 110, 26, olw(blue, 7)) + R(-26, 80, 52, 110, 22, olw(skin, 7)) + Ci(0, 196, 32, olw(skin, 7)), `translate(${sx} -600) rotate(${f(ang)})`);
  let o = leg(-60, 18 + kick) + leg(60, -22 - kick);
  o += arm(-128, 140 + flap) + arm(128, -138 - flap);
  o += R(-132, -410, 264, 120, 28, olw(navy, 7));
  o += R(-142, -630, 284, 248, 44, olw(blue, 7)) + P('M-60 -628L0 -570L60 -628', { fill: tc('#6FA6DE'), stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  o += R(40, -560, 64, 54, 10, olw(tc('#7AB0E8'), 5)) + Ci(-80, -540, 18, olw(tc('#FFD34E'), 5));
  o += P('M-128 -616L118 -404', ln(26, LINE)) + P('M-128 -616L118 -404', ln(16, bag));
  o += R(64, -466, 160, 124, 24, olw(bag, 7)) + P('M64 -440Q144 -400 224 -440V-466H64Z', { fill: tc('#8A5430'), stroke: LINE, 'stroke-width': 6 }) + R(110, -486, 60, 40, 6, olw('#FFFFFF', 5));
  // head + cap
  o += R(-214, -1010, 428, 390, 86, olw(skin, 8));
  o += P('M-224 -880Q-224 -1080 0 -1084Q224 -1080 224 -880Z', olw(navy, 8)) + P('M-40 -880Q140 -850 290 -900Q300 -870 250 -846Q100 -820 -40 -850Z', olw(tc('#1E3566'), 7)) + Ci(0, -960, 26, olw(tc('#FFD34E'), 6));
  const shock = face === 'shock';
  o += Ell(-90, -790, 44, shock ? 54 : 46, olw('#FFFFFF', 7)) + Ell(70, -790, 44, shock ? 54 : 46, olw('#FFFFFF', 7));
  o += P(shock ? dC(-86, -786, 10) + dC(74, -786, 10) : dC(-82, -780, 15) + dC(78, -780, 15), { fill: '#151515' });
  o += Ell(-10, -722, 36, 30, olw(tc('#E0AE86'), 6));
  o += P('M-10 -702q-46 -8 -92 20q30 8 50 0q22 -6 42 -18q20 12 42 18q20 8 50 0q-46 -28 -92 -20Z', olw(tc('#5A3420'), 6));
  o += shock ? Ell(-10, -650, 26, 30, olw('#4B1020', 6)) : P('M-50 -660q40 28 80 0', ln(9));
  if (letters > 0) {
    for (let i = 0; i < 5; i++) {
      if (i / 5 >= letters) break;
      const u = (t * 0.35 + i / 5) % 1, lx = 160 + u * 380 + Math.sin(t * 2 + i) * 40, ly = -470 - u * 420 + Math.cos(t * 3 + i * 2) * 30;
      o += G(R(-46, -30, 92, 60, 7, olw('#FFFFFF', 6)) + P('M-44 -28L0 6L44 -28', ln(5)) + R(22, -22, 16, 18, 3, { fill: tc('#FF5A5A') }), `translate(${f(lx)} ${f(ly)}) rotate(${f(Math.sin(t * 4 + i) * 30 + i * 20)})`);
    }
  }
  return G(o, `${tf(x, y, s, rot)}${flip ? ' scale(-1 1)' : ''}`);
}

// ---------------------------------------------------------------- skyChat(x, y, w, h, t, opts)
// The Admin's gigantic white-and-gold chat window (descends from the crack). (x, y) = centre, w x h px.
// opts { text, progress 0..1 (letters typed), glow 0..1, user ('ADMIN'), size (font px, auto), k (pop-in 0..1, outBack),
//        cursor (true), s (extra scale), rot }. Text wraps on spaces (or '\n').
function wrapText(text, maxChars) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let cur = '';
    for (const w of para.split(' ')) {
      if (cur && (cur + ' ' + w).length > maxChars) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    }
    out.push(cur);
  }
  return out;
}
const rays = (cx, cy, n, r, col, o_, rot) => (o_ > 0.003 ? P(Array.from({ length: n }, (_, i) => {
  const a0 = ((i / n) * 360 + rot) * Math.PI / 180, a1 = (((i + 0.45) / n) * 360 + rot) * Math.PI / 180;
  return `M${f(cx)} ${f(cy)}L${f(cx + r * Math.cos(a0))} ${f(cy + r * Math.sin(a0))}L${f(cx + r * Math.cos(a1))} ${f(cy + r * Math.sin(a1))}Z`;
}).join(''), op(col, o_)) : '');
function skyChat(x, y, w, h, t, opts = {}) {
  const { text = '', progress = 1, glow = 1, user = 'ADMIN', k = 1, cursor = true, s = 1, rot = 0 } = opts;
  const sc = s * (k >= 1 ? 1 : ease.outBack(clamp(k, 0, 1)));
  if (sc < 0.01) return '';
  const hh = Math.max(56, Math.min(120, h * 0.24)), r = Math.min(48, h * 0.16);
  let o = '';
  if (glow > 0) {
    o += rays(0, 0, 14, Math.max(w, h) * 0.75, '#FFF6D0', 0.12 * glow, t * 6);
    for (let i = 3; i >= 1; i--) { const g = 22 * i * (1 + 0.08 * Math.sin(t * 3 + i)); o += R(-w / 2 - g, -h / 2 - g, w + 2 * g, h + 2 * g, r + g, op('#FFF1B8', glow * (0.34 - i * 0.08))); }
  }
  o += R(-w / 2 + 10, -h / 2 + 16, w, h, r, op('#3A2A00', 0.18));
  o += R(-w / 2, -h / 2, w, h, r, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 10 });
  o += P(`M${f(-w / 2)} ${f(-h / 2 + hh)}V${f(-h / 2 + r)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(-r)}H${f(w / 2 - r)}a${f(r)} ${f(r)} 0 0 1 ${f(r)} ${f(r)}V${f(-h / 2 + hh)}Z`, { fill: 'url(#cityGoldBar)', stroke: LINE, 'stroke-width': 10, 'stroke-linejoin': 'round' });
  o += R(-w / 2 + 16, -h / 2 + hh + 14, w - 32, h - hh - 30, Math.max(8, r - 18), { fill: 'none', stroke: '#F2C230', 'stroke-width': 6 });
  // crown + [ADMIN]
  const cs = hh / 100, cx0 = -w / 2 + 34 + 50 * cs;
  o += G(P('M-44 26L-50 -22L-22 4L0 -34L22 4L50 -22L44 26Z', { fill: '#FFF3B0', stroke: LINE, 'stroke-width': 7, 'stroke-linejoin': 'round' }) + R(-44, 14, 88, 14, 4, { fill: '#E8A800', stroke: LINE, 'stroke-width': 5 }) + Ci(0, -36, 7, olw('#FF5A7A', 4)), `translate(${f(cx0)} ${f(-h / 2 + hh / 2 + 2)}) scale(${f(cs)})`);
  o += T(`[${esc(user)}]`, cx0 + 60 * cs, -h / 2 + hh / 2 + hh * 0.2, hh * 0.56, '#5A3A00', { 'text-anchor': 'start', 'letter-spacing': 2 });
  o += P(dC(w / 2 - 50, -h / 2 + hh / 2, hh * 0.16), { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 5 });
  // message
  const size = opts.size || Math.min((h - hh) * 0.3, 140);
  const maxChars = Math.max(6, Math.floor((w - 90) / (size * 0.54)));
  const lines = wrapText(text, maxChars);
  const total = lines.reduce((a, l) => a + l.length, 0);
  let left = Math.round(clamp(progress, 0, 1) * total);
  const lh = size * 1.12, y0 = -h / 2 + hh + (h - hh) / 2 - (lines.length - 1) * lh / 2 + size * 0.36;
  // each line is laid out at its FULL width (untyped rest = invisible tspan), so typing never shifts the centred text;
  // the cursor is a '|' tspan (every line carries one, invisible when the cursor is elsewhere)
  const counts = lines.map((l) => { const n = Math.min(left, l.length); left -= n; return n; });
  let curLine = counts.findIndex((n, i) => n < lines[i].length);
  if (curLine < 0) curLine = lines.length - 1;
  const on = cursor && Math.floor(t * 2.5) % 2 === 0 ? 1 : 0;
  lines.forEach((l, i) => {
    const n = counts[i];
    if (n === 0 && i !== curLine) return;
    const bar = `<tspan fill="#E8A800" stroke="#E8A800" stroke-width="${f(size * 0.05)}" fill-opacity="${i === curLine ? on : 0}" stroke-opacity="${i === curLine ? on : 0}">|</tspan>`;
    o += S.el('text', { x: 0, y: f(y0 + i * lh), 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': f(size), fill: '#2A2140', 'text-anchor': 'middle' }, esc(l.slice(0, n)) + bar + (n < l.length ? `<tspan fill-opacity="0">${esc(l.slice(n))}</tspan>` : ''));
  });
  if (glow > 0.3) o += K.sparkles([[w / 2 - 10, -h / 2 - 6, 26 * glow], [-w / 2 + 6, h / 2 - 4, 20 * glow], [w / 2 + 10, h / 2 - 30, 14 * glow]], t);
  return G(o, tf(x, y, sc, rot));
}

// ================================================================ CITY
// parallax k of every city layer (anchors carry their k; draw things that live on a landmark with K.view(cam, svg, anchor.k))
const KF = { sky: 0, sun: 0.03, crack: 0.04, cloud: 0.06, far2: 0.1, far: 0.18, flyFar: 0.26, pop: 0.3, blimp: 0.3, mid: 0.4, flyMid: 0.55, near: 0.75, street: 1, flyNear: 1.15 };
const MID_BASE = 1060, SHOP_Y = 908;

// far skyline rows: ONE silhouette path + ONE window path each (window pattern cells 16 x 22, buildings snapped to them)
function genSkyline(seed, x0, x1, base, hMin, hMax) {
  const cw = 16, ch = 22;
  let body = '', win = '';
  const tips = [];
  let x = Math.floor(x0 / cw) * cw;
  for (let i = 0; x < x1; i++) {
    const w = cw * (4 + Math.floor(rnd(i, seed) * 6));
    const h = Math.round((hMin + rnd(i, seed + 1) * (hMax - hMin)) / ch) * ch;
    const top = base - h, kind = Math.floor(rnd(i, seed + 2) * 6);
    body += dR(x, top, w, h + 260);
    if (kind === 1) body += dR(x + cw, top - 2 * ch, w - 2 * cw, 2 * ch + 2) + dR(x + 2 * cw, top - 3 * ch, Math.max(cw, w - 4 * cw), ch + 2);
    else if (kind === 2) { const cx = x + w / 2; body += dPoly([[cx - cw * 1.3, top + 1], [cx, top - ch * 3.2], [cx + cw * 1.3, top + 1]]) + dR(cx - 2, top - ch * 5.5, 4, ch * 2.6); tips.push([cx, top - ch * 5.5]); }
    else if (kind === 3) { const r = w / 2 - cw / 2; body += `M${f(x + cw / 2)} ${f(top + 1)}a${f(r)} ${f(r * 0.7)} 0 0 1 ${f(2 * r)} 0Z`; }
    else if (kind === 4) { const ax = x + Math.round(w * 0.3); body += dR(ax, top - ch * 3, 4, ch * 3); tips.push([ax + 2, top - ch * 3]); }
    else body += dR(x + cw, top - 12, cw * 2, 13);
    win += dR(x, top + ch, w, h - ch + 22);
    x += w + (rnd(i, seed + 3) < 0.3 ? cw : 0);
  }
  return { body, win, tips };
}
const FAR2 = genSkyline(101, -1500, 3500, 902, 250, 520);
const FAR1 = genSkyline(202, -1500, 3500, 902, 150, 370);

// ---------------------------------------------------------------- anchors (layer coordinates; k = parallax of that layer)
const CRANE = { mastX: 194, jibY: 150, tip: 600, trolley: 470, len: 330 };
const CITY = {
  k: KF,
  moon: { x: 1500, y: 250, r: 120, k: KF.sun },
  crack: { x: 960, y: 190, r: 560, k: KF.crack },
  tower: { x: 720, y: 222, w: 208, k: KF.mid },              // flat roof of the tall tower (giant cat seat): roof spans x 616..824
  crane: { x: 470, y: 520, k: KF.mid },                      // default hook point (use craneHook(t, opts) for the swaying one)
  stadium: { x: 1690, y: 614, rx: 215, k: KF.mid },          // centre of the pitch inside the bowl (rim y 610, bowl x 1475..1905)
  waterTower: { x: 1120, y: 590, s: 0.42, k: KF.mid },       // feet of the rooftop water tower (roof x 1024..1184; tips right)
  tv: { x: 1328, y: 470, sign: { x: 1328, y: 545 }, dish: { x: 1270, y: 450 }, k: KF.mid },   // TV-station roof centre
  heroRoof: { x: 1320, y: 674, x0: 1160, x1: 1480, k: KF.near },  // rooftop the hero stands on in the wide (feet y)
  blimp: { x: 1010, y: 300, s: 0.4, k: KF.blimp },
  street: { y: 990, laneR: 1044, laneL: 1082, k: KF.street },   // sidewalk feet y, car lanes (bottom of wheels)
};
function cityOpts(opts = {}) {
  return {
    time: 0, dawn: 0, flying: 0, popups: 0, crack: 0, crackR: CITY.crack.r, admin: 0, blimp: false,
    waterTip: 0, waterFall: 0, hookLen: CRANE.len, hookSwing: 4, hookX: CRANE.trolley, street: true, flyNear: true, flyMid: true,
    onSky: '', onMid: '', onNear: '', ...opts, crackAt: { x: CITY.crack.x, y: CITY.crack.y, ...(opts.crackAt || {}) },
  };
}
// the crane hook point (mid layer, k .4) incl. the sway: { x, y, k, rot }. Same opts as city() (hookLen, hookSwing, hookX).
function craneHook(t, opts = {}) {
  const o = cityOpts(opts), sw = o.hookSwing * Math.sin(t * 0.9), a = sw * Math.PI / 180;
  return { x: o.hookX + Math.sin(a) * o.hookLen, y: CRANE.jibY + 40 + Math.cos(a) * o.hookLen, k: KF.mid, rot: -sw };
}

// ---------------------------------------------------------------- sky
const CLOUDS = [[-560, 150, 1], [150, 120, 0.95], [690, 64, 0.7], [1060, 215, 0.85], [1720, 105, 0.8], [2280, 175, 1]];
function cloudD(x, y, s) {
  return dRR(x - 100 * s, y, 360 * s, 62 * s, 31 * s) + dC(x - 30 * s, y + 14 * s, 46 * s) + dC(x + 66 * s, y - 12 * s, 68 * s) + dC(x + 166 * s, y + 10 * s, 52 * s) + dC(x + 226 * s, y + 28 * s, 33 * s);
}
function sunMoon(t, p) {
  let s = '';
  const tm = p.time, dawn = p.dawn;
  let sx, sy, sr, sc;
  if (tm <= 0.5) { const u = tm * 2; sx = lerp(1560, 1545, u); sy = lerp(190, 470, ease.inOut(u)); sr = lerp(66, 108, u); sc = mix('#FFF2A8', '#FFA65A', u); } else { sx = 1545; sy = 470 + ease.in((tm - 0.5) * 2) * 700; sr = 108; sc = '#FF9A55'; }
  if (dawn > 0) { sx = lerp(sx, 1700, dawn); sy = lerp(sy, 455, dawn); sr = lerp(sr, 88, dawn); sc = mix(sc, '#FFE4A6', dawn); }
  if (dawn > 0.05) s += rays(sx, sy, 14, sr * 4.2, '#FFF4D0', 0.14 * dawn, t * 3);
  if (sy < 1050) {
    for (let i = 3; i >= 1; i--) s += Ci(sx, sy, sr * (1 + 0.5 * i), op(sc, 0.07 + (3 - i) * 0.04));
    s += Ci(sx, sy, sr, { fill: sc }) + Ci(sx - sr * 0.32, sy - sr * 0.32, sr * 0.3, op('#FFFFFF', 0.35));
  }
  const mk = sm(0.55, 0.9, tm) * (1 - dawn);
  if (mk > 0.01) {
    const M = CITY.moon, my = M.y + (1 - mk) * 160, r = M.r;
    s += Ci(M.x, my, r * 2.1, op('#FFF4D6', 0.05 * mk)) + Ci(M.x, my, r * 1.5, op('#FFF4D6', 0.09 * mk));
    s += Ci(M.x, my, r, { fill: '#FFF3D4', opacity: f(mk) });
    s += P(`M${f(M.x + r * 0.55)} ${f(my - r * 0.83)}A${r} ${r} 0 0 1 ${f(M.x - r * 0.3)} ${f(my + r * 0.95)}A${f(r * 1.05)} ${f(r * 1.05)} 0 0 0 ${f(M.x + r * 0.55)} ${f(my - r * 0.83)}Z`, { fill: '#E9D7A8', opacity: f(0.55 * mk) });
    s += P(dC(M.x - 42, my - 30, 22) + dC(M.x + 30, my + 22, 30) + dC(M.x - 26, my + 52, 13) + dC(M.x + 46, my - 50, 12) + dC(M.x - 70, my + 10, 9), { fill: '#E6D2A2', opacity: f(mk) });
  }
  return s;
}
function skyPart(t, cam, p, o) {
  const g = vgrad(p.sky.map((c, i) => [SKY_OFS[i], c]));
  let s = g.def + fullRect(cam, 0, { fill: g.url });
  if (p.star > 0.02) {
    s += R(-300, -300, 2520, 1080, 0, { fill: 'url(#cityStars)', opacity: f(p.star) });
    let tw = '';
    [[210, 90], [560, 260], [880, 60], [1180, 150], [1760, 380], [1890, 70], [380, 470], [1300, 330]].forEach(([x, y], i) => {
      const k = 0.5 + 0.5 * Math.sin(t * 2.3 + i * 1.7), r = 7 * k + 3;
      tw += `M${x} ${f(y - r)}L${f(x + r * 0.25)} ${f(y - r * 0.25)}L${f(x + r)} ${y}L${f(x + r * 0.25)} ${f(y + r * 0.25)}L${x} ${f(y + r)}L${f(x - r * 0.25)} ${f(y + r * 0.25)}L${f(x - r)} ${y}L${f(x - r * 0.25)} ${f(y - r * 0.25)}Z`;
    });
    s += P(tw, { fill: '#FFFFFF', opacity: f(p.star * 0.9) });
  }
  let out = V(cam, s, KF.sky) + V(cam, sunMoon(t, p), KF.sun);
  let cl = '', clS = '';
  let clH = '';
  for (const [x0, y, sc] of CLOUDS) { const x = wrap(x0 + t * 7 * sc, -900, 2800); clS += dRR(x - 96 * sc, y + 12 * sc, 352 * sc, 62 * sc, 31 * sc); cl += cloudD(x, y, sc); clH += `M${f(x + 30 * sc)} ${f(y - 52 * sc)}q${f(34 * sc)} ${f(-24 * sc)} ${f(74 * sc)} ${f(-10 * sc)}`; }
  const cop = 1 - 0.25 * sm(0.6, 1, p.time);
  out += V(cam, P(clS, { fill: p.cloudSh, opacity: f(cop) }) + P(cl, { fill: p.cloud, opacity: f(cop) }) + P(clH, ln(9, '#FFFFFF', 0.45 * cop * (1 - p.lit * 0.6))), KF.cloud);
  if (o.crack > 0 || o.onSky) out += V(cam, crack(o.crackAt.x, o.crackAt.y, o.crackR, o.crack) + (o.onSky || ''), KF.crack);
  return out;
}

// ---------------------------------------------------------------- flyers (opts.flying 0..1 lifts them from behind the buildings)
const SILO = {
  p1: dRR(-9, -48, 18, 17, 5) + dRR(-8, -29, 16, 22, 4) + dLimb(-6, -25, -21, -42, 5.5) + dLimb(6, -25, 20, -40, 5.5) + dLimb(-4, -9, -11, 10, 6) + dLimb(4, -9, 13, 8, 6),
  p2: dRR(-9, -48, 18, 17, 5) + dRR(-8, -29, 16, 22, 4) + dLimb(-6, -24, -24, -22, 5.5) + dLimb(6, -24, 24, -28, 5.5) + dLimb(-4, -9, -14, 4, 6) + dLimb(4, -9, 6, 12, 6),
  dog: dRR(-20, -8, 38, 15, 7) + dRR(12, -21, 18, 15, 6) + dLimb(-14, 4, -19, 14, 4) + dLimb(-4, 4, -2, 14, 4) + dLimb(6, 4, 4, 14, 4) + dLimb(14, 4, 19, 13, 4) + dLimb(-18, -4, -27, -14, 3.5),
  car: dRR(-32, -14, 64, 16, 6) + dRR(-16, -27, 32, 15, 6) + dC(-18, 3, 7) + dC(18, 3, 7),
  sofa: dRR(-32, -10, 64, 18, 6) + dRR(-30, -27, 60, 19, 6) + dRR(-38, -16, 12, 24, 5) + dRR(26, -16, 12, 24, 5),
  tree: dR(-4, -10, 8, 26) + dC(0, -26, 16) + dC(-13, -15, 12) + dC(13, -15, 12),
  tub: dRR(-32, -12, 64, 20, 9) + dC(-6, -21, 9) + dR(-24, 6, 6, 7) + dR(18, 6, 6, 7),
  bus: dRR(-50, -28, 100, 36, 8) + dC(-30, 8, 8) + dC(30, 8, 8),
};
const FLY_FAR = [['p1', 120, 300, 1, -20, 0.0, 6], ['dog', 380, 430, 0.9, 10, 0.1, -5], ['car', 700, 330, 1, -12, 0.2, 4], ['p2', 980, 390, 0.9, 25, 0.05, -7], ['sofa', 1190, 300, 1, 8, 0.3, 5],
  ['p1', 1390, 450, 0.8, -30, 0.15, 6], ['tree', 1640, 360, 1, 15, 0.35, -4], ['p2', 1830, 280, 1, -10, 0.25, 5], ['dog', 2060, 400, 0.9, 20, 0.4, -6], ['p1', -150, 380, 1, 12, 0.3, 5],
  ['tub', 560, 470, 0.9, -8, 0.45, 3], ['p2', 1500, 220, 0.8, 30, 0.5, -5], ['p1', 840, 200, 0.7, 40, 0.55, 4], ['bus', 290, 210, 0.8, -6, 0.6, 3]];
const FLY_MID = [['flyer', 270, 360, 1.0, -15, 0.0, 6, 0], ['dog', 540, 250, 1.0, 10, 0.1, -8, 1], ['mail', 900, 410, 0.11, -12, 0.0, 5, 2], ['flyer', 1130, 230, 0.9, 20, 0.2, -6, 3],
  ['car', 1380, 400, 0.9, -18, 0.25, 7, 4], ['flyer', 1650, 290, 1.0, 10, 0.3, -5, 5], ['dog', 1890, 430, 0.9, -20, 0.35, 6, 6], ['flyer', 2160, 270, 1.0, -10, 0.15, -6, 7],
  ['flyer', -210, 270, 1.0, 10, 0.2, 5, 8], ['flyer', 640, 540, 0.85, 30, 0.4, -7, 9]];
const FLY_NEAR = [['bus', 1470, 330, 0.42, -8, 0.05, -10], ['tub', 300, 330, 0.21, 10, 0.12, 9], ['flyer', 1850, 650, 1.7, -25, 0.3, -8, 3], ['dog', 110, 610, 1.6, 15, 0.35, 8, 4]];
function flyPos(e, i, t, flying, groundY) {
  const [, x0, y0, s, r0, th, vx = 5] = e;
  const rise = clamp((flying - th) / 0.35, 0, 1);
  if (rise <= 0) return null;
  const er = ease.out(rise);
  return { x: wrap(x0 + vx * t, -900, 2900), y: lerp(groundY, y0, er) + Math.sin(t * 0.9 + i * 1.7) * 10 * er, s, rot: r0 + Math.sin(t * 0.6 + i) * 7 + (1 - er) * 25 };
}
function flyFarPart(t, cam, p, o) {
  if (!(o.flying > 0)) return '';
  const col = mix(p.sil, p.far, 0.25);
  let s = '';
  FLY_FAR.forEach((e, i) => { const q = flyPos(e, i, t, o.flying, 940); if (q) s += P(SILO[e[0]], { fill: col, transform: tf(q.x, q.y, q.s, q.rot) }); });
  return V(cam, s, KF.flyFar);
}
function flyMidPart(t, cam, p, o, dy = 0) {
  if (!(o.flying > 0) || !o.flyMid) return '';
  const tint = { tint: p.tint, tintK: p.tintK * 0.4 };
  let s = '';
  FLY_MID.forEach((e, i) => {
    const q = flyPos(e, i, t, o.flying, 1080 + dy);
    if (!q) return;
    const y = q.y + dy * 0.5;
    if (e[0] === 'flyer') s += flyer(q.x, y, q.s, q.rot, { t, seed: e[7], ...tint });
    else if (e[0] === 'dog') s += dog(q.x, y, q.s, q.rot, { t, seed: e[7], col: ['#C98A4A', '#F2F2F2', '#3A3036'][i % 3], flip: e[6] < 0, ...tint });
    else if (e[0] === 'mail') s += mailman(q.x, y + 50, q.s, { t, rot: q.rot, ...tint });
    else if (e[0] === 'car') s += car(q.x, y, q.s, { col: '#7ED957', rot: q.rot, lights: p.lit, ...tint });
  });
  return V(cam, s, KF.flyMid);
}
function flyNearPart(t, cam, p, o) {
  if (!(o.flying > 0) || !o.flyNear) return '';
  const tint = { tint: p.tint, tintK: p.tintK * 0.3 };
  let s = '';
  FLY_NEAR.forEach((e, i) => {
    const q = flyPos(e, i, t, o.flying, 1500);
    if (!q) return;
    if (e[0] === 'bus') s += bus(q.x, q.y, q.s, q.rot, { t, flip: e[6] < 0, lights: p.lit, wave: 1, ...tint });
    else if (e[0] === 'tub') s += bathtubGuy(q.x, q.y, q.s, q.rot, { t, ...tint });
    else if (e[0] === 'flyer') s += flyer(q.x, q.y, q.s, q.rot, { t, seed: e[7], ...tint });
    else if (e[0] === 'dog') s += dog(q.x, q.y, q.s, q.rot, { t, seed: e[7], col: '#F2F2F2', ...tint });
  });
  return V(cam, s, KF.flyNear);
}

// ---------------------------------------------------------------- far skyline + popups + blimp
const POPS = [
  [330, 150, 'Gravity: OFF', '#FF4FD8'], [1300, 96, 'Too many players flying!', '#4FE3FF'], [760, 330, 'Cats: 100x size', '#FFD24F'],
  [1700, 300, 'Physics.exe not responding', '#7DFF8A'], [110, 430, 'Lag detected', '#4FE3FF'], [1120, 470, 'Server load: 999%', '#FF4FD8'],
  [2080, 170, 'Unknown command: un-fly', '#FFD24F'], [-300, 230, 'Admin review pending', '#7DFF8A'],
];
function farPart(t, cam, p, o, dy = 0) {
  const tr = dy ? `translate(0 ${dy})` : null;
  const hz = vgrad([[0, p.haze, 0], [1, p.haze, 0.85]]), hz2 = vgrad([[0, p.haze, 0], [1, p.haze, 0.55]]);
  const farWin = (W, kD, kN) => (p.lit < 0.9 ? P(W, { fill: 'url(#cityWinFarD)', opacity: f(p.glass * kD) }) : '') + (p.lit > 0.01 ? P(W, { fill: 'url(#cityWinFarN)', opacity: f(p.lit * kN) }) : '');
  const v2 = vis(cam, KF.far2), v1 = vis(cam, KF.far);
  let a = P(FAR2.body, { fill: p.far2 }) + farWin(FAR2.win, 0.45, 0.5);
  a += hz.def + R(v2.x0 - 100, 560, v2.x1 - v2.x0 + 200, 400, 0, { fill: hz.url });
  let b = P(FAR1.body, { fill: p.far }) + farWin(FAR1.win, 0.55, 0.75);
  if (p.lit > 0.3) b += P(FAR1.tips.map(([x, y]) => dC(x, y, 4.5)).join(''), { fill: '#FF3B4E', opacity: f(p.lit * (0.35 + 0.65 * blink(t, 1.1))) });
  b += hz2.def + R(v1.x0 - 100, 720, v1.x1 - v1.x0 + 200, 220, 0, { fill: hz2.url });
  return V(cam, G(a, tr), KF.far2) + V(cam, G(b, tr), KF.far) + flyFarPart(t, cam, p, o) + skyThings(t, cam, p, o);
}
// blimp + SERVER MESSAGE pop-ups (in front of the far skyline, behind the mid towers)
function skyThings(t, cam, p, o) {
  let out = '';
  if (o.blimp) {
    const B = { ...CITY.blimp, ...(typeof o.blimp === 'object' ? o.blimp : {}) };
    out += V(cam, blimp(B.x + Math.sin(t * 0.15) * 40, B.y, B.s, { t, lights: p.lit, text: B.text, flip: B.flip, rot: B.rot || 0, tint: p.tint, tintK: p.tintK * 0.6 }), KF.blimp);
  }
  if (o.popups > 0) {
    let ps = '';
    POPS.forEach(([x, y, line, col], i) => {
      const k = clamp((o.popups - i * 0.085) / 0.14, 0, 1);
      if (k > 0) ps += serverMsg(x, y + Math.sin(t * 1.3 + i * 2) * 6, 112 + line.length * 13.4, line, k, { neon: p.neon, col, rot: (rnd(i, 71) - 0.5) * 6 });
    });
    out += V(cam, ps, KF.pop);
  }
  return out;
}

// ---------------------------------------------------------------- mid skyline (k .4): buildings + landmarks
const MID_COLS = ['#6E86C8', '#F2B3C7', '#B59CE6', '#9ED9A0', '#7FB2F0', '#F29A7E', '#F6D37A', '#5FC4C9', '#E9A7D8'];
const MID = [
  { x: -704, w: 224, top: 380, kind: 'step', col: '#6E86C8' }, { x: -448, w: 192, top: 520, kind: 'box', col: '#F2B3C7' }, { x: -224, w: 224, top: 300, kind: 'spire', col: '#B59CE6' },
];
const MID_A = { x: 352, w: 192, top: 470, kind: 'round', col: '#9ED9A0' };
const MID_B = [{ x: 896, w: 128, top: 420, kind: 'slant', col: '#7FB2F0' }, { x: 1024, w: 160, top: 590, kind: 'box', col: '#F29A7E', ac: true }];
const MID_R = [{ x: 1920, w: 192, top: 330, kind: 'spire', col: '#6E86C8' }, { x: 2144, w: 224, top: 470, kind: 'step', col: '#F6D37A' }, { x: 2400, w: 192, top: 400, kind: 'box', col: '#5FC4C9', ant: true }, { x: 2624, w: 224, top: 520, kind: 'round', col: '#F29A7E' }];
const genMid = (i, x) => ({ x: x + 32 * Math.floor(rnd(i, 21) * 2), w: 32 * (5 + Math.floor(rnd(i, 22) * 3)), top: 300 + Math.floor(rnd(i, 23) * 7) * 40, kind: ['box', 'step', 'round', 'slant', 'spire'][Math.floor(rnd(i, 24) * 5)], col: MID_COLS[Math.floor(rnd(i, 25) * MID_COLS.length)], ant: rnd(i, 26) < 0.3 });
// Buildings of one layer are drawn in passes so that ALL their windows are ONE pattern path (each pattern-filled element
// costs a few ms in Chromium): A.body (outlined bodies) → windows (day glass / lit night) → A.shade → A.deco (caps, roof gear).
const newAcc = () => ({ body: '', win: '', shade: '', hi: '', awn: '', deco: '' });
const MID_WIN_Y1 = 960;   // mid windows below this are always hidden by the near row
function winD(x, y, w, cell, y1) { const y0 = Math.ceil((y + 14) / cell) * cell; return y0 < y1 - 10 ? dR(x, y0, w, y1 - y0) : ''; }
function flushAcc(A, p, kind) {
  let s = A.body;
  if (A.win) {
    if (p.lit < 0.9) s += P(A.win, { fill: `url(#cityWin${kind}D)`, opacity: f(p.glass) });
    if (p.lit > 0.01) s += P(A.win, { fill: `url(#cityWin${kind}N)`, opacity: f(p.lit) });
  }
  if (A.shade) s += P(A.shade, op('#000', 0.13));
  if (A.hi) s += P(A.hi, op('#FFFFFF', 0.12));
  if (A.awn) s += P(A.awn, { fill: 'url(#cityAwn)', opacity: f(0.75 - 0.35 * p.lit) });
  return s + A.deco;
}
// aviation light: blinks red at night (cheap two-circle glow, no gradient)
function redLight(x, y, t, p, r = 6) {
  if (p.lit < 0.2) return Ci(x, y, r, olw('#B8303E', 2.5));
  const on = blink(t, 1.1, x * 0.01);
  return (on ? Ci(x, y, r * 3.2, op('#FF4A5A', 0.18 * p.lit)) + Ci(x, y, r * 1.9, op('#FF6A7A', 0.3 * p.lit)) : '') + Ci(x, y, r, { fill: on ? '#FF4A5A' : '#8A2030', stroke: LINE, 'stroke-width': 2.5 });
}
function midBldg(b, p, t, A) {
  const { x, w, top, kind } = b, c = bc(b.col, p), hi = mix(c, '#FFFFFF', 0.3);
  let body = dR(x, top, w, MID_BASE - top), wins = [[x, top, w]], shadeTop = top, cap = true;
  if (kind === 'step') {
    body = dR(x, top + 96, w, MID_BASE - top - 96) + dR(x + 32, top + 40, w - 64, 60) + dR(x + 64, top, w - 128, 44);
    wins = [[x, top + 96, w], [x + 32, top + 40, w - 64]]; shadeTop = top + 96; cap = false;
  } else if (kind === 'round') { body += `M${x} ${top + 1}a${f(w / 2)} ${f(w * 0.34)} 0 0 1 ${w} 0Z`; cap = false; }
  else if (kind === 'slant') { body = dPoly([[x, MID_BASE], [x, top + 56], [x + w, top - 6], [x + w, MID_BASE]]); wins = [[x, top + 60, w]]; shadeTop = top + 20; cap = false; }
  else if (kind === 'spire') body += dPoly([[x + w * 0.22, top + 1], [x + w / 2, top - w * 0.62], [x + w * 0.78, top + 1]]);
  A.body += P(body, olw(c, 5));
  for (const [wx, wy, ww] of wins) A.win += winD(wx, wy, ww, 40, MID_WIN_Y1);
  A.shade += dR(x + w * 0.74, shadeTop, w * 0.26, MID_BASE - shadeTop);
  let o = '';
  if (kind === 'step') o += R(x + 58, top - 8, w - 116, 14, 5, olw(hi, 4)) + R(x + 26, top + 34, w - 52, 12, 5, olw(hi, 4)) + R(x - 6, top + 88, w + 12, 14, 5, olw(hi, 4));
  if (cap) o += R(x - 6, top - 10, w + 12, 16, 5, olw(hi, 4));
  if (kind === 'round') o += P(`M${x + 12} ${top - 4}a${f(w / 2 - 12)} ${f(w * 0.3)} 0 0 1 ${f(w * 0.36)} ${f(-w * 0.24)}`, ln(6, '#FFFFFF', 0.3)) + P(`M${f(x + w / 2)} ${f(top - w * 0.34)}V${f(top - w * 0.34 - 40)}`, ln(5)) + redLight(x + w / 2, top - w * 0.34 - 44, t, p, 5);
  if (kind === 'spire') o += P(`M${f(x + w / 2)} ${f(top - w * 0.62)}V${f(top - w * 0.62 - 70)}`, ln(5)) + redLight(x + w / 2, top - w * 0.62 - 74, t, p, 6);
  if (b.ant) o += P(`M${x + w * 0.3} ${top - 8}V${top - 90}M${x + w * 0.3 - 14} ${top - 60}H${x + w * 0.3 + 14}`, ln(5)) + redLight(x + w * 0.3, top - 94, t, p, 5);
  if (b.ac) o += R(x + 16, top - 40, 50, 30, 5, olw(bc('#C9CED8', p), 4)) + Ci(x + 41, top - 25, 9, { fill: 'none', stroke: LINE, 'stroke-width': 3 });
  A.deco += o;
}
function construction(p, t, A) {
  const g = bc('#E8603C', p), conc = bc('#BDB8C8', p);
  A.body += R(64, 780, 256, 300, 0, olw(conc, 5));
  A.win += winD(64, 780, 256, 40, MID_WIN_Y1);
  A.shade += dR(250, 780, 70, 300);
  const cols = [70, 150, 230, 312];
  const gd = cols.map((x) => `M${x} 784V${x === 312 ? 640 : 580}`).join('') + 'M66 720H316M66 650H316M66 586H236M150 586L230 650M70 720L150 650';
  A.deco += P(gd, ln(15, LINE)) + P(gd, ln(8, g)) + P('M110 586L104 560L124 558L126 586M140 560H180', ln(4, bc('#5A6478', p)));
}
function crane(p, t, o) {
  const nk = clamp(p.tintK / 0.7, 0, 1), h = craneHook(t, o), tx = o.hookX;
  const yel = bc('#FFC21F', p), grey = bc('#9A98A8', p);
  const latD = dR(176, 150, 36, MID_WIN_Y1 - 150) + dR(176, CRANE.jibY, CRANE.tip - 176, 26) + dR(24, CRANE.jibY, 152, 22);
  let s = P('M194 72L592 152M194 72L28 152', ln(3.5));
  s += P(latD, { fill: nk < 0.95 ? 'url(#cityLatD)' : 'url(#cityLatN)' }) + (nk > 0.05 && nk < 0.95 ? P(latD, { fill: 'url(#cityLatN)', opacity: f(nk) }) : '') + P(latD, { fill: 'none', stroke: LINE, 'stroke-width': 4 });
  s += P('M180 150L194 70L208 150', ln(9)) + P('M180 150L194 70L208 150', ln(4.5, yel));
  s += R(28, 172, 66, 56, 6, olw(grey, 4)) + R(98, 172, 50, 40, 6, olw(grey, 4)) + P('M32 190H90M32 208H90', ln(3, mix(grey, '#000000', 0.25)));
  s += R(212, 176, 52, 46, 8, olw(yel, 4)) + R(222, 184, 32, 20, 4, { fill: p.lit > 0.4 ? '#FFE6A0' : bc('#A9DDF5', p), stroke: LINE, 'stroke-width': 3 });
  s += R(tx - 18, 176, 36, 14, 4, olw(bc('#4A4E60', p), 3));
  s += P(`M${tx - 5} 190L${f(h.x - 5)} ${f(h.y - 48)}M${tx + 5} 190L${f(h.x + 5)} ${f(h.y - 48)}`, ln(3));
  s += G(R(-18, -54, 36, 28, 6, olw(yel, 3.5)) + P('M-14 -48H14', ln(3, '#000', 0.2)) + P('M0 -26V-8Q0 4 -11 2Q-18 0 -16 -8', { ...ln(6), fill: 'none' }), `translate(${f(h.x)} ${f(h.y)}) rotate(${f(h.rot)})`);
  s += redLight(CRANE.tip - 6, CRANE.jibY - 6, t, p, 5) + redLight(194, 66, t + 0.4, p, 5);
  return s;
}
function tallTower(p, t, A) {
  const c = bc('#3FB6B0', p), hi = mix(c, '#FFFFFF', 0.28), gold = bc('#FFD24F', p);
  A.body += P(dR(576, 380, 288, MID_BASE - 380) + dR(600, 300, 240, 84) + dR(624, 236, 192, 68), olw(c, 5));
  A.win += winD(576, 384, 288, 40, MID_WIN_Y1) + winD(608, 304, 224, 40, 372) + winD(640, 248, 160, 40, 292);
  A.shade += dR(808, 384, 56, MID_BASE - 384) + dR(800, 304, 40, 76) + dR(784, 240, 32, 60);
  let s = R(590, 400, 12, MID_WIN_Y1 - 400, 5, op(hi, 0.8)) + R(838, 400, 12, MID_WIN_Y1 - 400, 5, op(hi, 0.8));
  s += R(568, 372, 304, 14, 5, olw(gold, 4)) + R(592, 292, 256, 12, 5, olw(gold, 4)) + R(614, 222, 212, 16, 6, olw(gold, 4));
  const ha = t * 6, ma = t * 72;
  s += Ci(720, 268, 23, olw(p.lit > 0.4 ? '#FFF2C0' : '#FFF8E8', 4)) + P(`M720 268L${f(720 + Math.sin(ha * Math.PI / 180) * 12)} ${f(268 - Math.cos(ha * Math.PI / 180) * 12)}M720 268L${f(720 + Math.sin(ma * Math.PI / 180) * 17)} ${f(268 - Math.cos(ma * Math.PI / 180) * 17)}`, ln(3.5));
  s += P('M812 222V176', ln(4.5)) + redLight(812, 172, t, p, 5);
  A.deco += s;
}
function tvStation(p, t, A) {
  const c = bc('#EDE6D6', p), red = bc('#E8453C', p), grey = bc('#C9CED8', p), nk = clamp(p.tintK / 0.7, 0, 1);
  const lat = 'M1380 470L1400 250L1420 470Z';
  A.body += P(lat, { fill: nk < 0.95 ? 'url(#cityLatD)' : 'url(#cityLatN)' }) + (nk > 0.05 && nk < 0.95 ? P(lat, { fill: 'url(#cityLatN)', opacity: f(nk) }) : '') + P(lat, { fill: 'none', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  A.body += R(1216, 470, 224, MID_BASE - 470, 0, olw(c, 5));
  A.win += winD(1216, 586, 224, 40, MID_WIN_Y1);
  A.shade += dR(1384, 504, 56, MID_BASE - 504);
  let s = P('M1400 252V196', ln(4.5)) + redLight(1400, 192, t, p, 6) + redLight(1400, 340, t + 0.5, p, 4.5);
  s += R(1216, 470, 224, 34, 0, { fill: red, stroke: LINE, 'stroke-width': 5 });
  if (p.neon > 0.05) s += R(1228, 508, 200, 74, 16, { fill: 'none', stroke: '#FF6A5A', 'stroke-width': 14, opacity: f(0.35 * p.neon) });
  s += R(1236, 514, 184, 62, 10, olw(red, 4)) + T('NEWS 7', 1328, 559, 40, p.neon > 0.5 ? '#FFF6D8' : '#FFFFFF');
  s += G(P('M-48 -8Q0 50 48 -8Z', olw(grey, 4)) + P('M0 16L0 -30', ln(4)) + Ci(0, -32, 5, olw(red, 2.5)), 'translate(1270 458) rotate(-28)') + R(1260, 456, 18, 16, 3, olw(grey, 3));
  s += G(P('M-48 -8Q0 50 48 -8Z', olw(grey, 4)) + P('M0 16L0 -30', ln(4)), 'translate(1334 462) rotate(24) scale(0.55)');
  A.deco += s;
}
const STAD = { cx: 1690, rim: 610, rx: 215, ry: 64 };
function stadium(p, t) {
  const { cx, rim, rx, ry } = STAD;
  const wall = bc('#D6DCEB', p), stand = bc('#4A3E7A', p), field = bc('#4CC46A', p), lamp = p.lit > 0.3 ? '#FFF8D8' : bc('#E8EEF8', p);
  let s = '';
  for (const fx of [cx - rx - 14, cx + rx + 14]) {
    if (p.lit > 0.1) s += P(`M${fx - 30} ${rim - 150}L${fx + 30} ${rim - 150}L${cx + (fx < cx ? 40 : -40)} ${rim + 30}L${cx + (fx < cx ? -120 : 120)} ${rim + 30}Z`, { fill: 'url(#cityConeCool)', opacity: f(0.6 * p.lit) });
    s += P(`M${fx} ${rim + 90}V${rim - 150}`, ln(9)) + P(`M${fx} ${rim + 90}V${rim - 150}`, ln(4, bc('#8A90A6', p)));
    s += R(fx - 36, rim - 190, 72, 44, 6, olw(bc('#5A6478', p), 4)) + P([0, 1, 2].map((c) => [0, 1].map((r) => dC(fx - 22 + c * 22, rim - 177 + r * 18, 6.5)).join('')).join(''), { fill: lamp });
  }
  const back = `M${cx - rx} ${rim}A${rx} ${ry} 0 0 1 ${cx + rx} ${rim}Z`;
  s += P(back, { fill: stand }) + P(back, { fill: 'url(#cityCrowd)', opacity: f(0.85 - 0.3 * p.tintK) });
  s += Ell(cx, rim + 6, rx * 0.68, ry * 0.36, { fill: field, stroke: LINE, 'stroke-width': 3 }) + P(`M${cx} ${f(rim + 6 - ry * 0.36)}V${f(rim + 6 + ry * 0.36)}`, ln(3, '#FFFFFF', 0.7));
  s += P(`M${cx - rx} ${rim}A${rx} ${ry} 0 0 0 ${cx + rx} ${rim}L${cx + rx + 12} ${MID_BASE}H${cx - rx - 12}Z`, olw(wall, 5));
  let ribs = '';
  for (let i = -5; i <= 5; i++) { const x = cx + i * rx * 0.18, yy = rim + ry * Math.sqrt(Math.max(0, 1 - Math.pow(i * 0.18, 2))); ribs += `M${f(x)} ${f(yy + 4)}V${MID_BASE}`; }
  s += P(ribs, ln(4, mix(wall, '#000000', 0.25)));
  s += Ell(cx, rim, rx, ry, { fill: 'none', stroke: LINE, 'stroke-width': 5 }) + P(`M${cx - rx + 10} ${rim + 8}A${rx - 10} ${ry - 8} 0 0 0 ${cx + rx - 10} ${rim + 8}`, ln(6, '#FFFFFF', 0.4));
  s += R(cx - 100, rim + 86, 200, 44, 10, olw(bc('#FF5A7A', p), 4)) + TF('GO CATS!', cx, rim + 117, 30, '#FFFFFF');
  return s;
}
function midPart(t, cam, p, o, dy = 0) {
  const v = vis(cam, KF.mid), see = (x0, x1) => x1 > v.x0 - 60 && x0 < v.x1 + 60;
  const A = newAcc();
  for (const b of MID) if (see(b.x, b.x + b.w)) midBldg(b, p, t, A);
  if (see(20, 330)) construction(p, t, A);
  if (see(MID_A.x, MID_A.x + MID_A.w)) midBldg(MID_A, p, t, A);
  if (see(570, 870)) tallTower(p, t, A);
  for (const b of MID_B) if (see(b.x, b.x + b.w)) midBldg(b, p, t, A);
  if (see(1210, 1450)) tvStation(p, t, A);
  if (see(1440, 1940)) A.body += stadium(p, t);
  for (const b of MID_R) if (see(b.x, b.x + b.w)) midBldg(b, p, t, A);
  fillSlots(cam, KF.mid, -704, 2848, 256, (i, x) => { midBldg(genMid(i, x), p, t, A); return ''; });
  if (see(20, 620)) A.deco += crane(p, t, o);
  if (see(1000, 1200)) {
    const W = CITY.waterTower, fall = ease.in(clamp(o.waterFall, 0, 1));
    A.deco += G(waterTower(W.x, W.y, W.s, { tip: Math.max(o.waterTip, fall > 0 ? 1 : 0), t, tint: p.tint, tintK: p.tintK }), fall > 0 ? `translate(${f(fall * 90)} ${f(fall * fall * 700)}) rotate(${f(fall * 40)} ${W.x + 30} ${W.y})` : null);
  }
  let m = flushAcc(A, p, 'Mid');
  if (o.onMid) m += o.onMid;
  return V(cam, G(m, dy ? `translate(0 ${dy})` : null), KF.mid) + flyMidPart(t, cam, p, o, dy);
}

// ---------------------------------------------------------------- near buildings (k .75) + street (k 1)
const NEON_COLS = { PIZZA: '#FF5A5A', ARCADE: '#4FE3FF', 'CAT CAFE': '#FF7AD8', 'OPEN 24/7': '#7DFF8A', DONUTS: '#FFB347', KARAOKE: '#C78BFF' };
const NEAR = [
  { x: -624, w: 288, top: 830, col: '#D9786A', bill: 'BIG SALE', billCol: '#E8453C' }, { x: -336, w: 288, top: 780, col: '#5FB8C8', neon: 'KARAOKE', awn: '#7A4FC8' },
  { x: -48, w: 240, top: 860, col: '#7FC6A4', neon: 'PIZZA', awn: '#E8453C' }, { x: 192, w: 336, top: 770, col: '#8A8FD8', bill: 'MEOW MART', billCol: '#FF8A3D', ac: true, awn: '#2E9C6A' },
  { x: 528, w: 288, top: 880, col: '#F2C26B', neon: 'ARCADE', awn: '#3A7BD5' }, { x: 816, w: 288, top: 812, col: '#E58FB0', neon: 'CAT CAFE', awn: '#7A4FC8' },
  { x: 1152, w: 336, top: 690, col: '#6FA7E0', hero: true, awn: '#FFB52E' }, { x: 1488, w: 288, top: 850, col: '#F09A5E', neon: 'OPEN 24/7', awn: '#2E9C6A' },
  { x: 1776, w: 288, top: 772, col: '#9B7ED0', bill: 'TACO TUESDAY', billCol: '#FFB52E', ac: true, awn: '#E8453C' }, { x: 2064, w: 336, top: 860, col: '#5FB8C8', neon: 'DONUTS', awn: '#E8453C' },
  { x: 2400, w: 288, top: 800, col: '#E67A6A', awn: '#3A7BD5' },
];
const NEAR_COLS = ['#D9786A', '#5FB8C8', '#7FC6A4', '#8A8FD8', '#F2C26B', '#E58FB0', '#F09A5E', '#9B7ED0'];
const genNear = (i, x) => ({ x, w: 48 * (5 + Math.floor(rnd(i, 27) * 2)), top: 760 + Math.floor(rnd(i, 28) * 6) * 22, col: NEAR_COLS[Math.floor(rnd(i, 29) * NEAR_COLS.length)], awn: ['#E8453C', '#3A7BD5', '#2E9C6A'][i & 1 ? 1 : (i % 3 === 0 ? 2 : 0)], ac: rnd(i, 30) < 0.5 });
function nearBldg(b, p, t, A) {
  const { x, w, top } = b, c = bc(b.col, p), hi = mix(c, '#FFFFFF', 0.25), sh = mix(c, '#000000', 0.25);
  A.body += R(x, top, w, 1500 - top, 0, olw(c, 6)) + R(x, SHOP_Y, w, 1500 - SHOP_Y, 0, { fill: sh, stroke: LINE, 'stroke-width': 6 });
  A.body += R(x + 22, SHOP_Y + 34, w - 44, 90, 6, { fill: mix(bc('#BFE6FF', p), '#FFD98A', p.lit), stroke: LINE, 'stroke-width': 4 });
  A.win += winD(x, top + 20, w, 60, SHOP_Y - 8);
  A.shade += dR(x + w - 46, top, 46, 1500 - top);
  A.hi += dRR(x + 8, top + 10, 12, SHOP_Y - top - 18, 6) + dRR(x + 32, SHOP_Y + 42, 16, 50, 4);
  const n = Math.max(2, Math.round((w - 20) / 34)), sw = (w - 20) / n;
  let aw = `M${x + 10} ${SHOP_Y - 2}H${x + w - 10}V${SHOP_Y + 22}`;
  for (let i = 0; i < n; i++) aw += `q${f(-sw / 2)} 16 ${f(-sw)} 0`;
  aw += 'Z';
  A.body += P(aw, olw(bc(b.awn || '#E8453C', p), 4));
  A.awn += aw;
  let s = R(x - 10, top - 16, w + 20, 24, 7, olw(hi, 5));
  if (b.ac) s += R(x + 26, top - 52, 74, 38, 6, olw(bc('#C9CED8', p), 4)) + Ci(x + 63, top - 33, 12, { fill: 'none', stroke: LINE, 'stroke-width': 3 }) + R(x + 112, top - 40, 30, 26, 4, olw(bc('#AEB4C2', p), 3));
  if (b.bill) {
    const bw = Math.min(w - 30, 270), bx = x + w / 2 - bw / 2, by = top - 132;
    s += P(`M${bx + 34} ${top - 12}V${by + 80}M${bx + bw - 34} ${top - 12}V${by + 80}`, ln(8));
    s += R(bx, by, bw, 92, 8, olw(bc('#FFF3DC', p), 5)) + R(bx + 8, by + 8, bw - 16, 76, 5, { fill: bc(b.billCol || '#E8453C', p) }) + outTF(b.bill, bx + bw / 2, by + 59, b.bill.length > 10 ? 27 : 32, mix('#FFFFFF', '#FFF2C0', p.lit), 6);
    if (p.lit > 0.2) s += P(`M${bx + 20} ${by - 4}L${bx + bw - 20} ${by - 4}L${bx + bw} ${by + 90}L${bx} ${by + 90}Z`, op('#FFF2C0', 0.12 * p.lit));
  }
  if (b.neon) {
    const nc = NEON_COLS[b.neon] || '#FF7AD8', cx = x + w / 2, ny = top - 30, size = 40;
    s += P(`M${f(cx - b.neon.length * 11)} ${top - 12}V${ny - 6}M${f(cx + b.neon.length * 11)} ${top - 12}V${ny - 6}`, ln(5));
    if (p.neon > 0.05) s += TF(esc(b.neon), cx, ny, size, nc, { stroke: nc, 'stroke-width': 14, 'stroke-opacity': f(0.4 * p.neon), 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
    s += outTF(b.neon, cx, ny, size, mix(bc('#E8E2EE', p), nc, p.neon), 5);
  }
  if (b.hero) {
    s += waterTower(x + 76, top - 8, 0.3, { tint: p.tint, tintK: p.tintK, t });
    const ax = x + w - 56;
    s += P(`M${ax} ${top - 8}V${top - 190}M${ax - 18} ${top - 120}H${ax + 18}M${ax - 12} ${top - 160}H${ax + 12}`, ln(6)) + G(P('M-26 -6Q0 30 26 -6Z', olw(bc('#E8EEF8', p), 3.5)) + P('M0 10V-14', ln(3)), `translate(${ax - 24} ${top - 70}) rotate(-35)`) + redLight(ax, top - 196, t, p, 6);
  }
  A.deco += s;
}
function nearPart(t, cam, p, o) {
  const v = vis(cam, KF.near), A = newAcc();
  for (const b of NEAR) if (b.x + b.w > v.x0 - 60 && b.x < v.x1 + 60) nearBldg(b, p, t, A);
  fillSlots(cam, KF.near, -624, 2688, 336, (i, x) => { nearBldg(genNear(i, x), p, t, A); return ''; });
  let n = flushAcc(A, p, 'Near');
  if (o.onNear) n += o.onNear;
  return V(cam, n, KF.near);
}
const CARS = [['#FF5A5A', 1, 140], ['#4FC3F7', 1, 100], ['#FFD54F', -1, 120], ['#7ED957', 1, 160], ['#B388FF', -1, 110], ['#FF9F43', -1, 150], ['#F2F2F2', 1, 120], ['#F06292', -1, 90]];
function streetPart(t, cam, p, o) {
  const v = vis(cam, 1);
  let s = band(cam, 1, 966, 1004, { fill: p.walk }) + band(cam, 1, 1000, 1012, { fill: p.curb }) + band(cam, 1, 1012, 1900, { fill: p.road });
  s += band(cam, 1, 964, 970, { fill: LINE, opacity: 0.5 });
  const x0 = Math.floor((v.x0 - 200) / 120) * 120;
  s += P(`M${x0} 1063H${f(v.x1 + 200)}`, { stroke: mix('#FFD84D', p.tint, p.tintK * 0.6), 'stroke-width': 7, 'stroke-dasharray': '64 56' });
  let joints = '';
  for (let x = x0; x < v.x1 + 200; x += 120) joints += `M${x} 970L${x - 12} 1000`;
  s += P(joints, ln(3, '#000', 0.12));
  const fly = o.flying || 0, tintC = (c) => mix(c, p.tint, p.tintK * 0.6);
  // lamps
  let lampD = '', heads = '', glow = '';
  for (let i = Math.floor((v.x0 - 300) / 460); i <= Math.ceil((v.x1 + 300) / 460); i++) {
    const lx = i * 460 + 60;
    lampD += `M${lx} 1000V862Q${lx} 846 ${lx + 16} 846H${lx + 30}`;
    heads += dRR(lx + 22, 838, 30, 15, 6);
    if (p.lit > 0.05) glow += Ci(lx + 37, 856, 74, { fill: 'url(#cityGlowW)', opacity: f(p.lit) }) + Ell(lx + 37, 990, 76, 12, op('#FFE6A8', 0.22 * p.lit));
  }
  s += glow + P(lampD, ln(10)) + P(lampD, ln(5, tintC('#5A6478'))) + P(heads, { fill: p.lit > 0.3 ? '#FFF2C0' : tintC('#C9CED8'), stroke: LINE, 'stroke-width': 3 });
  if (o.street !== false) {
    // people on the sidewalk (they float up with opts.flying)
    for (let i = 0; i < 22; i++) {
      const vx = (rnd(i, 91) < 0.5 ? -1 : 1) * (14 + rnd(i, 92) * 18);
      const px = wrap(rnd(i, 93) * 3800 + vx * t, -900, 2900);
      if (px < v.x0 - 80 || px > v.x1 + 80) continue;
      const rise = fly > 0 ? clamp((fly - rnd(i, 94) * 0.55) / 0.3, 0, 1) : 0, er = ease.inOut(rise);
      s += tinyPerson(px + er * Math.sin(t + i) * 40, lerp(992, 380 + rnd(i, 95) * 520, er), 1.05, i, t * 9 + i * 2, rise, er * (rnd(i, 96) - 0.5) * 90, tintC);
    }
    for (const lane of [1, -1]) {
      CARS.forEach(([col, dir, sp], i) => {
        if (dir !== lane) return;
        const cx = wrap(rnd(i, 81) * 3800 + dir * sp * t, -900, 2900);
        if (cx < v.x0 - 200 || cx > v.x1 + 200) return;
        const rise = fly > 0 ? clamp((fly - rnd(i, 82) * 0.5) / 0.35, 0, 1) : 0, er = ease.inOut(rise);
        const cy = lerp(dir > 0 ? 1044 : 1082, 330 + rnd(i, 83) * 420, er);
        s += car(cx, cy, 1, { col, flip: dir < 0, lights: p.lit * (1 - er), rot: er * ((rnd(i, 84) - 0.5) * 60 + Math.sin(t * 1.3 + i) * 8), tint: p.tint, tintK: p.tintK * 0.6 });
      });
    }
  }
  return V(cam, s, KF.street);
}

// ---------------------------------------------------------------- light washes (camera applied!)
function cityLight(t, cam, p, o) {
  let l = wash(cam, p.wash, p.washK);
  const adm = clamp(Math.max(o.admin, o.crack * 0.85), 0, 1);
  if (o.crack > 0.02) {
    const c = o.crackAt;
    let b = '';
    for (let i = 0; i < 7; i++) {
      const a = (-54 + i * 18 + Math.sin(t * 0.7 + i * 1.3) * 4) * Math.PI / 180, hw = (2.5 + rnd(i, 97) * 4) * Math.PI / 180, L = 1800;
      b += dPoly([[c.x, c.y], [c.x + Math.sin(a - hw) * L, c.y + Math.cos(a - hw) * L], [c.x + Math.sin(a + hw) * L, c.y + Math.cos(a + hw) * L]]);
    }
    l += V(cam, P(b, { fill: 'url(#cityBeam)', opacity: f(0.55 * sm(0.1, 0.8, o.crack)) }), KF.crack);
  }
  if (adm > 0.01) l += V(cam, fullRect(cam, 0, { fill: 'url(#cityAdminWash)', opacity: f(adm * 0.7) }), 0) + wash(cam, '#DDEBFF', adm * 0.05);
  return l;
}

// ---------------------------------------------------------------- city(t, cam, opts)
function city(t, cam, opts = {}) {
  cam = cam || {};
  const o = cityOpts(opts), p = palAt(o.time, o.dawn);
  const bg = skyPart(t, cam, p, o) + farPart(t, cam, p, o);
  const mid = midPart(t, cam, p, o);
  const fg = nearPart(t, cam, p, o) + streetPart(t, cam, p, o) + flyNearPart(t, cam, p, o);
  return layers(bg, mid, fg, cityLight(t, cam, p, o), { pal: p });
}

// ---------------------------------------------------------------- rooftop(t, cam, opts)
const ROOF = {
  floor: 905, edge: 862, wallTop: 790, dyFar: 170, dyMid: 330,
  hero: { x: 960, y: 905 }, tank: { x: 300, y: 878, s: 1.05 }, antenna: { x: 1660, y: 874, top: 300 }, pigeon: { x: 830, y: 776 },
};
function rooftop(t, cam, opts = {}) {
  cam = cam || {};
  const o = cityOpts(opts), p = palAt(o.time, o.dawn);
  const bg = skyPart(t, cam, p, o) + farPart(t, cam, p, o, ROOF.dyFar) + midPart(t, cam, p, o, ROOF.dyMid);
  const v = vis(cam, 1), see = (x0, x1) => x1 > v.x0 - 60 && x0 < v.x1 + 60, tc = (c) => bc(c, p);
  const { wallTop, edge } = ROOF;
  let d = band(cam, 1, wallTop, edge + 6, { fill: tc('#C08A6E') }) + band(cam, 1, wallTop, edge + 6, { fill: 'url(#cityBrick)' });
  d += band(cam, 1, wallTop - 18, wallTop + 4, { fill: tc('#E2CDB8') }) + band(cam, 1, wallTop - 21, wallTop - 16, { fill: LINE }) + band(cam, 1, wallTop + 2, wallTop + 6, { fill: LINE });
  d += band(cam, 1, edge, 2100, { fill: tc('#8C869C') }) + band(cam, 1, edge, 2100, { fill: 'url(#cityTar)' }) + band(cam, 1, edge, edge + 28, op('#000', 0.2)) + band(cam, 1, edge - 2, edge + 3, { fill: LINE });
  if (see(-560, -120)) d += R(-540, 590, 380, 290, 10, olw(tc('#C9B6A0'), 6)) + R(-560, 574, 420, 28, 8, olw(tc('#E2D4C4'), 5)) + R(-430, 680, 130, 200, 8, olw(tc('#5E7FA8'), 5)) + Ci(-318, 790, 8, olw(tc('#FFD24F'), 3)) + R(-390, 642, 50, 22, 6, olw(p.lit > 0.3 ? '#FFF2C0' : tc('#E8EEF8'), 3));
  // string lights from the tank to the antenna
  const L0 = [384, 470], L1 = [ROOF.antenna.x - 6, 430], C0 = [1020, 640 + Math.sin(t * 0.8) * 6];
  const bez = (u) => [(1 - u) * (1 - u) * L0[0] + 2 * (1 - u) * u * C0[0] + u * u * L1[0], (1 - u) * (1 - u) * L0[1] + 2 * (1 - u) * u * C0[1] + u * u * L1[1]];
  let bulbs = '', bglow = '';
  for (let i = 1; i < 18; i++) { const [bx, by] = bez(i / 18); bulbs += dC(bx, by + 9, 7); if (p.lit > 0.1) bglow += dC(bx, by + 9, 18); }
  if (see(300, 1700)) d += P(`M${L0[0]} ${L0[1]}Q${f(C0[0])} ${f(C0[1])} ${L1[0]} ${L1[1]}`, { ...ln(3), fill: 'none' }) + (bglow ? P(bglow, op('#FFD98A', 0.28 * p.lit)) : '') + P(bulbs, { fill: p.lit > 0.25 ? '#FFE6A0' : tc('#F2EEE0'), stroke: LINE, 'stroke-width': 2.5 });
  if (see(150, 450)) d += waterTower(ROOF.tank.x, ROOF.tank.y, ROOF.tank.s, { tint: p.tint, tintK: p.tintK, t });
  for (const vx of [640, 1180]) if (see(vx - 40, vx + 40)) d += R(vx - 16, 812, 32, 70, 6, olw(tc('#AEB4C2'), 5)) + P(`M${vx - 34} 818Q${vx} 776 ${vx + 34} 818Z`, olw(tc('#C9CED8'), 5));
  if (see(1260, 1500)) {
    d += R(1270, 762, 230, 128, 14, olw(tc('#D4D8E2'), 6)) + P('M1290 790H1360M1290 812H1360M1290 834H1360M1290 856H1360', ln(4, '#000', 0.25)) + Ci(1430, 826, 44, olw(tc('#9AA0AE'), 5));
    d += G(P('M0 0L34 -10L34 10Z M0 0L-10 34L10 34Z M0 0L-34 10L-34 -10Z M0 0L10 -34L-10 -34Z', { fill: tc('#5A6070') }), `translate(1430 826) rotate(${f(t * 400)})`) + Ci(1430, 826, 8, olw(tc('#C9CED8'), 3));
  }
  if (see(1560, 1760)) {
    const A = ROOF.antenna, ad = `M${A.x - 32} ${A.y}L${A.x - 6} ${A.top}M${A.x + 32} ${A.y}L${A.x + 6} ${A.top}` + [0.15, 0.35, 0.55, 0.75].map((u) => { const y = lerp(A.y, A.top, u), hw = lerp(32, 6, u); return `M${f(A.x - hw)} ${f(y)}L${f(A.x + hw * 0.7)} ${f(y - 60)}M${f(A.x - hw)} ${f(y)}H${f(A.x + hw)}`; }).join('');
    d += P(ad, ln(10)) + P(ad, ln(5, tc('#E8453C'))) + P(`M${A.x} ${A.top}V${A.top - 70}`, ln(6)) + redLight(A.x, A.top - 74, t, p, 9);
    d += G(P('M-44 -10Q0 50 44 -10Z', olw(tc('#E8EEF8'), 5)) + P('M0 18V-26', ln(4)) + Ci(0, -28, 6, olw(tc('#E8453C'), 3)), `translate(${A.x - 50} ${A.top + 170}) rotate(-30)`);
  }
  if (see(780, 880)) {
    const { x, y } = ROOF.pigeon, hb = Math.max(0, Math.sin(t * 5)) * 6;
    d += P(`M${x - 6} ${y}V${y + 12}M${x + 6} ${y}V${y + 12}`, ln(3, '#E8803A')) + P(`M${x - 30} ${y - 4}Q${x - 26} ${y - 30} ${x} ${y - 30}Q${x + 22} ${y - 30} ${x + 22} ${y - 10}Q${x + 10} ${y + 4} ${x - 30} ${y - 4}Z`, olw(tc('#8A90A8'), 3.5));
    d += Ci(x + 14, y - 34 + hb, 12, olw(tc('#7A8098'), 3.5)) + P(`M${x + 24} ${y - 36 + hb}l10 3l-10 3Z`, { fill: '#E8803A' }) + Ci(x + 17, y - 37 + hb, 2.5, { fill: '#151515' }) + P(`M${x - 4} ${y - 18}q10 -6 20 2`, ln(4, tc('#5FD3B0')));
  }
  d += Ell(1120, 986, 170, 16, op(mix('#9FD8FF', p.sky[1], 0.5), 0.3));
  return layers(bg, V(cam, d, 1), flyNearPart(t, cam, p, o), cityLight(t, cam, p, o), { pal: p });
}

// ---------------------------------------------------------------- giantScale(t, cam, opts)
// Low-angle city for the size duel: rows of tiny rooftops at the bottom, giants stand with their feet on GIANT.ground.
const GIANT = { ground: 1000, horizon: 830, k: 1 };
const GROWS = [
  { k: 0.55, base: 1300, y0: 700, y1: 820, seed: 301, step: 132, win1: 920 },
  { k: 0.8, base: 1300, y0: 800, y1: 900, seed: 302, step: 150, win1: 960 },
  { k: 1.18, base: 1400, y0: 960, y1: 1030, seed: 303, step: 200, win1: 1150 },
];
const G_COLS = ['#6E86C8', '#F2B3C7', '#B59CE6', '#9ED9A0', '#7FB2F0', '#F29A7E', '#F6D37A', '#5FC4C9', '#D9786A', '#8A8FD8'];
function giantRow(cam, row, p, t) {
  const v = vis(cam, row.k), A = newAcc(), y1 = row.win1;
  for (let i = Math.floor((v.x0 - 300) / row.step); i <= Math.ceil((v.x1 + 300) / row.step); i++) {
    const w = 16 * (5 + Math.floor(rnd(i, row.seed) * 5)), x = i * row.step + Math.floor(rnd(i, row.seed + 1) * 2) * 16 - 32;
    const top = Math.round(lerp(row.y0, row.y1, rnd(i, row.seed + 2)) / 22) * 22;
    const c = bc(G_COLS[Math.floor(rnd(i, row.seed + 3) * G_COLS.length)], p), hi = mix(c, '#FFFFFF', 0.28);
    const kind = Math.floor(rnd(i, row.seed + 4) * 5);
    A.body += kind === 3 ? P(dR(x, top, w, row.base - top) + `M${x + 8} ${top + 1}a${f(w / 2 - 8)} ${f(w * 0.3)} 0 0 1 ${w - 16} 0Z`, olw(c, 4)) : R(x, top, w, row.base - top, 0, olw(c, 4));
    A.win += dR(x, top + 22, w, y1 - top - 22);
    A.shade += dR(x + w - 18, top, 18, row.base - top);
    let s = kind === 3 ? '' : R(x - 4, top - 8, w + 8, 12, 4, olw(hi, 3));
    if (kind === 0) s += waterTower(x + w * 0.35, top - 4, 0.16, { tint: p.tint, tintK: p.tintK, t });
    else if (kind === 1) s += P(`M${x + w * 0.7} ${top - 4}V${top - 50}`, ln(3.5)) + redLight(x + w * 0.7, top - 53, t + i, p, 3.5);
    else if (kind === 2) s += R(x + 10, top - 22, 30, 16, 3, olw(bc('#C9CED8', p), 3));
    else if (kind === 4 && p.lit > 0.3) s += R(x + 6, top - 34, w - 12, 22, 4, { fill: '#1A1638', stroke: LINE, 'stroke-width': 2.5 }) + TF(['PIZZA', 'HOTEL', 'BANK', 'CAFE'][i & 3], x + w / 2, top - 17, 15, ['#FF5A5A', '#4FE3FF', '#7DFF8A', '#FF7AD8'][i & 3]);
    A.deco += s;
  }
  return V(cam, flushAcc(A, p, 'Far'), row.k);
}
function giantScale(t, cam, opts = {}) {
  cam = cam || {};
  const o = cityOpts({ time: 0.88, ...opts }), p = palAt(o.time, o.dawn);
  let bg = skyPart(t, cam, p, o);
  const hz = (sc, tx, ty) => G(P(FAR2.body, { fill: p.far2 }) + P(FAR1.body, { fill: p.far }) + P(FAR1.win, { fill: 'url(#cityWinFarD)', opacity: f(p.glass * 0.5) }) + (p.lit > 0.01 ? P(FAR1.win, { fill: 'url(#cityWinFarN)', opacity: f(p.lit * 0.7) }) : ''), `translate(${tx} ${ty}) scale(${sc})`);
  const ty = GIANT.horizon - 902 * 0.42;
  bg += V(cam, hz(0.42, -300, ty) + hz(0.42, 1800, ty), 0.2);
  bg += flyFarPart(t, cam, p, o) + skyThings(t, cam, p, o);
  bg += giantRow(cam, GROWS[0], p, t) + giantRow(cam, GROWS[1], p, t);
  // the street the giants stand on
  let st = band(cam, 1, 940, 2000, { fill: p.road }) + band(cam, 1, 936, 948, { fill: p.walk });
  const v = vis(cam, 1);
  st += P(`M${Math.floor((v.x0 - 200) / 120) * 120} 975H${f(v.x1 + 200)}`, { stroke: mix('#FFD84D', p.tint, p.tintK * 0.6), 'stroke-width': 5, 'stroke-dasharray': '40 40' });
  CARS.forEach(([col, dir, sp], i) => { const cx = wrap(rnd(i, 81) * 3800 + dir * sp * 0.6 * t, -900, 2900); st += car(cx, dir > 0 ? 962 : 990, 0.42, { col, flip: dir < 0, lights: p.lit, tint: p.tint, tintK: p.tintK * 0.6 }); });
  for (let i = 0; i < 10; i++) { const px = wrap(rnd(i, 93) * 3800 + (i % 2 ? 60 : -60) * t, -900, 2900); st += tinyPerson(px, 948, 0.55, i, t * 14 + i, 0.6, 0, (c) => mix(c, p.tint, p.tintK * 0.6)); }
  const sh = clamp(o.shadow || 0, 0, 1);
  if (sh > 0) st += Ell(o.shadowX ?? 960, GIANT.ground, 900 * sh, 90 * sh, op('#0A0618', 0.45 * sh));
  bg += V(cam, st, 1);
  const fg = giantRow(cam, GROWS[2], p, t);
  let light = cityLight(t, cam, p, o);
  if (sh > 0) light += V(cam, fullRect(cam, 0, { fill: 'url(#cityDarkDown)', opacity: f(sh * 0.8) }), 0);
  return layers(bg, '', fg, light, { pal: p });
}

// ================================================================ TELEPORT-CHASE LOCATIONS (SC 08)
// Each: (t, cam, opts) → { bg, mid, fg, light }; characters go between mid and fg on the documented floor (k = 1).
// Shared opts: admin 0..1 (the Admin's cold white-gold light washes in), flash 0..1 (teleport arrival white flash).
function chaseLight(cam, o, base = '') {
  let l = base;
  if (o.admin > 0.01) l += V(cam, fullRect(cam, 0, { fill: 'url(#cityAdminWash)', opacity: f(o.admin * 0.8) }), 0);
  if (o.flash > 0.01) l += wash(cam, '#FFFFFF', o.flash);
  return l;
}
function clouds(list, t, col = '#FFFFFF', sh = '#D6ECFF') {
  let d = '', ds = '';
  for (const [x0, y, sc] of list) { const x = wrap(x0 + t * 6 * sc, -700, 2600); d += cloudD(x, y, sc); ds += dRR(x - 96 * sc, y + 12 * sc, 352 * sc, 62 * sc, 31 * sc); }
  return P(ds, { fill: sh }) + P(d, { fill: col });
}
function sunDisk(x, y, r, t, col = '#FFE45C', rayCol = '#FFF3B0', rayOp = 0.18) {
  return rays(x, y, 16, r * 3.6, rayCol, rayOp, t * 4) + Ci(x, y, r * 1.85, op('#FFF6C8', 0.16)) + Ci(x, y, r * 1.38, op('#FFF6C8', 0.24)) + Ci(x, y, r, { fill: col }) + Ci(x - r * 0.3, y - r * 0.3, r * 0.3, op('#FFFFFF', 0.45));
}
function puffs(x0, x1, y, r, seed, t = 0, drift = 0) {
  let d = '';
  for (let x = x0, i = 0; x < x1; i++) { const rr = r * (0.7 + rnd(i, seed) * 0.6); d += dC(x + Math.sin(t * 0.4 + i) * drift, y - rr * 0.35 + rnd(i, seed + 1) * r * 0.3, rr); x += rr * 1.3; }
  return d;
}

// ---------------------------------------------------------------- desert(t, cam, opts)
const DESERT = { floor: 905, stand: { x0: 560, x1: 1360 }, k: 1 };
function saguaro(x, base, s, flower = true, sway = 0) {
  const c = '#4DB35C', sh = '#348A46', hi = '#94E37E';
  const arm = (side, y, len, up) => { const d = `M${side * 22} ${-y}H${side * (22 + len)}V${-y - up}`; return P(d, ln(64, LINE)) + P(d, ln(50, c)) + P(`M${side * (22 + len) - side * 8} ${-y - 10}V${-y - up + 8}`, ln(7, hi, 0.7)); };
  let o = arm(-1, 120, 50, 96) + arm(1, 176, 46, 72);
  o += R(-36, -300, 72, 306, 36, olw(c, 6)) + P('M-12 -276V-20M12 -276V-20', ln(4, sh, 0.7)) + R(-26, -282, 10, 250, 5, op(hi, 0.75));
  let sp = '';
  for (let i = 0; i < 9; i++) sp += `M${i % 2 ? 34 : -34} ${-40 - i * 28}l${i % 2 ? 8 : -8} -4`;
  o += P(sp, ln(3, '#FFF6D8'));
  if (flower) o += P(dC(-8, -306, 13) + dC(8, -306, 13) + dC(0, -318, 13), olw('#FF6FB5', 4)) + Ci(0, -309, 6, { fill: '#FFE14D' });
  return G(o, `${tf(x, base, s)} rotate(${f(sway)})`);
}
function tumbleweed(x, y, r, rot) {
  let o = Ci(0, 0, r, { fill: '#D9B47A', opacity: 0.5, stroke: '#7A5A30', 'stroke-width': 6 });
  o += P(`M${-r * 0.8} 0Q0 ${-r * 1.1} ${r * 0.8} 0Q0 ${r * 1.1} ${-r * 0.8} 0M0 ${-r * 0.85}Q${r * 1.1} 0 0 ${r * 0.85}Q${-r * 1.1} 0 0 ${-r * 0.85}M${-r * 0.5} ${-r * 0.5}L${r * 0.5} ${r * 0.5}`, ln(4, '#8A6A3E'));
  return G(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`);
}
function rock(x, base, s, c = '#D9825A', sh = '#B5623E', hi = '#F2A57A') {
  return G(P(rp([[-90, 0], [-80, -56], [-30, -92], [40, -86], [86, -48], [94, 0]], 24), olw(c, 6)) + P(rp([[-90, 0], [-80, -56], [-42, -84], [-46, -26], [-20, 0]], 16), op(sh, 0.6)) + P('M-22 -80L34 -76', ln(8, hi)), tf(x, base, s));
}
function desert(t, cam, opts = {}) {
  cam = cam || {};
  const o = { heat: 1, tumble: true, admin: 0, flash: 0, ...opts };
  const g = vgrad([[0, '#2C86F5'], [0.45, '#6CC0FF'], [0.78, '#BFE6FF'], [1, '#FFE6B0']]);
  let bg = V(cam, g.def + fullRect(cam, 0, { fill: g.url }), 0);
  bg += V(cam, sunDisk(1540, 200, 92, t), 0.03);
  bg += V(cam, clouds([[260, 130, 0.75], [1020, 90, 0.55], [-400, 160, 0.8]], t, '#FFFFFF', '#FFE6C8'), 0.06);
  const mesa = 'M-900 770L-700 770L-660 610Q-650 592 -630 592L-380 592Q-360 592 -352 610L-300 770L120 770L150 668Q156 654 172 654L330 654Q344 654 350 668L392 770L1290 770L1334 566Q1342 550 1362 550L1700 550Q1720 550 1728 566L1784 770L2900 770V1300H-900Z';
  let m = P(mesa, { fill: '#E5A07E' }) + P('M-660 610Q-650 592 -630 592L-560 592L-600 770H-700Z M150 668Q156 654 172 654L210 654L190 770H120Z M1334 566Q1342 550 1362 550L1440 550L1400 770H1290Z', op('#C47A68', 0.6)) + P('M-640 600H-370M170 662H330M1360 558H1710', ln(6, '#F7C29E'));
  bg += V(cam, m, 0.12);
  if (o.heat > 0) {
    let hd = '';
    for (let i = 0; i < 8; i++) {
      const u = (t * 0.35 + rnd(i, 121)) % 1, x = rnd(i, 122) * 1900, y = 800 + rnd(i, 123) * 90 - u * 90, a = Math.sin(u * Math.PI);
      hd += P(`M${f(x)} ${f(y)}q10 -8 20 0t20 0t20 0`, { ...ln(4, '#FFFFFF', 0.35 * a * o.heat), fill: 'none' });
    }
    bg += V(cam, hd, 0.45);
  }
  const d1 = 'M-900 812Q-500 700 -100 770Q300 832 700 742Q1100 664 1500 752Q1900 832 2300 732Q2700 664 3100 750V1400H-900Z';
  bg += V(cam, P(d1, { fill: '#F2C27A' }) + P(d1, { fill: 'url(#citySand)' }) + P('M-500 742Q-300 712 -100 770M1100 676Q1300 690 1500 752M2300 732Q2500 690 2700 678', ln(7, '#FFE2A8', 0.8)), 0.3);
  const d2 = 'M-900 880Q-400 770 100 846Q500 908 900 826Q1300 764 1700 836Q2100 906 2700 806V1400H-900Z';
  bg += V(cam, P(d2, olw('#F6B45A', 5)) + P(d2, { fill: 'url(#citySand)' }) + P('M100 846Q500 908 900 826Q700 880 420 870Q260 862 100 846Z M1700 836Q2100 906 2700 806Q2300 880 2000 878Q1840 870 1700 836Z', op('#E39A44', 0.5)) + rock(-140, 852, 0.7, '#D9825A') + saguaro(1250, 820, 0.42, false, 2), 0.6);
  const grd = 'M-1300 905Q-300 878 400 898Q960 916 1520 898Q2200 878 3300 905V2300H-1300Z';
  let gr = P(grd, olw('#F9C46B', 6)) + P(grd, { fill: 'url(#citySand)' }) + P('M-200 960Q300 990 700 980M1300 1000Q1700 990 2100 960', ln(8, '#E8A750', 0.6));
  gr += saguaro(330, 918, 1.12, true, Math.sin(t * 0.8) * 0.8) + saguaro(1660, 912, 0.7, false, Math.sin(t * 0.8 + 1) * 0.8) + rock(150, 924, 0.8) + rock(1820, 918, 0.65);
  gr += G(R(-26, -40, 52, 44, 20, olw('#5CC46A', 5)) + P('M-10 -36V0M10 -36V0', ln(3, '#348A46')) + P(dC(0, -44, 8), olw('#FFD24F', 3)), 'translate(1480 916)');
  if (o.tumble) { const tx = wrap(t * 240, -400, 2400); gr += tumbleweed(tx, 880 - Math.abs(Math.sin(t * 4)) * 34, 34, t * 280); }
  const mid = V(cam, gr, 1);
  const fg = V(cam, P('M-500 1200L-500 1010Q-200 990 120 1040Q260 1070 300 1200Z M2420 1200V1000Q2100 990 1840 1050Q1720 1080 1700 1200Z', olw('#F2AE52', 6)) + P('M-200 1004Q-60 998 120 1040M2100 996Q1960 1000 1840 1050', ln(7, '#FFD98A', 0.8)) + P('M60 1036l10 -40l8 34l12 -46l8 46l12 -30l6 36Z M1880 1040l12 -36l8 30l10 -44l8 44l12 -30l6 36Z', olw('#7BBF4E', 4)), 1.3);
  return layers(bg, mid, fg, chaseLight(cam, o, wash(cam, '#FFB347', 0.05)));
}

// ---------------------------------------------------------------- island(t, cam, opts)
const ISLAND = { floor: 858, stand: { x0: 840, x1: 1260 }, palm: { x: 790, y: 864, top: { x: 650, y: 470 } }, horizon: 560, k: 1 };
function island(t, cam, opts = {}) {
  cam = cam || {};
  const o = { shark: false, admin: 0, flash: 0, ...opts };
  const g = vgrad([[0, '#1C7CF2'], [0.5, '#4BAEFF'], [0.85, '#97D7FF'], [1, '#DDF6FF']]);
  let bg = V(cam, g.def + fullRect(cam, 0, { fill: g.url }), 0) + V(cam, sunDisk(1580, 170, 80, t), 0.03);
  bg += V(cam, clouds([[260, 170, 0.95], [1130, 120, 0.7], [-500, 140, 0.8]], t), 0.06);
  let gulls = '';
  for (let i = 0; i < 3; i++) { const x = wrap(300 + i * 500 + t * (30 + i * 8), -200, 2200), y = 300 + i * 50 + Math.sin(t * 1.5 + i) * 12, fl = Math.sin(t * 7 + i * 2) * 8; gulls += `M${f(x - 26)} ${f(y - fl)}Q${f(x - 12)} ${f(y - 14)} ${f(x)} ${y}Q${f(x + 12)} ${f(y - 14)} ${f(x + 26)} ${f(y - fl)}`; }
  bg += V(cam, P(gulls, { ...ln(6, '#FFFFFF'), fill: 'none' }), 0.2);
  let sea = band(cam, 0.1, ISLAND.horizon, 2600, { fill: 'url(#cityOcean)' }) + band(cam, 0.1, ISLAND.horizon - 3, ISLAND.horizon + 7, op('#D8F4FF', 0.9));
  sea += G(P('M-20 0L20 0L14 12H-14Z', olw('#FFFFFF', 3)) + P('M0 -2V-46L24 -6Z', olw('#FF8A5A', 3)), `translate(${f(260 + Math.sin(t * 0.2) * 30)} ${ISLAND.horizon - 2}) scale(0.9)`);
  bg += V(cam, sea, 0.1);
  bg += V(cam, G(band(cam, 0.35, 600, 2600, { fill: 'url(#cityWaves)', opacity: 0.55 }), `translate(${f((t * 18) % 220)} 0)`), 0.35);
  let gl = '';
  for (let i = 0; i < 9; i++) { const x = rnd(i, 131) * 1900, y = 600 + rnd(i, 132) * 380, r = (4 + 6 * Math.max(0, Math.sin(t * 3 + i * 2))); gl += `M${f(x)} ${f(y - r)}L${f(x + r * 0.3)} ${f(y)}L${f(x)} ${f(y + r)}L${f(x - r * 0.3)} ${f(y)}Z`; }
  bg += V(cam, P(gl, op('#FFFFFF', 0.85)), 0.4);
  // the island
  let is = Ell(965, 905, 570, 78, { fill: 'url(#cityShallow)', opacity: 0.95 });
  is += Ell(965, 905, 512 + Math.sin(t * 1.6) * 10, 62 + Math.sin(t * 1.6) * 3, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 9, opacity: 0.85 }) + Ell(965, 907, 552 + Math.sin(t * 1.6 + 2) * 10, 72, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4, opacity: 0.45 });
  if (o.shark) { const a = t * 0.45, sx = 965 + Math.cos(a) * 640, sy = 940 + Math.sin(a) * 70; if (Math.sin(a) > -0.2) is += G(P('M-26 0Q-4 -10 6 -54Q14 -20 30 0Z', olw('#5A6A88', 4)) + P('M-60 4Q-30 -4 0 4Q30 12 60 4', ln(5, '#FFFFFF', 0.8)), `translate(${f(sx)} ${f(sy)}) scale(${Math.cos(a) > 0 ? -1 : 1} 1)`); }
  const sand = 'M500 902Q540 862 650 856H1290Q1400 862 1430 902Q965 950 500 902Z';
  is += P(sand, olw('#F7D892', 6)) + P('M516 900Q965 948 1414 900Q965 928 516 900Z', { fill: '#E0B26A' }) + P('M560 878Q600 864 660 862H1280', ln(6, '#FFF0C0', 0.9));
  is += Ell(700, 884, 90, 10, op('#C9964A', 0.45)) + P('M600 872l8 -26l6 22l8 -30l6 30l8 -20l4 24Z M1330 876l7 -22l6 18l7 -26l6 26l7 -16l3 20Z', olw('#5CC46A', 3.5));
  is += G(P('M-16 0L-5 -6L0 -18L5 -6L16 0L5 5L8 16L0 9L-8 16L-5 5Z', olw('#FF7A8A', 3)), 'translate(1190 884) scale(1.3)') + P('M1100 896q-12 -22 6 -28q16 -2 16 18Z', olw('#FFE0E8', 3));
  const cx = 1262 + Math.sin(t * 2) * 12;
  is += G(R(-16, -14, 32, 18, 8, olw('#FF7A3A', 3)) + P('M-14 -10l-10 -10M14 -10l10 -10M-10 4l-8 6M10 4l8 6', ln(3.5, '#151515')) + P(dC(-6, -16, 3) + dC(6, -16, 3), { fill: '#151515' }), `translate(${f(cx)} 870)`);
  // palm tree
  const { x: px, y: py, top: pt } = ISLAND.palm, sw = Math.sin(t * 0.9) * 4;
  const trunk = `M${px} ${py}Q${px - 20} ${(py + pt.y) / 2 + 60} ${pt.x + sw} ${pt.y}`;
  let rings = '';
  for (let i = 1; i < 10; i++) { const u = i / 10, x = (1 - u) * (1 - u) * px + 2 * (1 - u) * u * (px - 20) + u * u * (pt.x + sw), y = (1 - u) * (1 - u) * py + 2 * (1 - u) * u * ((py + pt.y) / 2 + 60) + u * u * pt.y; rings += `M${f(x - 15)} ${f(y + 4)}q15 8 30 0`; }
  is += P(trunk, ln(40, LINE)) + P(trunk, ln(30, '#C08A52')) + P(rings, ln(4, '#8A5A30'));
  let fronds = '', ribs = '';
  [[-200, 70], [-170, -10], [-80, -70], [30, -78], [140, -36], [205, 46], [60, 96], [-90, 100]].forEach(([ex0, ey0], i) => {
    const ex = ex0, ey = ey0 + Math.sin(t * 1.2 + i) * 7, nx = -ey * 0.22, ny = ex * 0.22;
    fronds += `M0 0Q${f(ex * 0.45 + nx - 10)} ${f(ey * 0.45 + ny - 46)} ${f(ex)} ${f(ey)}Q${f(ex * 0.55 - nx)} ${f(ey * 0.55 - ny + 18)} 0 6Z`;
    ribs += `M0 0Q${f(ex * 0.48)} ${f(ey * 0.48 - 22)} ${f(ex * 0.92)} ${f(ey * 0.92)}`;
  });
  is += G(P(fronds, olw('#3EBB5A', 5)) + P(ribs, { ...ln(4, '#26944A'), fill: 'none' }) + P(dC(-16, 14, 16) + dC(14, 16, 16) + dC(-1, 30, 15), olw('#8A5A2E', 4)) + P(dC(-20, 9, 4) + dC(10, 11, 4), op('#FFFFFF', 0.35)), `translate(${f(pt.x + sw)} ${pt.y}) rotate(${f(sw * 0.8)})`);
  const mid = V(cam, is, 1);
  const fgW = 'M-600 1300V1048Q-300 1022 0 1046T600 1046T1200 1046T1800 1046T2400 1046V1300Z';
  const fg = V(cam, G(P(fgW, { fill: '#2C9FE6' }) + P('M-600 1048Q-300 1022 0 1046T600 1046T1200 1046T1800 1046T2400 1046', ln(8, '#FFFFFF', 0.85)), `translate(${f(Math.sin(t * 0.9) * 40)} ${f(Math.sin(t * 1.3) * 6)})`), 1.25);
  return layers(bg, mid, fg, chaseLight(cam, o));
}

// ---------------------------------------------------------------- mountain(t, cam, opts)
const MOUNTAIN = { floor: 640, stand: { x0: 720, x1: 1200 }, flag: { x: 1236, y: 644 }, k: 1 };
function mountain(t, cam, opts = {}) {
  cam = cam || {};
  const o = { flag: true, snow: 0.6, admin: 0, flash: 0, ...opts };
  const g = vgrad([[0, '#0E3590'], [0.4, '#2A66D8'], [0.75, '#62A6FF'], [1, '#CFE8FF']]);
  let bg = V(cam, g.def + fullRect(cam, 0, { fill: g.url }), 0) + V(cam, sunDisk(330, 170, 70, t, '#FFF6C0', '#FFFFFF', 0.12), 0.03);
  const peaks = 'M-700 880L-420 590L-330 650L-180 540L80 880Z M300 880L520 650L740 880Z M1380 880L1620 580L1700 640L1830 520L2140 880Z M2160 880L2400 650L2640 880Z';
  const caps = 'M-232 594L-180 540L-130 594L-158 584L-180 600L-204 584Z M-470 642L-420 590L-372 634L-392 630L-414 646Z M480 692L520 650L560 692L536 686L520 700L502 686Z M1784 568L1830 520L1878 570L1852 562L1830 578L1808 562Z M1576 626L1620 580L1660 620L1640 616L1620 632Z M2356 696L2400 650L2442 694L2420 688L2400 704L2380 688Z';
  bg += V(cam, P(peaks, { fill: '#8EA4D6' }) + P(caps, { fill: '#F2F6FF' }) + P('M-180 540L80 880H-60Z M1830 520L2140 880H1990Z M1620 580L1700 640L1660 880Z', op('#6E84BC', 0.5)), 0.12);
  let cs = band(cam, 0.3, 820, 2400, { fill: '#F2F7FF' });
  cs += P(puffs(-900, 3000, 830, 60, 21, t, 6), { fill: '#D5E2F7' }) + P(puffs(-900, 3000, 816, 60, 21, t, 6), { fill: '#F7FAFF' });
  bg += V(cam, cs, 0.3);
  const body = 'M-500 1400L-200 1100L60 1010L240 910L420 852L560 764L700 652Q712 636 730 636L1190 636Q1208 636 1220 652L1360 764L1480 824L1640 904L1800 966L2100 1110L2500 1400Z';
  let mt = P(body, olw('#7C86AC', 6));
  mt += P('M1220 652L1360 764L1480 824L1640 904L1800 966L2100 1110L2500 1400H1500Q1400 1100 1250 900Q1150 780 1100 700Z', op('#5A6390', 0.55));
  mt += P('M300 960L420 900M140 1060L320 990M1500 900L1620 960M1700 1040L1860 1090M900 1000L1000 960L1120 990', ln(5, '#5A6390', 0.7));
  const rocks = rp([[280, 950], [320, 860], [372, 842], [420, 880], [452, 950]], 10) + rp([[1480, 920], [1520, 826], [1584, 814], [1630, 870], [1650, 930]], 10) + rp([[120, 1040], [176, 960], [226, 976], [272, 1050]], 8) + rp([[1760, 1010], [1806, 920], [1866, 914], [1910, 1000]], 8) + rp([[880, 900], [920, 840], [980, 832], [1010, 890]], 8);
  mt += P(rocks, olw('#5E6890', 5)) + P('M330 856L372 842L398 860M1530 822L1584 814L1612 834M186 958L226 976M1812 920L1866 914M926 838L980 832', { ...ln(9, '#FFFFFF'), fill: 'none' }) + P('M300 930L340 870M1500 910L1530 840M900 890L924 846', ln(5, '#4A5378', 0.7));
  const snow = 'M560 764L700 652Q712 636 730 636L1190 636Q1208 636 1220 652L1360 764Q1330 780 1300 760Q1276 806 1236 774Q1200 822 1150 784Q1100 830 1040 790Q990 826 950 788Q900 820 856 782Q810 812 776 776Q730 800 704 770Q660 790 630 766Q596 784 560 764Z';
  mt += P(snow, olw('#FFFFFF', 6)) + P('M1110 640L1190 636Q1208 636 1220 652L1360 764Q1330 780 1300 760Q1276 806 1236 774Q1200 822 1150 784Q1120 700 1110 640Z', op('#D4E2F5', 0.9));
  mt += P('M716 646Q730 640 760 640H1180', ln(7, '#FFFFFF')) + P('M740 664Q900 680 1100 664', ln(4, '#BFD3F0', 0.8));
  if (o.flag) {
    const F = MOUNTAIN.flag, wv = Math.sin(t * 6) * 8;
    mt += P(`M${F.x} ${F.y}V${F.y - 150}`, ln(7)) + P(`M${F.x} ${F.y}V${F.y - 150}`, ln(3, '#E8EEF8')) + P(`M${F.x + 2} ${F.y - 148}Q${F.x + 40} ${F.y - 148 + wv} ${F.x + 84} ${F.y - 140 - wv * 0.5}L${F.x + 80} ${F.y - 100 - wv * 0.5}Q${F.x + 40} ${F.y - 108 + wv} ${F.x + 2} ${F.y - 104}Z`, olw('#E8453C', 4));
    mt += Ell(F.x, F.y + 2, 26, 7, op('#BFD3F0', 0.9));
  }
  const mid = V(cam, mt, 1);
  let fgc = P(puffs(-900, 3000, 1010, 80, 41, t, 18), { fill: '#D8E6FA' }) + P(puffs(-900, 3000, 994, 80, 41, t, 18), { fill: '#FFFFFF' }) + band(cam, 1.15, 1010, 2400, { fill: '#FFFFFF' });
  let fg = V(cam, G(fgc, `translate(${f(Math.sin(t * 0.2) * 60)} 0)`), 1.15);
  if (o.snow > 0) {
    let sd = '';
    const n = Math.round(30 * o.snow);
    for (let i = 0; i < n; i++) { const x = wrap(rnd(i, 141) * 2400 - t * (220 + rnd(i, 142) * 160), -240, 2160), y = wrap(rnd(i, 143) * 1200 + t * (40 + rnd(i, 144) * 50) + Math.sin(t * 2 + i) * 20, -60, 1140); sd += dC(x, y, 3 + rnd(i, 145) * 4); }
    fg += V(cam, P(sd, op('#FFFFFF', 0.85)), 1.1);
  }
  return layers(bg, mid, fg, chaseLight(cam, o, wash(cam, '#BFE0FF', 0.05)));
}

// ================================================================ SERVER ROOM (SC 09, SC 10)
// serverRoom(t, cam, opts) → { bg, mid, fg, light }: bg = room + chair back/seat; mid = chair arms + knitted blanket (in front
// of whoever sits in the chair); fg = foreground cables; light = amber lamp light (+ green glow).
// Layering: L.bg + [old man in the chair] + L.mid + [hero, standing on SERVER.floor] + L.fg + L.light
const SERVER = {
  floor: 960, wall: { y0: 20, y1: 770 },
  desk: { top: 672, x0: 380, x1: 1560 }, keyboard: { x: 1010, y: 660 },
  chair: { x: 480, seat: 738, back: 432, s: 0.3 },
  screen: { x: 682, y: 182, w: 556, h: 350 }, header: { x: 960, y: 92 },
  crown: { x: 1834, y: 356 }, cloak: { x: 1764, y: 330 }, catBed: { x: 1590, y: 966 }, mugs: [{ x: 1252, y: 672 }, { x: 1318, y: 672 }], lamp: { x: 84, y: 330 },
  monitors: [
    { x: 30, y: 140, w: 260, h: 190, style: 'cream', kind: 'fly' }, { x: 20, y: 362, w: 262, h: 200, style: 'beige', kind: 'traffic' },
    { x: 330, y: 160, w: 300, h: 214, style: 'grey', kind: 'city' }, { x: 1282, y: 176, w: 300, h: 214, style: 'dark', kind: 'snow' },
    { x: 1290, y: 408, w: 320, h: 230, style: 'wood', kind: 'beach' }, { x: 1636, y: 132, w: 256, h: 192, style: 'grey', kind: 'desert' },
  ],
};
// live screen content in local coords (0..w, 0..h)
function liveScreen(kind, w, h, t) {
  let o = '';
  if (kind === 'city') {
    o += thumb('night', 0, 0, w, h);
    const bx = w * 0.42, by = h * 0.44;
    const u = Math.min(w, h * 1.6) * 0.01, sw = Math.sin(t * 2) * 2;
    o += R(bx, by, w * 0.14, h * 0.72, 0, { fill: '#3A3880' }) + P(`M${f(bx + w * 0.11)} ${f(by - u)}q${f(9 * u)} ${f(-2 * u + sw)} ${f(7 * u)} ${f(-10 * u)}`, { ...ln(2.6 * u, '#FF9A3A'), fill: 'none' });
    o += P(`${dRR(bx + 1.5 * u, by - 12 * u, 10 * u, 12.5 * u, 4 * u)}${dRR(bx + 0.5 * u, by - 20 * u, 8 * u, 8 * u, 3 * u)}M${f(bx + 0.8 * u)} ${f(by - 18 * u)}l${f(1 * u)} ${f(-4.5 * u)}l${f(2.6 * u)} ${f(3.5 * u)}ZM${f(bx + 8.2 * u)} ${f(by - 18 * u)}l${f(-1 * u)} ${f(-4.5 * u)}l${f(-2.6 * u)} ${f(3.5 * u)}Z`, { fill: '#FF9A3A' });
    o += R(w * 0.66, h * 0.12 + Math.sin(t * 2) * 3, w * 0.24, h * 0.16, 3, { fill: '#C9CED8' }) + R(w * 0.66, h * 0.12 + Math.sin(t * 2) * 3, w * 0.24, h * 0.05, 2, { fill: '#5A6478' });
    let fl = '';
    for (let i = 0; i < 5; i++) fl += dC(wrap(w * rnd(i, 151) + t * 12, 0, w), h * (0.2 + rnd(i, 152) * 0.4) + Math.sin(t * 3 + i) * 4, 3);
    o += P(fl, { fill: '#FFD45A' });
  } else if (kind === 'traffic') {
    o += thumb('day', 0, 0, w, h * 0.78) + R(0, h * 0.78, w, h * 0.22, 0, { fill: '#4A4E60' }) + P(`M0 ${f(h * 0.89)}H${w}`, { stroke: '#FFD84D', 'stroke-width': 3, 'stroke-dasharray': '14 12' });
    for (let i = 0; i < 4; i++) { const cx = wrap(i * w * 0.3 + t * (60 + i * 15) * (i % 2 ? -1 : 1), -30, w + 30); o += R(cx - 14, h * (i % 2 ? 0.9 : 0.8), 28, 11, 4, { fill: SHIRTS[i] }); }
  } else if (kind === 'snow') {
    o += thumb('snow', 0, 0, w, h);
    let sd = '';
    for (let i = 0; i < 18; i++) sd += dC(wrap(rnd(i, 161) * w + Math.sin(t + i) * 8, 0, w), wrap(rnd(i, 162) * h + t * 30, 0, h), 2.2);
    o += P(sd, { fill: '#FFFFFF' });
  } else if (kind === 'beach') {
    o += thumb('beach', 0, 0, w, h);
    o += P(`M0 ${f(h * 0.62)}` + Array.from({ length: 8 }, (_, j) => `q${f(w / 16)} ${f(Math.sin(t * 3 + j) * 4)} ${f(w / 8)} 0`).join(''), ln(3, '#FFFFFF', 0.8));
  } else if (kind === 'fly') {
    o += thumb('park', 0, 0, w, h);
    let pp = '';
    for (let i = 0; i < 6; i++) { const x = w * (0.1 + i * 0.15), y = h * (0.25 + rnd(i, 171) * 0.3) + Math.sin(t * 2 + i) * 6; pp += dR(x - 3, y - 4, 6, 9) + dC(x, y - 8, 3.5); }
    o += P(pp, { fill: '#FF6B6B' });
  } else if (kind === 'desert') {
    o += thumb('desert', 0, 0, w, h);
    const tx = wrap(t * 30, -20, w + 20);
    o += Ci(tx, h * 0.8 - Math.abs(Math.sin(t * 4)) * 8, 7, { fill: 'none', stroke: '#8A6A3E', 'stroke-width': 3 });
  } else o += thumb(kind, 0, 0, w, h);
  return o;
}
// a CRT monitor with clipped content (local svg in 0..sw x 0..sh), scanlines, glare, green tint
function crt(x, y, w, h, style, content, green = 0) {
  const hs = monHousing(x, y, w, h, style), id = S.uid('citySc');
  let o = hs.o + S.clipDef(id, R(hs.sx, hs.sy, hs.sw, hs.sh, 8)) + R(hs.sx, hs.sy, hs.sw, hs.sh, 8, { fill: '#000' });
  o += G(G(content, `translate(${f(hs.sx)} ${f(hs.sy)})`) + (green > 0.01 ? R(hs.sx, hs.sy, hs.sw, hs.sh, 0, op('#2AFF6A', 0.32 * green)) : '') + R(hs.sx, hs.sy, hs.sw, hs.sh, 0, { fill: 'url(#cityScan)' }), null, { 'clip-path': `url(#${id})` });
  o += P(`M${f(hs.sx + 10)} ${f(hs.sy + hs.sh - 10)}L${f(hs.sx + hs.sw * 0.38)} ${f(hs.sy + 10)}L${f(hs.sx + hs.sw * 0.5)} ${f(hs.sy + 10)}L${f(hs.sx + 34)} ${f(hs.sy + hs.sh - 10)}Z`, op('#FFFFFF', 0.1));
  o += R(hs.sx, hs.sy, hs.sw, hs.sh, 8, { fill: 'none', stroke: LINE, 'stroke-width': 4 });
  return o;
}
// the log view for the main screen: lines = array of strings (the newest at the bottom), colour amber → green
function logScreen(w, h, logs, t, green, title) {
  const fg = mix('#FFC266', '#8CFFA8', green), dim = mix('#7A4E1E', '#2E7A44', green);
  let o = R(0, 0, w, h, 0, { fill: mix('#1A0E06', '#04140A', green) });
  o += TF(esc(title || 'ADMIN LOG — user: you'), 22, 40, 26, fg, { 'text-anchor': 'start', 'letter-spacing': 1 }) + P(`M18 54H${w - 18}`, ln(3, dim));
  const n = Math.max(1, Math.floor((h - 76) / 36)), shown = logs.slice(-n);
  shown.forEach((l, i) => {
    const last = i === shown.length - 1, y = 92 + i * 36;
    if (last) o += R(14, y - 27, w - 28, 36, 6, op(fg, 0.16));
    o += TF(esc('> ' + l) + (last ? `<tspan fill-opacity="${Math.floor(t * 2.5) % 2 === 0 ? 1 : 0}">_</tspan>` : ''), 24, y, 27, last ? mix(fg, '#FFFFFF', 0.4) : fg, { 'text-anchor': 'start' });
  });
  return o;
}
function serverRoom(t, cam, opts = {}) {
  cam = cam || {};
  const o = { logs: null, green: 0, lamp: 1, crown: true, cloak: true, screens: [], steam: true, players: '8,000,000,000', logTitle: null, mainScreen: null, ...opts };
  const gk = clamp(o.green, 0, 1), amber = mix('#FFB347', '#8CFFA8', gk);
  const v = vis(cam, 1);
  let b = band(cam, 1, -500, 900, { fill: '#2E1E26' });
  // wall of old monitors (pattern) + live scan band + flicker
  b += G(R(-660, 0, 3240, SERVER.wall.y1 - SERVER.wall.y0, 0, { fill: 'url(#cityMonA)' }) + (gk > 0.01 ? R(-660, 0, 3240, SERVER.wall.y1 - SERVER.wall.y0, 0, { fill: 'url(#cityMonG)', opacity: f(gk) }) : ''), `translate(0 ${SERVER.wall.y0})`);
  b += R(-660, SERVER.wall.y0, 3240, 750, 0, op('#1A0C10', 0.3));
  let fl = '';
  const fr = Math.floor(t * 5);
  for (let i = 0; i < 6; i++) { const cx = Math.floor(rnd(fr * 7 + i, 181) * 9) * 220 - 220, cy = SERVER.wall.y0 + Math.floor(rnd(fr * 3 + i, 182) * 5) * 150; fl += dR(cx + 14, cy + 14, 150, 100); }
  b += P(fl, op(gk > 0.5 ? '#9CFFB0' : '#FFFFFF', 0.06)) + R(-660, SERVER.wall.y0 + ((t * 140) % 760) - 40, 3240, 50, 0, op(gk > 0.5 ? '#9CFFB0' : '#FFE2B0', 0.05));
  // ceiling beam + cables
  b += band(cam, 1, -500, 26, { fill: '#2A1A1E' }) + band(cam, 1, 4, 30, { fill: '#6A4632' }) + band(cam, 1, 28, 33, { fill: LINE });
  b += P('M-200 30Q200 90 420 30M1500 30Q1700 110 2100 30M600 30Q760 70 900 30', { ...ln(10, '#1E1418'), fill: 'none' });
  // header screen
  const H0 = SERVER.header;
  let hd = R(-430, -66, 860, 132, 20, olw('#3A3236', 7)) + R(-412, -52, 824, 104, 12, { fill: mix('#1A0E06', '#04140A', gk) }) + R(-412, -52, 824, 104, 12, { fill: 'url(#cityScan)' });
  hd += T('REAL LIFE SERVER', 0, -4, 50, amber, { 'letter-spacing': 3 }) + TF(esc(`Players: ${o.players}`), 0, 38, 32, mix(amber, '#FFFFFF', 0.25));
  hd += Ci(-360, -20, 9, { fill: blink(t, 1.4) ? '#FF4A4A' : '#5A1A1A' }) + TF('LIVE', -322, -12, 22, '#FF6A6A', { 'text-anchor': 'start' });
  hd += P('M-300 -66V-100M300 -66V-100', ln(6, '#1E1418'));
  b += G(hd, `translate(${H0.x} ${H0.y})`);
  // detailed live monitors
  SERVER.monitors.forEach((m, i) => { if (m.x + m.w > v.x0 - 40 && m.x < v.x1 + 40) b += crt(m.x, m.y, m.w, m.h, m.style, o.screens[i] || liveScreen(m.kind, m.w - 24, m.h - 40, t + i), gk); });
  // main monitor
  const scr = SERVER.screen;
  const main = o.mainScreen || (o.logs ? logScreen(scr.w, scr.h, o.logs, t, gk, o.logTitle) : liveScreen('city', scr.w, scr.h, t));
  b += R(SERVER.screen.x + 220, 540, 116, 50, 6, olw('#B9AC8C', 5)) + crt(670, 170, 580, 390, 'cream', main, o.logs ? 0 : gk);
  // desk + things on it
  const D = SERVER.desk;
  b += R(D.x0 + 20, D.top + 26, D.x1 - D.x0 - 40, 900 - D.top - 26, 0, olw('#7A4A30', 6)) + R(640, D.top + 30, 660, 900 - D.top - 30, 0, { fill: '#1E1216' });
  for (const dx of [420, 1320]) for (const dy of [722, 806]) b += R(dx, dy, 200, 74, 8, olw('#8A5636', 5)) + R(dx + 80, dy + 30, 40, 12, 6, olw('#E8C070', 3));
  b += R(D.x0, D.top, D.x1 - D.x0, 32, 10, olw('#A86A42', 6)) + R(D.x0 + 12, D.top + 4, D.x1 - D.x0 - 24, 8, 4, op('#FFFFFF', 0.15));
  b += P('M260 770C220 860 300 900 240 960M1700 700C1760 820 1660 880 1720 960M1560 760C1600 860 1520 900 1560 960', { ...ln(12, '#1E1418'), fill: 'none' });
  // keyboard + mouse
  const KB = SERVER.keyboard;
  b += R(KB.x - 136, KB.y - 16, 272, 30, 8, olw('#E6DCC4', 4)) + R(KB.x - 128, KB.y - 13, 256, 20, 4, { fill: 'url(#cityKeys)' });
  b += Ell(KB.x + 176, KB.y + 2, 20, 12, olw('#E6DCC4', 4));
  // desk lamp (amber) bending over the keyboard
  if (o.lamp > 0.05) b += P('M812 618L862 604L960 668H800Z', { fill: 'url(#cityLampCone)', opacity: f(0.8 * o.lamp) });
  b += Ell(784, D.top - 2, 34, 8, olw('#5A4A3A', 4)) + P('M784 664L770 600L820 572', { ...ln(9), fill: 'none' }) + P('M784 664L770 600L820 572', { ...ln(4.5, '#C9A060'), fill: 'none' });
  b += G(P('M-34 -8L34 -8L24 32H-24Z', olw('#E89A3A', 4.5)) + Ell(0, 32, 24, 6, { fill: o.lamp > 0.3 ? '#FFF2C0' : '#C9A060', stroke: LINE, 'stroke-width': 3 }), 'translate(832 580) rotate(-38)');
  // mugs + teapot + printout
  SERVER.mugs.forEach((m, i) => {
    b += P(`M${m.x + 20} ${m.y - 34}q20 2 18 16q-2 12 -18 12`, { ...ln(11), fill: 'none' }) + P(`M${m.x + 20} ${m.y - 34}q20 2 18 16q-2 12 -18 12`, { ...ln(5, i ? '#7FB2F0' : '#F29A7E'), fill: 'none' });
    b += R(m.x - 24, m.y - 46, 48, 46, 9, olw(i ? '#7FB2F0' : '#F29A7E', 4)) + Ell(m.x, m.y - 44, 20, 5, { fill: '#B9773E' }) + (i ? '' : P(`M${m.x - 8} ${m.y - 26}h16`, ln(4, '#FFFFFF', 0.7)));
    if (o.steam) { let st = ''; for (let j = 0; j < 2; j++) { const u = (t * 0.5 + j * 0.5 + i * 0.25) % 1; st += `M${m.x - 6 + j * 12} ${f(m.y - 54 - u * 60)}q${f(8 + Math.sin(t * 2 + j) * 4)} -10 0 -20q-8 -10 0 -20`; } b += P(st, { ...ln(5, '#FFFFFF', 0.35), fill: 'none' }); }
  });
  b += G(P('M-48 0Q-56 -50 0 -54Q56 -50 48 0Z', olw('#F2EAD8', 5)) + P('M44 -28Q78 -40 80 -62', ln(10)) + P('M44 -28Q78 -40 80 -62', ln(5, '#F2EAD8')) + P('M-44 -36Q-78 -30 -60 -6', { ...ln(9), fill: 'none' }) + Ell(0, -54, 22, 7, olw('#E07A5A', 4)) + Ci(0, -64, 7, olw('#E07A5A', 3)) + P(dC(-20, -24, 6) + dC(4, -30, 6) + dC(24, -20, 6), { fill: '#E07A5A' }), `translate(1424 ${D.top})`);
  b += R(1472, D.top - 36, 72, 36, 4, olw('#FFFFFF', 4)) + P('M1482 664h46M1482 652h36', ln(3, '#9AA0AE')) + P(`M1520 ${D.top + 14}C1546 760 1496 800 1526 860Q1536 900 1496 930L1576 950Q1616 900 1576 870Q1556 800 1550 ${D.top + 14}Z`, olw('#FFFFFF', 4)) + P('M1530 760h18M1526 800h20M1528 840h22M1516 900h40', ln(3, '#9AA0AE'));
  // floor: planks + braided rug
  b += band(cam, 1, 890, 2200, { fill: '#7A4A2E' }) + band(cam, 1, 890, 2200, { fill: 'url(#cityPlank)' }) + band(cam, 1, 884, 900, { fill: '#3A2418' }) + band(cam, 1, 898, 902, { fill: LINE });
  b += Ell(1000, 1000, 660, 84, olw('#8A3A4A', 6)) + Ell(1000, 1000, 576, 68, { fill: '#C8604A' }) + Ell(1000, 1000, 480, 52, { fill: '#E8B04A' }) + Ell(1000, 1000, 370, 38, { fill: '#7A9A5A' }) + Ell(1000, 1000, 240, 22, { fill: '#C8604A' });
  // floor lamp (left) with warm cone
  const LM = SERVER.lamp;
  if (o.lamp > 0.05) b += P(`M${LM.x - 70} ${LM.y + 56}L${LM.x + 70} ${LM.y + 56}L${LM.x + 230} 960L${LM.x - 230} 960Z`, { fill: 'url(#cityLampCone)', opacity: f(0.6 * o.lamp) });
  b += Ell(LM.x, 952, 66, 14, olw('#5A4A3A', 5)) + P(`M${LM.x} 950V${LM.y + 50}`, ln(10)) + P(`M${LM.x} 950V${LM.y + 50}`, ln(5, '#C9A060'));
  b += P(`M${LM.x - 70} ${LM.y + 56}L${LM.x - 46} ${LM.y - 44}H${LM.x + 46}L${LM.x + 70} ${LM.y + 56}Z`, olw(o.lamp > 0.3 ? '#F7B04A' : '#C98A3A', 6)) + P(`M${LM.x - 70} ${LM.y + 60}` + Array.from({ length: 7 }, () => 'q10 14 20 0').join(''), { ...ln(4, '#E07A3A'), fill: 'none' });
  // side table with tea + cookies
  b += P('M190 822V952M152 952H228', ln(10)) + P('M190 822V952M152 952H228', ln(5, '#8A5636')) + Ell(190, 818, 82, 16, olw('#A86A42', 5));
  b += R(140, 770, 40, 42, 8, olw('#C58BD8', 4)) + P('M180 780q16 2 14 14q-2 10 -14 10', { ...ln(4), fill: 'none' }) + Ell(222, 808, 36, 8, olw('#FFFFFF', 3)) + P(dC(210, 800, 10) + dC(232, 798, 10) + dC(221, 790, 9), olw('#D9A05A', 3));
  // coat rack with the Admin's cloak of code + golden crown
  b += Ell(1800, 958, 70, 14, olw('#5A3A2A', 5)) + P('M1800 956V300', ln(14)) + P('M1800 956V300', ln(8, '#8A5636')) + Ci(1800, 292, 14, olw('#A86A42', 4)) + P('M1800 330L1764 312M1800 330L1836 312M1800 380L1760 368', ln(7));
  if (o.cloak) {
    const C0 = SERVER.cloak;
    const x = C0.x, y = C0.y, sw = Math.sin(t * 0.9) * 4;
    const cl = `M${x - 14} ${y}Q${x - 44} ${y + 4} ${x - 60} ${y + 40}L${f(x - 112 + sw)} ${y + 440}Q${f(x - 60 + sw)} ${y + 462} ${f(x - 10 + sw)} ${y + 446}Q${f(x + 40 + sw)} ${y + 462} ${f(x + 80 + sw)} ${y + 436}L${x + 46} ${y + 40}Q${x + 34} ${y + 4} ${x + 14} ${y}Z`;
    b += P(cl, olw('#F4F8FF', 5)) + P(cl, { fill: 'url(#cityCode)' }) + P(`M${x - 36} ${y + 60}Q${f(x - 56 + sw)} ${y + 250} ${f(x - 60 + sw)} ${y + 450}M${x + 20} ${y + 60}Q${f(x + 30 + sw)} ${y + 250} ${f(x + 26 + sw)} ${y + 446}`, { ...ln(4, '#BFD3F0', 0.9), fill: 'none' });
    b += P(`M${f(x - 110 + sw)} ${y + 436}Q${f(x - 60 + sw)} ${y + 458} ${f(x - 10 + sw)} ${y + 442}Q${f(x + 40 + sw)} ${y + 458} ${f(x + 78 + sw)} ${y + 432}`, { ...ln(9, '#FFC93C'), fill: 'none' }) + P(`M${x - 40} ${y + 14}Q${x} ${y + 44} ${x + 40} ${y + 14}`, { ...ln(12, '#FFC93C'), fill: 'none' });
  }
  if (o.crown) {
    const Cr = SERVER.crown, sw = Math.sin(t * 1.2) * 3;
    b += P(`M1836 312L${Cr.x} ${Cr.y - 34}`, ln(3)) + G(P('M-40 22L-46 -20L-20 2L0 -30L20 2L46 -20L40 22Z', olw('#FFD24F', 5)) + R(-40, 12, 80, 16, 4, olw('#E8A800', 4)) + TF('ADMIN', 0, 25, 13, '#5A3A00') + Ci(0, -32, 6, olw('#FF5A7A', 3)) + P('M-30 -4L-24 10', ln(4, '#FFF3B0')), `translate(${Cr.x} ${Cr.y}) rotate(${f(sw)})`);
    b += K.sparkles([[Cr.x + 44, Cr.y - 30, 12], [Cr.x - 40, Cr.y + 30, 9]], t);
  }
  // cat bed
  const CB = SERVER.catBed;
  b += Ell(CB.x, CB.y, 120, 34, olw('#B9773E', 6)) + Ell(CB.x, CB.y - 10, 96, 22, olw('#E86A6A', 5)) + P(`M${CB.x - 110} ${CB.y + 4}q110 34 220 0`, ln(4, '#8A5430')) + Ell(CB.x, CB.y - 14, 60, 10, op('#FFFFFF', 0.25));
  b += Ci(CB.x + 170, CB.y + 6, 22, olw('#7FA8E0', 4)) + P(`M${CB.x + 152} ${CB.y}q18 -12 36 4M${CB.x + 154} ${CB.y + 14}q18 -10 34 2M${CB.x + 190} ${CB.y + 14}q30 10 40 -6`, { ...ln(3, '#4A6AA8'), fill: 'none' });
  // the huge armchair (back + seat in bg; arms + blanket in mid)
  const CH = SERVER.chair, cx = CH.x;
  const vel = '#B23A48', velSh = '#8A2A38', velHi = '#D8606A';
  b += P(`M${cx - 190} ${CH.seat}L${cx - 196} ${CH.back + 70}Q${cx - 190} ${CH.back} ${cx - 120} ${CH.back - 6}Q${cx} ${CH.back - 26} ${cx + 120} ${CH.back - 6}Q${cx + 190} ${CH.back} ${cx + 196} ${CH.back + 70}L${cx + 190} ${CH.seat}Z`, olw(vel, 7));
  b += P(`M${cx - 196} ${CH.back + 90}Q${cx - 250} ${CH.back + 110} ${cx - 236} ${CH.back + 300}L${cx - 190} ${CH.seat - 30}Z M${cx + 196} ${CH.back + 90}Q${cx + 250} ${CH.back + 110} ${cx + 236} ${CH.back + 300}L${cx + 190} ${CH.seat - 30}Z`, olw(velSh, 6));
  let tufts = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) tufts += dC(cx - 105 + c * 70 + (r % 2) * 35, CH.back + 70 + r * 90, 6);
  b += P(tufts, { fill: velSh }) + P(`M${cx - 150} ${CH.back + 40}Q${cx} ${CH.back + 14} ${cx + 150} ${CH.back + 40}`, ln(8, velHi, 0.6));
  const legs = `M${cx - 170} ${CH.seat + 140}L${cx - 178} 936M${cx + 170} ${CH.seat + 140}L${cx + 178} 936`;
  b += P(legs, ln(20)) + P(legs, ln(11, '#5A3A2A'));
  b += R(cx - 198, CH.seat + 30, 396, 118, 20, olw(velSh, 7)) + P(`M${cx - 190} ${CH.seat + 136}` + Array.from({ length: 12 }, () => 'q16 16 32 0').join(''), { ...ln(5, velHi, 0.7), fill: 'none' });
  b += R(cx - 204, CH.seat - 16, 408, 62, 28, olw(vel, 7)) + R(cx - 182, CH.seat - 8, 364, 12, 6, op(velHi, 0.7));
  let m = '';
  for (const sx of [-1, 1]) m += R(cx + sx * 212 - 48, CH.seat - 72, 96, 222, 40, olw(sx < 0 ? vel : velSh, 7)) + Ell(cx + sx * 212, CH.seat - 64, 50, 25, olw(velHi, 6)) + P(`M${cx + sx * 212 - 30} ${CH.seat - 20}V${CH.seat + 120}`, ln(5, velSh, 0.6));
  const bl = `M${cx + 150} ${CH.seat - 80}Q${cx + 240} ${CH.seat - 110} ${cx + 290} ${CH.seat - 60}L${cx + 300} ${CH.seat + 150}Q${cx + 250} ${CH.seat + 170} ${cx + 190} ${CH.seat + 140}Q${cx + 120} ${CH.seat + 100} ${cx + 60} ${CH.seat + 120}L${cx + 70} ${CH.seat + 30}Q${cx + 120} ${CH.seat} ${cx + 150} ${CH.seat - 80}Z`;
  m += P(bl, { fill: 'url(#cityKnit)', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' }) + P(`M${cx + 300} ${CH.seat + 150}Q${cx + 250} ${CH.seat + 170} ${cx + 190} ${CH.seat + 140}`, { ...ln(10, '#F6E8C8'), 'stroke-dasharray': '4 10', fill: 'none' });
  const fg = V(cam, P('M-300 1090C200 1040 500 1110 900 1080M1300 1100C1600 1050 1900 1110 2300 1070', { ...ln(16, '#1E1418'), fill: 'none' }), 1.15);
  let light = V(cam, R(-300, -300, 760, 1700, 0, { fill: 'url(#cityEdgeL)' }) + R(1460, -300, 760, 1700, 0, { fill: 'url(#cityEdgeR)' }) + R(-300, 880, 2520, 500, 0, { fill: 'url(#cityDarkUp)', opacity: 0.6 }), 0);
  light += wash(cam, '#FFB347', 0.07 * o.lamp) + (gk > 0.01 ? wash(cam, '#46F58C', 0.06 * gk) : '');
  if (o.lamp > 0.05) light += V(cam, Ci(LM.x, LM.y + 10, 240, { fill: 'url(#cityGlowW)', opacity: f(0.55 * o.lamp) }) + Ci(905, 520, 150, { fill: 'url(#cityGlowW)', opacity: f(0.4 * o.lamp) }), 1);
  return layers(V(cam, b, 1), V(cam, m, 1), fg, light);
}

// ================================================================ exports
const FLOOR = { street: CITY.street.y, heroRoof: CITY.heroRoof.y, rooftop: ROOF.floor, giant: GIANT.ground, desert: DESERT.floor, island: ISLAND.floor, mountain: MOUNTAIN.floor, server: SERVER.floor };
module.exports = {
  DEFS, CITY, ROOF, GIANT, DESERT, ISLAND, MOUNTAIN, SERVER, FLOOR, KF,
  city, rooftop, giantScale, desert, island, mountain, serverRoom,
  skyChat, crack, serverMsg, craneHook, toScreen, palAt,
  bus, bathtubGuy, waterTower, blimp, mailman, flyer, dog, car, tinyPerson, saguaro, tumbleweed,
  crt, liveScreen, logScreen, thumb, mix, layers, vis,
};
