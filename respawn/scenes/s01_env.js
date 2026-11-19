// Private helpers for SC 01 (cold open), SC 09 (delete save) and SC 12 (final gag + outro):
// camera/transition helpers, the hero on his bike, ghost copies looping their fails (full ghosts + ghostLite crowd poses),
// small FX (impact stars, motion trails, sweat drops), a sports-replay frame and the OSD text of the VHS rewind.
'use strict';

const K = require('./kit');
const R = require('./respawn');
const AC = require('./acting');
const X = require('../rig/extras');
const { draw } = require('../rig/cast');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;

const W = 1920, H = 1080, LINE = '#151515';
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const stroked = (sw, extra = {}) => ({ stroke: LINE, 'stroke-width': sw, 'stroke-linejoin': 'round', 'paint-order': 'stroke', ...extra });
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, stroked(size * 0.16, extra));
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, stroked(size * 0.16, extra));
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const mod = (a, n) => ((a % n) + n) % n;
// camera that puts world point (wx, wy) at the screen centre (parallax 1)
const at = (wx, wy, zoom = 1, extra = {}) => ({ zoom, x: wx - 960, y: wy - 540, ...extra });
// world point -> screen point for a cam (parallax k)
function toScr(cam, x, y, k = 1) {
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  const fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  return [fx + (cam.sx || 0) + z * (x - fx - (cam.x || 0) * k), fy + (cam.sy || 0) + z * (y - fy - (cam.y || 0) * k)];
}
function shakeAll(cam, t, list) {
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
// a whole-frame transform (rotation / zoom around the screen centre) for screen-space tricks
const frameTf = (z = 1, rot = 0, dx = 0, dy = 0) => `translate(${f(960 + dx)} ${f(540 + dy)}) rotate(${f(rot)}) scale(${f(z)}) translate(-960 -540)`;
function clipRect(x, y, w, h, inner, r = 0) {
  const id = S.uid('s01c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}

// ---------------------------------------------------------------- transitions / accents
function whip(t, tc, dir = 1, dur = 0.1) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * H, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = mod(hash(i * 5.1) * 2600 + dir * d * 16000, 2600) - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75, col = '#FFFFFF') => (t >= tc && t < tc + dur ? R.flash(a * (1 - (t - tc) / dur), col) : '');
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 600;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
// squash/stretch impulse after t0
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
// impact star burst (comic) at x, y — k 0..1
function impact(x, y, k, s = 1, col = '#FFE14D', seed = 1) {
  if (k <= 0 || k >= 1) return '';
  const n = 9, r0 = 60 * s, r1 = (150 + 120 * ease.out(k)) * s;
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + seed;
    const r = i % 2 ? r0 * (0.8 + 0.4 * hash(i + seed)) : r1 * (0.75 + 0.35 * hash(i * 3 + seed));
    d += `${i ? 'L' : 'M'}${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`;
  }
  const sc = ease.outBack(seg(k, 0, 0.3)) * (1 - 0.3 * seg(k, 0.6, 1));
  return S.g(S.path(d + 'Z', { fill: col, stroke: LINE, 'stroke-width': 8 * s, 'stroke-linejoin': 'round' }), `translate(${f(x)} ${f(y)}) scale(${f(sc)}) translate(${f(-x)} ${f(-y)})`, { opacity: f(1 - seg(k, 0.75, 1)) });
}
// little sweat drops flying off a head
function sweat(x, y, t, s = 1, n = 3) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = mod(t * 2.2 + i / n, 1);
    const dx = (i - (n - 1) / 2) * 60 * s * (0.6 + a), dy = -40 * s * Math.sin(a * Math.PI) - 10 * a * s;
    o += S.path(`M${f(x + dx)} ${f(y + dy - 18 * s)} Q${f(x + dx + 12 * s)} ${f(y + dy)} ${f(x + dx)} ${f(y + dy + 8 * s)} Q${f(x + dx - 12 * s)} ${f(y + dy)} ${f(x + dx)} ${f(y + dy - 18 * s)}Z`, { fill: '#8FD3FF', stroke: LINE, 'stroke-width': 4 * s, opacity: f(1 - a) });
  }
  return o;
}
// motion trail streaks behind a moving point (dir = travel direction unit vector)
function trail(x, y, dx, dy, len, s = 1, col = '#FFFFFF', n = 4, seed = 1) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 34 * s + (hash(i + seed) - 0.5) * 14 * s;
    const nx = -dy * off, ny = dx * off;
    const L = len * (0.6 + 0.4 * hash(i * 3 + seed));
    d += `M${f(x + nx)} ${f(y + ny)} L${f(x + nx - dx * L)} ${f(y + ny - dy * L)} `;
  }
  return S.path(d, ln(10 * s, col, 0.8));
}

