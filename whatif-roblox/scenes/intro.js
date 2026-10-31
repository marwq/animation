// SC 01 — the first 10 seconds:
//   "What if you woke up... and the WHOLE world was Roblox?
//    Every street. Every person. Every... chicken.
//    And to survive, everyone had to pick ONE game. You picked the hardest one."
// Usage: node scenes/intro.js [out.mp4] [fps] [from] [to]
'use strict';

const path = require('path');
const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const { drawHero } = require('../rig/hero');
const { draw: cast, NAMES } = require('../rig/cast');
const { chicken, chatBubble } = require('../rig/creatures');
const { secretEgg } = require('../rig/props');
const { renderVideo } = require('../tools/render');
const { f, ease, inv, lerp, clamp } = S;

const W = 1920, H = 1080;
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const bump = (t, a, b) => Math.sin(clamp((t - a) / (b - a), 0, 1) * Math.PI); // 0 -> 1 -> 0
const blinkAt = (t, ...cs) => Math.max(0, ...cs.map((c) => 1 - Math.abs(t - c) / 0.07));

// ---------------------------------------------------------------- captions
const CAPS = [
  [0.30, 0.72, 'WHAT IF', '#FFFFFF'], [0.72, 0.98, 'YOU', '#FFFFFF'], [0.98, 1.72, 'WOKE UP...', '#FFFFFF'],
  [1.98, 2.30, 'AND THE', '#FFFFFF'], [2.30, 2.95, 'WHOLE WORLD', '#FFD21F'], [2.95, 3.70, 'WAS ROBLOX?!', '#FF5A5A', 1.15],
  [3.76, 4.50, 'EVERY STREET.', '#FFFFFF'], [4.56, 5.30, 'EVERY PERSON.', '#FFFFFF'],
  [5.36, 5.86, 'EVERY...', '#FFFFFF'], [5.90, 6.48, 'CHICKEN.', '#FFD21F', 1.2],
  [6.56, 7.24, 'AND TO SURVIVE,', '#FFFFFF'], [7.24, 7.60, 'EVERYONE', '#FFFFFF'], [7.60, 8.02, 'HAD TO PICK', '#FFFFFF'],
  [8.02, 8.60, 'ONE GAME.', '#5CFF7A', 1.3],
  [8.74, 9.18, 'YOU PICKED', '#FFFFFF'], [9.18, 9.60, 'THE HARDEST', '#FFFFFF'], [9.60, 10.1, 'ONE.', '#FF4D6D', 1.35],
];
function caption(t) {
  const c = CAPS.find(([a, b]) => t >= a && t < b);
  if (!c) return '';
  const sc = lerp(0.5, 1, ease.outBack(inv(c[0], c[0] + 0.13, t))) * (c[4] || 1);
  const rot = c[4] ? -3 : 0;
  return S.g(S.el('text', {
    x: 0, y: 0, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 94, fill: c[3],
    stroke: '#151515', 'stroke-width': 17, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': 'middle',
  }, c[2]), `translate(960 1018) rotate(${rot}) scale(${f(sc)})`);
}

// ---------------------------------------------------------------- overlays
const WIPE_COLS = ['#FF5A5A', '#FFB000', '#FFE14D', '#3BD16F', '#34C3FF', '#3B8BFF', '#B06BFF', '#FF6FB5'];
// cover: squares grow left->right; uncover: they shrink in the same order
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

function vignette() { return S.rect(0, 0, W, H, 0, { fill: 'url(#vignette)' }); }

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

