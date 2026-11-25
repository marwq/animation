// Private helpers for SC 04 (school with stats): transitions (whip, smash, zoom lines, letterbox), split / picture-in-picture
// panels, camera roll + shake, the always-on HUD layer (frame + the hero's XP bar), small HUD bits in the Reality-HUD look
// (STR chips, damage numbers, stamps, the SPECIAL SKILL card), the classroom / gym / cafeteria populations, flying books and
// papers, and the retro "in games" NPC for the quest split-screen.
'use strict';

const K = require('./kit');
const H = require('./hud');
const ST = require('./sets_town');
const X = require('../rig/extras');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const scAt = (inner, x, y, k) => (k <= 0.001 ? '' : Math.abs(k - 1) < 1e-4 ? inner : S.g(inner, `translate(${f(x)} ${f(y)}) scale(${f(k)}) translate(${f(-x)} ${f(-y)})`));
// screen point of a world point through cam (k = parallax 1)
const toScr = (cam, x, y) => { const p = ST.toScreen(cam, x, y, 1); return { x: p[0], y: p[1], z: p[2] }; };
const camAt = ST.camAt;
// camera shake impulses: list of [t0, dur, amp]
function shakeAll(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
// squash / stretch impulse -> { sx, sy }
function boing(t, t0, amp = 0.22, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
// whole-frame roll (dutch angle) around the screen centre
const roll = (svg, deg) => (Math.abs(deg) > 0.01 ? S.g(svg, `rotate(${f(deg)} 960 540)`) : svg);
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s04c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}

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
  return S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
// white flash fading out after tc
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
// radial zoom lines around (cx, cy)
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
// horizontal speed streaks across a band
function streaks(t, y0, y1, n, seed, col = '#FFFFFF', op = 0.6, speed = 2600, dir = -1) {
  if (op <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = lerp(y0, y1, hash(i * 2.3 + seed)), len = 160 + hash(i * 5.7 + seed) * 380, th = 5 + hash(i * 1.1 + seed) * 9;
    const x = (((hash(i * 7.9 + seed) * 2600 + dir * t * speed * (0.6 + 0.8 * hash(i + seed))) % 2600) + 2600) % 2600 - 340;
    d += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(op) });
}
const letterbox = (k, h = 90) => (k > 0 ? S.rect(-10, -10, W + 20, 10 + h * k, 0, { fill: '#05070C' }) + S.rect(-10, HH - h * k, W + 20, h * k + 10, 0, { fill: '#05070C' }) : '');
const dim = (k, col = '#0B1020') => (k > 0 ? S.rect(-20, -20, W + 40, HH + 40, 0, { fill: col, opacity: f(k) }) : '');

// ---------------------------------------------------------------- panels (split screen / picture-in-picture)
// draw `inner` (authored for the full 1920x1080 frame) scaled into the screen rect (x, y, w, h); o.zoom, o.dx/dy (shift the source), o.k pop-in
function panel(x, y, w, h, inner, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0.001) return '';
  const s = Math.max(w / W, h / HH) * (o.zoom || 1);
  const cx = x + w / 2, cy = y + h / 2;
  const id = S.uid('s04p');
  let g = S.rect(x + 10, y + 14, w, h, o.r ?? 18, { fill: '#000', opacity: 0.3 });
  g += S.clipDef(id, S.rect(x, y, w, h, o.r ?? 18));
  g += S.g(S.g(inner, `translate(${f(cx)} ${f(cy)}) scale(${f(s)}) translate(${f(-960 - (o.dx || 0))} ${f(-540 - (o.dy || 0))})`), null, { 'clip-path': `url(#${id})` });
  g += S.rect(x, y, w, h, o.r ?? 18, { fill: 'none', stroke: o.rim || '#FFFFFF', 'stroke-width': o.border ?? 10 });
  g += S.rect(x - 5, y - 5, w + 10, h + 10, (o.r ?? 18) + 4, { fill: 'none', stroke: LINE, 'stroke-width': 5 });
  if (o.label) {
    const lw = o.label.length * 17 + 46;
    g += S.g(S.rect(0, 0, lw, 48, 24, { fill: o.labelCol || '#151A26', stroke: LINE, 'stroke-width': 4 }) + TF(o.label, lw / 2, 33, 26, o.labelFg || '#FFFFFF', { 'letter-spacing': 1.5 }), tf(x + 22, y - 24));
  }
  if (k < 1) {
    const e = ease.outBack(k);
    return S.g(g, `translate(${f(cx + (o.fromX || 0) * (1 - e))} ${f(cy)}) scale(${f(e)}) translate(${f(-cx)} ${f(-cy)})`, { opacity: f(seg(k, 0, 0.25)) });
  }
  return g;
}