// ---------------------------------------------------------------- the hero (and ghosts) on the bike
// bikeRig(o): bike + rider facing RIGHT. (x, y) = ground point under the bike, s = hero scale, rot = bike pitch (deg, + = nose down),
// rider: 'you' | 'ghost' | false; spin = wheel angle; pedal = crank phase; face; lean.
// returns { bike, rider } (draw bike first, rider second — or rider: false and draw your own)
function bikeRig(t, o = {}) {
  const { x = 0, y = 0, s = 0.34, rot = 0, spin = 0, pedal = 0, rider = 'you', face = 'happy', grey = false, alpha } = o;
  let bike = X.bicycle({ x: 0, y: 0, s: 1, flip: true, wheelSpin: spin, bars: o.bars || 0, col: grey ? '#9AA4B4' : '#2E7BD1' });
  if (grey) bike = R.tint(bike, 'ghost', 1);
  const g = (inner) => S.g(inner, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
  let rid = '';
  if (rider) {
    const ph = pedal;
    const pose = {
      x: -64, y: -82, s: 1, view: 'side', flip: true, lean: 14 + (o.lean || 0), armL: 70, armR: 64,
      legL: 62 + 16 * Math.sin(ph), kneeL: 74 + 26 * Math.cos(ph), legR: 62 - 16 * Math.sin(ph), kneeR: 74 - 26 * Math.cos(ph),
      face, headRot: o.headRot || -4, shadow: false, volume: false,
    };
    rid = rider === 'ghost' ? draw.ghost({ ...pose, alpha: alpha ?? 0.55, rim: false }) : K.actor('you', t, pose, { arms: false });
  }
  return { bike: g(bike), rider: rider ? g(rid) : '' };
}

// ---------------------------------------------------------------- ghost copies looping their fails
// One looping fail cycle (u = 0..1 phase within the loop). Returns ghostLite pose fields (body space) for crowds, and the prop kind.
// kinds: 'bike' (flung over the bars), 'slip' (tray, feet up), 'ball' (hit in the face, falls back), 'skate' (board shoots away),
//        'stairs' (tumbles), 'flail' (arms windmill), 'facepalm', 'trip'
function failPose(kind, u) {
  const e = ease.inOut;
  switch (kind) {
    case 'slip': {
      const a = seg(u, 0.2, 0.42), b = seg(u, 0.42, 0.55);
      return { view: 'side', flip: true, ...AC.walk(u * 18, 0.8 * (1 - a)), rot: lerp(0, 72, e(a)) * (1 - seg(u, 0.85, 1)), lift: 120 * Math.sin(a * Math.PI) * (1 - b), legL: lerp(0, 70, a), legR: lerp(0, 50, a), armL: lerp(40, 150, a), armR: lerp(40, 130, a) };
    }
    case 'ball': {
      const a = seg(u, 0.3, 0.5);
      return { view: 'front', rot: lerp(0, -80, e(a)) * (1 - seg(u, 0.85, 1)), rotY: -40, headRot: -20 * a, armL: 20 + 120 * a, armR: 20 + 110 * a, lift: 20 * Math.sin(a * Math.PI) };
    }
    case 'skate': {
      const a = seg(u, 0.25, 0.5);
      return { view: 'side', flip: true, rot: lerp(0, -95, e(a)) * (1 - seg(u, 0.85, 1)), rotY: -60, lift: 160 * Math.sin(a * Math.PI), armL: 160 * a, armR: 120 * a, legL: 40 * a, legR: -20 * a };
    }
    case 'bike': {
      const a = seg(u, 0.15, 0.55);
      return { view: 'side', flip: true, rot: -400 * e(a) * (1 - seg(u, 0.9, 1)), rotY: -470, lift: 260 * Math.sin(a * Math.PI), armL: 140, armR: 120, legL: 30, legR: -10 };
    }
    case 'stairs': {
      const a = mod(u * 2, 1);
      return { view: 'side', flip: u > 0.5, rot: a * 360, rotY: -470, lift: 40 * Math.abs(Math.sin(a * Math.PI)), armL: 120, armR: 80, legL: 40, legR: -30 };
    }
    case 'flail': {
      const k = Math.sin(u * Math.PI * 8);
      return { view: 'front', armL: 110 + 50 * k, armR: 110 - 50 * k, lift: 30 * Math.abs(Math.sin(u * Math.PI * 4)), headRot: 8 * k };
    }
    case 'facepalm':
      return { view: 'front', armL: 10, armR: 160 - 20 * Math.abs(Math.sin(u * Math.PI * 2)), headRot: 10, bodyY: 10 };
    case 'trip':
    default: {
      const a = seg(u, 0.35, 0.55);
      return { view: 'side', flip: false, ...AC.walk(u * 16, 1 - a), rot: lerp(0, 85, e(a)) * (1 - seg(u, 0.85, 1)), rotY: -60, armL: 120 * a + 20, armR: 100 * a };
    }
  }
}
// full ghost doing a fail with its prop (screen/world coords), u = loop phase 0..1. Cheap enough for ≤ 10 per frame.
function ghostFail(kind, t, u, o = {}) {
  const { x = 960, y = 900, s = 0.3, alpha = 0.6, flip = false } = o;
  const sg = flip ? -1 : 1;
  let pr = '', gh = '';
  const P = failPose(kind, u);
  if (flip && P.view === 'side') P.flip = !P.flip;
  if (flip && P.rot) P.rot = -P.rot;
  const face = { name: kind === 'ball' ? 'oof' : kind === 'slip' || kind === 'skate' || kind === 'bike' ? 'scream' : 'shocked' };
  if (kind === 'bike') {
    // ghost bike rolls in, stops dead; ghost flies over the bars
    const a = seg(u, 0.0, 0.15);
    const bx = x - sg * 260 * s * (1 - a);
    const bk = bikeRig(t, { x: bx, y, s, rot: sg * 0, spin: u * 20, rider: false, grey: true });
    pr += S.g(bk.bike, null, { opacity: f(alpha) });
    if (u < 0.15) { const b2 = bikeRig(t, { x: bx, y, s, rider: 'ghost', grey: true, alpha }); gh += S.g(b2.rider, flip ? `translate(${f(2 * bx)} 0) scale(-1 1)` : null); }
    else gh += draw.ghost({ x: x + sg * 420 * s * seg(u, 0.15, 0.55), y, s, alpha, ...P, face });
  } else {
    const fx = kind === 'trip' ? x + sg * lerp(-120, 80, u) * s * 2 : kind === 'slip' ? x + sg * lerp(-200, 60, seg(u, 0, 0.42)) * s * 2 : x;
    gh += draw.ghost({ x: fx, y, s, alpha, ...P, face });
    if (kind === 'slip') {
      const a = seg(u, 0.28, 0.7);
      const tx = fx + sg * lerp(220, 520, a) * s, ty = y - lerp(560, 300, a) * s - 600 * s * Math.sin(a * Math.PI);
      pr += S.g(X.lunchTray({ x: u < 0.28 ? fx + sg * 230 * s : tx, y: u < 0.28 ? y - 520 * s : ty, s, rot: sg * 400 * a, spaghetti: 1 }), null, { opacity: f(alpha) });
      pr += X.spaghetti({ x: fx + sg * 600 * s, y, s: s * 1.2, mode: 'splat', seed: 3 }).replace(/^/, '');
    } else if (kind === 'ball') {
      const a = seg(u, 0.05, 0.3);
      if (u < 0.3) pr += X.dodgeball({ x: x - sg * lerp(1400, 0, a) * s, y: y - 760 * s, s, col: '#B9C1CF' });
      else pr += X.dodgeball({ x: x - sg * lerp(0, 500, seg(u, 0.3, 0.8)) * s, y: y - 760 * s + 900 * s * seg(u, 0.3, 0.8) ** 2 * 0.9, s, col: '#B9C1CF', squash: 0.5 * (1 - seg(u, 0.3, 0.36)) });
    } else if (kind === 'skate') {
      const a = seg(u, 0.25, 0.8);
      pr += S.g(X.skateboard({ x: x + sg * (lerp(0, 900, a)) * s, y: y - 30 * s, s, rot: sg * 360 * a, flipK: a * 0.75 }), null, { opacity: f(alpha * (1 - seg(u, 0.75, 0.85))) });
    }
  }
  return R.tint(pr, 'ghost', 0.9) + gh;
}

// ---------------------------------------------------------------- sports replay frame (gym)
function replayFrame(t, k = 1) {
  if (k <= 0) return '';
  let o = '';
  const on = Math.floor(t * 2.5) % 2 === 0;
  o += S.rect(0, 0, W, 70, 0, { fill: '#0B0F1A', opacity: f(0.75 * k) }) + S.rect(0, H - 70, W, 70, 0, { fill: '#0B0F1A', opacity: f(0.75 * k) });
  const bug = S.rect(-150, -40, 300, 80, 16, ol('#FF3B4E', 6)) + (on ? S.circle(-108, 0, 13, { fill: '#FFFFFF' }) : '') + TS('REPLAY', 22, 17, 48, '#FFFFFF');
  o += S.g(bug, tf(220, 140, ease.outBack(clamp(k, 0, 1))));
  o += S.g(S.rect(-210, -30, 420, 60, 14, { fill: '#0B0F1A', opacity: 0.8 }) + TF('SLOW-MO · 0.25×', 0, 12, 34, '#FFE14D'), tf(1650, 140, k));
  return o;
}

module.exports = {
  W, H, LINE, tf, stroked, TS, TFS, pop, mod, at, toScr, shakeAll, frameTf, clipRect,
  whip, smash, zoomLines, boing, impact, sweat, trail, bikeRig, failPose, ghostFail, replayFrame,
};