function speedLines(x0, x1, y, n, seed, col = '#FFFFFF') {
  let o = '';
  for (let i = 0; i < n; i++) {
    const yy = y + (hash(seed + i) - 0.5) * 300, len = 120 + hash(seed + i * 3) * 220, xx = lerp(x0, x1, hash(seed + i * 7));
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

// ---------------------------------------------------------------- shot A: bedroom wake-up (0.00 - 1.95)
function shotBedroom(t) {
  const punch = ease.out(inv(1.17, 1.3, t));
  const cam = { zoom: 1 + 0.06 * ease.inOut(inv(0, 1.15, t)) + 0.2 * punch, fx: 960, fy: lerp(600, 500, punch) };
  if (t > 1.17 && t < 1.4) { const k = 1 - inv(1.17, 1.4, t); cam.sx = Math.sin(t * 95) * 10 * k; cam.sy = Math.cos(t * 83) * 8 * k; }
  const ring = t > 1.06 && t < 1.8 ? 1 : 0;
  const L = E.bedroomLayers(cam, t, { ring });
  const p = { x: 960, y: 1196, s: 0.9, nametag: 'YOU', headRot: 0 };
  if (t < 1.17) {
    const br = Math.sin(t * 2.6);
    p.bodyY = 4 * br; p.headY = 3 * br; p.headRot = 5;
    p.face = { name: 'neutral', eyes: { type: 'closed' }, mouth: 'smallSmile', fx: [] };
  } else if (t < 1.36) {
    const k = ease.outBack(inv(1.17, 1.3, t));
    p.bodyY = -80 * k; p.headY = -16 * k; p.sy = 1 + 0.07 * bump(t, 1.17, 1.36); p.sx = 1 - 0.04 * bump(t, 1.17, 1.36);
    p.face = { name: 'shocked', eyes: { pupil: 0.42, cross: 0.2 }, fx: ['exclaim'] };
  } else {
    const u = t - 1.36;
    p.bodyY = -80 + 4 * Math.sin(u * 5); p.headY = -16;
    p.headRot = 5 * Math.sin(u * 6.5);
    p.face = { name: 'amazed', eyes: { look: [Math.sin(u * 6.5) * 0.85, -0.1], cross: 0.3 }, blink: blinkAt(t, 1.62), fx: ['sparkles'] };
  }
  let o = L.back + S.g(drawHero(p), E.camTf(cam, 1)) + L.front;
  if (t < 1.17) o += S.g(zzz(t, 1110, 470), E.camTf(cam, 1));
  if (ring) {
    const k = ease.outBack(inv(1.06, 1.16, t));
    const jig = Math.sin(t * 60) * 4;
    o += S.g(S.g(F.markText('BEEP!', 0, 0, 72, -10 + jig, '#FF5A5A') + S.path('M-120 -40 L-160 -60 M-122 -6 L-170 -6 M120 -40 L160 -60 M122 -6 L170 -6', { stroke: '#151515', 'stroke-width': 8, 'stroke-linecap': 'round' }), `translate(1565 500) scale(${f(k)})`), E.camTf(cam, 1));
  }
  return o;
}

// ---------------------------------------------------------------- shot B: the world is Roblox (1.95 - 3.72)
function shotTownReveal(t) {
  const u = t - 1.95;
  const camX = 700 + 40 * u;
  const zk = ease.inOut(inv(0.02, 1.05, u));
  const cam = { zoom: lerp(2.2, 1.12, zk), fx: 960, fy: lerp(610, 760, zk), x: camX };
  if (u > 1.42 && u < 1.6) { const k = 1 - inv(1.42, 1.6, u); cam.sy = Math.sin(u * 90) * 9 * k; }
  const L = E.townLayers(cam, t);
  const p = { x: 960 + camX, y: 1042, s: 0.5, nametag: 'YOU' };
  const breathe = Math.sin(u * 7);
  if (u < 0.36) {
    const k = ease.out(inv(0, 0.2, u));
    p.armL = p.armR = lerp(9, 40, k); p.lean = 3;
    p.face = { name: 'shocked', eyes: { look: [0, 0.85], pupil: 0.5, cross: 0 }, mouth: 'o' };
    p.bodyY = 4;
  } else if (u < 0.86) {
    const v = u - 0.36;
    p.turn = Math.sin(v * 7) * 0.45;
    p.armL = p.armR = lerp(40, 72, ease.out(inv(0, 0.15, v)));
    p.headRot = Math.sin(v * 7) * 6; p.bodyY = 3 * breathe;
    p.face = { name: 'amazed', eyes: { look: [Math.sin(v * 7) * 0.8, -0.2], cross: 0.2 }, fx: ['sparkles'] };
  } else if (u < 0.98) {
    const k = ease.inOut(inv(0.86, 0.98, u));
    p.bodyY = 70 * k; p.armL = p.armR = lerp(72, -12, k); p.sy = 1 - 0.04 * k;
    p.face = { name: 'joy' };
  } else if (u < 1.42) {
    const k = inv(0.98, 1.42, u);
    p.lift = Math.sin(k * Math.PI) * 170; p.bodyY = lerp(40, 0, ease.out(inv(0, 0.3, k)));
    p.legL = p.legR = 10 + 18 * Math.sin(k * Math.PI); p.kneeL = p.kneeR = 52 * Math.sin(k * Math.PI);
    p.armL = p.armR = lerp(-12, 148, ease.outBack(inv(0, 0.35, k)));
    p.sy = 1 + 0.07 * bump(k, 0, 0.4); p.sx = 1 - 0.04 * bump(k, 0, 0.4);
    p.face = { name: 'excited' };
  } else {
    const k = inv(1.42, 1.62, u);
    p.bodyY = 52 * Math.sin(Math.min(1, k) * Math.PI) * (u < 1.62 ? 1 : 0);
    p.sx = 1 + 0.05 * Math.sin(Math.min(1, k) * Math.PI); p.sy = 1 - 0.05 * Math.sin(Math.min(1, k) * Math.PI);
    p.armL = 146 + 10 * Math.sin(u * 22); p.armR = 146 - 10 * Math.sin(u * 22);
    p.face = { name: 'excited' };
  }
  const carX = camX + lerp(-500, 2600, inv(0.25, 1.77, u));
  let world = E.car(carX, 935, '#FF5A5A', t) + drawHero(p);
  world += burst(960 + camX, 600 - (p.lift || 0) * 0.5, inv(1.0, 1.35, u));
  return L.bg + L.street + S.g(world, E.camTf(cam, 1)) + L.fg;
}

// ---------------------------------------------------------------- shot C1: every street (3.72 - 4.52)
function shotStreet(t) {
  const u = t - 3.72;
  const camX = 2300 + 420 * u;
  const cam = { zoom: 1.12 + 0.07 * (1 - ease.out(inv(0, 0.16, u))), fx: 960, fy: 700, x: camX };
  const L = E.townLayers(cam, t);
  let world = '';
  world += cast.dad({ x: camX + 1500 - 260 * u, y: 800, s: 0.3, view: 'side', legL: 22 * Math.sin(u * 14), legR: -22 * Math.sin(u * 14), kneeR: 20, kneeL: 20, armL: -20 * Math.sin(u * 14), armR: 20 * Math.sin(u * 14), face: 'neutral', shadow: true });
  world += E.car(camX + lerp(-500, 2500, ease.inOut(inv(0, 0.8, u))), 935, '#3B8BFF', t);
  world += speedLines(camX - 200, camX + 1200, 860, 6, 40, '#FFFFFF');
  return L.bg + L.street + S.g(world, E.camTf(cam, 1)) + L.fg;
}

// ---------------------------------------------------------------- shot C2: every person (4.52 - 5.32)
function shotPeople(t) {
  const u = t - 4.52;
  const camX = 3100 + 70 * u;
  const cam = { zoom: 1.24 + 0.06 * (1 - ease.out(inv(0, 0.16, u))), fx: 960, fy: 760, x: camX };
  const L = E.townLayers(cam, t);
  let world = '';
  const bop = Math.abs(Math.sin(u * 10));
  world += cast.pinky({ x: camX + 600, y: 1044, s: 0.5, turn: 0.25, armR: 150 + 24 * Math.sin(u * 22), armL: 12, headRot: -5 * Math.sin(u * 11), bodyY: 3 * Math.sin(u * 11), face: { name: 'joy' }, nametag: NAMES.pinky });
  world += chatBubble('hiii!! :D', camX + 700, 1044 - 560, { s: 0.85, pop: ease.outBack(inv(0.08, 0.22, u)) });
  world += cast.max({ x: camX + 1330, y: 1044, s: 0.5, turn: -0.2, bodyY: 34 * bop, headRot: 9 * Math.sin(u * 10), armL: 30 + 26 * Math.sin(u * 10), armR: 30 - 26 * Math.sin(u * 10), face: { name: 'joy' }, nametag: NAMES.max });
  world += musicNotes(t, camX + 1420, 1044 - 520);
  const ru = inv(0.14, 0.62, u);
  if (ru > 0 && ru < 1) {
    const sx = camX + lerp(2300, -500, ru);
    const ph = u * 34;
    world += speedLines(sx + 120, sx + 700, 860, 8, 90);
    world += dust(sx + 120, 1088, 0.14 + ru * 0.4, u);
    world += cast.speedy({ x: sx, y: 1090, s: 0.62, view: 'side', lean: -12, lift: 14 * Math.abs(Math.sin(ph)), legL: 46 * Math.sin(ph), kneeL: 30 + 30 * Math.max(0, -Math.sin(ph)), legR: -46 * Math.sin(ph), kneeR: 30 + 30 * Math.max(0, Math.sin(ph)), armL: -50 * Math.sin(ph), armR: 50 * Math.sin(ph), face: 'smug' });
  }
  return L.bg + L.street + S.g(world, E.camTf(cam, 1)) + L.fg;
}

// ---------------------------------------------------------------- shot C3: every... chicken (5.32 - 6.50)
function shotChicken(t) {
  const u = t - 5.32;
  const cam = { zoom: 1.5, fx: 960, fy: 720, x: 4050 };
  const L = E.townLayers(cam, t, { noFg: true });
  let o = S.g(L.bg + L.street, null, { filter: 'url(#blurBg)' });
  const z = 1 + 0.04 * inv(0, 1.18, u) + 0.12 * ease.out(inv(0.56, 0.66, u));
  let ck = {};
  if (u < 0.5) {
    const pk = Math.max(0, Math.sin(u * 13));
    ck = { look: 0.7, headY: 46 * pk, headRot: 14 * pk };
  } else if (u < 0.58) {
    const k = ease.outBack(inv(0.5, 0.58, u));
    ck = { look: lerp(0.7, 0, k), headY: 0, headRot: lerp(8, 0, k), squash: 0.25 * bump(u, 0.5, 0.62) };
  } else {
    ck = { look: 0, blink: blinkAt(u, 0.9), squash: 0.25 * bump(u, 0.5, 0.62) };
  }
  let scene = S.rect(-200, 990, 2320, 400, 0, { fill: '#5BCB5E' }) + S.rect(-200, 990, 2320, 400, 0, { fill: 'url(#studs)' });
  for (let i = 0; i < 12; i++) { const gx = i * 180 + 20; scene += S.path(`M${gx} 1000 l14 -40 l10 34 l12 -48 l12 50`, { fill: '#3FB34F', stroke: '#151515', 'stroke-width': 5, 'stroke-linejoin': 'round' }); }
  scene += chicken({ x: 960, y: 1010, s: 1.15, ...ck });
  scene += chatBubble('bawk.', 1060, 470, { s: 1.0, pop: ease.outBack(inv(0.6, 0.72, u)) });
  o += S.g(scene, `translate(960 760) scale(${f(z)}) translate(-960 -760)`);
  return o;
}

// ---------------------------------------------------------------- shot D: portal plaza (6.50 - 8.62)
function shotPlaza(t) {
  const u = t - 6.5;
  const one = inv(1.52, 1.62, u);
  const cam = { zoom: 1.0 + 0.1 * ease.inOut(inv(0, 2.1, u)) + 0.06 * ease.out(one), fx: 960, fy: 560 };
  const flash = bump(u, 1.52, 1.9);
  const L = E.plazaLayers(cam, t, { flash });
  let crowd = '';
  const people = [
    [cast.speedy, 250, NAMES.speedy, 0.0], [cast.pinky, 600, NAMES.pinky, 1.1], [cast.egglord, 1330, NAMES.egglord, 2.3],
    [cast.max, 1680, NAMES.max, 0.6], [cast.dad, 1950, NAMES.dad, 1.7],
  ];
  for (const [fn, x, name, ph] of people) {
    const b = Math.sin(u * 5 + ph);
    const point = name === NAMES.pinky || name === NAMES.max ? ease.outBack(inv(0.6 + ph * 0.1, 0.8 + ph * 0.1, u)) : 0;
    crowd += fn({ x, y: 1170, s: 0.6, view: 'back', bodyY: 4 * b, headRot: 3 * b, armR: lerp(9, 150, point), lift: 30 * bump(u, 1.52, 1.75), nametag: name });
  }
  // YOU in the middle, glancing around
  const yb = Math.sin(u * 5);
  crowd += drawHero({ x: 960, y: 1180, s: 0.64, view: 'back', bodyY: 4 * yb, headRot: 7 * Math.sin(u * 2.4), lift: 34 * bump(u, 1.52, 1.75), nametag: 'YOU' });
  let o = L.bg + S.g(crowd, E.camTf(cam, 1.15));
  // system message
  const pop = ease.outBack(inv(0.1, 0.28, u));
  if (pop > 0) {
    let b = S.rect(-470, -70, 940, 140, 26, { fill: '#121628', opacity: 0.9, stroke: '#FFFFFF', 'stroke-width': 5 });
    b += S.rect(-450, -52, 104, 104, 20, { fill: '#FFC52E', stroke: '#151515', 'stroke-width': 5 }) + F.markText('!', -398, 34, 90, 0, '#151515');
    b += S.el('text', { x: 50, y: -14, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 34, fill: '#FFC52E', 'text-anchor': 'middle' }, 'SYSTEM MESSAGE');
    b += S.el('text', { x: 50, y: 40, 'font-family': 'Lilita One, sans-serif', 'font-size': 50, fill: '#FFFFFF', 'text-anchor': 'middle' }, 'PICK ONE GAME BEFORE SUNSET!');
    o += S.g(b, `translate(960 168) scale(${f(pop * 0.9)})`);
  }
  if (flash > 0) o += S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(flash * 0.25) });
  return o;
}