// ---------------------------------------------------------------- the always-on HUD layer (screen space, drawn last)
const XP = { level: 1, value: 0.12, text: '12 / 100' };      // == SC03's end state; no XP is earned in SC04
// mid = screen pop-ups between the frame and the XP bar; o.dots = minimap dots; o.k = frame assemble
function hudLayer(t, clock, mid = '', o = {}) {
  let g = H.hudFrame({ t, clock, day: 'MON', dots: o.dots, k: o.k ?? 1 });
  g += mid;
  g += H.xpBar({ ...XP, t, k: o.xpK ?? 1 });
  return g;
}

// ---------------------------------------------------------------- small HUD bits in the Reality-HUD look
// STR chip over a head (x, y = head top): [STR] 85 + bar; picked: 0..1 green check slaps; hl: gold pulse
function strChip(o = {}) {
  const { x = 0, y = 0, s = 1, k = 1, t = 0, str = 50, picked = 0, hl = 0, name = '' } = o;
  if (k <= 0) return '';
  const th = H.theme(picked > 0.5 ? 'green' : hl > 0 ? 'gold' : 'cyan');
  const wd = 176, ht = name ? 84 : 62, top = -22 - ht;
  const kk = ease.outBack(seg(k, 0, 1));
  let b = H.panel(-wd / 2, top, wd, ht, th, { c: 10, br: 12, scan: false, shadow: false, edge: 4 });
  let yy = top + 8;
  if (name) { b += H.TF(name, 0, top + 24, 17, th.label, { 'letter-spacing': 2 }); yy += 20; }
  b += S.path(H.para(-wd / 2 + 10, yy, 62, 28, 7), { fill: '#FF9A2E', stroke: th.edge, 'stroke-width': 3 }) + H.TF('STR', -wd / 2 + 39, yy + 21, 17, '#2A1200');
  b += H.TL(String(str), wd / 2 - 14, yy + 27, 34, str >= 80 ? '#FFD21F' : '#FFFFFF', { 'text-anchor': 'end', stroke: th.edge, 'stroke-width': 5, 'paint-order': 'stroke' });
  b += H.segBar(-wd / 2 + 12, yy + 36, wd - 26, 8, str / 100, str >= 80 ? '#FF7A3D' : '#FF9A2E', { th, t, cell: 12 });
  b += S.path('M0 -4V-22', ln(4.5, th.edge)) + S.path('M0 -4V-22', ln(2, th.rim)) + S.path(H.diamondD(0, -2, 5, 6), { fill: th.rim });
  if (hl > 0) b += S.path(H.cham(-wd / 2 - 6, top - 6, wd + 12, ht + 12, 12), { fill: 'none', stroke: '#FFD21F', 'stroke-width': 4, opacity: f(hl * (0.5 + 0.5 * Math.sin(t * 9))) });
  if (picked > 0) {
    const sl = H.slap(clamp(picked, 0, 1), 20, -8);
    b += S.g(S.circle(0, 0, 22, { fill: '#3DFF8F', stroke: th.edge, 'stroke-width': 4 }) + S.path('M-12 1 L-4 9 L12 -9', ln(6, th.edge)), `translate(${f(wd / 2 - 4)} ${f(top + 4)}) rotate(${f(sl.rot)}) scale(${f(sl.sc)})`, { opacity: f(sl.op) });
  }
  return S.g(b, `translate(${f(x)} ${f(y + Math.sin(t * 2 + x * 0.01) * 2)}) scale(${f(s * kk)})`, k < 0.3 ? { opacity: f(k / 0.3) } : {});
}
// floating damage / heal number (game style): rises, pops, fades; age seconds since the hit
function dmgNum(x, y, age, text, col = '#FF4D66', s = 1, life = 1.1) {
  if (age < 0 || age > life) return '';
  const u = age / life;
  const sc = s * (age < 0.12 ? lerp(1.9, 1, age / 0.12) : 1);
  const op = 1 - seg(u, 0.7, 1);
  return S.g(H.TL(text, 0, 0, 64, col, { stroke: '#03101B', 'stroke-width': 9, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }), `translate(${f(x + 20 * u)} ${f(y - 120 * ease.out(u))}) rotate(${f(-6 + 4 * u)}) scale(${f(sc)})`, op < 1 ? { opacity: f(op) } : {});
}
// a slanted stamp (OUT!, WIN, DODGE!) slamming on: k 0..1
function stamp(x, y, k, text, col = '#FF3355', s = 1, rot = -8, fg = '#FFF6D8') {
  if (k <= 0) return '';
  const sl = H.slap(clamp(k, 0, 1), rot - 14, rot);
  const w = text.length * 27 + 50;
  let g = S.path(H.para(-w / 2, -32, w, 64, 14), { fill: col, stroke: '#03101B', 'stroke-width': 5, 'stroke-linejoin': 'round' });
  g += S.path(H.para(-w / 2 + 6, -26, w - 12, 10, 4), { fill: '#FFFFFF', opacity: 0.35 });
  g += H.TL(text, 0, 16, 44, fg, { stroke: '#03101B', 'stroke-width': 6, 'paint-order': 'stroke' });
  if (sl.flash > 0) g += S.path(H.para(-w / 2, -32, w, 64, 14), { fill: '#FFFFFF', opacity: f(0.8 * sl.flash) });
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(sl.rot)}) scale(${f(s * sl.sc)})`, { opacity: f(sl.op) }) + H.impactTicks(x, y, w * 0.6 * s, 46 * s, seg(k, 0.5, 0.95), '#FFFFFF', 6);
}
// the SPECIAL SKILL card (gold glass) — k 0..1 unfolds; value types in
function skillCard(o = {}) {
  const { x = 960, y = 300, s = 1, k = 1, t = 0, title = 'SPECIAL SKILL', value = 'FALLING DOWN', sub = 'COOLDOWN: 0 SEC · USES: ∞', out = 0 } = o;
  if (k <= 0 || out >= 1) return '';
  const th = H.theme('gold');
  const wd = 560, ht = 168, left = -wd / 2, top = -ht / 2;
  const uf = H.unfold(seg(k, 0, 0.55));
  let c = H.panel(left, top, wd, ht, th, { c: 18, br: 24 });
  c += H.sheen(left + 8, top + 6, wd - 16, ht - 12, t, 3.4, 4);
  c += S.path(H.hexD(left + 66, 0, 46), { fill: '#2A1A00', stroke: th.edge, 'stroke-width': 5 }) + S.path(H.hexD(left + 66, 0, 38), { fill: 'none', stroke: '#FFD21F', 'stroke-width': 3 });
  // a little falling stick-figure icon
  c += S.g(S.circle(0, -20, 9, { fill: '#FFD21F' }) + S.path('M0 -10 L0 12 M0 0 L-16 -8 M0 0 L16 6 M0 12 L-12 26 M0 12 L14 24', ln(6, '#FFD21F')), `translate(${f(left + 66)} 4) rotate(${f(-35 + 10 * Math.sin(t * 6))})`);
  c += H.TF(title, left + 130, top + 42, 20, th.label, { 'text-anchor': 'start', 'letter-spacing': 4 });
  const vt = value.slice(0, Math.ceil(value.length * seg(k, 0.35, 0.75)));
  if (vt) c += H.TL(vt, left + 128, top + 100, 56, '#FFF8E6', { 'text-anchor': 'start', stroke: th.edge, 'stroke-width': 7, 'paint-order': 'stroke' });
  if (k > 0.7) c += H.richText(sub, left + 130, top + 142, 22, '#FFD07A', 'F', 'start', { opacity: f(seg(k, 0.7, 0.9)) });
  const rk = ease.outBack(seg(k, 0.55, 0.85));
  if (rk > 0) c += S.g(S.path(H.para(-74, -18, 148, 36, 10), { fill: '#FF9A2E', stroke: th.edge, 'stroke-width': 4 }) + H.TL('LEGENDARY', 0, 9, 22, '#2A1200'), `translate(${f(-left - 92)} ${f(top + 2)}) rotate(6) scale(${f(rk)})`);
  if (k < 0.85) c += S.path(H.cham(left, top, wd, ht, 18), { fill: '#FFFFFF', opacity: f(0.7 * (1 - seg(k, 0.4, 0.8))) });
  let g = S.g(c, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  if (uf.line > 0) g += S.path(`M${f(left * uf.sx)} 0H${f(-left * uf.sx)}`, ln(6, '#FFFFFF', uf.line));
  const op = 1 - clamp(out, 0, 1);
  return S.g(g, `translate(${f(x)} ${f(y - 40 * out)}) scale(${f(s)})`, op < 1 ? { opacity: f(op) } : {});
}
// a red boss-attack callout banner ("BOSS ATTACK: POP QUIZ!")
function attackCallout(x, y, k, t, label = 'BOSS ATTACK', text = 'POP QUIZ!', s = 1) {
  if (k <= 0) return '';
  const th = H.theme('boss');
  const wd = 620, ht = 112;
  const uf = H.unfold(seg(k, 0, 0.5));
  let c = H.panel(-wd / 2, -ht / 2, wd, ht, th, { c: 16, br: 22 });
  c += S.path(H.para(-wd / 2, -ht / 2, wd, ht, 0), { fill: 'url(#hdHaz)', opacity: 0.18 });
  c += H.skullIcon(-wd / 2 + 56, 0, 30, '#FFF6D8', '#C8102E');
  c += H.TF(label, -wd / 2 + 104, -14, 20, th.label, { 'text-anchor': 'start', 'letter-spacing': 4 });
  c += H.TL(text, -wd / 2 + 102, 38, 54, '#FFF6D8', { 'text-anchor': 'start', stroke: th.edge, 'stroke-width': 7, 'paint-order': 'stroke' });
  if (k < 0.8) c += S.path(H.cham(-wd / 2, -ht / 2, wd, ht, 16), { fill: '#FFFFFF', opacity: f(0.7 * (1 - seg(k, 0.4, 0.75))) });
  let g = S.g(c, `scale(${f(uf.sx)} ${f(uf.sy)})`);
  if (uf.line > 0) g += S.path(`M${-wd / 2 * uf.sx} 0H${wd / 2 * uf.sx}`, ln(6, '#FFFFFF', uf.line));
  const sh = Math.max(0, 1 - seg(k, 0.5, 1)) * 10;
  return S.g(g, `translate(${f(x + Math.sin(t * 70) * sh)} ${f(y)}) rotate(-2) scale(${f(s)})`);
}

// ---------------------------------------------------------------- props in motion
// a quiz sheet lying flat on a table (perspective-squashed); world coords
const flatPaper = (x, y, s, rot = 0, o = {}) => S.g(X.quizPaper({ x: 0, y: 0, s: 1, title: o.title || 'POP QUIZ', name: o.name || '', grade: o.grade || null }), `translate(${f(x)} ${f(y)}) scale(${f(s)} ${f(s * 0.42)}) rotate(${f(rot)})`);
// a book falling from the sky and bouncing to rest at (x, y); u = time since its release
function fallingBook(x, y, age, i, s = 0.5, fallH = 700) {
  if (age < 0) return '';
  const cols = ['#E8453C', '#3B82F6', '#FFC93C', '#5DBB4A', '#B65CFF'];
  const c = cols[i % cols.length];
  const T1 = 0.32;
  let yy, rot;
  if (age < T1) { const u = age / T1; yy = y - fallH * (1 - u * u); rot = (hash(i) - 0.5) * 400 * (1 - u) + 4; }
  else { const a2 = age - T1, b = Math.max(0, Math.sin(Math.min(1, a2 / 0.22) * Math.PI)) * 40 * Math.exp(-a2 * 3); yy = y - b; rot = (hash(i + 3) - 0.5) * 30; }
  const w = 220 - (i % 3) * 20, h = 44;
  const g = S.rect(-w / 2, -h, w, h, 8, ol(c, 6)) + S.rect(-w / 2 + 14, -h + 6, w - 22, h - 14, 4, { fill: '#FFF8EE' }) + S.rect(-w / 2, -h, 26, h, 6, ol('#2A2A33', 5));
  return S.g(g, `translate(${f(x)} ${f(yy)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// little orbiting dizzy stars around a head (screen or world coords)
function dizzyStars(x, y, r, t, s = 1, n = 3) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = t * 5 + (i / n) * Math.PI * 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.3;
    o += S.path(K.F.starPath(px, py, 16 * s, 7 * s, 5), ol('#FFD21F', 3 * s));
  }
  return o;
}

