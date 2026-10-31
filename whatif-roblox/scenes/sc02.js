// SC 02, 0:19.2 - 1:01 — "The night before": 2 A.M., Steal an Egg on the tablet, the glitchy
// Secret Egg, "FREE", the username "YOU", the egg cracks and everything goes BLOCKY.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const C = require('./common');
const { drawHero } = require('../rig/hero');
const { tablet } = require('../rig/props');
const { tabletScreen } = require('./tablet');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const LINES = [
  [20.20, 21.20, 'NARRATOR', "It's *two A.M.*"],
  [21.30, 22.60, 'NARRATOR', 'You should be asleep.'],
  [23.40, 24.90, 'NARRATOR', 'You are *NOT* asleep.'],
  [25.10, 26.60, 'NARRATOR', "You're playing *Steal an Egg.*"],
  [26.70, 28.00, 'NARRATOR', 'Just one more round.'],
  [28.60, 30.30, 'NARRATOR', 'That was *forty* rounds ago.'],
  [30.50, 32.40, 'NARRATOR', 'Then, rolling down the egg belt...'],
  [32.60, 34.80, 'NARRATOR', "something you've *never* seen before."],
  [35.10, 36.30, 'SYSTEM', 'Secret Egg.'],
  [36.40, 36.90, 'SYSTEM', 'Price:'],
  [36.95, 37.60, 'SYSTEM', 'Question mark.'],
  [37.65, 38.15, 'SYSTEM', 'Question mark.'],
  [38.20, 38.70, 'SYSTEM', 'Question mark.'],
  [39.00, 41.00, 'YOU', 'Ohhh... what is *THAT?*'],
  [41.30, 42.10, 'NARRATOR', 'You tap it.'],
  [42.50, 43.30, 'NARRATOR', "It's *free.*"],
  [43.60, 45.40, 'NARRATOR', 'Nothing good is ever free.'],
  [45.70, 48.30, 'SYSTEM', 'Before hatching, please enter your username.'],
  [48.60, 49.30, 'YOU', 'Mm...'],
  [49.40, 50.20, 'YOU', 'username... uhh...'],
  [51.10, 51.80, 'YOU', '...you?'],
  [53.30, 54.40, 'NARRATOR', 'You typed *"YOU."*'],
  [54.50, 55.30, 'NARRATOR', 'In all caps.'],
  [55.70, 56.40, 'NARRATOR', 'Remember that.'],
  [56.45, 57.00, 'NARRATOR', "It's *important.*"],
  [57.10, 57.90, 'NARRATOR', 'The egg cracks.'],
  [58.00, 59.30, 'NARRATOR', 'Pixels pour out of the screen...'],
  [59.30, 60.00, 'NARRATOR', 'and *everything* goes—'],
  [60.00, 60.90, 'NARRATOR', '*BLOCKY!*'],
];
const TRACK = C.makeTrack(LINES);
TRACK.caps.pop(); // BLOCKY! is drawn big by overlay() on the white flash
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);

// ---------------------------------------------------------------- helpers
const HERO_BED = { x: 960, y: 1196, s: 0.9 };
const toScreen = (cam, X, Y) => {
  const z = cam.zoom ?? 1, fx = cam.fx ?? 960, fy = cam.fy ?? 540;
  return [fx + (cam.sx || 0) + z * (X - fx - (cam.x || 0)), fy + (cam.sy || 0) + z * (Y - fy - (cam.y || 0))];
};

