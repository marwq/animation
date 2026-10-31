// Shared helpers for all scenes: timed dialogue lines -> karaoke captions + lip-sync visemes,
// transitions, overlays and small FX.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const { f, ease, inv, lerp, clamp } = S;

const W = 1920, H = 1080;
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const bump = (t, a, b) => Math.sin(clamp((t - a) / (b - a), 0, 1) * Math.PI);
const blinkAt = (t, ...cs) => Math.max(0, ...cs.map((c) => 1 - Math.abs(t - c) / 0.07));

// ---------------------------------------------------------------- lines -> captions / visemes
// line: [start, end, speaker, text]; *word* marks a highlighted keyword.
const SPEAKER_COL = { NARRATOR: '#FFFFFF', YOU: '#FFFFFF', NOVA: '#FF8FB0', SYSTEM: '#7CF7FF', MOM: '#FFB3D1', DAD: '#B8F0A0' };
const HILITE = { NARRATOR: '#FFD21F', YOU: '#FFD21F', NOVA: '#FF5A8A', SYSTEM: '#FFFFFF', MOM: '#FF5A8A', DAD: '#FFD21F' };

function words(text) {
  const out = []; let hi = false;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let w = raw; let h = hi;
    if (w.startsWith('*')) { h = true; hi = true; w = w.slice(1); }
    if (w.endsWith('*') || w.endsWith('*,') || w.includes('*')) { h = true; hi = false; w = w.replace(/\*/g, ''); }
    out.push({ w, h });
  }
  return out;
}

// split a line into word timings (by letter count) and caption chunks
function layoutLine([a, b, sp, text]) {
  const ws = words(text);
  const weight = (w) => Math.max(2, w.replace(/[^A-Za-z0-9?!]/g, '').length + 1);
  const total = ws.reduce((s, w) => s + weight(w.w), 0);
  let t = a;
  for (const w of ws) { const d = ((b - a) * weight(w.w)) / total; w.t0 = t; w.t1 = t + d; t += d; }
  const chunks = []; let cur = [];
  const flush = () => { if (cur.length) { chunks.push(cur); cur = []; } };
  for (const w of ws) {
    cur.push(w);
    const len = cur.map((x) => x.w).join(' ').length;
    if (len >= 10 || /[.,!?—…]$/.test(w.w) || cur.length >= 3) flush();
  }
  flush();
  return { a, b, sp, ws, chunks: chunks.map((c) => ({ t0: c[0].t0, t1: c[c.length - 1].t1, text: c.map((x) => x.w).join(' ').toUpperCase(), hi: c.some((x) => x.h), sp })) };
}

function makeTrack(lines) {
  const L = lines.map(layoutLine);
  const caps = [];
  for (const l of L) l.chunks.forEach((c, i) => {
    const next = l.chunks[i + 1];
    caps.push([c.t0, next ? next.t0 : Math.max(c.t1, l.b), c.text, c.hi ? HILITE[c.sp] : SPEAKER_COL[c.sp], c.hi ? 1.12 : 1]);
  });
  return { lines: L, caps };
}

const VOWEL = { a: 'D', e: 'C', i: 'B', o: 'E', u: 'F', y: 'B' };
function letterViseme(ch) {
  if (VOWEL[ch]) return VOWEL[ch];
  if ('mbp'.includes(ch)) return 'A';
  if ('fv'.includes(ch)) return 'G';
  if (ch === 'l') return 'H';
  if (ch === 'w') return 'F';
  return 'B';
}
// viseme for `speaker` at time t, or null when silent
function visemeAt(track, speaker, t) {
  for (const l of track.lines) {
    if (l.sp !== speaker || t < l.a || t > l.b) continue;
    for (const w of l.ws) {
      if (t < w.t0 || t > w.t1) continue;
      const letters = w.w.toLowerCase().replace(/[^a-z]/g, '');
      if (!letters) { if (!w.w.includes('#')) return 'X'; const u0 = (t - w.t0) / (w.t1 - w.t0); return ['C', 'D', 'B', 'E'][Math.floor(u0 * 4) % 4]; }
      const seq = [];
      for (const ch of letters) { const v = letterViseme(ch); if (seq[seq.length - 1] !== v) seq.push(v); }
      const u = (t - w.t0) / (w.t1 - w.t0);
      if (u > 0.92) return 'X';
      return seq[Math.min(seq.length - 1, Math.floor(u * seq.length))];
    }
    return 'X';
  }
  return null;
}