// ---------------------------------------------------------------- the retro "IN GAMES" panel content (full-frame, cheap)
function retroGame(t, k = 1) {
  let o = S.rect(-20, -20, 1960, 1120, 0, { fill: '#5FB8FF' });
  // pixel clouds + hills + ground
  const px = (x, y, w, h, c) => S.rect(x, y, w, h, 0, { fill: c });
  o += px(200, 170, 240, 60, '#FFFFFF') + px(240, 130, 160, 50, '#FFFFFF') + px(1300, 220, 280, 60, '#FFFFFF') + px(1350, 180, 160, 50, '#FFFFFF');
  o += px(-20, 640, 1960, 460, '#58B848') + px(-20, 640, 1960, 30, '#3E9A36');
  for (let i = 0; i < 12; i++) o += px(i * 170 + 40, 700 + (i % 2) * 70, 40, 40, '#4AA63C');
  // a pixel hut
  o += px(1250, 380, 420, 270, '#B8743A') + S.path('M1220 390 L1460 230 L1700 390 Z', { fill: '#C0392B', stroke: '#5A1A10', 'stroke-width': 10 }) + px(1420, 500, 90, 150, '#5A3A1A') + px(1300, 440, 80, 70, '#FFE38A');
  // the blocky villager NPC (8-bit style), bobbing
  const b = Math.round(Math.sin(t * 4)) * 6;
  let n = px(-70, -330 + b, 140, 140, '#F2C49A') + px(-80, -350 + b, 160, 50, '#7A4A22') + px(-40, -270 + b, 20, 24, '#151515') + px(20, -270 + b, 20, 24, '#151515') + px(-30, -225 + b, 60, 12, '#151515');
  n += px(-90, -190, 180, 180, '#3E7BD8') + px(-130, -190, 40, 150, '#3E7BD8') + px(90, -190, 40, 150, '#3E7BD8') + px(-130, -40, 40, 40, '#F2C49A') + px(90, -40, 40, 40, '#F2C49A');
  n += px(-80, -10, 70, 120, '#5A3A1A') + px(10, -10, 70, 120, '#5A3A1A');
  o += S.g(n, tf(760, 760));
  // the classic quest "!" above him
  o += H.questMarker({ x: 760, y: 400, s: 2.3, t, k });
  o += TS('VILLAGER', 760, 900, 54, '#FFFFFF');
  return o;
}

module.exports = {
  tf, TS, TFS, pop, scAt, toScr, camAt, shakeAll, boing, roll, clipTo,
  whip, smash, zoomLines, streaks, letterbox, dim, panel,
  XP, hudLayer, strChip, dmgNum, stamp, skillCard, attackCallout,
  flatPaper, fallingBook, dizzyStars, retroGame, LINE,
};
