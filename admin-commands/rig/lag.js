// Non-rig characters of the Shutdown video, plain SVG (no filters, no masks):
//   lag({ x, y, size, t, mouth, mood, glitch, look, blink })   the LAG: a puffy cloud of spinning loading wheels
//   buffer({ x, y, s, t, mood, blink, hop, look })              the Lag shrunk into a hamster-sized pet
//   modbot({ x, y, s, t, face, roll, alarm, lean, talk })       round one-wheeled security robot
'use strict';

const S = require('./svg');
const C = require('./palette');
const F = require('./face');
const { f } = S;

const LINE = C.line;
const outline = (fill, w = 7) => ({ fill, stroke: LINE, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const lineOnly = (w = 7, color = LINE) => ({ fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
const ring = (x, y, r) => `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// Many classic dotted loading spinners, batched by dot index: n paths whatever the number of spinners.
// list: [{x, y, r, speed (rev/s, + = clockwise), phase}]; rotation is stepped like a real loading icon.
function spinners(list, t, { n = 8, col = '#FFFFFF', minOp = 0.14, dot = 0.2, shrink = 0.45, stepped = true } = {}) {
  const lv = Array.from({ length: n }, () => '');
  for (const s of list) {
    const turns = t * (s.speed ?? 1) + (s.phase || 0);
    const base = stepped ? Math.floor(turns * n) / n : turns;
    const dir = (s.speed ?? 1) >= 0 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const a = (base - dir * i / n) * Math.PI * 2 - Math.PI / 2;
      lv[i] += ring(s.x + Math.cos(a) * s.r, s.y + Math.sin(a) * s.r, s.r * dot * (1 - (shrink * i) / (n - 1)));
    }
  }
  return lv.map((d, i) => (d ? S.path(d, { fill: col, opacity: f(minOp + (1 - minOp) * Math.pow(1 - i / (n - 1), 1.7)) }) : '')).join('');
}

// ---------------------------------------------------------------- the LAG
// Unit cloud is ~740 x 500; drawn at scale size * 0.76, so size 1 ≈ 380 px tall (560 wide), size 0.4 ≈ 150 px,
// size 3 ≈ 1140 px tall (fills a 1920x1080 frame). (x, y) is the centre of the cloud.
const PUFFS = [
  [-232, 96, 84], [-118, 124, 94], [0, 132, 98], [118, 124, 94], [234, 98, 82],
  [-306, 8, 72], [304, 4, 74], [-214, -62, 94], [-80, -112, 112], [72, -120, 114], [208, -60, 92],
  [-150, -168, 72], [0, -196, 84], [150, -172, 68], [0, 6, 176],
];
// the loading wheels the cloud is made of (spaced around the rim, clear of the face)
const SPIN = [[-240, 106, 44], [240, 104, 44], [-318, 6, 38], [316, 2, 38], [-238, -84, 42], [238, -84, 42],
  [-160, -200, 36], [0, -232, 40], [160, -204, 34], [-128, 168, 38], [128, 168, 38], [-80, -128, 26], [80, -132, 26]];
const LAG_SCALE = 0.76;
const MOUTH_OPEN = { B: 0.3, C: 0.5, D: 0.8, E: 0.62, F: 0.34, G: 0.2, H: 0.5, o: 0.4, O: 0.78, grin: 0.5, bigGrin: 0.82, scream: 1, wail: 0.9, yawn: 0.8, teeth: 0.36, uh: 0.25, tongue: 0.3, open: 0.7 };
const ROUND = ['E', 'F', 'o', 'O', 'yawn'];
const LAG_COL = {
  neutral: { base: '#8E94A5', shade: '#686E80', hi: '#BCC1CD', dots: '#EEF1F6', pupil: LINE },
  hungry: { base: '#8E94A5', shade: '#686E80', hi: '#BCC1CD', dots: '#EEF1F6', pupil: LINE },
  angry: { base: '#7D7F92', shade: '#585A6C', hi: '#A9ABBB', dots: '#F2E6EA', pupil: '#E8243C' },
  laugh: { base: '#9298A9', shade: '#6C7284', hi: '#C2C7D2', dots: '#F4F6FA', pupil: LINE },
  scared: { base: '#A2A8B6', shade: '#7A8092', hi: '#D0D4DD', dots: '#FFFFFF', pupil: LINE },
};

function lagEye(ex, ey, R, side, mood, t, look, blink, col) {
  let o = '';
  const scared = mood === 'scared', angry = mood === 'angry', hungry = mood === 'hungry';
  const r = R * (scared ? 1.1 : 1);
  o += S.circle(ex, ey, r, outline('#FFFFFF', 9));
  if (mood === 'laugh') {
    o += S.path(`M${f(ex - r * 0.62)} ${f(ey + r * 0.22)} Q${f(ex)} ${f(ey - r * 0.75)} ${f(ex + r * 0.62)} ${f(ey + r * 0.22)}`, lineOnly(16));
    o += spinners([{ x: ex, y: ey, r: r * 0.78, speed: 2.2 * side, phase: side * 0.3 }], t, { col: '#5A6072', dot: 0.16, minOp: 0.06 });
    return o;
  }
  o += spinners([{ x: ex, y: ey, r: r * 0.78, speed: (angry ? 1.8 : 1.1) * side, phase: side * 0.3 }], t, { col: '#4A5062', dot: 0.16, minOp: 0.06 });
  const pr = r * (scared ? 0.18 : hungry ? 0.42 : 0.34);
  const jit = scared ? Math.sin(t * 61) * 3 : 0;
  const px = ex + look[0] * r * 0.28 + jit, py = ey + look[1] * r * 0.24;
  if (angry) o += S.circle(px, py, pr * 1.45, { fill: '#FF6B7A', opacity: 0.55 });
  o += S.circle(px, py, pr, { fill: col.pupil }) + S.circle(px - pr * 0.36, py - pr * 0.38, pr * 0.34, { fill: '#FFFFFF' }) + S.circle(px + pr * 0.32, py + pr * 0.3, pr * 0.14, { fill: '#FFFFFF' });
  // lids: angry slant (inner corner low), blink from the top
  const lid = Math.max(blink, angry ? 0.42 : 0);
  if (lid > 0.01) {
    const tilt = angry ? r * 0.5 * -side : 0;
    const y0 = ey - r + 2 * r * lid;
    const id = S.uid('lle');
    o += S.clipDef(id, S.circle(ex, ey, r)) + S.g(S.path(`M${f(ex - r - 10)} ${f(ey - r - 30)} L${f(ex + r + 10)} ${f(ey - r - 30)} L${f(ex + r + 10)} ${f(y0 - tilt)} L${f(ex - r - 10)} ${f(y0 + tilt)} Z`, { fill: col.base, stroke: LINE, 'stroke-width': 12 }), null, { 'clip-path': `url(#${id})` });
    o += S.circle(ex, ey, r, { fill: 'none', stroke: LINE, 'stroke-width': 9 });
  }
  return o;
}
function lagMouth(mouth, mood, t, col) {
  const my = 92;
  const m = mouth || (mood === 'hungry' ? 'open' : mood === 'laugh' ? 'bigGrin' : mood === 'scared' ? 'wavy' : 'X');
  const a = MOUTH_OPEN[m];
  if (!a) {
    if (mood === 'angry' || m === 'teethClosed') {
      let d = `M-150 ${my}`;
      for (let i = 1; i <= 10; i++) d += ` L${-150 + i * 30} ${my + (i % 2 ? -14 : 10)}`;
      return S.path(d, lineOnly(12));
    }
    if (m === 'wavy' || mood === 'scared') {
      let d = `M-110 ${my}`;
      for (let i = 1; i <= 8; i++) d += ` Q${-110 + i * 27.5 - 13.75} ${my + (i % 2 ? -16 : 16)} ${-110 + i * 27.5} ${my}`;
      return S.path(d, lineOnly(11));
    }
    if (m === 'smile' || m === 'smallSmile' || mood === 'laugh') return S.path(`M-140 ${my - 16} Q0 ${my + 52} 140 ${my - 16}`, lineOnly(12));
    return S.path(`M-140 ${my + 12} Q-60 ${my - 8} 0 ${my - 4} Q70 ${my} 140 ${my + 16}`, lineOnly(12));
  }
  const round = ROUND.includes(m);
  const w = round ? 70 + 50 * a : 150;
  const top = my - 8 - (round ? 40 * a : 6 * a), bot = my + 20 + (round ? 130 : 190) * a;
  const d = round
    ? `M${-w} ${f((top + bot) / 2)} Q${-w} ${f(top)} 0 ${f(top)} Q${w} ${f(top)} ${w} ${f((top + bot) / 2)} Q${w} ${f(bot)} 0 ${f(bot)} Q${-w} ${f(bot)} ${-w} ${f((top + bot) / 2)} Z`
    : `M${-w} ${my} Q0 ${f(top - 10)} ${w} ${my} Q${f(w * 0.85)} ${f(bot)} 0 ${f(bot)} Q${f(-w * 0.85)} ${f(bot)} ${-w} ${my} Z`;
  const id = S.uid('lgm');
  let inner = S.rect(-260, my - 300, 520, 600, 0, { fill: '#22252F' });
  // a deep little spinner in the throat
  if (a > 0.45) inner += spinners([{ x: 0, y: (top + bot) / 2 + 14, r: 26 + 30 * a, speed: 1.4 }], t, { col: '#6A7082', dot: 0.2 });
  // grey teeth-like dots along the lips
  let teeth = '';
  const nT = round ? 5 : 8;
  for (let i = 0; i < nT; i++) {
    const u = (i + 0.5) / nT, x = -w * 0.86 + 2 * w * 0.86 * u;
    const yTop = round ? top + 10 + Math.pow(Math.abs(u - 0.5) * 2, 2) * (bot - top) * 0.25 : my - (1 - Math.pow(2 * u - 1, 2)) * (my - top + 4) * 0.5 + 6;
    teeth += ring(x, yTop + 4, 13 - Math.abs(u - 0.5) * 6);
  }
  if (!round || a > 0.5) for (let i = 0; i < nT - 3; i++) {
    const u = (i + 0.5) / (nT - 3), x = -w * 0.6 + 1.2 * w * u;
    teeth += ring(x, bot - 10 - (1 - Math.pow(2 * u - 1, 2)) * 6, 11);
  }
  inner += S.path(teeth, { fill: '#C5CAD6', stroke: '#9CA2B2', 'stroke-width': 3 });
  let o = S.clipDef(id, S.path(d)) + S.path(d, { fill: '#22252F' }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(d, { fill: 'none', stroke: LINE, 'stroke-width': 12, 'stroke-linejoin': 'round' });
  if (mood === 'hungry') {
    const dx = w * 0.55, dy = my + 30 + (Math.sin(t * 3) * 0.5 + 0.5) * 40;
    o += S.path(`M${f(dx - 12)} ${my + 8} Q${f(dx - 14)} ${f(dy)} ${f(dx)} ${f(dy + 18)} Q${f(dx + 14)} ${f(dy)} ${f(dx + 12)} ${my + 8} Z`, { fill: '#BFE8FF', stroke: LINE, 'stroke-width': 6 });
  }
  return o;
}
function lag({ x = 960, y = 540, size = 1, t = 0, mouth = null, mood = 'neutral', glitch = 0, look = [0, 0], blink = 0 } = {}) {
  const col = LAG_COL[mood] || LAG_COL.neutral;
  const lw = 10 / Math.sqrt(Math.max(1, size));
  const breathe = (i) => 1 + 0.035 * Math.sin(t * 2.6 + i * 1.7);
  const bob = mood === 'laugh' ? Math.abs(Math.sin(t * 9)) * -22 : Math.sin(t * 1.6) * 8;
  const shiver = mood === 'scared' ? Math.sin(t * 57) * 6 : 0;
  const P = PUFFS.map(([px, py, r], i) => [px, py, r * breathe(i)]);
  let o = '';
  // silhouette: outline, shadow, base, highlights (4 paths for the whole cloud)
  const sil = P.map(([px, py, r]) => ring(px, py, r + lw)).join('');
  if (glitch > 0) {
    const g = 10 + 26 * glitch;
    o += S.path(sil, { fill: '#FF2E63', opacity: f(0.55 * glitch), transform: `translate(${f(-g)} ${f(-g * 0.2)})` }) + S.path(sil, { fill: '#2EE6FF', opacity: f(0.55 * glitch), transform: `translate(${f(g)} ${f(g * 0.2)})` });
  }
  o += S.path(sil, { fill: LINE });
  o += S.path(P.map(([px, py, r]) => ring(px, py, r)).join(''), { fill: col.shade });
  o += S.path(P.map(([px, py, r]) => ring(px - 5, py - 8, r * 0.9)).join(''), { fill: col.base });
  o += S.path(P.slice(0, 14).filter((p) => p[1] < -150).map(([px, py, r]) => `M${f(px - r * 0.72)} ${f(py - r * 0.18)} A${f(r * 0.78)} ${f(r * 0.78)} 0 0 1 ${f(px + r * 0.1)} ${f(py - r * 0.74)}`).join(''), { fill: 'none', stroke: col.hi, 'stroke-width': 14, 'stroke-linecap': 'round', opacity: 0.7 });
  // the cloud is MADE of loading wheels: one spinner per puff plus small ones in the gaps
  const list = SPIN.map(([sx, sy, sr], i) => ({ x: sx, y: sy, r: sr * breathe(i + 3), speed: (0.8 + hash(i) * 0.7) * (mood === 'angry' ? 1.8 : mood === 'scared' ? 2.4 : 1), phase: hash(i + 9) }));
  o += S.path(list.map((q) => ring(q.x, q.y, q.r * 1.36)).join(''), { fill: col.shade, opacity: 0.38 });
  o += spinners(list, t, { col: col.dots, dot: 0.28, minOp: 0.05, shrink: 0.5 });
  // brows
  const browTilt = mood === 'angry' ? 34 : mood === 'scared' ? -30 : mood === 'hungry' ? -10 : mood === 'laugh' ? -14 : 0;
  const browY = mood === 'hungry' || mood === 'scared' ? -168 : -150;
  for (const side of [-1, 1]) {
    const xi = side * 36, xo = side * 196;
    const bd = `M${xo} ${browY - browTilt * 0.2} Q${side * 120} ${browY - 34} ${xi} ${browY + browTilt}`;
    o += S.path(bd, lineOnly(38, LINE)) + S.path(bd, lineOnly(24, '#4E5466'));
  }
  o += lagEye(-104, -44, 80, -1, mood, t, look, blink, col) + lagEye(104, -44, 80, 1, mood, t, look, blink, col);
  o += lagMouth(mouth, mood, t, col);
  if (mood === 'scared') o += F.sweatDrop(250, -170, 1.6) + F.sweatDrop(-268, -130, 1.2);
  if (mood === 'angry') o += S.path('M262 -230 q-6 -24 18 -30 M300 -210 q24 -6 30 18 M292 -168 q6 24 -18 30 M254 -186 q-24 6 -30 -18', { fill: 'none', stroke: '#E8243C', 'stroke-width': 12, 'stroke-linecap': 'round' });
  const k = size * LAG_SCALE;
  const tf = `translate(${f(x + shiver)} ${f(y + bob * size)}) scale(${f(k)})`;
  if (!(glitch > 0)) return S.g(o, tf);
  // glitch: pixel-shifted horizontal slices (clipped <use> copies) and stray pixel blocks
  const gid = S.uid('lagG');
  let out = S.g(o, tf, { id: gid });
  const step = Math.floor(t * 14);
  const H = 520 * k, W = 820 * k;
  const nb = 2 + Math.round(glitch * 3);
  for (let i = 0; i < nb; i++) {
    const hy = y - H / 2 + hash(step * 7.1 + i * 13.3) * H, hh = (12 + hash(step + i * 5.7) * 50) * k * (0.6 + glitch);
    const dx = (hash(step * 3.3 + i) - 0.5) * 120 * k * glitch;
    const cid = S.uid('lagC');
    out += S.clipDef(cid, S.rect(x - W, hy, 2 * W, hh)) + S.g(S.el('use', { href: `#${gid}`, x: f(dx) }), null, { 'clip-path': `url(#${cid})` });
  }
  let blocks = '';
  for (let i = 0; i < Math.round(4 + glitch * 10); i++) {
    const bx = x + (hash(step * 1.7 + i * 3.1) - 0.5) * W * 1.1, by = y + (hash(step * 2.9 + i * 7.7) - 0.5) * H;
    const bw = (16 + hash(i + step) * 60) * k, bh = (10 + hash(i * 2 + step) * 26) * k;
    blocks += `M${f(bx)} ${f(by)}h${f(bw)}v${f(bh)}h${f(-bw)}Z`;
  }
  out += S.path(blocks, { fill: ['#FF2E63', '#2EE6FF', col.base][step % 3], opacity: f(0.5 + 0.4 * glitch) });
  return out;
}

// ---------------------------------------------------------------- Buffer (the shrunken Lag: a pet)
// Feet at (x, y). s = 1 ≈ 120 px tall (same units as the rig: next to a kid at s 0.5 use s 0.5).
// mood: 'happy' | 'sad' | 'surprised' | 'sleepy' | 'love' | 'scared'; blink 0..1; hop 0..1 (jump height, with stretch)
function buffer({ x = 0, y = 0, s = 1, t = 0, mood = 'happy', blink = 0, hop = 0, look = [0, 0] } = {}) {
  const lift = hop * 70;
  const sq = hop > 0.02 ? 1 + 0.1 * hop : 1;
  let o = S.ellipse(0, 0, 40 * Math.max(0.5, 1 - hop * 0.6), 7, { fill: C.shadow });
  let b = '';
  // feet and arms
  for (const sx of [-1, 1]) {
    b += S.ellipse(sx * 17, -6 + (hop > 0.02 ? -4 : 0), 13, 8, outline('#FFB8C9', 4.5));
    b += S.ellipse(sx * 54, -60 + Math.sin(t * 6 + sx) * 2, 9, 13, { ...outline('#E9ECF3', 4.5), transform: `rotate(${sx * -24} ${sx * 54} -60)` });
  }
  // body: a little loading wheel
  b += S.circle(0, -62, 52, outline('#F4F6FA', 6));
  b += S.path('M-30 -26 Q0 -6 32 -24 Q20 -12 0 -10 Q-18 -10 -30 -26 Z', { fill: '#DDE1EA' });
  b += spinners([{ x: 0, y: -62, r: 40, speed: 1.2 }], t, { col: '#8C93A8', dot: 0.17, minOp: 0.1 });
  b += S.circle(-26, -96, 9, { fill: '#FFFFFF' });
  // eyes
  const closed = mood === 'sleepy' || blink > 0.7;
  for (const sx of [-1, 1]) {
    const ex = sx * 17 + look[0] * 4, ey = -66 + look[1] * 3;
    if (closed) b += S.path(`M${ex - 11} ${ey + 2} Q${ex} ${ey + 10} ${ex + 11} ${ey + 2}`, lineOnly(5));
    else if (mood === 'love') b += S.path(F.heartPath(ex, ey, 11), outline('#FF4D6D', 4));
    else {
      const k = mood === 'scared' ? 0.75 : 1;
      b += S.ellipse(ex, ey, 12 * k, 16 * k, { fill: LINE });
      b += S.circle(ex - 4 * k, ey - 6 * k, 5 * k, { fill: '#FFFFFF' }) + S.circle(ex + 4 * k, ey + 5 * k, 2.4 * k, { fill: '#FFFFFF' });
      if (blink > 0.05) b += S.rect(ex - 14, ey - 18, 28, 32 * blink, 0, { fill: '#F4F6FA' });
      if (mood === 'sad') b += S.path(`M${ex - 12} ${ey - 20} L${ex + 10} ${ey - 26 + sx * 6}`, lineOnly(4));
    }
  }
  b += S.ellipse(-34, -48, 9, 5, { fill: C.blush, opacity: 0.7 }) + S.ellipse(34, -48, 9, 5, { fill: C.blush, opacity: 0.7 });
  // mouth
  if (mood === 'surprised' || mood === 'scared') b += S.ellipse(0, -44, 6, mood === 'scared' ? 5 : 7, outline(C.mouth, 3.5));
  else if (mood === 'sad') b += S.path('M-8 -40 Q0 -48 8 -40', lineOnly(4));
  else if (mood === 'sleepy') b += S.ellipse(0, -44, 4, 5, outline(C.mouth, 3)) + F.markText('z', 52, -112, 30, -10);
  else b += S.path('M-10 -48 Q-5 -40 0 -46 Q5 -40 10 -48', lineOnly(4));
  if (mood === 'love') b += S.path(F.heartPath(48, -118, 9), outline('#FF4D6D', 3.5));
  if (mood === 'sad') b += S.path('M-17 -54 q-3 8 0 12', lineOnly(4, C.tear));
  o += S.g(b, `translate(0 ${f(-lift)}) scale(${f(1 / Math.sqrt(sq))} ${f(sq)})`);
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- Modbot (security robot)
// Wheel on the ground at (x, y). s = 1 ≈ 880 px tall (rig units: next to kids at s 0.5 use s 0.5).
// face: '!' red | '?' amber (suspicious) | '#' chat-filtered | 'ok' green; roll: distance rolled (px, spins
// the wheel); alarm 0..1: siren glow + sweeping beams; lean: body tilt (deg, + = toward screen-right); talk 0..1 pulses the screen.
function modbot({ x = 0, y = 0, s = 1, t = 0, face = '!', roll = 0, alarm = 0, lean = 0, talk = 0, flip = false } = {}) {
  const WR = 92, wy = -WR;
  let o = S.ellipse(0, 0, 170, 22, { fill: C.shadow });
  // wheel
  let w = S.circle(0, 0, WR, outline('#2A2D36', 9)) + S.circle(0, 0, WR - 26, outline('#8C93A8', 6));
  let spokes = '';
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; spokes += `M0 0 L${f(Math.cos(a) * (WR - 30))} ${f(Math.sin(a) * (WR - 30))} `; }
  w += S.path(spokes, lineOnly(10, '#5B6275')) + S.circle(0, 0, 18, outline('#C9CED8', 5));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; w += S.path(`M${f(Math.cos(a) * (WR - 4))} ${f(Math.sin(a) * (WR - 4))} L${f(Math.cos(a) * (WR - 16))} ${f(Math.sin(a) * (WR - 16))}`, lineOnly(5, '#4A4E5C')); }
  o += S.g(w, `translate(0 ${wy}) rotate(${f((roll / WR) * (180 / Math.PI))})`);
  // body
  let b = '';
  b += S.path(`M-120 ${wy - 40} L120 ${wy - 40} L96 ${wy + 20} L-96 ${wy + 20} Z`, outline('#5B6275', 8));
  const bd = 'M-232 -300 C-232 -560 -180 -770 0 -770 C180 -770 232 -560 232 -300 C232 -220 170 -170 0 -170 C-170 -170 -232 -220 -232 -300 Z';
  const id = S.uid('mb');
  let inner = S.path('M60 -800 C210 -720 250 -480 240 -300 C230 -200 160 -150 40 -150 C150 -220 190 -420 60 -800 Z', { fill: '#C7D0DF' });
  inner += S.path('M-170 -560 C-150 -680 -90 -740 -30 -750', lineOnly(28, '#FFFFFF'));
  inner += S.rect(-260, -330, 520, 62, 0, { fill: '#2E6BE6' }) + S.path('M-260 -330 L260 -330 M-260 -268 L260 -268', lineOnly(6));
  inner += S.el('text', { x: 0, y: -284, 'font-family': 'Lilita One, sans-serif', 'font-size': 52, fill: '#FFFFFF', 'text-anchor': 'middle', 'letter-spacing': 6 }, 'MOD');
  b += S.clipDef(id, S.path(bd)) + S.path(bd, { fill: '#EEF1F6' }) + S.g(inner, null, { 'clip-path': `url(#${id})` }) + S.path(bd, { fill: 'none', stroke: LINE, 'stroke-width': 9 });
  // stubby arms
  for (const sx of [-1, 1]) {
    b += S.g(S.path(S.roundedPath([[-26, 0], [26, 0], [26, 130], [-26, 130]], 22), outline('#C9CED8', 8)) + S.circle(0, 150, 32, outline('#5B6275', 8)), `translate(${sx * 236} -470) rotate(${f(sx * (-14 + Math.sin(t * 3 + sx) * 4 + alarm * 30))})`);
  }
  // screen face
  const pulse = 1 + 0.08 * talk * Math.sin(t * 30);
  b += S.path(S.roundedPath([[-166, -690], [166, -690], [166, -410], [-166, -410]], 54), outline('#1B1E28', 9));
  const fc = { '!': '#FF3B4E', '?': '#FFB21F', '#': '#FF5A3B', ok: '#3BD16F' }[face] || '#FF3B4E';
  b += S.path(S.roundedPath([[-140, -664], [140, -664], [140, -436], [-140, -436]], 40), { fill: fc, opacity: 0.14 });
  let sym = '';
  if (face === 'ok') sym = S.path('M-70 -560 L-20 -508 L74 -612', lineOnly(30, fc));
  else if (face === '#') {
    const g = Math.floor(t * 10) % 2;
    sym = S.el('text', { x: 0, y: -486, 'font-family': 'Lilita One, sans-serif', 'font-size': 190, fill: fc, 'text-anchor': 'middle' }, '#') +
      S.el('text', { x: -100 + g * 200, y: -630, 'font-family': 'Lilita One, sans-serif', 'font-size': 50, fill: fc, 'text-anchor': 'middle', opacity: 0.7 }, '#');
  } else sym = S.el('text', { x: 0, y: -478, 'font-family': 'Lilita One, sans-serif', 'font-size': 230, fill: fc, 'text-anchor': 'middle' }, face === '?' ? '?' : '!');
  b += S.g(sym, `translate(0 -550) scale(${f(pulse)}) translate(0 550)`);
  for (let yy = -650; yy < -430; yy += 18) b += S.path(`M-140 ${yy} L140 ${yy}`, { stroke: '#000', 'stroke-width': 4, opacity: 0.12 });
  b += S.path('M-130 -650 Q-110 -676 -60 -678', lineOnly(10, '#FFFFFF55'));
  // siren
  const on = alarm > 0 && Math.floor(t * 6) % 2 === 0;
  if (alarm > 0) {
    const a = t * 360 * 1.2;
    const beam = (ang) => S.path('M0 -810 L-520 -1010 L-520 -880 Z', { fill: '#FF3B4E', opacity: f(0.22 * alarm), transform: `rotate(${f(ang)} 0 -810)` });
    b += beam(Math.sin((a * Math.PI) / 180) * 50) + S.g(beam(-Math.sin((a * Math.PI) / 180) * 50), 'scale(-1 1)');
    b += S.circle(0, -812, 90 + (on ? 26 : 0), { fill: '#FF3B4E', opacity: f(0.18 * alarm) });
  }
  b += S.rect(-56, -790, 112, 30, 10, outline('#5B6275', 7));
  b += S.path('M-46 -790 L-46 -812 A46 46 0 0 1 46 -812 L46 -790 Z', outline(on ? '#FF6B78' : '#E8243C', 7));
  b += S.path('M-24 -820 Q-20 -846 2 -852', lineOnly(8, '#FFFFFF99'));
  o += S.g(b, `rotate(${f(lean)} 0 ${wy})`);
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f((flip ? -1 : 1) * s)} ${f(s)})`);
}

module.exports = { lag, buffer, modbot, spinners, LAG_SCALE };