// night bedroom with the hero in bed. opts: face, bodyY, headRot, headY, tab (0..1 raised), tabOn, glowCol, clock
function nightBed(t, cam, o = {}) {
  const L = E.bedroomLayers(cam, t, { night: true, clock: '2:00', clockCol: '#FF4D4D' });
  const bodyY = o.bodyY ?? 0;
  const hero = drawHero({ ...HERO_BED, bodyY, headY: o.headY || 0, headRot: o.headRot || 0, face: o.face, nametag: o.nametag === false ? null : 'YOU', lean: o.lean || 0 });
  let s = L.back + S.g(hero, E.camTf(cam, 1)) + L.front;
  const tabY = lerp(1000, 812 + bodyY * 0.4, ease.outBack(clamp(o.tab ?? 0, 0, 1)));
  if ((o.tab ?? 0) > 0) s += S.g(tablet({ x: 960 + (o.tabX || 0), y: tabY + (o.tabBob || 0), s: 0.78, on: o.tabOn !== false, glow: o.glowCol || '#A8E8FF', rot: o.tabRot || 0 }), E.camTf(cam, 1));
  if (o.extraWorld) s += S.g(o.extraWorld, E.camTf(cam, 1));
  // grade
  const glows = [];
  if (o.tabOn !== false && (o.tab ?? 0) > 0.5) {
    const [gx, gy] = toScreen(cam, 960, 640 + bodyY * 0.9);
    glows.push({ x: gx, y: gy, r: 420 * (cam.zoom || 1), col: o.glowCol || '#A8E8FF', a: o.glowA ?? 0.5 });
  }
  const [cx, cy] = toScreen(cam, 1565, 620);
  glows.push({ x: cx, y: cy, r: 150 * (cam.zoom || 1), col: '#FF3B3B', a: 0.35 });
  const [mx, my] = toScreen(cam, 460, 270);
  glows.push({ x: mx, y: my, r: 260 * (cam.zoom || 1), col: '#C9D8FF', a: 0.25 });
  s += C.nightGrade(o.grade ?? 1, glows);
  // the clock digits glow through the dark
  s += S.g(S.el('text', { x: 0, y: -2, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 40, fill: '#FF5A5A', 'text-anchor': 'middle', opacity: 0.85 }, '2:00'), `${E.camTf(cam, 1)} translate(1565 640)`);
  return s;
}

function tabletShot(t, opts, zoom = 1, fx = 960, fy = 540) {
  return S.g(tabletScreen(t, opts), `translate(${fx} ${fy}) scale(${f(zoom)}) translate(${-fx} ${-fy})`);
}

function pixelFountain(t, t0, x, y, n = 90) {
  let o = '';
  const cols = ['#FF5A5A', '#FFB000', '#FFE14D', '#3BD16F', '#34C3FF', '#3B8BFF', '#B06BFF', '#FF6FB5'];
  for (let i = 0; i < n; i++) {
    const birth = t0 + i * 0.014;
    const age = t - birth; if (age < 0) continue;
    const a = (-90 + (hash(i * 3) - 0.5) * 150) * Math.PI / 180, sp = 700 + hash(i * 7) * 900;
    const px = x + (hash(i * 11) - 0.5) * 200 + Math.cos(a) * sp * age, py = y + Math.sin(a) * sp * age + 700 * age * age;
    const sz = 16 + hash(i * 5) * 30;
    o += S.rect(px - sz / 2, py - sz / 2, sz, sz, 4, { fill: cols[i % cols.length], stroke: '#151515', 'stroke-width': 3, transform: `rotate(${f(age * 300 * (hash(i) - 0.5))} ${f(px)} ${f(py)})` });
  }
  return o;
}

// ---------------------------------------------------------------- shots
function shotClock(t) { // 19.2 - 22.7
  const u = t - 19.2;
  const cam = { zoom: 2.7 - 0.25 * ease.inOut(inv(0, 3.5, u)), fx: 1565, fy: 610, x: -60 * inv(0, 3.5, u) };
  let o = nightBed(t, cam, { face: { name: 'neutral', eyes: { type: 'closed' } }, nametag: false });
  // title card
  const txt = 'THE NIGHT BEFORE...';
  const n = Math.floor(clamp(inv(19.5, 20.6, t), 0, 1) * txt.length);
  const fade = 1 - inv(21.7, 22.2, t);
  if (n > 0 && fade > 0) o += S.g(S.el('text', { x: 960, y: 210, 'font-family': 'Lilita One, sans-serif', 'font-size': 96, fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 14, 'paint-order': 'stroke', 'text-anchor': 'middle' }, txt.slice(0, n)), null, { opacity: f(fade) });
  // VHS play-in
  if (t < 19.75) o += C.vhs(t, '', 1 - inv(19.4, 19.75, t));
  if (t < 20.4) o += S.el('text', { x: 90, y: 120, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 72, fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }, '▶ PLAY');
  if (t < 19.45) o += C.staticNoise(t, 1 - inv(19.2, 19.45, t));
  return o;
}

