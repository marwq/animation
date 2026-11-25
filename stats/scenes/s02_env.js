// Private helpers for SC 02 · MEET EVERYONE: transitions (whip, smash, zoom lines, iris), the SCRAPBOOK freeze-frame
// character intros (the live frame snaps into a taped photo print + a stitched name label + a doodled arrow — deliberately
// nothing like the cyan stat HUD that arrives in SC 03), thought bubbles, the streamer facecam, the hero's controller,
// the cartoon tornado (Max), the 1979 flashback (young Lou + sepia film), Tank's redacted file, and the original fantasy
// game world "DRAGON PEAK" (meadow, the peak, slime / shroom / bat / goblin / dragon, a chest of items, RPG badges, tooltips,
// boss bar, fire breath) that the hero plays at the start and the end of the scene.
'use strict';

const K = require('./kit');
const G = require('./gameui');
const CAST = require('../rig/cast');
const BODY = require('../rig/body');
const R6 = require('../rig/r6');
const L3 = require('../rig/looks3'), L4 = require('../rig/looks4'), L5 = require('../rig/looks5'), L6 = require('../rig/looks6'), L7 = require('../rig/looks7');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, view } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const scAt = (inner, x, y, k) => (k <= 0.001 ? '' : Math.abs(k - 1) < 1e-4 ? inner : S.g(inner, `translate(${f(x)} ${f(y)}) scale(${f(k)}) translate(${f(-x)} ${f(-y)})`));
const op = (v) => ({ opacity: f(clamp(v, 0, 1)) });
const textW = (s, size, font = 'L') => String(s).length * size * (font === 'L' ? 0.56 : 0.58);
function shakeAll(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
// squash/stretch impulse after t0 -> { sx, sy }
function boing(t, t0, amp = 0.22, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s02c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
const dim = (k, col = '#10142A') => (k > 0.001 ? S.rect(-20, -20, W + 40, HH + 40, 0, { fill: col, opacity: f(clamp(k, 0, 1)) }) : '');

// ---------------------------------------------------------------- transitions
function whip(t, tc, dir = 1, dur = 0.12) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * HH, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(0.55 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 900;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
function streaks(t, y0, y1, n, seed, col = '#FFFFFF', opv = 0.6, speed = 2600, dir = -1) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = lerp(y0, y1, hash(i * 2.3 + seed)), len = 160 + hash(i * 5.7 + seed) * 380, th = 5 + hash(i * 1.1 + seed) * 9;
    const x = (((hash(i * 7.9 + seed) * 2600 + dir * t * speed * (0.6 + 0.8 * hash(i + seed))) % 2600) + 2600) % 2600 - 340;
    d += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(opv) });
}
// iris: a dark frame with a round hole of radius r around (cx, cy) (r huge = open)
function iris(cx, cy, r, col = '#0B0B12') {
  if (r > 2300) return '';
  const R_ = Math.max(0.5, r);
  return S.path(`M-20 -20 H${W + 20} V${HH + 20} H-20 Z M${f(cx - R_)} ${f(cy)} a${f(R_)} ${f(R_)} 0 1 0 ${f(2 * R_)} 0 a${f(R_)} ${f(R_)} 0 1 0 ${f(-2 * R_)} 0 Z`, { fill: col, 'fill-rule': 'evenodd' });
}
// simple full-screen rewind landing (SC 01 ended with the rewind collapsing to a point): scanlines + streaks fading out
function rewindTail(t, k) {
  if (k <= 0) return '';
  let o = S.rect(0, 0, W, HH, 0, { fill: '#3A2A7A', opacity: f(0.25 * k) });
  let st = '';
  const step = Math.floor(t * 30);
  for (let i = 0; i < 14; i++) { const yy = hash(i * 5 + step * 1.3) * HH, xx = hash(i * 9 + step * 0.7) * W, l = 140 + hash(i + step) * 380; st += `M${f(xx)} ${f(yy)}h${f(l)}v5h${f(-l)}Z`; }
  o += S.path(st, { fill: '#FFFFFF', opacity: f(0.6 * k) });
  return o;
}
// CRT power-off: the picture collapses to a white line then a dot (k 0..1) — drawn over a screen rect
function crtOff(x, y, w, h, k) {
  if (k <= 0) return '';
  const a = seg(k, 0, 0.55), b = seg(k, 0.55, 1);
  let o = S.rect(x, y, w, h, 0, { fill: '#05060A', opacity: f(Math.min(1, k * 2.2)) });
  const lh = lerp(h, 6, ease.in(a)), lw = lerp(w, 10, ease.in(b));
  if (b < 1) o += S.rect(x + w / 2 - lw / 2, y + h / 2 - lh / 2, lw, lh, Math.min(lh, lw) / 2, { fill: '#FFFFFF', opacity: f(0.85 * (1 - b * 0.6)) });
  return o;
}

