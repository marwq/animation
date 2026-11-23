// Private helpers for SC 07 (everybody's Dad) and SC 08 (the rage-quit + the bedroom talk + the alarm): transitions, split
// panels, water splash, rimshot drum, small props (mic, glasses, Dad's arm over the keyboard), memory polaroids, the plaza /
// living-room / bedroom composers and the noob crowd around Dad. Pure functions -> SVG strings.
'use strict';

const K = require('./kit');
const G = require('./gameui');
const GS = require('./sets_game');
const H = require('./sets_house');
const AC = require('./acting');
const CAST = require('../rig/cast');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, view, actor } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const DEFS = `<defs>
<linearGradient id="s07Deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A2A8A" stop-opacity="0.32"/><stop offset="0.55" stop-color="#FF6A3A" stop-opacity="0.12"/><stop offset="1" stop-color="#FF9A50" stop-opacity="0.06"/></linearGradient>
<linearGradient id="s07Sepia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3D9A4" stop-opacity="0.5"/><stop offset="1" stop-color="#B98A5A" stop-opacity="0.45"/></linearGradient>
<linearGradient id="s08RedV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF2440" stop-opacity="0.38"/><stop offset="1" stop-color="#5A0010" stop-opacity="0.5"/></linearGradient>
<linearGradient id="s07Spot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6C8" stop-opacity="0.0"/><stop offset="1" stop-color="#FFF6C8" stop-opacity="0.38"/></linearGradient>
<radialGradient id="s08Lamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFC56A" stop-opacity="0.55"/><stop offset="1" stop-color="#FFC56A" stop-opacity="0"/></radialGradient>
</defs>`;

