// Cats of "What If You Had ADMIN COMMANDS in Real Life?" (non-rig, plain SVG: no filters, no masks, < 150 elements each)
//
//   pancake({ x, y, s, t, pose, mood, blink, crown, look, flip, rot, mouth, keyboard, zzz })
//       the family cat: a fat, fluffy, lazy, smug ORANGE tabby.
//   cat({ x, y, s, t, pose, mood, coat, seed, look, blink, flip, rot, mouth })
//       other city cats: coat 'black' | 'white' | 'grey' | 'calico' | 'siamese' | 'tabby' (+ 'orange'); seed varies size, collar, eyes.
//
//   (x, y) = the ground point under the cat (pounce: the ground under its belly; it floats ~140*s above it).
//   s = 1: Pancake sitting is ≈ 240 px tall (same scale as the rig characters: at the same s he is about knee-high to a kid).
//   s 0.3 = tiny on a desk, s 6+ = building-sized (outlines thin out automatically as s grows).
//   pose: 'sit' (front) | 'loaf' (on a keyboard; keyboard: false hides it) | 'walk' (side, faces screen-left; flip: true faces right; t drives the cycle)
//         | 'sleep' (curled up, z's unless zzz: false) | 'pounce' (side, mid-air) | 'lie' (on its back, paws up) | 'paw' (sitting, one paw up, catching)
//   mood: 'lazy' | 'smug' | 'happy' | 'surprised' | 'angry'   (default depends on the pose; sleep always has closed eyes)
//   look: [x, y] -1..1 pupils, blink 0..1, mouth: 'w' | 'smirk' | 'open' | 'o' | 'hiss' | 'meow' overrides the mood's mouth.
//   crown: true = the tiny golden ADMIN crown (final gag).
// Static gradients live in DEFS (scenes/main.js loads them); every fill also carries a flat fallback colour.
'use strict';

const S = require('./svg');
const { f } = S;

const LINE = '#151515';
const K = 0.68; // cat units -> px at s = 1