// ---------------------------------------------------------------- SCRAPBOOK freeze-frame intro
// the live frame (inner, full 1920x1080) snaps into a taped photo print on craft paper. k 0..1 (in; run back to 0 to release)
function snapshot(inner, k, o = {}) {
  if (k <= 0.001) return inner;
  const e = ease.outBack(clamp(k, 0, 1)), el = clamp(k, 0, 1);
  const sc = lerp(1, o.scale ?? 0.84, e), rot = lerp(0, o.rot ?? -1.8, e);
  const cx = 960 + (o.dx || 0) * el, cy = (o.cy ?? 515);
  const tr_ = `translate(${f(cx)} ${f(cy)}) rotate(${f(rot)}) scale(${f(sc)}) translate(-960 -540)`;
  let out = S.rect(-20, -20, W + 40, HH + 40, 0, { fill: o.paper || '#EFD9B4' }) + S.rect(-20, -20, W + 40, HH + 40, 0, { fill: 'url(#s02Paper)', opacity: 0.9 });
  const bw = 30;
  let photo = S.rect(-bw + 22, -bw + 30, W + 2 * bw, HH + 2 * bw, 8, { fill: '#000', opacity: 0.22 });
  photo += S.rect(-bw, -bw, W + 2 * bw, HH + 2 * bw, 8, { fill: '#FFFDF6', stroke: '#C9B48E', 'stroke-width': 3 });
  photo += clipTo(0, 0, W, HH, inner);
  photo += S.rect(0, 0, W, HH, 0, { fill: 'none', stroke: '#D8C8A8', 'stroke-width': 3 });
  // tape strips on two corners
  photo += S.g(S.rect(-110, -34, 220, 68, 4, { fill: '#F4E7B8', opacity: 0.82, stroke: '#D8C890', 'stroke-width': 2 }), tf(30, 10, 1, -38));
  photo += S.g(S.rect(-110, -34, 220, 68, 4, { fill: '#F4E7B8', opacity: 0.82, stroke: '#D8C890', 'stroke-width': 2 }), tf(W - 30, HH - 10, 1, -38));
  out += S.g(photo, tr_);
  // the shutter flash right at the freeze
  if (k < 0.45) out += S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(0.8 * (1 - k / 0.45)) });
  return out;
}
// where a point of the live frame lands inside the snapshot (to aim the doodled arrow at a face)
function snapPoint(x, y, k, o = {}) {
  const e = ease.outBack(clamp(k, 0, 1));
  const sc = lerp(1, o.scale ?? 0.84, e), rot = (lerp(0, o.rot ?? -1.8, e) * Math.PI) / 180;
  const cx = 960 + (o.dx || 0) * clamp(k, 0, 1), cy = (o.cy ?? 515);
  const dx = (x - 960) * sc, dy = (y - 540) * sc;
  return [cx + dx * Math.cos(rot) - dy * Math.sin(rot), cy + dx * Math.sin(rot) + dy * Math.cos(rot)];
}
// the stitched name label: big name + sub ribbon; tape on top. (x, y) = label centre, k pop-in, out fold-away
function nameCard(o = {}) {
  const { x = 960, y = 200, name = 'YOU', sub = '', col = '#E8453C', rot = -4, size = 96, subSize = 34, t = 0 } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  const nw = textW(name, size, 'L') + 90, sw = sub ? textW(sub, subSize, 'F') + 70 : 0;
  const w = Math.max(nw, sw + 20, 260), h = size * 1.32;
  let c = S.rect(-w / 2 + 10, -h / 2 + 14, w, h, 22, { fill: '#000', opacity: 0.2 });
  c += S.rect(-w / 2, -h / 2, w, h, 22, ol(col, 7));
  c += S.rect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 14, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 4, 'stroke-dasharray': '16 11', opacity: 0.9 });
  c += TS(name, 0, size * 0.36, size, '#FFFFFF', { 'letter-spacing': 2 });
  if (sub) {
    const sk = ease.outBack(seg(k, 0.35, 1));
    if (sk > 0.01) {
      let r = S.rect(-sw / 2, 0, sw, subSize * 1.7, 12, ol('#FFF6E2', 5)) + TF(sub, 0, subSize * 1.17, subSize, '#2A2030');
      if (o.redact) {   // black bars wipe over the sub-text, letter by letter
        const rk = clamp(o.redact, 0, 1);
        r += S.rect(-sw / 2 + 22, subSize * 0.38, (sw - 44) * rk, subSize * 0.95, 4, { fill: '#151515' });
      }
      c += S.g(r, `translate(0 ${f(h / 2 - 8)}) rotate(${f(3)}) scale(${f(sk)})`);
    }
  }
  c += S.g(S.rect(-70, -22, 140, 44, 4, { fill: '#F4E7B8', opacity: 0.85, stroke: '#D8C890', 'stroke-width': 2 }), tf(-w / 2 + 40, -h / 2 + 4, 1, -24));
  c += S.g(S.rect(-70, -22, 140, 44, 4, { fill: '#F4E7B8', opacity: 0.85, stroke: '#D8C890', 'stroke-width': 2 }), tf(w / 2 - 40, -h / 2 + 4, 1, 22));
  const sl = k < 0.5 ? lerp(1.9, 0.92, ease.in(k / 0.5)) : lerp(0.92, 1, ease.outBack(seg(k, 0.5, 1)));
  const rr = rot + (1 - k) * 14;
  return S.g(c, `translate(${f(x)} ${f(y - 60 * ease.in(out))}) rotate(${f(rr)}) scale(${f(sl * (1 - out * 0.3))})`, op(seg(k, 0, 0.12) * (1 - out)));
}
// a doodled marker arrow from (x0, y0) bending to (x1, y1); k = draw progress
function doodleArrow(x0, y0, x1, y1, k, o = {}) {
  if (k <= 0.01) return '';
  const { bend = 0.3, col = '#FFFFFF', w = 12 } = o;
  const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
  const N = 24, n = Math.max(2, Math.round(N * clamp(k, 0, 1)));
  const pts = [];
  for (let i = 0; i <= n; i++) { const u = i / N; pts.push([(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1]); }
  const d = 'M' + pts.map(([a, b]) => `${f(a)} ${f(b)}`).join(' L');
  let c = S.path(d, ln(w + 9, LINE)) + S.path(d, ln(w, col));
  if (k > 0.85) {
    const [ax, ay] = pts[pts.length - 1], [bx, by] = pts[pts.length - 2];
    const a = Math.atan2(ay - by, ax - bx), L = 44 * seg(k, 0.85, 1);
    const hd = `M${f(ax - L * Math.cos(a - 0.5))} ${f(ay - L * Math.sin(a - 0.5))} L${f(ax)} ${f(ay)} L${f(ax - L * Math.cos(a + 0.5))} ${f(ay - L * Math.sin(a + 0.5))}`;
    c += S.path(hd, ln(w + 9, LINE)) + S.path(hd, ln(w, col));
  }
  return c;
}
// small hand-lettered doodle note ("← this one")
const doodleNote = (txt, x, y, k, size = 44, rot = -6, col = '#FFFFFF') => (k > 0.01 ? S.g(TFS(txt, 0, 0, size, col), tf(x, y, ease.outBack(clamp(k, 0, 1)), rot)) : '');

// ---------------------------------------------------------------- thought bubble (cloud) with an inner drawing
function thought(o = {}) {
  const { x = 960, y = 300, r = 110, tail = null, inner = '', t = 0, seed = 1 } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  let d = '';
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = r * (0.42 + 0.08 * hash(i + seed)), wob = Math.sin(t * 2 + i) * 3;
    d += `M${f(Math.cos(a) * r * 0.78 + rr)} ${f(Math.sin(a) * r * 0.62 + wob)} a${f(rr)} ${f(rr)} 0 1 0 ${f(-2 * rr)} 0 a${f(rr)} ${f(rr)} 0 1 0 ${f(2 * rr)} 0 Z`;
  }
  let c = S.path(d, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 7 }) + S.ellipse(0, 0, r * 0.95, r * 0.75, { fill: '#FFFFFF' });
  if (tail) {
    const [tx, ty] = [tail[0] - x, tail[1] - y];
    for (let i = 0; i < 2; i++) { const u = 0.55 + i * 0.25, rr = r * (0.16 - i * 0.06); c += S.circle(tx * u, ty * u, rr, ol('#FFFFFF', 5)); }
  }
  c += inner;
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(k) * (1 - out))})`);
}

// ---------------------------------------------------------------- the hero's game controller (centre, s)
function controller(x, y, s = 1, rot = 0, t = 0, press = 0) {
  let c = S.path('M-118 -34 Q-118 -60 -88 -60 L88 -60 Q118 -60 118 -34 L136 42 Q142 72 112 72 Q92 72 80 46 L60 20 L-60 20 L-80 46 Q-92 72 -112 72 Q-142 72 -136 42 Z', ol('#3A3F52', 6));
  c += S.path('M-96 -48 L-40 -48', ln(6, '#5A6078', 0.9));
  c += S.path('M-86 -24 h28 M-72 -38 v28', ln(11, '#151515'));
  const pr = (i) => (press && Math.floor(t * 12 + i) % 3 === 0 ? 0.75 : 1);
  c += S.circle(72, -36, 9 * pr(0), ol('#3BD16F', 3)) + S.circle(92, -20, 9 * pr(1), ol('#E8453C', 3)) + S.circle(52, -20, 9 * pr(2), ol('#34A3FF', 3)) + S.circle(72, -4, 9 * pr(3), ol('#FFD21F', 3));
  c += S.circle(-30, 4, 13, ol('#22252F', 4)) + S.circle(30, 4, 13, ol('#22252F', 4));
  c += S.rect(-10, -44, 20, 8, 4, { fill: Math.floor(t * 2) % 2 ? '#7CF7FF' : '#3BD16F' });
  return S.g(c, tf(x, y, s, rot));
}

// ---------------------------------------------------------------- streamer facecam (screen space): frame at (x, y, w, h)
function facecam(o = {}) {
  const { x = 1480, y = 560, w = 400, h = 300, t = 0, inner = '', live = true } = o;
  const k = clamp(o.k ?? 1, 0, 1);
  if (k <= 0.001) return '';
  const cols = ['#FF4FB8', '#B06BFF', '#34C3FF', '#3BD16F', '#FFD21F', '#FF8A2B'];
  const ci = Math.floor(t * 3) % cols.length;
  let c = S.rect(10, 14, w, h, 26, { fill: '#000', opacity: 0.3 });
  c += S.rect(-8, -8, w + 16, h + 16, 30, { fill: cols[ci], stroke: LINE, 'stroke-width': 6 });
  c += clipTo(0, 0, w, h, S.rect(0, 0, w, h, 0, { fill: '#2A6E78' }) + inner, 22);
  c += S.rect(0, 0, w, h, 22, { fill: 'none', stroke: LINE, 'stroke-width': 5 });
  if (live) c += S.rect(16, 16, 112, 42, 21, ol('#E8453C', 4)) + S.circle(40, 37, 8, { fill: '#FFFFFF', opacity: Math.floor(t * 2) % 2 ? 1 : 0.4 }) + TF('LIVE', 84, 50, 28, '#FFFFFF');
  const sc = ease.outBack(k);
  return S.g(c, `translate(${f(x + w / 2)} ${f(y + h / 2)}) scale(${f(sc)}) translate(${f(-w / 2)} ${f(-h / 2)})`);
}

// ---------------------------------------------------------------- Max the TORNADO (x, y = floor point), k 0..1 spin-up, t
function tornado(x, y, s, t, k = 1, inner = '') {
  if (k <= 0.01) return '';
  const hgt = 820 * s, top = 340 * s;
  let bands = '';
  for (let i = 0; i < 9; i++) {
    const u = i / 8, yy = -hgt * u, wd = lerp(70 * s, top, Math.pow(u, 1.25));
    const ph = t * 14 + i * 0.9, off = Math.sin(ph) * 24 * s;
    bands += `M${f(-wd + off)} ${f(yy)} Q${f(off)} ${f(yy + 34 * s)} ${f(wd + off)} ${f(yy)} `;
  }
  let c = S.path(`M${f(-70 * s)} 0 Q${f(-top * 0.6)} ${f(-hgt * 0.55)} ${f(-top)} ${f(-hgt)} L${f(top)} ${f(-hgt)} Q${f(top * 0.6)} ${f(-hgt * 0.55)} ${f(70 * s)} 0 Z`, { fill: '#9AD97E', opacity: 0.55, stroke: LINE, 'stroke-width': 5 });
  c += S.path(bands, ln(10 * Math.max(0.6, s / 0.5), '#5DBB4A', 0.95)) + S.path(bands, ln(4, '#FFFFFF', 0.6));
  c += inner;
  // debris: cereal O's and spikes flung round
  let deb = '';
  for (let i = 0; i < 10; i++) {
    const a = t * (9 + i) + i * 1.7, rr = (top * 0.8 + 40 * s * hash(i)), yy = -hgt * (0.15 + 0.75 * hash(i * 3.3));
    deb += `M${f(Math.cos(a) * rr + 12 * s)} ${f(yy + Math.sin(a) * 30 * s)} a${f(12 * s)} ${f(12 * s)} 0 1 0 ${f(-24 * s)} 0 a${f(12 * s)} ${f(12 * s)} 0 1 0 ${f(24 * s)} 0 Z `;
  }
  c += S.path(deb, { fill: '#FFC93C', stroke: LINE, 'stroke-width': 3 });
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(k))} 1)`);
}