function captionText(text, color, scale = 1, y = 1018, rot = 0) {
  return S.g(S.el('text', {
    x: 0, y: 0, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 94, fill: color,
    stroke: '#151515', 'stroke-width': 17, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': 'middle',
  }, text), `translate(960 ${y}) rotate(${rot}) scale(${f(scale)})`);
}
function captionAt(caps, t, y = 1018) {
  const c = caps.find(([a, b]) => t >= a && t < b);
  if (!c) return '';
  const sc = lerp(0.5, 1, ease.outBack(inv(c[0], c[0] + 0.13, t))) * (c[4] || 1);
  return captionText(c[2], c[3], sc, y, c[4] > 1 ? -3 : 0);
}

// ---------------------------------------------------------------- transitions / overlays
const WIPE_COLS = ['#FF5A5A', '#FFB000', '#FFE14D', '#3BD16F', '#34C3FF', '#3B8BFF', '#B06BFF', '#FF6FB5'];
function pixelWipe(p, mode = 'cover', black = false) {
  const cell = 120, cols = 16, rows = 9;
  let o = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const d = ((c + r * 0.6) / (cols + rows * 0.6)) * 0.62 + hash(c * 31 + r * 7) * 0.08;
    let q = clamp((p - d) / 0.3, 0, 1);
    q = mode === 'cover' ? ease.outBack(q) : 1 - ease.inOut(q);
    if (q <= 0.001) continue;
    const s = cell * Math.min(q, 1.08) + 2;
    const fill = black ? '#0B0B12' : WIPE_COLS[Math.floor(hash(c * 13 + r * 17) * WIPE_COLS.length)];
    o += S.rect(c * cell + cell / 2 - s / 2, r * cell + cell / 2 - s / 2, s, s, black ? 2 : 10 * q, { fill });
  }
  return o;
}

const vignette = () => S.rect(0, 0, W, H, 0, { fill: 'url(#vignette)' });

// night colour grade + a light source glow (cx, cy, r) in screen space
function nightGrade(k = 1, glows = []) {
  let o = S.rect(0, 0, W, H, 0, { fill: '#0D1238', opacity: f(0.62 * k) });
  for (const g of glows) {
    const id = S.uid('ng');
    o += S.el('radialGradient', { id }, `<stop offset="0" stop-color="${g.col || '#A8E8FF'}" stop-opacity="${f(g.a ?? 0.55)}"/><stop offset="1" stop-color="${g.col || '#A8E8FF'}" stop-opacity="0"/>`);
    // soft-light keeps the black outlines black; a faint normal pass adds the light spill
    o += S.circle(g.x, g.y, g.r, { fill: `url(#${id})`, style: 'mix-blend-mode:soft-light' });
    o += S.circle(g.x, g.y, g.r, { fill: `url(#${id})`, opacity: 0.28 });
  }
  return o;
}

// VHS look: scanlines, tracking band, noise, tint, OSD text
function vhs(t, label = '', k = 1) {
  let o = S.rect(0, 0, W, H, 0, { fill: '#2A1E4A', opacity: f(0.25 * k) });
  let lines = '';
  for (let y = 0; y < H; y += 6) lines += `M0 ${y} L${W} ${y} `;
  o += S.path(lines, { stroke: '#000', 'stroke-width': 2, opacity: f(0.18 * k) });
  const by = ((t * 900) % (H + 200)) - 100;
  o += S.rect(0, by, W, 60, 0, { fill: '#FFFFFF', opacity: f(0.12 * k) }) + S.rect(0, by + 8, W, 6, 0, { fill: '#FFFFFF', opacity: f(0.35 * k) });
  for (let i = 0; i < 14; i++) {
    const y = hash(i * 5 + Math.floor(t * 40)) * H, x = hash(i * 9 + Math.floor(t * 40)) * W;
    o += S.rect(x, y, 80 + hash(i) * 260, 3, 0, { fill: '#FFFFFF', opacity: f(0.5 * k) });
  }
  if (label) {
    o += S.el('text', { x: 90, y: 120, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 72, fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }, label);
  }
  return o;
}