// ---------------------------------------------------------------- coats
const COATS = {
  orange: { base: '#F7A24A', hi: '#FFCB8A', shade: '#DD7B28', stripe: '#CC5F1A', cream: '#FFF0D8', creamShade: '#F2D2A6', inEar: '#FF9DB0', nose: '#FF7F9A', iris: '#C2E866', irisDark: '#6FA82A', pads: '#FF9DB0', whisker: LINE },
  black: { base: '#34313F', hi: '#57536C', shade: '#211F2A', stripe: null, cream: '#4A4659', creamShade: '#3E3A4C', inEar: '#C77A92', nose: '#C77A92', iris: '#FFE066', irisDark: '#E8A21A', pads: '#C77A92', whisker: '#E8E8F0', lid: '#3E3A4C' },
  white: { base: '#FAFAFF', hi: '#FFFFFF', shade: '#D6D7E6', stripe: null, cream: '#FFFFFF', creamShade: '#E6E6F0', inEar: '#FFA8BC', nose: '#FF8FA8', iris: '#8FD0FF', irisDark: '#3A8ED8', pads: '#FFA8BC', whisker: '#8A8A99' },
  grey: { base: '#A4AAB8', hi: '#C8CDD8', shade: '#7E8596', stripe: '#848A9A', cream: '#E9EBF1', creamShade: '#D3D6E0', inEar: '#F2A0B4', nose: '#E88AA0', iris: '#F6D25A', irisDark: '#D8962A', pads: '#E88AA0', whisker: LINE },
  calico: { base: '#FFFFFF', hi: '#FFFFFF', shade: '#E2E2EC', stripe: null, cream: '#FFFFFF', creamShade: '#E9E9F2', inEar: '#FFA8BC', nose: '#FF8FA8', iris: '#F2C94C', irisDark: '#C98A12', pads: '#FFA8BC', whisker: '#8A8A99', patchA: '#F29A45', patchB: '#3A3640' },
  siamese: { base: '#F4E8D6', hi: '#FFF7EA', shade: '#DCCAB0', stripe: null, cream: '#5A3E32', creamShade: '#4A3228', inEar: '#7A5446', nose: '#3A2820', iris: '#7CC8FF', irisDark: '#2E7FD0', pads: '#3A2820', whisker: '#F4E8D6', point: '#5A3E32', lid: '#5A3E32' },
  tabby: { base: '#C08A5A', hi: '#DEAD7C', shade: '#986840', stripe: '#6A4628', cream: '#F7E6CC', creamShade: '#E6CCA6', inEar: '#F2A0B4', nose: '#D9707F', iris: '#A6D850', irisDark: '#5E9A26', pads: '#D9707F', whisker: LINE },
};
const mix = (a, b, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - k) + parseInt(b.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
for (const [k, c] of Object.entries(COATS)) {
  c.name = k;
  c.lid = c.lid || mix(c.hi, c.base, 0.55);
  c.ear = c.point || c.base;
  c.paw = c.point || c.cream;
  c.tail = c.point || c.base;
}
const DEFS = '<defs>' + Object.values(COATS).map((c) =>
  `<linearGradient id="catg-${c.name}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.hi}"/><stop offset="0.55" stop-color="${c.base}"/><stop offset="1" stop-color="${c.shade}"/></linearGradient>` +
  `<linearGradient id="catc-${c.name}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.cream}"/><stop offset="1" stop-color="${c.creamShade}"/></linearGradient>` +
  `<linearGradient id="cati-${c.name}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.iris}"/><stop offset="1" stop-color="${c.irisDark}"/></linearGradient>`).join('') + '</defs>';
const G = (c) => `url(#catg-${c.name}) ${c.base}`;
const GC = (c) => `url(#catc-${c.name}) ${c.cream}`;
const GI = (c) => `url(#cati-${c.name}) ${c.iris}`;

// ---------------------------------------------------------------- geometry helpers
const P = (p) => `${f(p[0])} ${f(p[1])}`;
// closed Catmull-Rom spline through points
function blob(pts) {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${P(p2)}`;
  }
  return d + ' Z';
}
// open Catmull-Rom sampled into n points
function sample(pts, n) {
  const out = [];
  const segs = pts.length - 1;
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * segs, i = Math.min(segs - 1, Math.floor(u)), t = u - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c = (a, b, cc, dd) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - dd) * t * t + (-a + 3 * b - 3 * cc + dd) * t * t * t);
    out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
}
const mirrorHalf = (half) => [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
const stroke = (w, col = LINE) => ({ fill: 'none', stroke: col, 'stroke-width': f(w), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const filled = (fill, lw) => ({ fill, stroke: LINE, 'stroke-width': f(lw), 'stroke-linejoin': 'round' });
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
let clipN = 0;
const clipId = () => `catclip${++clipN}_${S.uid('c')}`;
function clipped(d, fill, inner, lw) {
  const id = clipId();
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>` + S.path(d, { fill }) + (inner ? S.g(inner, null, { 'clip-path': `url(#${id})` }) : '') + S.path(d, { fill: 'none', stroke: LINE, 'stroke-width': f(lw), 'stroke-linejoin': 'round' });
}
// tapered tail along a centreline; w0 at the base, w1 near the tip (round tip)
function tail(pts, w0, w1, c, lw, { stripes = true, col } = {}) {
  const N = 22, cs = sample(pts, N);
  const L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const a = cs[Math.max(0, i - 1)], b = cs[Math.min(N, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const w = w0 + (w1 - w0) * (i / N);
    L.push([cs[i][0] - (dy / l) * w, cs[i][1] + (dx / l) * w]);
    R.push([cs[i][0] + (dy / l) * w, cs[i][1] - (dx / l) * w]);
  }
  let d = `M${P(L[0])}`;
  for (let i = 1; i <= N; i++) d += ` Q${P(L[i - 1])} ${f((L[i - 1][0] + L[i][0]) / 2)} ${f((L[i - 1][1] + L[i][1]) / 2)}`;
  d += ` L${P(L[N])} A${f(w1)} ${f(w1)} 0 0 1 ${P(R[N])}`;
  for (let i = N - 1; i >= 0; i--) d += ` Q${P(R[i + 1])} ${f((R[i + 1][0] + R[i][0]) / 2)} ${f((R[i + 1][1] + R[i][1]) / 2)}`;
  d += ` L${P(R[0])} Z`;
  let o = S.path(d, filled(col || (c.point ? c.point : G(c)), lw));
  if (stripes && c.stripe) {
    let sd = '';
    for (const u of [0.3, 0.48, 0.64, 0.78, 0.9]) {
      const i = Math.round(u * N), a = L[i], b = R[i], m = cs[i];
      sd += `M${f(m[0] + (a[0] - m[0]) * 0.92)} ${f(m[1] + (a[1] - m[1]) * 0.92)} L${f(m[0] + (b[0] - m[0]) * 0.92)} ${f(m[1] + (b[1] - m[1]) * 0.92)} `;
    }
    o += S.path(sd, stroke(lw * 1.5, c.stripe));
  }
  return o;
}
// a stubby leg as a stroked capsule (solid colours: gradients don't work on zero-width bounding boxes)
const leg = (a, b, w, col, lw) => S.path(`M${P(a)} L${P(b)}`, stroke(w + 2 * lw, LINE)) + S.path(`M${P(a)} L${P(b)}`, stroke(w, col));
function paw(x, y, rx, ry, c, lw, rot = 0, toes = true) {
  let o = S.ellipse(x, y, rx, ry, filled(c.paw === c.cream ? GC(c) : c.paw, lw));
  if (toes) o += S.path(`M${f(x - rx * 0.3)} ${f(y + ry * 0.1)} L${f(x - rx * 0.3)} ${f(y + ry * 0.75)} M${f(x + rx * 0.3)} ${f(y + ry * 0.1)} L${f(x + rx * 0.3)} ${f(y + ry * 0.75)}`, stroke(lw * 0.6));
  return rot ? S.g(o, `rotate(${f(rot)} ${f(x)} ${f(y)})`) : o;
}
// paw seen from below: toe beans
function beans(x, y, r, c, lw, rot = 0) {
  let o = S.circle(x, y, r, filled(c.paw === c.cream ? GC(c) : c.paw, lw));
  o += S.ellipse(x, y + r * 0.22, r * 0.42, r * 0.32, { fill: c.pads });
  for (const [dx, dy] of [[-0.5, -0.32], [-0.17, -0.55], [0.17, -0.55], [0.5, -0.32]]) o += S.ellipse(x + dx * r, y + dy * r, r * 0.16, r * 0.19, { fill: c.pads });
  return rot ? S.g(o, `rotate(${f(rot)} ${f(x)} ${f(y)})`) : o;
}

// ---------------------------------------------------------------- moods
const MOODS = {
  lazy: { eye: { upper: 0.52, lower: 0.12, tilt: -3, pupil: 'slit', pw: 5 }, mouth: 'w', ear: 8, whisk: 8 },
  smug: { eye: { upper: 0.46, lower: 0.14, tilt: 5, pupil: 'slit', pw: 5, look: [0.55, 0.05] }, mouth: 'smirk', ear: 2, whisk: 0 },
  happy: { eye: { closed: 'happy' }, mouth: 'open', ear: -4, whisk: -6, blush: true },
  surprised: { eye: { upper: 0, pupil: 'round', pr: 8, k: 1.16 }, mouth: 'o', ear: -12, whisk: -10 },
  angry: { eye: { upper: 0.36, tilt: 16, pupil: 'slit', pw: 3.5 }, mouth: 'hiss', ear: 42, whisk: -14, puff: true },
  sleep: { eye: { closed: 'closed' }, mouth: 'w', ear: 10, whisk: 10 },
};

// ---------------------------------------------------------------- head (front facing, centred on 0,0; spans x ±124, y -140..80)
const HEAD_R = [[0, -90], [44, -87], [76, -72], [96, -46], [104, -18], [120, -6], [104, 4], [124, 20], [102, 28], [114, 44], [84, 54], [52, 70], [22, 78], [0, 80]];
const HEAD_D = blob(mirrorHalf(HEAD_R));
function catEye(cx, cy, side, e, c, lw, look, blink) {
  if (e.closed === 'happy') return S.path(`M${f(cx - 21)} ${f(cy + 8)} Q${f(cx)} ${f(cy - 20)} ${f(cx + 21)} ${f(cy + 8)}`, stroke(lw * 1.35));
  if (e.closed === 'closed' || blink > 0.96) return S.path(`M${f(cx - 22)} ${f(cy + 1)} Q${f(cx)} ${f(cy + 13)} ${f(cx + 22)} ${f(cy + 1)}`, stroke(lw * 1.35));
  const k = e.k || 1, rx = 26 * k, ry = 24 * k;
  let o = S.ellipse(cx, cy, rx, ry, filled(GI(c), lw));
  const lk = [S.clamp((look || e.look || [0, 0])[0], -1, 1), S.clamp((look || e.look || [0, 0])[1], -1, 1)];
  const px = cx + lk[0] * rx * 0.36, py = cy + 2 + lk[1] * ry * 0.26;
  if (e.pupil === 'round') o += S.circle(px, py, e.pr || 9, { fill: LINE });
  else o += S.ellipse(px, py, e.pw || 5, ry * 0.8, { fill: LINE });
  o += S.circle(cx - rx * 0.34, cy - ry * 0.36, rx * 0.2, { fill: '#FFFFFF' }) + S.circle(cx + rx * 0.3, cy + ry * 0.32, rx * 0.09, { fill: '#FFFFFF' });
  const inner = -side;
  const up = Math.max(e.upper || 0, blink || 0), tilt = (e.tilt || 0) * (1 - (blink || 0));
  const R2x = rx + lw * 0.8, R2y = ry + lw * 0.8;
  if (up > 0.02) {
    const yAt = (x) => cy - ry + 2 * ry * up + tilt * ((x - cx) / rx) * inner;
    const pts = [];
    for (let i = 0; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI, x = cx + Math.cos(a) * R2x; pts.push([x, Math.min(cy + Math.sin(a) * R2y, yAt(x))]); }
    pts.push([cx + R2x, yAt(cx + R2x)], [cx - R2x, yAt(cx - R2x)]);
    o += S.path('M' + pts.map(P).join(' L') + ' Z', { fill: c.lid });
    const yc = yAt(cx), wk = Math.sqrt(Math.max(0, 1 - ((yc - cy) / ry) ** 2));
    o += S.path(`M${f(cx - rx * wk * 1.02)} ${f(yAt(cx - rx * wk))} L${f(cx + rx * wk * 1.02)} ${f(yAt(cx + rx * wk))}`, stroke(lw * 1.3));
  }
  if (e.lower > 0.02) {
    const yl = cy + ry - 2 * ry * e.lower;
    const pts = [];
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI, x = cx + Math.cos(a) * R2x; pts.push([x, Math.max(cy + Math.sin(a) * R2y, yl)]); }
    o += S.path('M' + pts.map(P).join(' L') + ' Z', { fill: c.lid }) + S.path(`M${f(cx - rx * 0.8)} ${f(yl)} Q${f(cx)} ${f(yl + 4)} ${f(cx + rx * 0.8)} ${f(yl)}`, stroke(lw * 0.9));
  }
  return o;
}
function catMouth(m, c, lw) {
  const nose = `M0 15 L0 25 `;
  switch (m) {
    case 'smirk': return S.path(nose + 'M-20 30 Q-9 34 0 25 Q15 33 30 16', stroke(lw));
    case 'open': return S.path('M-26 24 Q-13 34 0 26 Q13 34 26 24 Q22 54 0 58 Q-22 54 -26 24 Z', filled('#8A2440', lw)) + S.ellipse(0, 48, 13, 8, { fill: '#FF8FA8' }) + S.path(nose, stroke(lw));
    case 'o': return S.path(nose, stroke(lw)) + S.ellipse(0, 38, 10, 12, filled('#8A2440', lw));
    case 'meow': return S.path(nose, stroke(lw)) + S.path('M-16 30 Q0 22 16 30 Q16 58 0 62 Q-16 58 -16 30 Z', filled('#8A2440', lw)) + S.ellipse(0, 52, 9, 6, { fill: '#FF8FA8' });
    case 'hiss': return S.path('M-32 24 Q0 14 32 24 Q28 62 0 64 Q-28 62 -32 24 Z', filled('#8A2440', lw)) + S.ellipse(0, 54, 14, 7, { fill: '#FF8FA8' }) +
      S.path('M-22 22 L-16 40 L-10 22 Z M22 22 L16 40 L10 22 Z', { fill: '#FFFFFF', stroke: LINE, 'stroke-width': f(lw * 0.6), 'stroke-linejoin': 'round' }) + S.path('M0 12 L0 18', stroke(lw));
    default: return S.path(nose + 'M-24 23 Q-12 38 0 25 Q12 38 24 23', stroke(lw));
  }
}
function catHead(c, o) {
  const { lw, mood } = o;
  const M = MOODS[mood] || MOODS.lazy;
  const earA = M.ear;
  let s = '';
  // ears (behind the head)
  for (const sx of [-1, 1]) {
    let e = S.path(S.roundedPath([[sx * 22, -74], [sx * 84, -142], [sx * 106, -46]], 18), filled(c.ear === c.base ? G(c) : c.ear, lw));
    e += S.path(S.roundedPath([[sx * 42, -76], [sx * 82, -124], [sx * 94, -60]], 12), { fill: c.inEar });
    e += S.path(`M${sx * 58} -70 L${sx * 70} -100 M${sx * 74} -66 L${sx * 80} -94`, stroke(lw * 0.55, c.point ? '#8A6A5A' : c.cream));
    s += S.g(e, `rotate(${f(sx * earA)} ${sx * 66} -62)`);
  }
  // head
  let inner = '';
  if (c.patchA) inner += S.ellipse(70, -60, 70, 58, { fill: c.patchA }) + S.ellipse(-80, -70, 58, 46, { fill: c.patchB }) + S.ellipse(-110, 30, 30, 26, { fill: c.patchA });
  if (c.point) inner += S.ellipse(0, 16, 74, 66, { fill: c.point, opacity: 0.9 }) + S.ellipse(0, 22, 92, 82, { fill: c.point, opacity: 0.35 });
  if (c.stripe) inner += S.path('M-28 -88 Q-23 -72 -17 -58 M0 -92 L0 -60 M28 -88 Q23 -72 17 -58 M104 -28 Q88 -26 74 -19 M108 -6 Q92 -3 78 3 M-104 -28 Q-88 -26 -74 -19 M-108 -6 Q-92 -3 -78 3', stroke(lw * 1.7, c.stripe));
  s += clipped(HEAD_D, G(c), inner, lw);
  // muzzle
  s += S.path(blob([[0, 4], [22, -1], [44, 8], [54, 26], [44, 44], [22, 52], [0, 49], [-22, 52], [-44, 44], [-54, 26], [-44, 8], [-22, -1]]), { fill: GC(c) });
  if (M.blush || o.blush) s += S.ellipse(-70, 30, 20, 10, { fill: '#FF7F9A', opacity: 0.45 }) + S.ellipse(70, 30, 20, 10, { fill: '#FF7F9A', opacity: 0.45 });
  // eyes
  const e = { ...M.eye };
  s += catEye(-42, -18, -1, e, c, lw, o.look, o.blink || 0) + catEye(42, -18, 1, e, c, lw, o.look, o.blink || 0);
  // nose + mouth
  s += S.path('M-12 4 Q0 -1 12 4 Q5 15 0 16 Q-5 15 -12 4 Z', filled(c.nose, lw * 0.7)) + S.ellipse(-3, 5, 3.5, 2, { fill: '#FFFFFF', opacity: 0.8 });
  s += catMouth(o.mouth || M.mouth, c, lw);
  // whiskers
  const wd = M.whisk;
  let w = '';
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) w += `M${sx * 56} ${18 + i * 9} Q${sx * 96} ${12 + i * 12 + wd * 0.3} ${sx * 134} ${6 + i * 16 + wd} `;
  s += S.path(w, stroke(lw * 0.45, c.whisker));
  if (o.crown) s += tinyCrown(0, -84, lw);
  if (o.collar) s += S.path('M-66 66 Q0 96 66 66', stroke(lw * 4.2, LINE)) + S.path('M-66 66 Q0 96 66 66', stroke(lw * 2.6, o.collar)) + S.circle(0, 90, 10, filled('#FFD23F', lw * 0.7)) + S.path('M-4 92 L4 92', stroke(lw * 0.5));
  return s;
}
// the final gag: a tiny golden ADMIN crown
function tinyCrown(x, y, lw) {
  let o = S.path(S.roundedPath([[-46, 4], [-52, -42], [-26, -20], [0, -54], [26, -20], [52, -42], [46, 4]], 5), filled('#FFC93C', lw));
  o += S.path(S.roundedPath([[-50, -10], [50, -10], [50, 8], [-50, 8]], 5), filled('#E7A21A', lw * 0.8));
  o += S.el('text', { x: 0, y: 5, 'font-family': 'Lilita One, sans-serif', 'font-size': 15, fill: '#221D44', 'text-anchor': 'middle', textLength: 70, lengthAdjust: 'spacingAndGlyphs' }, 'ADMIN');
  o += S.circle(-52, -42, 6, filled('#4FD1FF', lw * 0.6)) + S.circle(0, -54, 7, filled('#FF4D6D', lw * 0.6)) + S.circle(52, -42, 6, filled('#4FD1FF', lw * 0.6));
  o += S.path('M-34 -6 L-30 -26', stroke(lw * 0.8, '#FFF0B0'));
  return S.g(o, `translate(${f(x)} ${f(y)})`);
}