// ---------------------------------------------------------------- camera / timing helpers
function shakeAll(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
// squash/stretch impulse after t0
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
// whip-pan: white streak flash around tc
function whip(t, tc, dir = 1, dur = 0.1) {
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
const smash = (t, tc, dur = 0.14, a = 0.75, col = '#FFFFFF') => (t >= tc && t < tc + dur ? S.rect(0, 0, W, HH, 0, { fill: col, opacity: f(a * (1 - (t - tc) / dur)) }) : '');
const fadeIn = (t, tc, dur = 0.35, col = '#000000') => (t >= tc && t < tc + dur ? S.rect(0, 0, W, HH, 0, { fill: col, opacity: f(1 - (t - tc) / dur) }) : '');
const fadeOut = (t, tc, dur = 0.35, col = '#000000') => (t > tc - dur && t <= tc + 0.5 ? S.rect(0, 0, W, HH, 0, { fill: col, opacity: f(seg(t, tc - dur, tc)) }) : '');
// radial zoom lines (punchlines)
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 900;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.7 * k) });
}
// vertical speed streaks (fast scroll), screen space
function vStreaks(t, x0, x1, n, seed, col = '#FFFFFF', op = 0.5, speed = 3200) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(i * 2.3 + seed)), len = 120 + hash(i * 5.7 + seed) * 300, th = 4 + hash(i * 1.1 + seed) * 8;
    const y = (((hash(i * 7.9 + seed) * 1400 - t * speed * (0.6 + 0.8 * hash(i + seed))) % 1400) + 1400) % 1400 - 160;
    d += `M${f(x)} ${f(y)}h${f(th)}v${f(len)}h${f(-th)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(op) });
}
const letterbox = (k, h = 70) => (k > 0 ? S.rect(-10, -10, W + 20, 10 + h * k, 0, { fill: '#05070C' }) + S.rect(-10, HH - h * k, W + 20, h * k + 10, 0, { fill: '#05070C' }) : '');

// ---------------------------------------------------------------- split panels
// draw `inner` (a full 1920x1080 frame) into the screen rect (x, y, w, h), cropped (slice); frame + shadow
function panel(x, y, w, h, inner, o = {}) {
  const { border = 10, col = '#FFFFFF', rot = 0, shadow = true, r = 0 } = o;
  const k = o.k ?? 1;
  if (k <= 0.001) return '';
  const cx = x + w / 2, cy = y + h / 2;
  let g = '';
  if (shadow) g += S.rect(x + 14, y + 18, w, h, r, { fill: '#000000', opacity: 0.3 });
  g += S.rect(x - border, y - border, w + 2 * border, h + 2 * border, r + border * 0.6, { fill: col, stroke: LINE, 'stroke-width': 6 });
  g += `<svg x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
  if (o.tint) g += S.rect(x, y, w, h, 0, { fill: o.tint, opacity: f(o.tintOp ?? 0.3) });
  g += S.rect(x, y, w, h, r, { fill: 'none', stroke: LINE, 'stroke-width': 5 });
  if (o.label) g += S.g(S.rect(-o.label.length * 13 - 26, -30, o.label.length * 26 + 52, 60, 30, ol(o.labelCol || '#FFD23F', 6)) + TS(o.label, 0, 16, 40, '#FFFFFF'), tf(o.lx ?? cx, o.ly ?? (y + h - 10)));
  const sc = ease.outBack(clamp(k, 0, 1));
  return S.g(g, `translate(${f(cx)} ${f(cy)}) rotate(${f(rot)}) scale(${f(sc)}) translate(${f(-cx)} ${f(-cy)})`);
}
// a polaroid photo with a frame (inner = a full 1920x1080 frame, cropped to the photo box), (x, y) = centre
function polaroid(x, y, w, inner, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0.001) return '';
  const h = w * 0.72, pad = w * 0.05, cap = w * 0.17;
  let g = S.rect(-w / 2 - pad + 12, -h / 2 - pad + 16, w + 2 * pad, h + pad + cap, 6, { fill: '#000000', opacity: 0.28 });
  g += S.rect(-w / 2 - pad, -h / 2 - pad, w + 2 * pad, h + pad + cap, 6, { fill: '#FBF6EA', stroke: LINE, 'stroke-width': 5 });
  g += `<svg x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
  g += S.rect(-w / 2, -h / 2, w, h, 0, { fill: 'url(#s07Sepia)' });
  g += S.rect(-w / 2, -h / 2, w, h, 0, { fill: 'none', stroke: LINE, 'stroke-width': 4 });
  if (o.caption) g += TF(o.caption, 0, h / 2 + cap * 0.62, cap * 0.42, '#4A3A5A');
  if (o.tape) g += S.rect(-w * 0.12, -h / 2 - pad - 18, w * 0.24, 40, 3, { fill: '#F6EBC2', opacity: 0.85, transform: 'rotate(-4)' });
  const sc = ease.outBack(clamp(k, 0, 1)) * (o.s ?? 1);
  return S.g(g, `translate(${f(x)} ${f(y - (1 - ease.out(clamp(k, 0, 1))) * 120)}) rotate(${f((o.rot ?? 0) + (1 - clamp(k, 0, 1)) * 14)}) scale(${f(sc)})`, k < 1 ? { opacity: f(seg(k, 0, 0.25)) } : {});
}

// ---------------------------------------------------------------- water FX (k 1 world units; s = scale like an actor)
// a cartoon splash at the water line (x, y): crown of water fingers, droplets, foam, ripple rings. age s since the hit (~1.3 s)
function splash(x, y, age, s = 1, seed = 1, big = 1) {
  if (age < 0 || age > 1.6) return '';
  let o = '';
  // ripple rings on the surface
  for (let j = 0; j < 3; j++) {
    const a = age - j * 0.18;
    if (a < 0 || a > 1.2) continue;
    const r = (120 + 520 * ease.out(a / 1.2)) * s * big;
    o += S.ellipse(x, y + 8 * s, r, r * 0.16, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(10 * s * (1 - a / 1.2)), opacity: f(0.8 * (1 - a / 1.2)) });
  }
  // the crown
  const up = ease.out(seg(age, 0, 0.22)), down = ease.in(seg(age, 0.22, 0.75));
  const hgt = (520 * up - 560 * down) * s * big;
  if (hgt > 4) {
    let d = '';
    const n = 7;
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * 2 - 1, sp = 1 - 0.55 * Math.abs(u);
      const bx = x + u * 150 * s * big, tip = bx + u * 120 * s * big * up, hh = hgt * sp * (0.8 + 0.4 * hash(i + seed)), wd = (34 + 16 * hash(i * 3 + seed)) * s * big;
      d += `M${f(bx - wd)} ${f(y)} Q${f(bx - wd * 0.3 + (tip - bx) * 0.4)} ${f(y - hh * 0.6)} ${f(tip)} ${f(y - hh)} Q${f(bx + wd * 0.3 + (tip - bx) * 0.4)} ${f(y - hh * 0.6)} ${f(bx + wd)} ${f(y)} Z`;
    }
    o += S.path(d, { fill: '#CFF6FF', stroke: LINE, 'stroke-width': f(5 * s), 'stroke-linejoin': 'round' });
    o += S.path(d, { fill: '#FFFFFF', opacity: 0.45, transform: `translate(${f(-6 * s)} 0) scale(1 1)` });
  }
  // droplets
  let dd = '';
  for (let i = 0; i < 18; i++) {
    const a = age - 0.04 - hash(i * 1.3 + seed) * 0.08;
    if (a < 0) continue;
    const ang = -Math.PI / 2 + (hash(i * 7.1 + seed) - 0.5) * 2.2, v = (700 + 700 * hash(i * 3.9 + seed)) * s * big;
    const px = x + Math.cos(ang) * v * a, py = y + Math.sin(ang) * v * a + 0.5 * 2600 * s * a * a;
    if (py > y + 20 * s) continue;
    const r = (10 + 12 * hash(i * 5.5 + seed)) * s;
    dd += `M${f(px - r)} ${f(py)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  }
  if (dd) o += S.path(dd, { fill: '#E6FBFF', stroke: LINE, 'stroke-width': f(3.5 * s) });
  // foam
  const fk = seg(age, 0, 0.1) * (1 - seg(age, 0.7, 1.5));
  if (fk > 0) o += S.ellipse(x, y + 4 * s, 200 * s * big * (0.7 + 0.5 * seg(age, 0, 0.5)), 30 * s * big, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': f(4 * s), opacity: f(fk) });
  return o;
}
// rising bubbles from (x, y) for k > 0
function bubbles(x, y, t, k = 1, s = 1, n = 6, seed = 2) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const ph = ((t * 1.6 + hash(i + seed)) % 1);
    const bx = x + (hash(i * 3.3 + seed) - 0.5) * 120 * s + Math.sin(t * 6 + i) * 8 * s, by = y - ph * 40 * s;
    const r = (8 + 10 * hash(i * 2.2 + seed)) * s * (1 - ph * 0.5);
    d += `M${f(bx - r)} ${f(by)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  }
  return S.path(d, { fill: '#E6FBFF', stroke: LINE, 'stroke-width': f(3 * s), opacity: f(k) });
}

// ---------------------------------------------------------------- props
// rimshot drum kit (snare + cymbal + sticks), (x, y) = floor point, s scale; hit 0..1 (the TSS)
function drumKit(x, y, s, hit = 0, t = 0) {
  const wob = Math.sin(t * 40) * 9 * (1 - seg(hit, 0.3, 1)) * (hit > 0 ? 1 : 0);
  let o = '';
  // cymbal stand + cymbal
  o += S.path('M170 0 L170 -330 M130 0 L170 -150 L210 0', ln(9, '#3A3F4E'));
  o += S.g(S.ellipse(0, 0, 120, 22, ol('#FFD23F', 7)) + S.ellipse(0, -4, 22, 8, { fill: '#C9971A' }) + S.path('M-90 -6 Q0 -18 90 -6', ln(4, '#FFF3B0', 0.8)), `translate(170 -335) rotate(${f(-8 + wob)})`);
  // snare
  o += S.path('M-60 0 L-30 -150 M60 0 L30 -150', ln(8, '#3A3F4E'));
  o += S.rect(-110, -230, 220, 90, 14, ol('#E8453C', 7)) + S.path('M-110 -205 H110 M-110 -168 H110', ln(5, '#FFFFFF', 0.7));
  o += S.ellipse(0, -230, 110, 28, ol('#F4F4F8', 7));
  // sticks
  const a1 = -40 + 50 * bump(hit, 0, 0.4), a2 = 20 - 40 * bump(hit, 0.3, 0.8);
  o += S.g(S.rect(-8, -170, 16, 190, 8, ol('#E8C07A', 5)), `translate(-60 -250) rotate(${f(a1)})`);
  o += S.g(S.rect(-8, -170, 16, 190, 8, ol('#E8C07A', 5)), `translate(60 -260) rotate(${f(a2)})`);
  return S.g(o, tf(x, y, s));
}
// a handheld microphone, (x, y) = grip, rot (deg, 0 = head up)
function mic(x, y, s = 1, rot = 0) {
  return S.g(S.rect(-14, -10, 28, 120, 10, ol('#2A2E3A', 5)) + S.rect(-18, -28, 36, 24, 6, ol('#8A90A0', 5)) + S.circle(0, -58, 38, ol('#B9BFCC', 6)) +
    S.path('M-26 -70 H26 M-30 -54 H30 M-24 -38 H24 M-12 -90 V-26 M12 -90 V-26', ln(3, '#7A808E')) + S.circle(-12, -72, 9, { fill: '#FFFFFF', opacity: 0.7 }), tf(x, y, s, rot));
}
// Dad's reading glasses (folded / held), (x, y) = centre
function glassesProp(x, y, s = 1, rot = 0, fold = 0) {
  const w = 64 * (1 - 0.35 * fold);
  return S.g(S.rect(-w - 8, -24, w, 46, 14, { fill: '#DCEBFF', 'fill-opacity': 0.55, stroke: '#5A3A2A', 'stroke-width': 9 }) + S.rect(8, -24, w, 46, 14, { fill: '#DCEBFF', 'fill-opacity': 0.55, stroke: '#5A3A2A', 'stroke-width': 9 }) +
    S.path('M-8 -6 Q0 -16 8 -6', ln(8, '#5A3A2A')) + S.path(`M${f(-w - 8)} -12 L${f(-w - 40)} -4 M${f(w + 8)} -12 L${f(w + 40)} -4`, ln(7, '#5A3A2A')) + S.path(`M${f(-w + 6)} -12 l18 18`, ln(5, '#FFFFFF', 0.7)), tf(x, y, s, rot));
}
// Dad's R6 arm reaching over the keyboard (POV): from (x0, y0) off-frame to the fingertip (x1, y1); press dips it
function dadArm(x0, y0, x1, y1, w = 150) {
  const a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI, len = Math.hypot(x1 - x0, y1 - y0);
  let o = S.rect(0, -w / 2, len - w * 0.95, w, 22, ol('#BFD9F2', 8));
  o += S.path(`M${f(len * 0.3)} ${f(-w / 2 + 14)} V${f(w / 2 - 14)} M${f(len * 0.55)} ${f(-w / 2 + 14)} V${f(w / 2 - 14)}`, ln(4, '#9FC0E0', 0.7));
  o += S.rect(len - w * 1.15, -w / 2 - 6, 60, w + 12, 14, ol('#A8C8E8', 7));
  o += S.rect(len - w * 1.0, -w / 2 + 6, w * 0.95, w - 12, 26, ol('#F4CDAE', 8));
  o += S.rect(len - w * 0.18, -w * 0.18, w * 0.4, w * 0.3, 14, ol('#F4CDAE', 7));
  o += S.path(`M${f(len - w * 0.8)} ${f(-w / 2 + 22)} q 30 10 60 0`, ln(5, '#E3B48F'));
  return S.g(o, `translate(${f(x0)} ${f(y0)}) rotate(${f(a)})`);
}
// floating "!" / "?" / "♥" emote pops
function heartPop(x, y, k, s = 1) {
  if (k <= 0 || k >= 1) return '';
  const sc = s * ease.outBack(seg(k, 0, 0.3)) * (1 + 0.2 * k);
  return S.g(G.heart(0, 0, 60, '#FF4B7A'), `translate(${f(x)} ${f(y - 80 * k)}) scale(${f(sc)})`, { opacity: f(1 - seg(k, 0.7, 1)) });
}

// ---------------------------------------------------------------- set composers
// the plaza at sunset; behind = before L.front (sinking into the water), chars after it; over = FX after chars (world, k 1)
function plaza(t, cam, o = {}, behind = '', chars = '', over = '') {
  const Lp = GS.plaza.layers(o.tSet ?? t, cam, { time: 'sunset', skyscraper: true, ...o });
  const veil = o.veil ?? 0.16;
  const vr = (k) => S.rect(-10, -10, W + 20, HH + 20, 0, { fill: o.veilCol || '#FFC4B4', opacity: f(k) });
  let out = Lp.bg + (veil > 0 ? vr(veil) : '') + Lp.mid + (behind ? view(cam, behind) : '') + Lp.front + (o.dof ? vr(o.dof) : '') + (chars ? view(cam, chars) : '') + (over ? view(cam, over) : '') + Lp.fg + Lp.light;
  if (o.deep) out += S.rect(0, 0, W, HH, 0, { fill: 'url(#s07Deep)', opacity: f(clamp(o.deep, 0, 1)) });
  return out;
}
// the living room; parts = { seated, devices, standing, over } world svg; o = set options
function living(t, cam, o = {}, parts = {}) {
  const Ll = H.livingRoom.layers(t, { time: 'night', ...o });
  return view(cam, Ll.bg, 0.8) + view(cam, Ll.mid) + (parts.seated ? view(cam, parts.seated) : '') + view(cam, Ll.front) + (parts.devices ? view(cam, parts.devices) : '') +
    view(cam, Ll.table) + (parts.standing ? view(cam, parts.standing) : '') + view(cam, Ll.fg, 1.2) + view(cam, Ll.light) + (parts.over ? view(cam, parts.over) : '');
}
function bedroom(t, cam, o = {}, parts = {}) {
  const Lb = H.bedroom.layers(t, { time: 'night', ...o });
  return view(cam, Lb.bg, 0.8) + view(cam, Lb.mid) + (parts.behind ? view(cam, parts.behind) : '') + view(cam, Lb.front) + (parts.front ? view(cam, parts.front) : '') +
    view(cam, Lb.fg || '', 1.2) + view(cam, Lb.light) + (parts.over ? view(cam, parts.over) : '');
}

// the "monitor POV" on the REAL hero at his PC: the living-room plate behind him (the family laughing at their screens, out of
// focus), the hero big in the foreground looking into his monitor, lit blue by it. o: { face, s, x, y, act, pose, fam(t) svg,
// camP, veil, red 0..1 (anger tint on his face), laugh (HA HA bob), plateOver }
function heroPOV(t, o = {}) {
  const LS = H.SPOTS.livingRoom.seats, D = H.SPOTS.livingRoom.devices;
  const X = require('../rig/extras');
  const lp = (ph) => ({ bodyY: 6 * Math.abs(Math.sin(t * 10 + ph)), headRot: 5 * Math.sin(t * 10 + ph) });
  const fam = o.fam ? o.fam(t) :
    actor('dad', t, H.seatPose(LS.dad, 1.1, { volume: false, face: { name: 'joy', eyes: { type: 'happy' } }, ...lp(0) }), { energy: 0 }) +
    actor('mom', t, H.seatPose(LS.mom, 1.04, { volume: false, face: { name: 'joy', mouth: 'bigGrin', eyes: { type: 'happy' } }, ...lp(1.3) }), { energy: 0 }) +
    actor('grandma', t, H.seatPose(LS.grandma, 0.9, { volume: false, face: { name: 'joy', eyes: { type: 'happy' } }, phone: 'arm', ...lp(2.1) }), { energy: 0 });
  const devices = X.laptopOld({ ...D.laptop, face: 'lid' }) + X.tablet({ ...D.tablet, face: 'back', landscape: true });
  const camP = o.camP || GS.camAt(1330, 560, 1.3);
  let out = living(t, camP, { chair: false, glow: H.deviceGlows(['dad', 'mom', 'grandma'], 1) }, { seated: fam, devices });
  out += S.rect(0, 0, W, HH, 0, { fill: '#141A3A', opacity: f(o.veil ?? 0.34) });
  if (o.plateOver) out += o.plateOver;
  // the gaming chair's headrest behind him
  const s = o.s ?? 1.15, x = o.x ?? 600, y = o.y ?? 1320;
  out += S.path(`M${f(x - 250 * s)} ${f(y)} L${f(x - 236 * s)} ${f(y - 900 * s)} Q${f(x - 220 * s)} ${f(y - 1010 * s)} ${f(x)} ${f(y - 1016 * s)} Q${f(x + 220 * s)} ${f(y - 1010 * s)} ${f(x + 236 * s)} ${f(y - 900 * s)} L${f(x + 250 * s)} ${f(y)} Z`, { fill: '#1E2029', stroke: LINE, 'stroke-width': 8 });
  out += S.path(`M${f(x - 96 * s)} ${f(y - 990 * s)} V${f(y)} M${f(x + 96 * s)} ${f(y - 990 * s)} V${f(y)}`, ln(26 * s, '#B88A2E'));
  out += actor('you', t, { x, y, s, volume: false, turn: 0, armL: 12, armR: 12, face: o.face || { name: 'angry', eyes: { upper: 0.35, look: [0, 0] } }, ...(o.pose || {}) }, o.act || { arms: false, energy: 0.4 });
  // monitor light on the face (+ the anger tint)
  const fx = x, fy = y - 700 * s;
  out += G.screenGlow(fx, fy, 600 * s, 520 * s, '#8FB8FF', 0.55);
  if (o.red) out += S.ellipse(fx, fy + 20 * s, 190 * s, 150 * s, { fill: '#FF3A3A', opacity: f(0.22 * o.red) });
  return out;
}

// ---------------------------------------------------------------- the noob crowd
// noob i drawn with a mood: 'idle' | 'watch' | 'cheer' | 'laugh' | 'clap' | 'nod' | 'amazed' | 'sit' | 'love' | 'shake'
const NOOB_I = [3, 5, 7, 9, 11, 13, 2, 4, 6, 8, 10, 12, 14, 15, 1, 16, 17, 18, 19, 20, 21, 22, 23, 24];
function noob(i, t, pose, mood = 'idle', ph = 0) {
  const p = { shadow: true, t, ...pose };
  const b = Math.abs(Math.sin(t * 9 + ph));
  if (mood === 'watch') Object.assign(p, AC.breathe(t, ph), { face: ph % 3 < 1 ? 'happy' : 'neutral', armL: 6, armR: 6 });
  else if (mood === 'cheer') Object.assign(p, { lift: 30 * b * (pose.s || 0.4) / 0.4, armL: 150 + 20 * b, armR: 150 + 20 * Math.abs(Math.sin(t * 9 + ph + 1)), face: (i % 2) ? 'joy' : 'excited' });
  else if (mood === 'laugh') Object.assign(p, { bodyY: 10 * b, headRot: 7 * Math.sin(t * 11 + ph), armL: 30 + 25 * b, armR: 34 + 22 * Math.abs(Math.sin(t * 11 + ph + 0.7)), face: { name: 'joy', mouth: 'bigGrin', eyes: { type: 'happy' }, fx: i % 3 ? [] : ['tears'] } });
  else if (mood === 'clap') { const c = Math.abs(Math.sin(t * 12 + ph)); Object.assign(p, { armL: 30 + 25 * c, armR: 30 + 25 * c, bodyY: 4 * c, face: 'happy' }); }
  else if (mood === 'nod') Object.assign(p, { headRot: 3 * Math.sin(t * 2 + ph), headY: 6 * Math.abs(Math.sin(t * 3 + ph)), face: { name: 'happy', eyes: { look: [0, -0.4] } }, armL: 8, armR: 8 });
  else if (mood === 'amazed') Object.assign(p, { face: { name: 'amazed', mouth: 'o', eyes: { type: i % 2 ? 'star' : undefined, look: [0, -0.5] } }, armL: 14, armR: 14, ...AC.breathe(t, ph) });
  else if (mood === 'love') Object.assign(p, { face: { name: 'happy', eyes: { type: 'heart' }, fx: ['blush'] }, armL: 40 + 10 * b, armR: 40 + 10 * b, bodyY: 4 * b });
  else if (mood === 'shake') Object.assign(p, { face: { name: 'scared', fx: ['sweat'] }, sx: 1 + 0.03 * Math.sin(t * 50), armL: 20, armR: 20 });
  else if (mood === 'confused') Object.assign(p, { face: { name: 'confused', fx: ['question'] }, headRot: 8, armL: 8, armR: 8 });
  else if (mood === 'deadpan') Object.assign(p, { face: 'deadpan', armL: 6, armR: 6 });
  else Object.assign(p, AC.breathe(t, ph), { armL: 8, armR: 8 });
  Object.assign(p, pose.over || {});
  delete p.over;
  return CAST.draw.noob(i, p);
}

module.exports = {
  DEFS, LINE, W, HH, tf, TS, TFS, pop, shakeAll, boing, whip, smash, fadeIn, fadeOut, zoomLines, vStreaks, letterbox,
  panel, polaroid, splash, bubbles, drumKit, mic, glassesProp, dadArm, heartPop, plaza, living, bedroom, heroPOV, noob, NOOB_I,
};