// ---------------------------------------------------------------- 1979: young Lou (dark pompadour + dark walrus moustache, striped tank)
const design = (style) => L7.dress7(L6.dress6(L5.dress5(L4.dress4(L3.dress(R6.makeDesign(style))))));
const LOU79 = design({
  hair: 'pompadour', eyeStyle: 'dot', top: 'stripeTee', sleeve: 'short', pantsShape: 'straight', size: 1.1, torsoW: 112, shoe: 'sneaker', bicep: true,
  eye: { pupil: 1.0 }, brows: { L: [8, -2], R: [8, -2] }, neutralMouth: 'smile',
  acc: { hugeWalrus: 1.05, cheekBlush: '#FF9F8F' },
  col: {
    skin: '#F2C29E', skinShade: '#DDA884', skinShade2: '#C48A68', hair: '#4A2E1E', hairShade: '#2E1A10', hairHi: '#7A5038', brow: '#3A2214', stache: '#4A2E1E', stacheHi: '#6E4A34',
    top: '#FFFFFF', topShade: '#E4E4EC', sleeve: '#FFFFFF', stripe: '#E8453C', accent: '#E8453C', pants: '#3A5A9A', pantsShade: '#2E4A80', sole: '#FFFFFF', soleShade: '#E0E0EA', toe: '#E8453C',
  },
});
const youngLou = (pose) => BODY.drawCharacter(LOU79, { shade: true, shadow: true, ...pose, nametag: null });
// old-film treatment over a full frame: sepia wash, flicker, scratches, dust, rounded vignette frame
function oldFilm(t, k = 1) {
  if (k <= 0) return '';
  const fl = 0.04 * Math.sin(t * 47) + 0.03 * hash(Math.floor(t * 24));
  let o = S.rect(0, 0, W, HH, 0, { fill: '#C89A5A', opacity: f((0.34 + fl) * k) }) + S.rect(0, 0, W, HH, 0, { fill: '#3A2410', opacity: f(0.1 * k) });
  const step = Math.floor(t * 24);
  let sc = '';
  for (let i = 0; i < 3; i++) { const xx = hash(i * 7 + step) * W; sc += `M${f(xx)} 0 L${f(xx + (hash(i + step) - 0.5) * 30)} ${HH}`; }
  o += S.path(sc, ln(2.5, '#FFF4DC', 0.55 * k));
  let dust = '';
  for (let i = 0; i < 12; i++) { const xx = hash(i * 3 + step * 1.7) * W, yy = hash(i * 5 + step * 2.3) * HH, r = 2 + hash(i * 11 + step) * 5; dust += `M${f(xx)} ${f(yy)} m${f(-r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`; }
  o += S.path(dust, { fill: '#2A1A0A', opacity: f(0.5 * k) });
  o += S.path(`M-20 -20 H${W + 20} V${HH + 20} H-20 Z M80 60 H${W - 80} Q${W - 30} 60 ${W - 30} 110 V${HH - 110} Q${W - 30} ${HH - 60} ${W - 80} ${HH - 60} H80 Q30 ${HH - 60} 30 ${HH - 110} V110 Q30 60 80 60 Z`, { fill: '#140C06', 'fill-rule': 'evenodd', opacity: f(0.9 * k) });
  return o;
}

// ---------------------------------------------------------------- Tank's redacted file (screen space, x, y = centre)
function tankFile(o = {}) {
  const { x = 1400, y = 360, t = 0, rows = 3, big = 0 } = o;
  const k = clamp(o.k ?? 1, 0, 1), out = clamp(o.out || 0, 0, 1);
  if (k <= 0.001 || out >= 1) return '';
  const w = 560, h = 400;
  let c = S.rect(-w / 2 + 10, -h / 2 + 14, w, h, 10, { fill: '#000', opacity: 0.25 });
  c += S.path(`M${-w / 2} ${-h / 2 + 30} L${-w / 2 + 20} ${-h / 2} L${-w / 2 + 200} ${-h / 2} L${-w / 2 + 220} ${-h / 2 + 30} L${w / 2} ${-h / 2 + 30} L${w / 2} ${h / 2} L${-w / 2} ${h / 2} Z`, ol('#E8C27A', 6));
  c += TF('FILE: TANK', -w / 2 + 110, -h / 2 + 24, 26, '#5A3A12');
  c += S.rect(-w / 2 + 24, -h / 2 + 46, w - 48, h - 70, 6, ol('#FFFBEF', 4));
  const lab = ['REAL NAME', 'AGE', 'HOBBIES', 'FEARS'];
  for (let i = 0; i < 4; i++) {
    const yy = -h / 2 + 100 + i * 66;
    c += TF(lab[i] + ':', -w / 2 + 50, yy, 26, '#5A4A3A', { 'text-anchor': 'start' });
    const rk = clamp(rows - i, 0, 1);
    if (rk > 0) c += S.rect(-w / 2 + 210, yy - 24, (w - 260) * ease.out(rk) * (0.7 + 0.3 * hash(i * 3.3)), 30, 4, { fill: '#151515' });
  }
  if (big > 0) c += S.g(G.stamp({ text: 'BIG', x: 0, y: 0, k: big, col: '#D7263D', size: 120, rot: -14 }), 'translate(70 40)');
  return S.g(c, `translate(${f(x)} ${f(y + 30 * ease.in(out))}) rotate(${f(3 - 6 * (1 - k))}) scale(${f(ease.outBack(k) * (1 - out * 0.2))})`, op(1 - out));
}