function shotBedWide(t) { // 22.7 - 25.0
  const u = t - 22.7;
  const on = t >= 23.3;
  const pop = ease.outBack(inv(23.3, 23.45, t));
  const cam = { zoom: 1.08 + 0.18 * ease.inOut(inv(0.6, 2.3, u)), fx: 960, fy: 560 };
  const face = on
    ? { name: 'happy', mouth: 'bigGrin', eyes: { pupil: 0.55, cross: 0, look: [0, 0.6] }, blink: 0 }
    : { name: 'neutral', eyes: { type: 'closed' }, mouth: 'line' };
  let o = nightBed(t, cam, { face, tab: on ? pop : 0, tabOn: on, bodyY: on ? -30 * pop : 0, glowA: 0.55 });
  if (on) o += C.sfx('*click*', 1240, 500, inv(23.3, 23.42, t) * (1 - inv(24.0, 24.2, t)), 58, -6, '#FFFFFF');
  return o;
}

function shotFaceTapping(t) { // 25.0 - 30.4
  const u = t - 25.0;
  const forty = t >= 28.6;
  const dart = Math.sign(Math.sin(t * 4.2)) * 0.7;
  const tw = forty ? (Math.sin(t * 40) > 0.6 ? 0.3 : 0) : 0;
  const cam = { zoom: 1.5 + 0.12 * inv(0, 5.4, u) + (forty ? 0.15 * ease.out(inv(28.6, 28.75, t)) : 0), fx: 960, fy: 600 };
  const face = forty
    ? { name: 'happy', mouth: 'bigGrin', eyes: { pupil: 0.5, cross: 0, look: [dart * 0.5, 0.55], upper: 0.3 }, eyeR: { upper: 0.3 + tw }, fx: ['eyebags', 'sweat'] }
    : { name: 'happy', mouth: 'bigGrin', eyes: { pupil: 0.7, cross: 0, look: [dart, 0.6] }, blink: blinkAt(t, 26.2, 27.9) };
  let o = nightBed(t, cam, { face, tab: 1, bodyY: -40, tabBob: Math.abs(Math.sin(t * 14)) * 8, headRot: 2 * Math.sin(t * 3), glowA: 0.6 });
  // taps
  const tp = (t * 3.5) % 1;
  o += C.sfx('tap', 640 + (Math.floor(t * 3.5) % 2) * 640, 800, bump(tp, 0, 0.5), 46, -10, '#A8E8FF');
  if (t > 26.7 && t < 28.4) o += C.sfx('+1 ROUND', 1500, 300, inv(26.75, 26.9, t) * (1 - inv(28.2, 28.4, t)), 70, 6, '#5CFF7A');
  if (forty) {
    const k = ease.outBack(inv(28.6, 28.8, t));
    o += S.g(S.rect(-260, -80, 520, 160, 40, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 7 }) + S.el('text', { x: 0, y: 36, 'font-family': 'Lilita One, sans-serif', 'font-size': 104, fill: '#FFE14D', 'text-anchor': 'middle' }, 'ROUND 40'), `translate(1440 240) rotate(4) scale(${f(k)})`);
  }
  return o;
}

function shotBelt(t) { // 30.4 - 35.0
  const u = t - 30.4;
  const off = u * 260;
  const secretX = t >= 32.4 ? 2050 - (t - 32.4) * 260 : undefined;
  const gl = Math.max(bump(t, 32.45, 32.75), bump(t, 33.6, 33.75) * 0.6);
  const z = 1.0 + 0.05 * inv(0, 4.6, u) + 0.08 * ease.out(inv(32.6, 32.8, t));
  return tabletShot(t, { beltOffset: off, secretX, glitch: gl, avatarFace: t > 32.6 ? 'amazed' : 'happy' }, z, 1300, 560);
}

function shotSecretZoom(t) { // 35.0 - 38.8
  const u = t - 35.0;
  const stop = ease.out(inv(0, 0.8, u));
  const secretX = lerp(1324, 960, stop);
  const off = (35.0 - 30.4) * 260 + 364 * stop;
  const q = t >= 38.2 ? 3 : t >= 37.65 ? 2 : t >= 36.95 ? 1 : 0;
  const pop = Math.max(bump(t, 36.95, 37.15), bump(t, 37.65, 37.85), bump(t, 38.2, 38.4));
  const gl = Math.max(bump(t, 35.1, 35.3), pop * 0.5);
  const z = lerp(1.0, 1.75, ease.inOut(inv(0, 1.2, u))) + 0.04 * pop;
  return tabletShot(t, { beltOffset: off, secretX, qMarks: Math.max(1, q), tagPop: pop, glitch: gl, hideEggs: u > 0.9, avatarFace: 'amazed' }, z, 960, 470);
}