function staticNoise(t, k = 1) {
  let o = S.rect(0, 0, W, H, 0, { fill: '#26262E', opacity: f(k) });
  for (let i = 0; i < 70; i++) {
    const y = hash(i * 7 + Math.floor(t * 60)) * H, x = hash(i * 3 + Math.floor(t * 60)) * W;
    o += S.rect(x - 200, y, 200 + hash(i * 11) * 600, 4 + hash(i) * 8, 0, { fill: hash(i * 13) > 0.5 ? '#FFFFFF' : '#8A8A99', opacity: f(0.7 * k) });
  }
  return o;
}

function whiteFlash(k) { return k > 0 ? S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(clamp(k, 0, 1)) }) : ''; }

// ---------------------------------------------------------------- small FX
function zzz(t, x, y) {
  let o = '';
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.8 + i / 3) % 1;
    o += F.markText(i % 2 ? 'Z' : 'z', x + ph * 60 + i * 10, y - ph * 160, 46 + ph * 30, -12, '#FFFFFF');
  }
  return S.g(o, null, { opacity: 0.95 });
}

function musicNotes(t, x, y) {
  let o = '';
  for (let i = 0; i < 3; i++) {
    const ph = (t * 1.3 + i / 3) % 1;
    const nx = x + Math.sin((ph + i) * 6) * 30 + i * 30, ny = y - ph * 200;
    const col = ['#FFE14D', '#FF6FB5', '#34C3FF'][i];
    const g = S.ellipse(0, 0, 16, 12, { fill: col, stroke: '#151515', 'stroke-width': 5, transform: 'rotate(-20)' }) +
      S.path('M13 -4 L13 -56 L36 -46', { fill: 'none', stroke: '#151515', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    o += S.g(g, `translate(${f(nx)} ${f(ny)}) scale(${f(1 - ph * 0.3)})`, { opacity: f(1 - ph * ph) });
  }
  return o;
}

function speedLines(x0, x1, y, n, seed, col = '#FFFFFF', spread = 300) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const yy = y + (hash(seed + i) - 0.5) * spread, len = 120 + hash(seed + i * 3) * 220, xx = lerp(x0, x1, hash(seed + i * 7));
    o += S.rect(xx, yy, len, 10, 5, { fill: col, opacity: 0.85 });
  }
  return o;
}

function dust(x, y, t0, t) {
  let o = '';
  for (let i = 0; i < 4; i++) {
    const age = t - t0 - i * 0.04; if (age < 0 || age > 0.45) continue;
    const k = age / 0.45;
    o += S.circle(x + i * 40 + k * 60, y - k * 50 - i * 6, 18 + k * 30, { fill: '#FFFFFF', opacity: f(0.8 * (1 - k)), stroke: '#151515', 'stroke-width': 4 });
  }
  return o;
}

function burst(x, y, k, col = '#FFE14D') {
  if (k <= 0 || k >= 1) return '';
  let o = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, r0 = 40 + k * 120, r1 = r0 + 60 * (1 - k);
    o += S.path(`M${f(x + Math.cos(a) * r0)} ${f(y + Math.sin(a) * r0)} L${f(x + Math.cos(a) * r1)} ${f(y + Math.sin(a) * r1)}`, { stroke: col, 'stroke-width': 12 * (1 - k) + 2, 'stroke-linecap': 'round' });
  }
  return o + F.sparkle(x - 90 * k, y - 60 * k, 30 * (1 - k)) + F.sparkle(x + 100 * k, y - 30 * k, 24 * (1 - k));
}

function sfx(text, x, y, k, size = 90, rot = -8, col = '#FFE14D') {
  if (k <= 0) return '';
  return S.g(F.markText(text, 0, 0, size, rot, col), `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
}

module.exports = {
  W, H, hash, bump, blinkAt, makeTrack, visemeAt, captionAt, captionText, pixelWipe, vignette, nightGrade, vhs, staticNoise,
  whiteFlash, zzz, musicNotes, speedLines, dust, burst, sfx,
};