// ================================================================= DRAGON PEAK — the hero's game (an original fantasy world)
// World units: screen px at zoom 1; characters stand on GW.ground (900). Layers: sky (screen) · far (k .2) · hills (k .5) ·
// ground (k 1) · fg (k 1.3). Characters / creatures / items are drawn by the scene with view(cam, svg, 1).
const GW = { ground: 900, peakX: 2950, chestX: 1650 };
const DEFS = '<defs>' +
  '<linearGradient id="s02Sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5EC2FF"/><stop offset="0.75" stop-color="#C9EEFF"/><stop offset="1" stop-color="#EFFAFF"/></linearGradient>' +
  '<linearGradient id="s02SkyRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A0E2A"/><stop offset="0.7" stop-color="#B8342A"/><stop offset="1" stop-color="#FF8A3A"/></linearGradient>' +
  '<linearGradient id="s02Night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1438"/><stop offset="1" stop-color="#2A3A78"/></linearGradient>' +
  '<pattern id="s02Paper" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="12" cy="14" r="3.2" fill="#D6BB8C"/><circle cx="44" cy="42" r="2.6" fill="#D6BB8C"/><path d="M30 8 l6 3" stroke="#D6BB8C" stroke-width="2.5" stroke-linecap="round"/></pattern>' +
  '</defs>';