// ---------------------------------------------------------------- shot E: the Admin Vault (8.62 - 10.0)
function shotVault(t) {
  const u = t - 8.62;
  const duck = ease.inOut(inv(0.36, 0.5, u)) * (1 - ease.inOut(inv(0.78, 0.95, u)));
  const cam = { zoom: 1.2 + 0.05 * inv(0, 1.38, u) + 0.12 * ease.inOut(inv(1.18, 1.38, u)), fx: 860, fy: 620 };
  const shk = 5 + 9 * duck + 12 * (1 - inv(0, 0.25, u));
  cam.sx = Math.sin(t * 61) * shk; cam.sy = Math.cos(t * 53) * shk * 0.8;
  const L = E.vaultLayers(cam, t, { eggOnPedestal: false });
  const bodyY = 46 + 96 * duck;
  const sq = bump(u, 0.36, 0.56) * 0.06;
  const eggY = -950 - 110 + bodyY - 10 * duck;
  const p = {
    x: 760, y: 990, s: 0.66, bodyY, sx: 1 + sq, sy: 1 - sq, lean: 4 - 6 * duck, turn: 0.15,
    armL: 150 - 30 * duck + 8 * Math.sin(t * 30), armR: 152 - 30 * duck - 8 * Math.sin(t * 30),
    face: duck > 0.5 ? { name: 'scared', eyes: { type: 'squint' }, mouth: 'scream', fx: ['sweat2'] } : { name: 'scream', eyes: { look: [0.7, -0.6], cross: 0 }, blink: 0 },
    headRot: -4 + 3 * Math.sin(t * 40),
    props: [{ svg: secretEgg({ x: 6, y: eggY, size: 240, t, rot: 6 * Math.sin(t * 9) }), layer: 'top' }],
  };
  let o = L.bg + L.platform + S.g(drawHero(p), E.camTf(cam, 1));
  // front laser: sweeps down over his head, then away
  const la = lerp(-0.06, 0.075, ease.inOut(inv(0.3, 0.62, u))) - 0.12 * ease.in(inv(0.7, 1.0, u));
  o += E.vaultLaserFront(cam, t, la);
  // red alarm + HUD
  o += S.rect(0, 0, W, H, 0, { fill: '#FF2D55', opacity: f(0.06 + 0.06 * Math.max(0, Math.sin(t * 9))) });
  const sec = u < 1.0 ? 10 : 9;
  o += E.timerHud(sec, bump(u, 1.0, 1.15));
  // white flash on the cut
  const fl = 1 - inv(0, 0.14, u);
  if (fl > 0) o += S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(fl) });
  // glitch on the last beat
  if (u > 1.22) {
    let g = '';
    for (let i = 0; i < 6; i++) { const y = hash(i + Math.floor(t * 30)) * H; g += S.rect(0, y, W, 6 + hash(i * 3) * 24, 0, { fill: ['#00F0FF', '#FF3DF2', '#FFFFFF'][i % 3], opacity: 0.45 }); }
    o += g;
  }
  return o;
}