function shotFaceWow(t) { // 38.8 - 41.2
  const v = vis('YOU', t);
  const lean = ease.inOut(inv(38.8, 40.4, t));
  const cam = { zoom: 1.6 + 0.25 * lean, fx: 960, fy: 590 };
  const face = { name: 'amazed', mouth: v || 'O', eyes: { pupil: 1.75, sparkle: true, cross: 0.2, look: [0, 0.4] }, fx: ['sparkles'] };
  let o = nightBed(t, cam, { face, tab: 1, bodyY: -50 - 20 * lean, headY: 0, glowCol: '#C77DFF', glowA: 0.7 });
  return o;
}

function shotBuy(t) { // 41.2 - 43.4
  const press = bump(t, 41.95, 42.2);
  return tabletShot(t, { beltOffset: 1560, secretX: 960, hideEggs: true, dim: 0.45, buy: { k: inv(41.25, 41.45, t), press, tap: inv(41.95, 42.35, t), free: bump(t, 42.5, 42.95) } }, 1.05, 960, 540);
}

function shotOminous(t) { // 43.4 - 45.6
  const u = t - 43.4;
  const purch = t < 44.1 ? inv(43.45, 43.6, t) * (1 - inv(43.9, 44.1, t)) : 0;
  const dark = ease.inOut(inv(44.0, 45.0, t));
  const gl = Math.max(bump(t, 44.4, 44.55), bump(t, 45.0, 45.2)) * 0.8;
  const z = 1.05 + 0.25 * ease.inOut(inv(0.6, 2.2, u));
  return tabletShot(t, { beltOffset: 1560, secretX: 960, hideEggs: true, dim: 0.2 + 0.4 * dark, purchased: purch, vignette: dark, glitch: gl }, z, 960, 470);
}

function shotUsername(t) { // 45.6 - 48.5
  const caret = Math.floor(t * 2.2) % 2 === 0;
  const kb = inv(45.95, 46.25, t);
  let o = tabletShot(t, { beltOffset: 1560, secretX: 960, hideEggs: true, dim: 0.5, user: { k: inv(45.65, 45.85, t), text: '', caret }, keyboard: kb > 0 ? { caps: false } : null }, 1.0);
  return o;
}

function shotSleepy(t) { // 48.5 - 51.9
  const v = vis('YOU', t);
  const yawn = t > 50.2 && t < 50.95;
  const nod = bump(t, 49.6, 50.2);
  const cam = { zoom: 1.65, fx: 960, fy: 590 };
  let face;
  if (yawn) face = { name: 'sleepy', mouth: 'yawn', eyes: { type: 'closed' }, fx: [] };
  else if (t > 51.0) face = { name: 'confused', mouth: v || 'wavy', eyeL: { upper: 0.55, look: [0, 0.5] }, eyeR: { upper: 0.6, look: [0, 0.5] }, fx: [] };
  else face = { name: 'sleepy', mouth: v || 'line', eyes: { upper: 0.6 + 0.15 * nod, look: [0, 0.6] }, fx: [] };
  return nightBed(t, cam, { face, tab: 1, bodyY: -35 + 14 * nod, headRot: (yawn ? -8 : 0) + (t > 51.0 ? 8 * ease.out(inv(51.0, 51.2, t)) : 0) + 4 * nod, glowA: 0.55 });
}

function shotKeyboard(t) { // 51.9 - 53.2
  const keys = [['Y', 52.0], ['O', 52.35], ['U', 52.7]];
  let press = null, text = '';
  for (const [k, at] of keys) { if (t >= at) text += k; if (t >= at && t < at + 0.16) press = k; }
  return tabletShot(t, { beltOffset: 1560, secretX: 960, hideEggs: true, dim: 0.5, user: { k: 1, text, caret: true }, keyboard: { caps: true, press } }, 1.45, 960, 760);
}