// ---------------------------------------------------------------- poses (cat units, origin = ground point)
function body(d, c, lw, inner) { return clipped(d, G(c), inner, lw); }
const sideStripes = (c, lw, d) => (c.stripe ? S.path(d, stroke(lw * 1.6, c.stripe)) : '');
function patches(c, list) { return c.patchA ? list.map(([x, y, rx, ry, k]) => S.ellipse(x, y, rx, ry, { fill: k ? c.patchB : c.patchA })).join('') : ''; }

function poseSit(c, o, paw1) {
  const { lw, t, bw } = o;
  const br = 1 + 0.015 * Math.sin(t * 2.4);
  const X = (x) => x * bw;
  let s = '';
  // body
  const bd = blob([[0, -198], [X(68), -192], [X(112), -162], [X(140), -112], [X(152), -58], [X(142), -12], [X(100), 2], [0, 4], [X(-100), 2], [X(-142), -12], [X(-152), -58], [X(-140), -112], [X(-112), -162], [X(-68), -192]]);
  let inner = patches(c, [[X(80), -150, 60, 50, 0], [X(-100), -60, 50, 60, 1]]);
  inner += S.path(blob([[0, -176], [18, -192], [34, -170], [52, -178], [X(60), -150], [X(70), -100], [X(58), -36], [26, -8], [0, -4], [-26, -8], [X(-58), -36], [X(-70), -100], [X(-60), -150], [-52, -178], [-34, -170], [-18, -192]]), { fill: GC(c) });
  inner += sideStripes(c, lw, `M${X(146)} -78 Q${X(128)} -72 ${X(118)} -56 M${X(138)} -118 Q${X(120)} -112 ${X(110)} -96 M${X(120)} -158 Q${X(104)} -152 ${X(96)} -138 M${X(-146)} -78 Q${X(-128)} -72 ${X(-118)} -56 M${X(-138)} -118 Q${X(-120)} -112 ${X(-110)} -96 M${X(-120)} -158 Q${X(-104)} -152 ${X(-96)} -138`);
  inner += S.path(`M${X(132)} -34 Q${X(116)} -96 ${X(72)} -100 M${X(-132)} -34 Q${X(-116)} -96 ${X(-72)} -100`, stroke(lw * 0.8));
  s += S.g(body(bd, c, lw, inner), `scale(1 ${f(br)})`);
  // hind feet
  s += S.ellipse(X(-118), -8, 34, 15, filled(G(c), lw)) + S.ellipse(X(118), -8, 34, 15, filled(G(c), lw));
  // front paws (paw1 = the screen-right paw is raised)
  s += paw(-40, -12, 30, 18, c, lw);
  if (!paw1) s += paw(40, -12, 30, 18, c, lw);
  // tail wrapped round the front
  const tw = o.puff ? 1.5 : 1;
  const sw = 6 * Math.sin(t * 1.6);
  s += tail([[X(124), -24], [X(146), -2], [X(80), 10], [X(-30), 12], [X(-120), 0], [X(-150) + sw, -34]], 18 * tw, 13 * tw, c, lw);
  return { s, head: [0, -222 * br + 2 * Math.sin(t * 2.4 + 0.6)], headK: 1.14 };
}
function poseLoaf(c, o) {
  const { lw, t, bw } = o;
  const X = (x) => x * bw;
  const br = 1 + 0.02 * Math.sin(t * 2.2);
  let s = '';
  if (o.keyboard !== false) {
    s += S.path(S.roundedPath([[-196, -44], [196, -44], [228, -8], [228, 14], [-228, 14], [-228, -8]], 12), filled('#3A3F52', lw));
    let keys = '';
    for (let r = 0; r < 2; r++) for (let i = 0; i < 15; i++) { const x = -196 + i * 28 - r * 8, y = -36 + r * 15; keys += `M${x} ${y} h20 v10 h-20 Z `; }
    s += S.path(keys, { fill: '#C9CED8', stroke: '#22252F', 'stroke-width': f(lw * 0.45) });
    s += S.path('M-220 4 L220 4', stroke(lw * 0.6, '#5A6078'));
  }
  const y0 = o.keyboard === false ? 0 : -26;
  const bd = blob([[0, -150], [X(84), -146], [X(144), -122], [X(170), -72], [X(164), -22], [X(130), -4], [0, 0], [X(-130), -4], [X(-164), -22], [X(-170), -72], [X(-144), -122], [X(-84), -146]]);
  let inner = patches(c, [[X(110), -100, 60, 44, 0], [X(-90), -120, 50, 40, 1]]);
  inner += sideStripes(c, lw, `M${X(-110)} -132 Q${X(-98)} -108 ${X(-104)} -86 M${X(-56)} -146 Q${X(-48)} -120 ${X(-52)} -98 M${X(56)} -146 Q${X(48)} -120 ${X(52)} -98 M${X(110)} -132 Q${X(98)} -108 ${X(104)} -86 M${X(150)} -90 Q${X(134)} -80 ${X(128)} -62`);
  inner += S.ellipse(0, -10, X(120), 26, { fill: c.shade, opacity: 0.35 });
  s += S.g(body(bd, c, lw, inner), `translate(0 ${y0}) scale(1 ${f(br)})`);
  s += S.g(tail([[X(150), -40], [X(166), -10], [X(120), 8], [X(40), 12]], 17, 13, c, lw) + paw(-34, -6, 24, 13, c, lw) + paw(34, -6, 24, 13, c, lw), `translate(0 ${y0})`);
  return { s, head: [0, y0 - 120 * br], headK: 1.1 };
}
function poseWalk(c, o) {
  const { lw, t, bw } = o;
  const ph = t * 5.2;
  const bob = 4 * Math.abs(Math.sin(ph));
  const X = (x) => x * bw;
  let s = '';
  const legAt = (hx, a, dark) => {
    const r = (a * Math.PI) / 180, L = 84;
    const foot = [hx - Math.sin(r) * L, -88 + bob + Math.cos(r) * L - Math.max(0, Math.sin(r)) * 16];
    return leg([hx, -88 + bob], foot, 40, dark ? c.shade : (c.point || c.base), lw) + paw(foot[0] - 6, foot[1] + 2, 24, 13, c, lw, 0, false);
  };
  const sw = (k) => 24 * Math.sin(ph + k);
  // far legs
  s += legAt(X(-82), sw(Math.PI), true) + legAt(X(94), sw(0), true);
  // tail
  const ts = 12 * Math.sin(t * 3.1);
  s += tail([[X(146), -148 + bob], [X(196), -176], [X(218) + ts * 0.5, -236], [X(200) + ts, -284], [X(172) + ts, -294]], 17 * (o.puff ? 1.5 : 1), 12 * (o.puff ? 1.5 : 1), c, lw);
  // body
  const bd = blob([[X(-158), -136], [X(-136), -188], [X(-60), -210], [X(40), -210], [X(126), -188], [X(168), -136], [X(160), -80], [X(110), -48], [0, -38], [X(-110), -48], [X(-156), -84]]);
  let inner = patches(c, [[X(40), -170, 70, 40, 0], [X(-60), -110, 50, 40, 1]]);
  inner += S.path(blob([[X(-124), -70], [X(-40), -84], [X(40), -84], [X(124), -74], [X(114), -36], [0, -26], [X(-114), -36]]), { fill: GC(c) });
  inner += sideStripes(c, lw, `M${X(-60)} -208 Q${X(-56)} -182 ${X(-64)} -158 M0 -212 Q${X(4)} -186 ${X(-4)} -160 M${X(60)} -208 Q${X(64)} -182 ${X(56)} -158 M${X(116)} -192 Q${X(122)} -168 ${X(112)} -146`);
  s += S.g(body(bd, c, lw, inner), `translate(0 ${f(bob)})`);
  // near legs
  s += legAt(X(-104), sw(0), false) + legAt(X(116), sw(Math.PI), false);
  return { s, head: [X(-156), -206 + bob * 1.3], headK: 1, headRot: -4 };
}
function poseSleep(c, o) {
  const { lw, t, bw } = o;
  const X = (x) => x * bw;
  const br = 1 + 0.035 * Math.sin(t * 1.7);
  let s = '';
  const bd = blob([[X(-164), -40], [X(-150), -104], [X(-86), -146], [0, -156], [X(90), -144], [X(152), -102], [X(166), -42], [X(132), -6], [0, 0], [X(-132), -6]]);
  let inner = patches(c, [[X(60), -110, 70, 44, 0], [X(-100), -80, 40, 36, 1]]);
  inner += sideStripes(c, lw, `M${X(-40)} -154 Q${X(-30)} -130 ${X(-36)} -106 M${X(20)} -156 Q${X(28)} -130 ${X(22)} -106 M${X(80)} -144 Q${X(84)} -120 ${X(76)} -100 M${X(130)} -116 Q${X(124)} -96 ${X(112)} -84`);
  s += S.g(body(bd, c, lw, inner), `scale(1 ${f(br)})`);
  s += paw(-26, -16, 28, 15, c, lw);
  const r = { s, head: [X(-74), -64 * br], headK: 0.9, headRot: -12, after: '' };
  r.after = tail([[X(150), -30], [X(120), 2], [X(30), 12], [X(-60), 10], [X(-128), -6]], 18, 13, c, lw);
  if (o.zzz !== false) {
    const k = (t * 0.6) % 1;
    const z = (x, y, sz, op) => S.el('text', { x: f(x), y: f(y), 'font-family': 'Lilita One, sans-serif', 'font-size': f(sz), fill: '#FFFFFF', stroke: LINE, 'stroke-width': f(lw * 0.9), 'paint-order': 'stroke', 'text-anchor': 'middle', opacity: f(op) }, 'z');
    r.after += z(X(-10) + 30 * k, -190 - 60 * k, 40 + 20 * k, 1 - k) + z(X(30) + 30 * ((k + 0.5) % 1), -190 - 60 * ((k + 0.5) % 1), 40 + 20 * ((k + 0.5) % 1), 1 - ((k + 0.5) % 1));
  }
  return r;
}
function posePounce(c, o) {
  const { lw, t, bw } = o;
  const X = (x) => x * bw;
  let s = '';
  const st = 1 + 0.03 * Math.sin(t * 6);
  // far legs
  s += leg([X(-96), -232], [X(-300), -300], 38, c.shade, lw) + beans(X(-318), -304, 24, c, lw, -100) + leg([X(118), -150], [X(232), -96], 40, c.shade, lw);
  s += tail([[X(160), -176], [X(240), -200], [X(320), -226], [X(380) + 10 * Math.sin(t * 5), -224]], 17 * (o.puff ? 1.5 : 1), 12 * (o.puff ? 1.5 : 1), c, lw);
  const bd = blob([[X(-176), -204], [X(-140), -262], [X(-30), -284], [X(100), -260], [X(182), -206], [X(176), -150], [X(80), -122], [X(-60), -140], [X(-160), -170]]);
  let inner = patches(c, [[X(40), -250, 70, 40, 0], [X(-80), -180, 50, 34, 1]]);
  inner += S.path(blob([[X(-140), -170], [X(-40), -150], [X(80), -134], [X(150), -150], [X(120), -120], [0, -118], [X(-120), -146]]), { fill: GC(c) });
  inner += sideStripes(c, lw, `M${X(-60)} -278 Q${X(-50)} -252 ${X(-58)} -228 M0 -282 Q${X(10)} -256 0 -232 M${X(60)} -272 Q${X(70)} -246 ${X(62)} -224 M${X(120)} -244 Q${X(126)} -222 ${X(116)} -202`);
  s += S.g(body(bd, c, lw, inner), `translate(0 -200) scale(${f(st)} 1) translate(0 200)`);
  // near legs + claws out
  s += leg([X(-120), -220], [X(-326), -236], 40, c.point || c.base, lw) + beans(X(-346), -238, 27, c, lw, -80);
  s += leg([X(140), -150], [X(250), -128], 42, c.point || c.base, lw) + paw(X(262), -124, 26, 15, c, lw, 10, false);
  return { s, head: [X(-176), -258], headK: 0.95, headRot: -8 };
}
function poseLie(c, o) {
  const { lw, t, bw } = o;
  const X = (x) => x * bw;
  const rock = 3 * Math.sin(t * 1.4);
  let s = '';
  s += tail([[X(150), -50], [X(214), -36], [X(262), -14], [X(296) + 8 * Math.sin(t * 2.5), -30]], 17, 12, c, lw);
  // far paws up
  s += leg([X(-40), -142], [X(-30), -232], 36, c.shade, lw) + beans(X(-30), -244, 24, c, lw, 8);
  s += leg([X(110), -132], [X(130), -222], 36, c.shade, lw) + beans(X(132), -232, 24, c, lw, 10);
  const bd = blob([[X(-152), -60], [X(-132), -122], [X(-40), -152], [X(60), -152], [X(140), -122], [X(168), -70], [X(142), -22], [X(40), -6], [X(-60), -6], [X(-142), -24]]);
  let inner = patches(c, [[X(-40), -40, 70, 34, 0], [X(110), -60, 40, 36, 1]]);
  inner += S.ellipse(X(12), -126, X(120), 44, { fill: GC(c) });
  inner += sideStripes(c, lw, `M${X(-60)} -26 Q${X(-50)} -50 ${X(-58)} -72 M0 -20 Q${X(10)} -46 0 -70 M${X(60)} -24 Q${X(70)} -48 ${X(62)} -70`);
  s += S.g(body(bd, c, lw, inner), `rotate(${f(rock)} 0 -40)`);
  // near paws up
  s += leg([X(-80), -136], [X(-112), -214], 38, c.point || c.base, lw) + beans(X(-116), -226, 26, c, lw, -14);
  s += leg([X(70), -140], [X(66), -230], 38, c.point || c.base, lw) + beans(X(66), -242, 26, c, lw, 0);
  return { s, head: [X(-184), -78], headK: 1, headRot: 28 + rock };
}
const POSES = { sit: poseSit, paw: (c, o) => poseSit(c, o, true), loaf: poseLoaf, walk: poseWalk, sleep: poseSleep, pounce: posePounce, lie: poseLie };
const DEFAULT_MOOD = { sit: 'lazy', paw: 'surprised', loaf: 'lazy', walk: 'smug', sleep: 'sleep', pounce: 'happy', lie: 'happy' };

