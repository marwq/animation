// Private helpers for SC 05 («ШКОЛА») and SC 11 («ПОСЛЕ»): transitions, the hero with the magic laptop, typed chat commands,
// noclip ghosting, the hero in socks, smoke, request bubbles, the melted whistle, burnt soles, the lunch lady, the wrinkled
// hand, a cheap "darkness with a hole" and small props (stopwatch, phone, ceiling debris).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const SETS = require('./sets');
const V = K.V;
const { makeDesign } = require('../rig/r6');
const { drawCharacter } = require('../rig/body');

let CS = null;
try { CS = require('./city'); } catch (e) { CS = null; }

const LINE = '#151515';
const W = 1920, H = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
// camera that centres the world point (wx, wy) at the given zoom
const at = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
// world point -> screen point for a cam at parallax 1
const toScr = (cam, x, y) => { const z = cam.zoom ?? 1; return [960 + (cam.sx || 0) + z * (x - 960 - (cam.x || 0)), 540 + (cam.sy || 0) + z * (y - 540 - (cam.y || 0))]; };
function shakeAll(cam, t, list) {
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s05c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
// feet y that puts a rig character's face centre at screen y fy (size = the design's size factor)
const faceAt = (fy, s, size = 1) => fy + 740 * s * size;
// a camera key that snaps (very short ease) — for smash-zooms inside a shot
const snapKeys = (t0, a, b, d = 0.07) => [[t0 - d, a], [t0, b]];

// ---------------------------------------------------------------- transitions
function whip(t, tc, dir = 1, dur = 0.1) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * H, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
// radial zoom lines around (cx, cy) for punchlines (k 0..1)
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = 380 + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 500;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}

// ---------------------------------------------------------------- chat commands
// typed command bar: prog 0..1; ENTER flash at tEnter; pops in at o.tIn; a little bump on ENTER
function cmd(t, x, y, text, prog, tEnter, o = {}) {
  const kin = o.tIn !== undefined ? pop(t, o.tIn, 0.22) : 1;
  if (kin <= 0.01) return '';
  const enter = t >= tEnter ? clamp((t - tEnter) / 0.45, 0, 1) : 0;
  const sc = (o.s || 1) * kin * (1 + 0.14 * bump(t, tEnter, tEnter + 0.2));
  return K.chatCommand(x, y, text, prog, { t, enter, s: sc, user: o.user || 'you', theme: o.theme || 'dark', w: o.w, cursor: prog < 1 });
}
// progress for a command typed between two absolute times
const typeBetween = (t, a, b) => clamp((t - a) / Math.max(0.05, b - a), 0, 1);