function shotTyped(t) { // 53.2 - 57.0
  const u = t - 53.2;
  const rem = ease.out(inv(55.7, 55.85, t));
  const okP = bump(t, 56.55, 56.8);
  const z = lerp(1.5, 2.1, ease.inOut(inv(0, 2.3, u))) + 0.55 * rem;
  const shake = rem > 0 && t < 56.3 ? Math.sin(t * 70) * 8 * (1 - inv(55.7, 56.3, t)) : 0;
  let o = S.g(tabletShot(t, { beltOffset: 1560, secretX: 960, hideEggs: true, dim: 0.5, user: { k: 1, text: 'YOU', caret: Math.floor(t * 2.2) % 2 === 0, ok: okP, okTap: inv(56.55, 56.9, t) }, keyboard: { caps: true } }, z, 960, 395), `translate(${f(shake)} 0)`);
  if (rem > 0) {
    o += S.rect(0, 0, W, H, 0, { fill: 'url(#vignette)', opacity: 1 }) + S.rect(0, 0, W, H, 0, { fill: '#FF2D55', opacity: f(0.12 * (1 - inv(56.3, 56.6, t))) });
    o += C.sfx('!', 1500, 330, rem * (1 - inv(56.4, 56.6, t)), 200, 10, '#FF4D6D') + C.sfx('!', 420, 330, rem * (1 - inv(56.4, 56.6, t)), 160, -10, '#FF4D6D');
  }
  return o;
}

function shotCrack(t) { // 57.0 - 58.0
  const u = t - 57.0;
  return tabletShot(t, { hatch: { crack: inv(0.1, 0.85, u), shake: 0.4 + inv(0, 1, u) } }, 1.0 + 0.08 * u);
}

function shotPixels(t) { // 58.0 - 61.0
  const u = t - 58.0;
  const sh = 4 + 14 * inv(0, 2, u);
  const cam = { zoom: 1.45 - 0.2 * ease.out(inv(0, 1.3, u)), fx: 960, fy: 620, sx: Math.sin(t * 61) * sh, sy: Math.cos(t * 53) * sh };
  const rainbow = ['#FF6FB5', '#FFE14D', '#5CFF7A', '#34C3FF', '#C77DFF'][Math.floor(t * 10) % 5];
  const face = u < 0.6 ? { name: 'shocked', eyes: { pupil: 0.45, cross: 0, look: [0, 0.5] } } : { name: 'scared', mouth: 'scream', eyes: { pupil: 0.4 }, fx: ['sweat2'] };
  const world = pixelFountain(t, 58.0, 960, 700);
  let o = nightBed(t, cam, { face, tab: 1, bodyY: -50 - 30 * ease.out(inv(0.3, 0.6, u)), glowCol: rainbow, glowA: 0.75, grade: 1 - 0.4 * inv(0.8, 1.3, u), extraWorld: world });
  // everything goes blocky: the colourful pixel wave
  if (t > 59.3) o += C.pixelWipe(inv(59.3, 60.0, t), 'cover');
  return o;
}

function scene(t) {
  if (t < 22.7) return shotClock(t);
  if (t < 25.0) return shotBedWide(t);
  if (t < 30.4) return shotFaceTapping(t);
  if (t < 35.0) return shotBelt(t);
  if (t < 38.8) return shotSecretZoom(t);
  if (t < 41.2) return shotFaceWow(t);
  if (t < 43.4) return shotBuy(t);
  if (t < 45.6) return shotOminous(t);
  if (t < 48.5) return shotUsername(t);
  if (t < 51.9) return shotSleepy(t);
  if (t < 53.2) return shotKeyboard(t);
  if (t < 57.0) return shotTyped(t);
  if (t < 58.0) return shotCrack(t);
  return shotPixels(t);
}

// drawn over the captions: the final white flash + fade out
function overlay(t) {
  if (t < 60.0) return '';
  let o = C.whiteFlash(1);
  o += C.captionText('BLOCKY!', '#FFD21F', lerp(0.6, 1.9, ease.outBack(inv(60.0, 60.2, t))), 600, -4);
  if (t > 60.7) o += S.rect(0, 0, W, H, 0, { fill: '#000', opacity: f(inv(60.7, 61.0, t)) });
  return o;
}

module.exports = { scene, overlay, TRACK, LINES };