const GC = { line: LINE, grass: '#7CCB5A', grassD: '#5AA840', grassL: '#A6E07E', dirt: '#E2B878', dirtD: '#C99A5A', hill: '#9AD86E', hillD: '#74BC52', far: '#9A86C8', farD: '#7A66AA', peak: '#5A3E7A', peakD: '#3E2A5A' };
// rolling ridge path between x0..x1 around base y with amplitude
function ridge(x0, x1, base, amp, seed, step = 120, bottom = 2600) {
  let d = `M${x0} ${bottom} L${x0} ${f(base)}`;
  for (let x = x0; x <= x1; x += step) d += ` L${x} ${f(base - amp * (0.5 + 0.5 * Math.sin(x * 0.0021 + seed) * Math.cos(x * 0.0013 + seed * 2)))}`;
  return d + ` L${x1} ${bottom} Z`;
}
function cloud(x, y, s, col = '#FFFFFF') {
  return S.g(S.path('M-90 20 Q-110 -10 -70 -20 Q-60 -60 -10 -50 Q20 -80 60 -50 Q110 -50 100 -10 Q130 10 100 26 Z', { fill: col, stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' }), tf(x, y, s));
}
function gTree(x, y, s, sway = 0) {
  let c = S.path('M-18 0 L-14 -150 L14 -150 L18 0 Z', ol('#8A5A34', 5));
  c += S.g(S.circle(-60, -190, 70, ol('#4FA83A', 5)) + S.circle(60, -200, 66, ol('#4FA83A', 5)) + S.circle(0, -260, 84, ol('#5DBB4A', 5)) + S.circle(-24, -282, 26, { fill: '#8AD872', opacity: 0.8 }), `rotate(${f(sway)} 0 -150)`);
  return S.g(c, tf(x, y, s));
}
function signpost(x, y, s = 1) {
  let c = S.rect(-12, -230, 24, 230, 4, ol('#8A5A34', 5));
  c += S.g(S.path('M-120 -30 L90 -30 L120 0 L90 30 L-120 30 Z', ol('#C98A4A', 5)) + TF('DRAGON PEAK', -14, 12, 30, '#3A2410'), 'translate(0 -186)');
  c += S.g(S.path('M120 -26 L-90 -26 L-120 0 L-90 26 L120 26 Z', ol('#C98A4A', 5)) + TF('VILLAGE', 10, 11, 28, '#3A2410'), 'translate(0 -116)');
  return S.g(c, tf(x, y, s));
}
function rock(x, y, s) { return S.g(S.path('M-50 0 Q-60 -40 -20 -56 Q20 -66 46 -36 Q60 -14 50 0 Z', ol('#A8A8B8', 5)) + S.path('M-24 -40 Q-6 -50 12 -44', ln(5, '#D4D4E0')), tf(x, y, s)); }
function flower(x, y, s, col) { return S.g(S.path('M0 0 V-34', ln(4, '#3A8A2A')) + S.circle(0, -40, 11, ol(col, 3)) + S.circle(0, -40, 4, { fill: '#FFE14D' }), tf(x, y, s)); }
// THE PEAK: tall jagged mountain, red glow + smoke at the summit (world x, base y), danger 0..1 makes it glow harder
function peak(x, y, t, danger = 0) {
  let c = S.path('M-700 0 L-420 -360 L-330 -300 L-170 -640 L-90 -560 L0 -760 L70 -620 L150 -690 L320 -330 L420 -400 L720 0 Z', ol(GC.peak, 7));
  c += S.path('M0 -760 L-60 -600 L-10 -630 L30 -560 L70 -620 Z M-170 -640 L-200 -560 L-150 -580 Z M150 -690 L120 -600 L170 -620 Z', { fill: '#F2EEFF', stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  c += S.path('M-420 -360 L-380 -250 M-90 -560 L-120 -380 L-60 -200 M320 -330 L280 -150', ln(6, GC.peakD, 0.8));
  const gl = 0.35 + 0.65 * danger;
  c += S.ellipse(0, -770, 150 + 60 * danger, 70 + 20 * danger, { fill: '#FF6A3A', opacity: f(0.35 * gl) }) + S.ellipse(0, -770, 70, 34, { fill: '#FFC24A', opacity: f(0.5 * gl) });
  let sm = '';
  for (let i = 0; i < 5; i++) { const u = ((t * 0.25 + i / 5) % 1), r = 30 + 60 * u; sm += `M${f(30 * Math.sin(u * 5 + i) + 80 * u + r)} ${f(-790 - 260 * u)} a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 Z`; }
  c += S.path(sm, { fill: '#6A5A7A', opacity: 0.45 });
  return S.g(c, tf(x, y, 1));
}
// scenery: { sky, far, hills, ground, fg } already camera-transformed; o.danger 0..1 (red sky, glow), o.night
function gameWorld(t, cam, o = {}) {
  const danger = clamp(o.danger || 0, 0, 1);
  let sky = S.rect(-40, -40, W + 80, HH + 80, 0, { fill: o.night ? 'url(#s02Night)' : 'url(#s02Sky)' });
  if (danger > 0) sky += S.rect(-40, -40, W + 80, HH + 80, 0, { fill: 'url(#s02SkyRed)', opacity: f(danger) });
  let sun = danger < 1 && !o.night ? S.circle(1420, 210, 70, { fill: '#FFF3A0', stroke: '#FFD24A', 'stroke-width': 8, opacity: f(1 - danger) }) : '';
  let cl = '';
  for (let i = 0; i < 7; i++) cl += cloud(-600 + i * 760 + ((t * 18) % 760), 140 + 90 * hash(i * 2.2), 0.7 + 0.5 * hash(i), danger > 0.5 ? '#E8B0A8' : '#FFFFFF');
  const far = S.path(ridge(-3000, 8000, 640, 170, 1.3, 140), ol(GC.far, 6)) + peak(GW.peakX, 620, t, danger) + S.path(ridge(-3000, 8000, 700, 90, 4.1, 160), { fill: GC.farD, opacity: 0.55 });
  let hills = S.path(ridge(-3000, 8000, 760, 120, 2.7, 110), ol(GC.hill, 6)) + S.path(ridge(-3000, 8000, 800, 60, 5.2, 130), { fill: GC.hillD, opacity: 0.6 });
  for (let i = 0; i < 12; i++) hills += gTree(-1400 + i * 640 + 200 * hash(i * 3.1), 760 + 30 * hash(i), 0.45, 0);
  // ground: grass slab + winding path + props
  let g = S.path(`M-3000 ${2600} L-3000 790 ${Array.from({ length: 60 }, (_, i) => `L${-3000 + i * 180} ${f(790 + 10 * Math.sin(i * 1.7))}`).join(' ')} L8000 790 L8000 2600 Z`, ol(GC.grass, 7));
  g += S.path('M-3000 862 Q-1500 840 0 868 Q1500 894 3000 860 Q4500 830 8000 866 L8000 972 Q4500 950 3000 978 Q1500 1004 0 974 Q-1500 948 -3000 970 Z', ol(GC.dirt, 6));
  g += S.path('M-2600 920 h60 M-1800 900 h80 M-900 950 h50 M300 930 h70 M1200 950 h60 M2100 920 h80 M3000 940 h60 M3800 905 h70', ln(6, GC.dirtD, 0.8));
  for (const [x, s] of [[-900, 1.05], [520, 1.15], [2300, 1.1], [3700, 1.2], [-2200, 1.1]]) g += gTree(x, 830, s, Math.sin(t * 1.3 + x) * 1.5);
  g += signpost(150, 880, 1);
  for (const [x, s] of [[-500, 0.9], [1150, 1.1], [2700, 0.8], [3300, 1]]) g += rock(x, 846, s);
  const fcol = ['#FF6FB5', '#FFE14D', '#FFFFFF', '#B06BFF'];
  for (let i = 0; i < 26; i++) g += flower(-2400 + i * 260 + 90 * hash(i), 820 + 26 * hash(i * 1.9), 1, fcol[i % 4]);
  let fg = '';
  for (let i = 0; i < 18; i++) { const x = -2000 + i * 420 + 120 * hash(i * 7.7); fg += `M${f(x - 50)} 1100 Q${f(x - 30)} 1030 ${f(x - 10)} 1060 Q${f(x)} 1000 ${f(x + 14)} 1058 Q${f(x + 30)} 1020 ${f(x + 50)} 1100 Z `; }
  fg = S.path(fg, ol(GC.grassD, 5));
  return { sky: sky + view(cam, sun, 0.03) + view(cam, cl, 0.08), far: view(cam, far, 0.2), hills: view(cam, hills, 0.5), ground: view(cam, g, 1), fg: view(cam, fg, 1.3) };
}

// ---------------------------------------------------------------- creatures (x, y = feet, s = scale; they face screen-left)
function eye2(x, y, r, look = -0.4, o = {}) {
  let c = S.ellipse(x, y, r, r * 1.1, ol('#FFFFFF', 4));
  if (o.x) return S.path(`M${f(x - r * 0.6)} ${f(y - r * 0.6)} L${f(x + r * 0.6)} ${f(y + r * 0.6)} M${f(x + r * 0.6)} ${f(y - r * 0.6)} L${f(x - r * 0.6)} ${f(y + r * 0.6)}`, ln(6));
  c += S.circle(x + look * r * 0.45, y + r * 0.1, r * 0.52, { fill: o.iris || LINE }) + S.circle(x + look * r * 0.45 - r * 0.18, y - r * 0.12, r * 0.16, { fill: '#FFFFFF' });
  return c;
}
function slime(x, y, s, t, o = {}) {
  const q = 0.08 * Math.sin(t * 7 + (o.seed || 0));
  let c = S.ellipse(0, 4, 90, 14, { fill: '#000', opacity: 0.15 });
  c += S.g(S.path('M-86 0 Q-96 -70 -40 -104 Q0 -124 40 -104 Q96 -70 86 0 Z', ol(o.col || '#5CC8FF', 6)) + S.path('M-52 -70 Q-40 -96 -12 -102', ln(9, '#FFFFFF', 0.7)) + eye2(-30, -56, 16, -0.5, o) + eye2(14, -56, 16, -0.5, o) + S.path('M-22 -24 Q-8 -14 6 -24', ln(5)), `scale(${f(1 - q * 0.6)} ${f(1 + q)})`);
  return S.g(c, tf(x, y, s));
}
function shroom(x, y, s, t, o = {}) {
  const st = Math.sin(t * 8 + (o.seed || 0)) * 6;
  let c = S.ellipse(0, 4, 70, 12, { fill: '#000', opacity: 0.15 });
  c += S.path(`M-24 0 L-20 ${f(-20 + st * 0.3)} M24 0 L20 -20`, ln(14, LINE)) + S.path('M-34 -20 Q-40 -100 -20 -110 L20 -110 Q40 -100 34 -20 Z', ol('#FFF0D8', 6));
  c += eye2(-12, -70, 11, -0.5, o) + eye2(14, -70, 11, -0.5, o) + S.path('M-22 -92 L-4 -84 M24 -92 L6 -84', ln(6)) + S.path('M-10 -46 Q2 -52 12 -46', ln(5));
  c += S.path('M-100 -104 Q-96 -190 0 -196 Q96 -190 100 -104 Q0 -86 -100 -104 Z', ol(o.col || '#E8453C', 6)) + S.circle(-50, -150, 16, { fill: '#FFFFFF' }) + S.circle(20, -168, 20, { fill: '#FFFFFF' }) + S.circle(62, -124, 12, { fill: '#FFFFFF' });
  return S.g(c, tf(x, y + st * 0.0, s));
}
function bat(x, y, s, t, o = {}) {
  const fl = Math.sin(t * 16 + (o.seed || 0));
  const wing = (sx) => S.path(`M${sx * 30} -10 Q${sx * 90} ${f(-70 - 40 * fl)} ${sx * 170} ${f(-40 - 60 * fl)} Q${sx * 150} ${f(-10 - 30 * fl)} ${sx * 130} ${f(0 - 20 * fl)} Q${sx * 110} ${f(-10 - 10 * fl)} ${sx * 90} ${f(10 - 10 * fl)} Q${sx * 70} 0 ${sx * 30} 20 Z`, ol('#7A4AA8', 5));
  let c = wing(-1) + wing(1) + S.circle(0, 0, 46, ol('#8A5AC8', 6)) + S.path('M-36 -30 L-30 -74 L-8 -42 Z M36 -30 L30 -74 L8 -42 Z', ol('#8A5AC8', 5));
  c += eye2(-16, -6, 12, -0.4, { iris: '#C8202A', ...o }) + eye2(16, -6, 12, -0.4, { iris: '#C8202A', ...o }) + S.path('M-10 18 L-6 30 L-2 18 M2 18 L6 30 L10 18', { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 3 });
  return S.g(c, tf(x, y - 160 - 20 * Math.sin(t * 3 + (o.seed || 0)), s));
}
// goblin: club 0 = raised over the shoulder … 1 = swung down; hurt true = X eyes; poof 0..1 = turns into a puff + coins
function goblin(x, y, s, t, o = {}) {
  const club = clamp(o.club || 0, 0, 1), bob = Math.sin(t * 9) * 4;
  let c = S.ellipse(0, 4, 110, 16, { fill: '#000', opacity: 0.16 });
  // legs + feet
  c += S.path('M-36 -100 L-40 -8 M34 -100 L38 -8', ln(30, LINE)) + S.path('M-36 -100 L-40 -8 M34 -100 L38 -8', ln(20, '#6AB03C'));
  c += S.ellipse(-56, -6, 42, 18, ol('#5A3A22', 5)) + S.ellipse(24, -6, 42, 18, ol('#5A3A22', 5));
  // tunic + belt
  let b = S.path('M-74 -250 L74 -250 L96 -110 L72 -96 L52 -112 L30 -94 L6 -112 L-18 -94 L-40 -112 L-62 -96 L-96 -110 Z', ol('#8A5A34', 6)) + S.path('M-82 -160 Q0 -146 82 -160', ln(14, '#D8B26A')) + S.circle(0, -153, 13, ol('#F2C24A', 4));
  // back arm (right side) + front arm with the club (left side, toward the hero)
  b += S.path('M66 -230 Q110 -190 104 -140', ln(28, LINE)) + S.path('M66 -230 Q110 -190 104 -140', ln(18, '#6AB03C')) + S.circle(104, -136, 20, ol('#6AB03C', 5));
  const ca = lerp(-150, -20, ease.inOut(club));
  const armEnd = [-66 + 90 * Math.cos(((ca + 90) * Math.PI) / 180) * -1, -230 + 90 * Math.sin(((ca + 90) * Math.PI) / 180)];
  const hx = -66 - 70 * Math.sin((ca * Math.PI) / 180) * -1 * 0 + -40, hy = -240;
  const clubSvg = S.g(S.path('M-14 0 L-22 -170 Q-24 -210 0 -214 Q26 -210 22 -170 L14 0 Z', ol('#9A6A3A', 6)) + S.path('M-22 -150 l-18 -6 M22 -130 l18 -4 M-20 -100 l-16 4 M18 -180 l16 -10 M0 -214 l0 -18', ln(9, '#E8E0D0')) + S.path('M-22 -150 l-18 -6 M22 -130 l18 -4 M-20 -100 l-16 4 M18 -180 l16 -10 M0 -214 l0 -18', ln(3, LINE)) + S.rect(-16, -6, 32, 40, 8, ol('#6AB03C', 5)), `translate(${f(hx)} ${f(hy)}) rotate(${f(ca)})`);
  void armEnd;
  b += clubSvg + S.path(`M-66 -230 L${f(hx)} ${f(hy)}`, ln(28, LINE)) + S.path(`M-66 -230 L${f(hx)} ${f(hy)}`, ln(18, '#6AB03C'));
  // head
  let h = S.path('M-60 -330 L-190 -380 L-80 -296 Z M60 -330 L190 -380 L80 -296 Z', ol('#7CC24A', 6)) + S.path('M-80 -330 L-160 -364 L-90 -310 Z M80 -330 L160 -364 L90 -310 Z', { fill: '#E88A8A' });
  h += S.path('M-110 -300 Q-120 -400 0 -410 Q120 -400 110 -300 Q110 -230 0 -226 Q-110 -230 -110 -300 Z', ol('#7CC24A', 7));
  if (o.hurt) h += eye2(-44, -330, 22, -0.4, { x: true }) + eye2(30, -330, 22, -0.4, { x: true });
  else h += eye2(-44, -330, 22, -0.6, { iris: '#C8202A' }) + eye2(30, -330, 22, -0.6, { iris: '#C8202A' }) + S.path('M-76 -366 L-20 -348 M64 -366 L12 -348', ln(11));
  h += S.ellipse(-14, -296, 26, 20, ol('#68B03A', 5)) + S.circle(60, -280, 5, { fill: '#4A8A2A' }) + S.circle(-70, -296, 4, { fill: '#4A8A2A' });
  h += o.hurt ? S.path('M-50 -258 Q-10 -244 30 -258', ln(7)) + S.path('M-6 -252 Q2 -232 14 -250', ol('#FF7A8A', 4))
    : S.path('M-64 -264 Q-10 -232 50 -264 Q-10 -250 -64 -264 Z', ol('#5A1A1A', 5)) + S.path('M-48 -262 L-42 -282 L-34 -258 M30 -262 L36 -284 L42 -260', { fill: '#FFF8E0', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  c += S.g(b + S.g(h, `translate(0 ${f(bob * 0.5)}) rotate(${f(o.headRot || 0)} 0 -300)`), `translate(0 ${f(bob)})`);
  let out = S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(s * (o.flip ? -1 : 1))} ${f(s)}) rotate(${f(o.rot || 0)})`);
  if (o.poof > 0) {
    const u = clamp(o.poof, 0, 1);
    out = S.g(out, null, op(1 - seg(u, 0, 0.25)));
    let pf = '';
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, d = 80 + 120 * ease.out(u), r = 60 * (1 - u * 0.7); pf += `M${f(x + Math.cos(a) * d * s + r * s)} ${f(y - 220 * s + Math.sin(a) * d * s * 0.8)} a${f(r * s)} ${f(r * s)} 0 1 0 ${f(-2 * r * s)} 0 a${f(r * s)} ${f(r * s)} 0 1 0 ${f(2 * r * s)} 0 Z`; }
    out += S.path(pf, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 5, opacity: f(1 - seg(u, 0.5, 1)) });
  }
  return out;
}
// the DRAGON (head facing screen-left). (x, y) = neck base; s; jaw 0..1 (roar); breath true adds smoke; wing flap with t
function dragon(x, y, s, t, o = {}) {
  const jaw = clamp(o.jaw || 0, 0, 1), fl = Math.sin(t * 3.2) * (o.flap ?? 1);
  const RED = '#D93A3A', REDD = '#A82A30', BELLY = '#FFD27A', MEM = '#7A2A5A';
  const wing = (sx, sc) => S.g(S.path(`M0 0 L${f(260 * sx)} ${f(-420 - 40 * fl)} L${f(520 * sx)} ${f(-300 - 60 * fl)} Q${f(470 * sx)} ${f(-180 - 30 * fl)} ${f(500 * sx)} ${f(-80 - 20 * fl)} Q${f(400 * sx)} -90 ${f(380 * sx)} 0 Q${f(280 * sx)} -60 ${f(220 * sx)} 30 Q${f(120 * sx)} -10 0 60 Z`, ol(MEM, 7)) +
    S.path(`M0 0 L${f(500 * sx)} ${f(-80 - 20 * fl)} M0 0 L${f(380 * sx)} 0 M0 0 L${f(220 * sx)} 30 M${f(260 * sx)} ${f(-420 - 40 * fl)} L${f(520 * sx)} ${f(-300 - 60 * fl)}`, ln(10, REDD)) + S.circle(260 * sx, -420 - 40 * fl, 14, ol('#F4E6C8', 4)), `translate(${f(160)} ${f(-300)}) scale(${f(sc)})`);
  let c = S.g(wing(1, 1.0) + wing(-1, 0.85), 'translate(60 160)');
  // body + neck (thick S from the body up-left to the head) + belly plates + back spikes
  c += S.ellipse(250, 120, 320, 200, ol(RED, 8)) + S.ellipse(150, 150, 170, 120, { fill: BELLY, stroke: LINE, 'stroke-width': 6 });
  c += S.path('M-70 60 Q30 -330 -170 -560 L-30 -660 Q230 -420 250 -10 Z', ol(RED, 8));
  c += S.path('M-46 40 Q46 -330 -146 -552', ln(54, BELLY)) + S.path('M-46 40 Q46 -330 -146 -552', { fill: 'none', stroke: LINE, 'stroke-width': 5, 'stroke-dasharray': '6 52', opacity: 0.6 });
  let sp = '';
  for (let i = 1; i < 8; i++) { const u = i / 8, px = (1 - u) * (1 - u) * 250 + 2 * (1 - u) * u * 230 + u * u * -30, py = (1 - u) * (1 - u) * -10 + 2 * (1 - u) * u * -420 + u * u * -660; sp += `M${f(px - 4)} ${f(py + 22)} L${f(px + 52 - 20 * u)} ${f(py - 6)} L${f(px - 6)} ${f(py - 24)} Z `; }
  c += S.path(sp, ol('#F2B84B', 5));
  // head: skull + snout + lower jaw (rotates open about the hinge)
  const hinge = [-90, -600], ja = 34 * jaw;
  let jawSvg = S.path('M-90 -600 L-330 -600 Q-360 -598 -362 -578 Q-330 -548 -250 -552 L-90 -560 Z', ol(REDD, 7)) + S.path('M-330 -598 L-318 -576 L-300 -598 L-286 -578 L-270 -598 L-254 -578 L-236 -598', { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  c += S.g(jawSvg, `rotate(${f(-ja)} ${hinge[0]} ${hinge[1]})`);
  if (jaw > 0.05) c += S.path(`M-110 -604 L-330 -606 L${f(-330 + 20 * jaw)} ${f(-590 + 60 * jaw)} L-110 -580 Z`, { fill: '#5A0A1A', opacity: 0.9 });
  let hd = S.path('M-40 -700 Q30 -660 20 -590 Q0 -540 -90 -560 L-90 -600 L-340 -604 Q-380 -606 -380 -640 Q-378 -672 -330 -680 L-200 -700 Q-120 -740 -40 -700 Z', ol(RED, 8));
  hd += S.path('M-330 -604 L-316 -626 L-300 -604 L-286 -626 L-270 -604 L-254 -626 L-238 -604', { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  hd += S.ellipse(-350, -654, 9, 6, { fill: LINE }) + S.ellipse(-320, -664, 8, 5, { fill: LINE });
  // horns + brow + eye
  hd += S.path('M-60 -700 Q20 -800 120 -790 Q30 -770 -10 -690 Z M-110 -716 Q-80 -820 10 -850 Q-60 -800 -70 -712 Z', ol('#F4E6C8', 6));
  hd += S.path('M-210 -700 L-120 -712', ln(16)) + S.ellipse(-160, -676, 30, 22, ol('#FFE14D', 5)) + S.ellipse(-166 - 4 * (o.look || 0), -676, 6, 18, { fill: LINE });
  hd += S.path('M-200 -720 L-110 -742 L-120 -716 Z', { fill: REDD, stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' });
  c += hd;
  // nostril smoke
  if (o.smoke !== false) {
    let sm = '';
    for (let i = 0; i < 4; i++) { const u = (t * 0.9 + i / 4) % 1, r = 12 + 26 * u; sm += `M${f(-360 - 60 * u + r)} ${f(-670 - 120 * u)} a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 Z`; }
    c += S.path(sm, { fill: '#5A5A6A', opacity: 0.45 });
  }
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(s * (o.flip ? -1 : 1))} ${f(s)}) rotate(${f(o.rot || 0)})`);
}
// where the dragon's mouth is (world), for the fire breath
const dragonMouth = (x, y, s) => [x - 350 * s, y - 590 * s];
// fire breath cone from (x0, y0) toward angle a (deg), length L, k 0..1 extend, t flicker
function fireBreath(x0, y0, a, L, k, t, wd = 0.32) {
  if (k <= 0.01) return '';
  const len = L * ease.out(clamp(k, 0, 1));
  const cone = (w, col, jit, opv) => {
    const N = 10;
    let up = '', dn = '';
    for (let i = 0; i <= N; i++) {
      const u = i / N, half = len * w * Math.pow(u, 0.8) + 14, j = (hash(i * 3.1 + Math.floor(t * 20)) - 0.5) * jit * u;
      up += ` L${f(u * len)} ${f(-half + j)}`;
      dn = ` L${f(u * len)} ${f(half - j)}` + dn;
    }
    return S.path(`M0 0${up}${dn} Z`, { fill: col, opacity: opv, 'stroke-linejoin': 'round' });
  };
  let c = cone(wd, '#E8341A', 90, 0.9) + cone(wd * 0.72, '#FF8A1A', 70, 0.95) + cone(wd * 0.42, '#FFD84A', 50, 1) + cone(wd * 0.16, '#FFFBE0', 30, 1);
  return S.g(c, `translate(${f(x0)} ${f(y0)}) rotate(${f(a)})`);
}

// ---------------------------------------------------------------- the KNIGHT (the hero's avatar): the hero + a sword + a round shield
function shieldRound(x, y, s = 1, rot = 0) {
  return S.g(S.circle(0, 0, 70, ol('#3A6AD8', 7)) + S.circle(0, 0, 50, { fill: 'none', stroke: '#F2C24A', 'stroke-width': 9 }) + S.path('M0 -30 L9 -9 L31 -9 L13 5 L20 27 L0 14 L-20 27 L-13 5 L-31 -9 L-9 -9 Z', ol('#F2C24A', 4)), tf(x, y, s, rot));
}
function knightProps(pose) {
  const D = CAST.D.you, side = (pose.view === 'side') ? -1 : 1;
  const [hx, hy] = CAST.handAt(D, pose, side);
  const ang = CAST.forearmAngle(pose, side);
  const props = [{ svg: G.sword(hx, hy, 0.62, ang + 180 + (pose.swordRot || 0)), layer: 'front' }];
  if (pose.view !== 'side') { const [lx, ly] = CAST.handAt(D, pose, -1, 160); props.push({ svg: shieldRound(lx - 10, ly, 1.1, -8), layer: 'front' }); }
  else props.push({ svg: shieldRound(40, -420, 1.05, 0), layer: 'back' });
  return props;
}

// ---------------------------------------------------------------- game UI (RPG wood + parchment: deliberately NOT the cyan Reality HUD)
const LVCOL = (lv) => (lv >= 80 ? '#D7263D' : lv >= 45 ? '#FF8A1A' : lv >= 20 ? '#F2C24A' : '#3BB84A');
// level badge floating above (x, y) = the head top; name on a ribbon; k pop
function lvBadge(x, y, lv, name, k = 1, o = {}) {
  if (k <= 0.01) return '';
  const col = LVCOL(lv), boss = lv >= 80, s = o.s ?? 1;
  const bw = 176, bh = 66, yy = -(o.lift ?? 40) - bh / 2;
  let c = S.path(`M-14 ${f(yy + bh / 2 - 4)} L0 ${f(yy + bh / 2 + 18)} L14 ${f(yy + bh / 2 - 4)} Z`, ol('#5A3A22', 5));
  c += S.rect(-bw / 2, yy - bh / 2, bw, bh, 14, ol('#5A3A22', 6)) + S.rect(-bw / 2 + 7, yy - bh / 2 + 7, bw - 14, bh - 14, 9, { fill: 'none', stroke: '#F2C24A', 'stroke-width': 4 });
  c += S.rect(-bw / 2 + 14, yy - bh / 2 + 14, 22, bh - 28, 5, { fill: col, stroke: LINE, 'stroke-width': 3 });
  c += T(`LV ${lv}`, 14, yy + 15, 42, '#FFF4D0', { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' });
  if (name) {
    const nw = Math.max(120, textW(name, 26, 'F') + 50);
    c += S.path(`M${-nw / 2 - 18} ${f(yy - bh / 2 - 26)} L${-nw / 2} ${f(yy - bh / 2 - 44)} L${nw / 2} ${f(yy - bh / 2 - 44)} L${nw / 2 + 18} ${f(yy - bh / 2 - 26)} L${nw / 2} ${f(yy - bh / 2 - 8)} L${-nw / 2} ${f(yy - bh / 2 - 8)} Z`, ol(boss ? '#8A1020' : '#2E6A3A', 5));
    c += TF(name, 0, yy - bh / 2 - 16, 26, '#FFFFFF', { 'letter-spacing': 2 });
  }
  if (boss) c += S.g(S.circle(0, 0, 22, ol('#F4E6C8', 4)) + S.circle(-8, -2, 6, { fill: LINE }) + S.circle(8, -2, 6, { fill: LINE }) + S.path('M-8 12 V18 M0 12 V18 M8 12 V18', ln(3)), `translate(${f(bw / 2 + 4)} ${f(yy - bh / 2 + 4)})`);
  const sc = ease.outBack(clamp(k, 0, 1)) * s;
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
}
// parchment item tooltip; (x, y) = bottom tip
function itemTip(x, y, name, stat, statCol, k = 1, o = {}) {
  if (k <= 0.01) return '';
  const w = Math.max(250, textW(name, 34, 'L') + 60), h = 124;
  let c = S.path(`M-14 -6 L0 14 L14 -6 Z`, ol('#C9A060', 5));
  c += S.rect(-w / 2, -h - 4, w, h, 12, ol('#F6E3B4', 6)) + S.rect(-w / 2 + 8, -h + 4, w - 16, h - 16, 8, { fill: 'none', stroke: '#C9A060', 'stroke-width': 3 });
  c += T(name, 0, -h + 44, 34, '#6A3A12');
  c += T(stat, 0, -h + 96, 44, statCol, { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' });
  const stars = o.stars ?? 3;
  for (let i = 0; i < stars; i++) c += S.path(`M${f(-w / 2 + 26 + i * 22)} -${h - 22} l4 9 l10 1 l-8 6 l3 10 l-9 -5 l-9 5 l3 -10 l-8 -6 l10 -1 Z`, { fill: '#F2B84B', stroke: LINE, 'stroke-width': 2 });
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(clamp(k, 0, 1)) * (o.s ?? 1))})`);
}
// treasure chest (bottom centre); open 0..1
function chest(x, y, s, open = 0, t = 0) {
  let c = '';
  if (open > 0.2) {
    let r = '';
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.22 + Math.sin(t * 2) * 0.03; r += `M0 -120 L${f(Math.cos(a - 0.06) * 520)} ${f(-120 + Math.sin(a - 0.06) * 520)} L${f(Math.cos(a + 0.06) * 520)} ${f(-120 + Math.sin(a + 0.06) * 520)} Z`; }
    c += S.path(r, { fill: '#FFF0A0', opacity: f(0.5 * seg(open, 0.2, 0.6)) });
  }
  c += S.rect(-140, -130, 280, 130, 12, ol('#B0703A', 7)) + S.path('M-140 -90 H140 M-140 -40 H140', ln(5, '#8A5228')) + S.rect(-150, -134, 26, 134, 6, ol('#F2C24A', 5)) + S.rect(124, -134, 26, 134, 6, ol('#F2C24A', 5));
  c += S.rect(-24, -104, 48, 52, 8, ol('#F2C24A', 5)) + S.circle(0, -84, 8, { fill: LINE });
  const lo = ease.outBack(clamp(open, 0, 1)), sy = lerp(1, -0.62, lo);
  if (open > 0.05) c += S.ellipse(0, -132, 128, 16, { fill: '#3A2010' }) + S.ellipse(0, -136, 90, 10, { fill: '#FFE68A', opacity: f(0.8 * seg(open, 0.1, 0.5)) });
  c += S.g(S.path('M-146 0 Q-146 -96 0 -100 Q146 -96 146 0 Z', ol(sy < 0 ? '#8A5228' : '#C9803F', 7)) + (sy > 0 ? S.path('M-120 -50 Q0 -80 120 -50', ln(5, '#8A5228')) : '') + S.rect(-160, -14, 320, 22, 8, ol('#F2C24A', 5)), `translate(0 -130) scale(1 ${f(Math.abs(sy) < 0.08 ? 0.08 * Math.sign(sy || 1) : sy)})`);
  return S.g(c, tf(x, y, s));
}
function boots(x, y, s = 1, rot = 0) {
  return S.g(S.path('M-50 -90 L-10 -90 L-8 -20 L40 -18 Q60 -14 58 4 L-56 4 Z', ol('#8A5A34', 6)) + S.path('M-54 -70 H-6', ln(6, '#F2C24A')) + S.path('M24 -60 L34 -44 L50 -60 M30 -36 L60 -56', ln(5, '#FFFFFF', 0.9)), tf(x, y, s, rot));
}
// boss bar (screen space, top centre)
function bossBar(o = {}) {
  const { x = 960, y = 92, w = 1040, name = 'ANCIENT DRAGON', lv = 90, t = 0 } = o;
  const k = clamp(o.k ?? 1, 0, 1), fill = clamp(o.fill ?? 1, 0, 1);
  if (k <= 0.01) return '';
  let c = S.rect(-w / 2 - 10, -30, w + 20, 78, 18, ol('#2A1420', 7)) + S.rect(-w / 2 + 6, -14, w - 12, 46, 10, { fill: '#4A1A26' });
  c += S.rect(-w / 2 + 6, -14, (w - 12) * fill, 46, 10, { fill: '#E8341A' }) + S.rect(-w / 2 + 6, -14, (w - 12) * fill, 14, 7, { fill: '#FF8A6A', opacity: 0.7 });
  for (let i = 1; i < 10; i++) c += S.path(`M${f(-w / 2 + 6 + ((w - 12) * i) / 10)} -14 v46`, ln(3, '#2A1420', 0.5));
  c += S.rect(-w / 2 - 10, -30, w + 20, 78, 18, { fill: 'none', stroke: '#F2C24A', 'stroke-width': 4 });
  const nt = `${name}  ·  LV ${lv}`;
  const tw_ = textW(nt, 40, 'L') + 80;
  c += S.path(`M${-tw_ / 2} -40 L${-tw_ / 2 + 20} -84 L${tw_ / 2 - 20} -84 L${tw_ / 2} -40 Z`, ol('#8A1020', 6)) + T(nt, 0, -48, 40, '#FFF4D0', { stroke: LINE, 'stroke-width': 7, 'paint-order': 'stroke' });
  c += S.g(S.circle(0, 0, 40, ol('#F4E6C8', 6)) + S.circle(-14, -4, 11, { fill: LINE }) + S.circle(14, -4, 11, { fill: LINE }) + S.path('M-14 20 V30 M0 20 V30 M14 20 V30', ln(5)), `translate(${f(-w / 2 - 10)} 9)`);
  const pulse = 1 + 0.04 * Math.sin(t * 10);
  return S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(k) * pulse)} ${f(ease.outBack(k))})`);
}
// the game's own corner HUD: pixel hearts + coins (screen space, top-left)
function gameCorner(t, o = {}) {
  const hearts = o.hearts ?? 3, coins = o.coins ?? 120;
  let c = S.rect(24, 22, 400, 84, 20, { fill: '#2A1A10', opacity: 0.55 });
  for (let i = 0; i < 3; i++) { const x = 46 + i * 62, full = i < hearts; c += S.path(`M${x + 6} 44h12v6h6v-6h12v6h6v18h-6v6h-6v6h-6v6h-6v-6h-6v-6h-6v-6h-6v-18h6z`, { fill: full ? '#E8453C' : '#5A3A3A', stroke: LINE, 'stroke-width': 4 }); }
  c += S.circle(262, 64, 20, ol('#FFD21F', 5)) + S.path('M262 52 V76', ln(5, '#C8901A')) + T(String(coins), 296, 80, 44, '#FFF4D0', { 'text-anchor': 'start', stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke' });
  return c;
}
const GAME = { GW, GC, gameWorld, slime, shroom, bat, goblin, dragon, dragonMouth, fireBreath, knightProps, shieldRound, lvBadge, itemTip, chest, boots, bossBar, gameCorner, LVCOL };


module.exports = {
  DEFS, GAME, GW,
  LINE, tf, TS, TFS, pop, scAt, op, textW, shakeAll, boing, clipTo, dim,
  whip, smash, zoomLines, streaks, iris, rewindTail, crtOff,
  snapshot, snapPoint, nameCard, doodleArrow, doodleNote, thought, controller, facecam, tornado,
  LOU79, youngLou, oldFilm, tankFile,
};