// ---------------------------------------------------------------- the hero + the magic laptop
// laptop props in BODY space (feet 0,0). mode: 'back' (lid back toward camera, held at the belly), 'open' (screen toward camera),
// 'side' (side view: held in front, screen visible), 'under' (closed, clutched at the chest like a book)
function lapProp(t, mode = 'back', o = {}) {
  const glow = o.glow ?? 0.8;
  if (mode === 'back') return { svg: SETS.laptop(0, o.y ?? -232, o.s ?? 0.52, '', { back: true, glow, t }), layer: 'front' };
  if (mode === 'open') return { svg: SETS.laptop(0, o.y ?? -250, o.s ?? 0.5, o.screen || SETS.adminScreen(t, { typed: o.typed || '', lines: o.lines }), { glow, t }), layer: 'front' };
  if (mode === 'side') return { svg: SETS.laptop(o.x ?? -190, o.y ?? -300, o.s ?? 0.42, o.screen || SETS.adminScreen(t, { typed: o.typed || '', lines: o.lines }), { glow, t }), layer: 'front' };
  // 'under': closed, vertical against the chest
  return { svg: S.g(SETS.laptop(0, 0, o.s ?? 0.36, '', { lid: 0, glow: o.glow ?? 0.25, t }), tf(o.x ?? 30, o.y ?? -330, 1, o.rot ?? -78)), layer: 'front' };
}
function hero(t, pose = {}, act = {}, lap = null) {
  const p = { ...pose };
  if (lap) p.props = [...(pose.props || []), lapProp(t, lap.mode, lap)];
  return K.actor('you', t, p, act);
}
// the hero in socks (the shoes did not survive): same design, shoe colours -> socks with grey toes
const D_SOCKS = makeDesign({
  col: { jacket: '#D8262E', jacketLine: '#B01D24', shirt: '#F2D04A', shirtShade: '#D9B73A', pants: '#1F3B2A', pantsShade: '#162C1F', sole: '#F4F2F8', soleShade: '#D2CEDF', toe: '#BDB7CF' },
});
function heroSocks(t, pose = {}, act = {}, lap = null) {
  const auto = V.perform('YOU', t, { seed: 3 * 3.7 + (act.seed || 0), ...act });
  const p = { shade: true, shadow: true, ...auto, ...pose };
  if (pose.face && auto.face) {
    const fo = typeof pose.face === 'string' ? { name: pose.face } : { ...pose.face };
    if (auto.face.mouth && V.talking('YOU', t) && fo.mouth === undefined) fo.mouth = auto.face.mouth;
    if (auto.face.blink && fo.blink === undefined) fo.blink = auto.face.blink;
    p.face = fo;
  }
  if (lap) p.props = [...(pose.props || []), lapProp(t, lap.mode, lap)];
  return drawCharacter(D_SOCKS, p);
}
// noclip: translucent body + a jittering double (k 0..1)
function ghost(svg, k, t, dx = 10) {
  if (k <= 0.01) return svg;
  const j = Math.sin(t * 47) * dx * k + (hash(Math.floor(t * 20)) - 0.5) * dx * k;
  return S.g(svg, `translate(${f(j)} 0)`, { opacity: f(0.22 * k) }) + S.g(svg, null, { opacity: f(1 - 0.5 * k) });
}
// ghost scanline shimmer over an area (screen/world rect), k 0..1
function scanShimmer(x, y, w, h, t, k, col = '#7CF7FF') {
  if (k <= 0.01) return '';
  let d = '';
  const off = (t * 220) % 28;
  for (let yy = y + off; yy < y + h; yy += 28) d += `M${f(x)} ${f(yy)}h${f(w)}`;
  return S.path(d, { stroke: col, 'stroke-width': 5, opacity: f(0.45 * k), fill: 'none' });
}