function drawCat(c, opts) {
  const { x = 0, y = 0, s = 1, t = 0, pose = 'sit', flip = false, rot = 0 } = opts;
  const lw = 9 / Math.pow(Math.max(0.05, s), 0.35);
  const fn = POSES[pose] || poseSit;
  let mood = pose === 'sleep' ? 'sleep' : (opts.mood || DEFAULT_MOOD[pose] || 'lazy');
  if (!MOODS[mood]) mood = 'lazy';
  const o = { lw, t, bw: opts.bw || 1, keyboard: opts.keyboard, zzz: opts.zzz, puff: MOODS[mood].puff };
  const r = fn(c, o);
  let head = catHead(c, { lw, mood, look: opts.look, blink: opts.blink || 0, mouth: opts.mouth, crown: opts.crown, collar: opts.collar, blush: opts.blush });
  if (pose === 'paw') {
    // raised paw beside the head, palm (toe beans) to camera
    const up = 1 + 0.04 * Math.sin(t * 7);
    head += '';
    r.s += leg([50, -150], [132, -300 * up], 42, c.point || c.base, lw);
    r.after = (r.after || '') + beans(138, -318 * up, 36, c, lw, 14);
  }
  const hk = r.headK || 1;
  let out = r.s + S.g(head, `translate(${P(r.head)}) rotate(${f(r.headRot || 0)}) scale(${f(hk)})`) + (r.after || '');
  const sc = s * K;
  const shadow = opts.shadow === false ? '' : S.ellipse(x, y + 2 * sc, (pose === 'walk' || pose === 'lie' || pose === 'sleep' || pose === 'loaf' ? 190 : pose === 'pounce' ? 150 : 150) * sc, 18 * sc, { fill: 'rgba(0,0,0,0.16)' });
  return shadow + S.g(out, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(flip ? -sc : sc)} ${f(sc)})`);
}

// Pancake: the family cat
function pancake(opts = {}) {
  return drawCat(COATS.orange, { mood: undefined, ...opts, bw: 1.06 });
}
// any city cat
function cat(opts = {}) {
  const seed = opts.seed ?? 0;
  const c = COATS[opts.coat] || COATS[['black', 'white', 'grey', 'calico', 'siamese', 'tabby'][Math.floor(hash(seed + 1) * 6)]];
  const collar = hash(seed * 3.7 + 2) > 0.55 ? ['#E8453C', '#2E7BFF', '#3BD16F', '#B45CFF', '#FF8A2A'][Math.floor(hash(seed * 5.1) * 5)] : null;
  return drawCat(c, { collar, ...opts, bw: 0.84 + hash(seed * 1.9 + 4) * 0.12 });
}

module.exports = { pancake, cat, DEFS, COATS, tinyCrown };