// ---------------------------------------------------------------- timeline
function frame(t) {
  let o = E.DEFS;
  let shot;
  if (t < 1.95) shot = shotBedroom(t);
  else if (t < 3.72) shot = shotTownReveal(t);
  else if (t < 4.52) shot = shotStreet(t);
  else if (t < 5.32) shot = shotPeople(t);
  else if (t < 6.5) shot = shotChicken(t);
  else if (t < 8.62) shot = shotPlaza(t);
  else shot = shotVault(t);
  // whip-pan blur around the chicken -> plaza cut
  const whip = Math.max(bump(t, 6.38, 6.62), 0);
  if (whip > 0.02) shot = S.g(shot, `translate(${f((t < 6.5 ? -1 : 1) * whip * 160)} 0)`, { filter: 'url(#whip)' });
  o += shot;
  o += vignette();
  o += caption(t);
  // opening: black -> pixels
  if (t < 0.5) o += pixelWipe(inv(0.02, 0.5, t), 'uncover', true);
  // bedroom -> town: colourful pixel wave
  if (t > 1.68 && t < 1.95) o += pixelWipe(inv(1.68, 1.95, t), 'cover');
  if (t >= 1.95 && t < 2.3) o += pixelWipe(inv(1.95, 2.3, t), 'uncover');
  return o;
}

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, '..', 'out', 'intro_10s.mp4');
  const fps = Number(process.argv[3] || 60);
  renderVideo(frame, { w: W, h: H, fps, duration: 10, out, crf: 15 }).catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { frame };