// ---------------------------------------------------------------- small FX
// continuous smoke puffs rising from (x, y): each puff = a little cloud of 3 circles
function smoke(x, y, t, o = {}) {
  const { n = 5, s = 1, col = '#C9C7D4', seed = 1, rate = 0.9, rise = 170, op = 0.75, drift = 30 } = o;
  let out = '';
  for (let i = 0; i < n; i++) {
    const ph = (t * rate + i / n + hash(seed + i) * 0.2) % 1;
    const px = x + (Math.sin(ph * 5 + i + seed) * 16 + ph * drift) * s, py = y - ph * rise * s, r = (10 + ph * 30) * s;
    const a = Math.min(1, ph * 6) * (1 - ph);
    if (a < 0.02) continue;
    const d = `M${f(px - r)} ${f(py)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z` +
      `M${f(px - r * 1.5)} ${f(py + r * 0.3)}a${f(r * 0.7)} ${f(r * 0.7)} 0 1 0 ${f(r * 1.4)} 0a${f(r * 0.7)} ${f(r * 0.7)} 0 1 0 ${f(-r * 1.4)} 0Z` +
      `M${f(px + r * 0.2)} ${f(py + r * 0.35)}a${f(r * 0.75)} ${f(r * 0.75)} 0 1 0 ${f(r * 1.5)} 0a${f(r * 0.75)} ${f(r * 0.75)} 0 1 0 ${f(-r * 1.5)} 0Z`;
    out += S.path(d, { fill: col, opacity: f(op * a), stroke: '#8A8898', 'stroke-width': f(Math.max(1, 3 * s)) });
  }
  return out;
}
// dust burst at (x, y): age seconds since the hit
function dustPuff(x, y, age, s = 1, n = 6) {
  if (age < 0 || age > 0.6) return '';
  const u = age / 0.6;
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI, d = (40 + 160 * ease.out(u)) * s;
    o += S.circle(x + Math.cos(a) * d * 1.4, y + Math.sin(a) * d * 0.4 - 10 * s, (22 + 18 * hash(i)) * s * (1 - u * 0.4), { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4 * s, opacity: f(1 - u) });
  }
  return o;
}
// request / speech bubble with a tail toward (x + tx, y + ty)
function bubble(x, y, text, k, o = {}) {
  if (k <= 0.01) return '';
  const size = o.size || 44, w = o.w || Math.max(160, text.length * size * 0.56 + 60), h = size * 1.8;
  const tx = o.tx ?? 0, ty = o.ty ?? h / 2 + 40;
  let g = S.path(`M${f(-18)} ${f(h / 2 - 4)} L${f(tx)} ${f(ty)} L${f(18)} ${f(h / 2 - 4)} Z`, ol(o.col || '#FFFFFF', 5));
  g += S.rect(-w / 2, -h / 2, w, h, h / 2.4, ol(o.col || '#FFFFFF', 6)) + S.rect(-22, h / 2 - 10, 44, 10, 0, { fill: o.col || '#FFFFFF' });
  g += T(esc(text), 0, size * 0.36, size, o.ink || '#2A2246');
  return S.g(g, tf(x, y, ease.outBack(clamp(k, 0, 1)) * (o.s || 1), o.rot || 0));
}
// a "TWEET!" / "BOOM!" etc
const bang = (txt, x, y, k, size = 120, rot = -6, col = '#FFD21F') => K.bang(txt, x, y, k, size, rot, col);

// ---------------------------------------------------------------- props
// Coach's whistle melting: k 0 = whistle, 1 = drooping with silver drips. (x, y) = mouth point, s scale
function meltWhistle(x, y, s, k, t = 0) {
  const u = clamp(k, 0, 1), sag = 30 * ease.out(u);
  // body (sags at the far end) + mouthpiece
  const d = `M-6 -12 L34 ${f(-12 + sag * 0.4)} Q52 ${f(-10 + sag)} 50 ${f(6 + sag)} Q46 ${f(18 + sag * 1.1)} 32 ${f(14 + sag * 0.7)} L-6 12 Z`;
  let o = S.path(d, ol('#D3D8E2', 4)) + S.rect(-26, -9, 22, 18, 4, ol('#C9CED8', 4));
  o += S.circle(26, f(2 + sag * 0.4), 5, { fill: LINE, opacity: f(1 - u * 0.8) }) + S.path(`M0 -6 L30 ${f(-6 + sag * 0.3)}`, ln(3, '#FFFFFF', 0.85));
  if (u > 0.15) {
    const dk = (t * 1.3) % 1, dk2 = (t * 1.3 + 0.5) % 1;
    o += S.path(`M40 ${f(16 + sag)} q-4 ${f(8 + 16 * u)} 0 ${f(14 + 22 * u)} q4 -6 0 -${f(14 + 22 * u)}`, ol('#C9CED8', 3));
    o += S.circle(40, 36 + sag + 22 * u + dk * 140, 5 * (1 - dk), ol('#C9CED8', 2)) + S.circle(22, 24 + sag * 0.7 + dk2 * 150, 4 * (1 - dk2), ol('#C9CED8', 2));
    o += smoke(30, -16, t, { n: 3, s: 0.45, seed: 7, rise: 110, op: 0.55, col: '#E4E2EA' });
  }
  return S.g(o, tf(x, y, s));
}
function stopwatch(x, y, s, txt, rot = 0) {
  let o = S.rect(-12, -96, 24, 22, 4, ol('#C9CED8', 4)) + S.rect(-26, -110, 52, 18, 6, ol('#FF5A5A', 4)) + S.circle(0, 0, 80, ol('#E9EDF3', 6)) + S.circle(0, 0, 64, ol('#FFFFFF', 3));
  o += S.rect(-56, -22, 112, 44, 8, { fill: '#1B1E28' }) + T(txt, 0, 16, 40, '#7CFF6B');
  return S.g(o, tf(x, y, s, rot));
}
function phoneProp(x, y, s, rot, flash = 0) {
  let o = S.rect(-40, -70, 80, 140, 14, ol('#2A2D38', 5)) + S.rect(-30, -56, 60, 104, 6, { fill: '#5AC8FF' }) + S.circle(20, -58, 5, { fill: '#8A93A6' });
  if (flash > 0) o += S.circle(20, -58, 40 * flash, { fill: '#FFFFFF', opacity: f(flash) }) + K.rays(20, -58, 10, 160 * flash, '#FFFFFF', 0.6 * flash, 0);
  return S.g(o, tf(x, y, s, rot));
}
// a charred sneaker sole (side-ish), smoking; burn 0..1 (embers)
function burntSole(x, y, s, t, seed = 1) {
  let o = S.path('M-90 0 Q-100 -26 -70 -30 L60 -34 Q100 -34 96 -10 Q94 6 70 6 L-70 6 Q-90 6 -90 0 Z', ol('#2A2328', 5));
  o += S.path('M-60 -20 L-30 -14 M0 -24 L24 -12 M40 -26 L64 -16', ln(4, '#FF7A2E', 0.55 + 0.4 * Math.sin(t * 9 + seed)));
  o += S.path('M-70 -2 L70 -2', ln(3, '#4A3E44'));
  return S.g(o, tf(x, y, s)) + smoke(x, y - 30 * s, t, { n: 4, s: s * 0.9, seed, rise: 220, op: 0.7, col: '#8E8C9C' });
}
// lunch lady: an adult with a puffy white cap + apron + ladle
function lunchLady(t, pose = {}) {
  const props = [
    { svg: S.path('M-150 -975 Q-165 -1070 -60 -1080 Q0 -1125 60 -1080 Q165 -1070 150 -975 Q0 -948 -150 -975 Z', ol('#FFFFFF', 7)) + S.path('M-132 -988 Q0 -962 132 -988', ln(4, '#D6DAE6')), layer: 'top' },
    { svg: S.path('M-96 -500 L96 -500 L110 -250 L-110 -250 Z', ol('#FFFFFF', 6)) + S.path('M-60 -460 H60', ln(4, '#D6DAE6')), layer: 'front' },
  ];
  if (pose.ladle !== false) {
    const a = pose.armR ?? 9, hx = 108 + 252 * Math.sin((a * Math.PI) / 180), hy = -515 + 252 * Math.cos((a * Math.PI) / 180);
    props.push({ svg: S.g(S.path('M0 0 L0 -150', ln(16)) + S.path('M0 0 L0 -150', ln(8, '#C9CED8')) + S.path('M-34 -150 Q-34 -190 0 -190 Q34 -190 34 -150 Z', ol('#C9CED8', 5)), tf(hx, hy + 20, 1, (pose.ladleRot ?? 0) + 180)), layer: 'front' });
  }
  return K.draw.adult(6, { shade: true, shadow: true, face: 'happy', ...pose, props: [...(pose.props || []), ...props] });
}
// wrinkled old hand, index finger pointing along +x (tip at the origin); cardigan cuff behind. s ~1 = 260 px long
function oldHand(x, y, s, rot = 0, press = 0) {
  const sk = '#F2D2BC', sh = '#D9B096';
  let o = S.rect(-330, -62, 150, 124, 26, ol('#8E949F', 7)) + S.path('M-300 -62 V62 M-260 -62 V62 M-220 -62 V62', ln(4, '#757B86'));
  o += S.path('M-200 -52 Q-120 -70 -60 -44 L-14 -30 Q8 -26 8 -12 Q8 2 -14 2 L-60 0 Q-40 30 -70 50 Q-120 70 -200 54 Z', ol(sk, 7));
  o += S.path('M-120 -40 Q-100 -10 -126 30 M-150 -36 Q-132 -4 -150 36', ln(3.5, sh));
  o += S.path('M-40 -38 q6 8 0 16 M-24 -34 q5 7 0 14', ln(3, sh));
  o += S.path('M-90 46 q16 -10 30 0 M-118 54 q16 -10 30 0', ln(3, sh));
  o += S.path(`M-6 -24 Q4 -20 2 -10`, ln(3, '#FFFFFF', 0.6));
  o += S.ellipse(-2, -14, 8, 9, { fill: '#F8E2D2', stroke: sh, 'stroke-width': 2 });
  if (press > 0) o += S.circle(10, -14, 26 * press, { fill: 'none', stroke: '#FFE7B0', 'stroke-width': 5, opacity: f(1 - press) });
  return S.g(o, tf(x, y, s, rot));
}
// darkness everywhere except a rounded rect (with a few soft rings); op = darkness
function darkAround(x, y, w, h, op = 0.85, soft = 120, col = '#06040E') {
  const ring = (g) => `M-800 -800 H2720 V1880 H-800 Z M${f(x - g)} ${f(y - g)} h${f(w + 2 * g)} v${f(h + 2 * g)} h${f(-w - 2 * g)} Z`;
  let o = '';
  const N = 4;
  for (let i = 0; i < N; i++) o += S.path(ring((soft * (N - i)) / N), { fill: col, 'fill-rule': 'evenodd', opacity: f(op / N * 1.1) });
  return o;
}
// ceiling debris chunks falling from (x, y) since t0
function debris(x, y, t, t0, n = 10, s = 1, seed = 2) {
  const age = t - t0;
  if (age < 0 || age > 1.6) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const vx = (hash(i + seed) - 0.5) * 600 * s, vy = -100 * hash(i * 3 + seed) * s;
    const px = x + vx * age, py = y + vy * age + 0.5 * 2600 * age * age * s;
    const r = (14 + 22 * hash(i * 7 + seed)) * s;
    o += S.rect(px - r, py - r * 0.7, r * 2, r * 1.4, 4, { ...ol(i % 3 ? '#E6EEF8' : '#C9D3E2', 4), transform: `rotate(${f(age * 400 * (hash(i) - 0.5))} ${f(px)} ${f(py)})` });
  }
  return o;
}
// the hero-shaped hole lying in the floor (a body outline lying sideways, head to the left, perspective-flattened);
// origin = the hole centre on the floor
function floorHeroHole(x, y, s, k = 1, flat = 0.36) {
  if (k <= 0.01) return '';
  const d = SETS.heroHoleD(s, ease.outBack(clamp(k, 0, 1)), 0, 0);
  const inner = S.g(S.path(d, { fill: '#0E0A1A', stroke: LINE, 'stroke-width': 9 }) + S.path(d, { fill: 'none', stroke: '#5A4A6A', 'stroke-width': 6, transform: 'translate(8 0)', opacity: 0.5 }), `rotate(90) translate(0 ${f(480 * s)})`);
  return S.g(inner, `translate(${f(x)} ${f(y)}) scale(1 ${f(flat)})`);
}

module.exports = {
  CS, LINE, W, H, faceAt, tf, TS, TFS, esc, pop, at, toScr, shakeAll, clipTo, snapKeys, whip, smash, zoomLines,
  cmd, typeBetween, lapProp, hero, heroSocks, ghost, scanShimmer, smoke, dustPuff, bubble, bang,
  meltWhistle, stopwatch, phoneProp, burntSole, lunchLady, oldHand, darkAround, debris, floorHeroHole,
};
