// Part 4 (3:15.4 - 4:21): the portals open. Mom -> Brookhaven't, Dad -> Fishing Simulator,
// Banana -> Tower of Pain, Grandma -> DOORS; the glitching Steal an Egg portal; YOU jumps in.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const E3 = require('./env3');
const C = require('./common');
const A = require('./acting');
const { drawHero } = require('../rig/hero');
const { draw: cast, NAMES } = require('../rig/cast');
const { draw: cast2, NAMES2, walker, sunglasses } = require('../rig/cast2');
const { secretEgg } = require('../rig/props');
const { chatBubble } = require('../rig/creatures');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 195.4, END = 261.0;
const LINES = [
  [195.80, 197.90, 'NARRATOR', 'And then... the *portals* open.'],
  [198.20, 200.80, 'NARRATOR', 'Hundreds of glowing doorways, right in the middle of town.'],
  [201.00, 203.20, 'NARRATOR', 'Every single one is a *different game.*'],
  [203.50, 204.70, 'NARRATOR', '"Tower of Pain."'],
  [204.80, 206.00, 'NARRATOR', '"Adopt Me Maybe."'],
  [206.10, 207.20, 'NARRATOR', '"Brookhaven\'t."'],
  [207.30, 209.30, 'NARRATOR', '"Natural Disasters... but *REAL.*"'],
  [209.60, 211.20, 'NARRATOR', 'And everyone has to *choose.*'],
  [211.60, 213.30, 'NARRATOR', "Mom picks *Brookhaven't.*"],
  [213.40, 216.20, 'NARRATOR', 'Instantly, she owns a pink mansion, a pink car...'],
  [216.40, 217.80, 'NARRATOR', 'and a pink *horse?*'],
  [218.10, 220.40, 'MOM', "I'm finally living my best life, *#####!*"],
  [220.70, 221.80, 'NARRATOR', 'Filtered *again.*'],
  [222.20, 224.00, 'NARRATOR', 'Dad picks *Fishing Simulator.*'],
  [224.20, 226.00, 'NARRATOR', "He sits on a dock. He doesn't move."],
  [226.60, 228.10, 'NARRATOR', "He's never been *happier.*"],
  [228.40, 230.20, 'DAD', '...Peace and *quiet.*'],
  [230.60, 233.00, 'NARRATOR', 'The banana dentist picks *Tower of Pain.*'],
  [233.50, 235.00, 'NARRATOR', 'He falls off the *first step.*'],
  [235.20, 237.00, 'BANANA', 'Ohhhhh *nooooo...*'],
  [237.40, 239.00, 'NARRATOR', 'And Grandma picks *DOORS.*'],
  [239.50, 241.80, 'NARRATOR', 'Ten seconds later... the monster runs out *screaming.*'],
  [242.00, 243.60, 'MONSTER', "*SHE'S TOO FAST!*"],
  [244.20, 246.00, 'NARRATOR', 'And then you see it.'],
  [246.20, 248.60, 'NARRATOR', 'One portal... flickering. *Glitching.*'],
  [248.80, 250.60, 'NARRATOR', 'With a familiar egg on the sign.'],
  [251.00, 252.60, 'NARRATOR', '*"STEAL AN EGG."*'],
  [253.00, 255.00, 'NARRATOR', 'The game that started all of this.'],
  [255.40, 256.60, 'YOU', 'Okay. Okay okay okay.'],
  [257.20, 258.00, 'YOU', "Let's *GO!*"],
  [258.40, 259.40, 'NARRATOR', 'You jump *in.*'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };
const whip = (t, a, b, inner) => { const k = bump(t, a, b); return k > 0.02 ? S.g(inner, `translate(${f((t < (a + b) / 2 ? -1 : 1) * k * 160)} 0)`, { filter: 'url(#whip)' }) : inner; };
const flash = (t, a, d = 0.18) => C.whiteFlash(1 - inv(a, a + d, t));
const townShot = (t, cam, world = '', opts = {}) => { const L = E.townLayers(cam, t, opts); return L.bg + L.street + S.g(world, E.camTf(cam, 1)) + L.fg; };
const plaza = (t, cam, world = '', opts = {}) => E.plazaLayers(cam, t, opts).bg + S.g(world, E.camTf(cam, 1.15));

// ---------------------------------------------------------------- portals open (195.4 - 203.4)
function shotPortalsRise(t) { // 195.4 - 198.1
  const camX = 2400;
  const cam = { zoom: 1.0, fx: 960, fy: 600, x: camX };
  const sh = bump(t, 196.0, 198.0) * 10;
  cam.sx = Math.sin(t * 60) * sh; cam.sy = Math.cos(t * 47) * sh;
  const cols = ['#FF5A5A', '#34C3FF', '#3BD16F', '#FF6FB5', '#B06BFF'];
  let ports = '';
  [[camX + 300, 0], [camX + 760, 0.15], [camX + 1220, 0.3], [camX + 1680, 0.45]].forEach(([x, d], i) => {
    const k = ease.outBack(inv(196.2 + d, 196.9 + d, t));
    if (k > 0) ports += S.g(E.portal({ x: 0, base: 0, w: 200, h: 300, col: cols[i], name: '', icon: '' }, t + i), `translate(${x} 900) scale(1 ${f(k)})`) + C.dust(x - 120, 900, 196.2 + d, t);
  });
  const crowd = drawHero({ x: camX + 980, y: 1042, s: 0.5, nametag: tag, face: { name: 'shocked', eyes: { pupil: 0.5 } }, lift: 30 * bump(t, 196.1, 196.5) });
  return townShot(t, cam, ports + crowd);
}

function shotPlazaWide(t) { // 198.1 - 203.4
  const cam = { zoom: 1.0 + 0.12 * ease.inOut(inv(198.1, 203.4, t)), fx: 960, fy: 520, x: lerp(-60, 60, inv(198.1, 203.4, t)) };
  let crowd = '';
  [[cast.speedy, 250, NAMES.speedy], [cast2.jetkid, 600, NAMES2.jetkid], [cast.max, 1330, NAMES.max], [cast2.hotdog, 1680, NAMES2.hotdog]].forEach(([fn, x, n], i) => {
    crowd += fn({ x, y: 1170, s: 0.6, view: 'back', ...A.breathe(t, i), armR: 9 + 140 * bump(t, 199 + i * 0.4, 200.5 + i * 0.4), nametag: n });
  });
  crowd += drawHero({ x: 960, y: 1180, s: 0.64, view: 'back', ...A.breathe(t, 2), nametag: tag });
  return flash(t, 198.1) + plaza(t, cam, crowd, { many: true });
}

function shotSigns(t) { // 203.4 - 209.4: punch onto each sign
  const P = E.PORTALS;
  const beats = [[203.4, P[0]], [204.75, P[3]], [206.05, P[1]], [207.25, P[2]]];
  let i = beats.length - 1; while (i > 0 && t < beats[i][0]) i--;
  const [b, por] = beats[i];
  const k = ease.out(inv(b, b + 0.18, t));
  const sy = por.base - por.h - 83;
  const cam = { zoom: lerp(1.6, 2.2, k), fx: por.x, fy: sy + 60 };
  // camera works in the portal layer's space (k = 0.75): compensate so the sign is centred
  const z = 1 + (cam.zoom - 1) * 0.75;
  let o = S.g(E.plazaLayers({ zoom: 1 }, t).bg, `translate(960 520) scale(${f(z)}) translate(${f(-por.x)} ${f(-(sy + 140))})`);
  if (i === 3) { // natural disasters... but REAL: wind, debris, a flying cow-ish block
    for (let j = 0; j < 18; j++) { const ph = (t * 1.4 + hash(j)) % 1; o += S.rect(hash(j * 3) * 1920 + ph * 400, 1080 - ph * 1300, 26, 26, 4, { fill: ['#8A5A33', '#3BD16F', '#C9CED8'][j % 3], stroke: '#151515', 'stroke-width': 3, transform: `rotate(${f(ph * 720)} ${f(hash(j * 3) * 1920 + ph * 400 + 13)} ${f(1093 - ph * 1300)})` }); }
    if (t > 208.3) o += S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.6 * bump(t, 208.3, 208.6)) }) + C.sfx('REAL!', 1450, 300, inv(208.3, 208.45, t), 120, 8, '#FF4D6D');
  }
  return o;
}

function shotChoose(t) { // 209.4 - 211.5
  const cam = { zoom: 1.05, fx: 960, fy: 520 };
  let crowd = '';
  [[cast.mom, 330, 'Mom'], [cast.dad, 620, 'Dad'], [cast2.banana, 1340, NAMES2.banana], [cast2.grandma, 1640, NAMES2.grandma]].forEach(([fn, x, n], i) => {
    crowd += fn({ x, y: 1170, s: 0.6, view: 'back', ...A.breathe(t, i), headRot: 8 * Math.sin(t * 3 + i), nametag: n, props: n === NAMES2.grandma ? [{ svg: walker(), layer: 'front' }] : [] });
  });
  crowd += drawHero({ x: 980, y: 1180, s: 0.64, view: 'back', headRot: 10 * Math.sin(t * 4), nametag: tag });
  return plaza(t, cam, crowd, { many: true });
}

// ---------------------------------------------------------------- Mom (211.5 - 221.9)
function shotMom(t) {
  if (t < 212.6) { // she jumps into the pink portal
    const cam = { zoom: 1.6, fx: 560, fy: 520 };
    const k = inv(211.8, 212.5, t);
    let o = E.plazaLayers(cam, t).bg;
    const mom = cast.mom({ x: 560, y: 1100 - Math.sin(k * Math.PI) * 220, s: 0.55 * (1 - 0.6 * k), view: 'back', armL: 150, armR: 150, nametag: 'Mom', lift: 0 });
    o += S.g(mom, E.camTf(cam, 1.15));
    o += S.rect(0, 0, W, H, 0, { fill: '#FF6FB5', opacity: f(0.8 * inv(212.3, 212.6, t)) });
    return o;
  }
  const v = vis('MOM', t);
  const cam = { zoom: t < 218.0 ? 1.0 : 1.6, fx: 960, fy: t < 218.0 ? 540 : 470 };
  let o = E3.pinkMansion(t, cam, { car: inv(214.6, 215.4, t), horse: inv(216.5, 216.8, t) });
  const mom = cast.mom({ x: 960, y: 960, s: 0.6, nametag: 'Mom', face: t < 218.0 ? { name: 'love', fx: ['blush'] } : { name: 'joy', mouth: v || 'smile' }, armL: 150, armR: 150 + 10 * Math.sin(t * 6), props: [{ svg: sunglasses(), layer: 'front' }].slice(0, 0) });
  o += S.g(mom, E.camTf(cam, 1));
  if (t > 216.5 && t < 218.0) o += C.sfx('?!', 1500, 420, inv(216.6, 216.75, t), 110, 10, '#FF4D6D');
  if (t >= 218.0) o += S.g(chatBubble("I'm finally living my best life, #####!", 960, 280, { s: 0.7, pop: ease.outBack(inv(218.1, 218.25, t)), color: Math.floor(t * 8) % 2 && t > 219.6 ? '#FF4D6D' : '#151515' }), E.camTf(cam, 1));
  if (t > 219.6 && t < 220.3) o += C.sfx('BEEP!', 1480, 300, inv(219.65, 219.75, t), 100, 8, '#FF4D6D');
  if (t > 220.7) o += S.g(S.rect(-260, -70, 520, 140, 20, { fill: 'none', stroke: '#FF2D55', 'stroke-width': 12 }) + S.el('text', { x: 0, y: 28, 'font-family': 'Lilita One, sans-serif', 'font-size': 80, fill: '#FF2D55', 'text-anchor': 'middle' }, 'FILTERED x12'), `translate(1450 760) rotate(-10) scale(${f(ease.outBack(inv(220.7, 220.85, t)))})`);
  return flash(t, 212.6, 0.25) + o;
}

// ---------------------------------------------------------------- Dad (221.9 - 230.4)
function shotDad(t) {
  const v = vis('DAD', t);
  const close = t > 228.2;
  const cam = close ? { zoom: 2.0, fx: 520, fy: 560 } : { zoom: 1.0 + 0.08 * inv(221.9, 228.2, t), fx: 900, fy: 560 };
  let o = E3.lakeDock(t, cam, { bobber: true });
  const dad = cast.dad({ view: 'side', flip: true, x: 520, y: 790 + 160, s: 0.55, bodyY: 168, legL: 88, kneeL: 88, legR: 86, kneeR: 86, armL: 70, armR: 64,
    face: t > 226.5 ? { name: 'happy', mouth: v || 'smile', eyes: { type: 'happy' } } : { name: 'neutral', mouth: v || 'smile' }, nametag: 'Dad', shadow: false });
  // fishing rod from his hands to the bobber
  const rod = S.path(`M${520 + 120} ${790 - 150} L${1080} 440`, { stroke: '#6B4A2A', 'stroke-width': 10, 'stroke-linecap': 'round' }) + S.path('M1080 440 Q1150 520 1180 690', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 3 });
  o += S.g(rod + dad, E.camTf(cam, 1));
  if (t > 226.6) for (let i = 0; i < 4; i++) { const ph = ((t - 226.6) * 0.7 + i / 4) % 1; o += S.g(S.path(E3.heart(0, 0, 20), { fill: '#FF5A9A', stroke: '#151515', 'stroke-width': 4 }), `translate(${f(620 + i * 60 + Math.sin(ph * 6 + i) * 20)} ${f(460 - ph * 260)})`, { opacity: f(1 - ph) }); }
  if (t < 226.0 && t > 224.2) o += S.g(S.rect(-170, -55, 340, 110, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One, sans-serif', 'font-size': 60, fill: '#5CFF7A', 'text-anchor': 'middle' }, `IDLE: ${Math.floor((t - 224.2) * 30)} MIN`), 'translate(1600 140)');
  return o;
}

// ---------------------------------------------------------------- Banana (230.4 - 237.2)
function shotBanana(t) {
  const v = vis('BANANA', t);
  let cam, bx, by, rot = 0, face, arms = {};
  if (t < 233.4) { // looks up at the tower, confident
    cam = { zoom: 1.0, fx: 960, fy: 520 };
    bx = 960; by = 860; face = { name: 'determined' };
    arms = { armR: 150 * bump(t, 231.2, 232.8) };
  } else if (t < 235.0) { // jumps to step 1... and slips off
    const k = inv(233.5, 234.5, t);
    cam = { zoom: 1.3, fx: 1180, fy: 600 };
    bx = lerp(960, 1180, ease.out(Math.min(1, k * 1.6))); by = 860 - Math.sin(Math.min(1, k * 1.6) * Math.PI) * 200 + (k > 0.62 ? 0 : 0);
    if (k > 0.62) { const d = (k - 0.62) / 0.38; bx = 1180 + 140 * d; by = 760 + 600 * d * d; rot = 70 * d; }
    face = k > 0.62 ? { name: 'scared', mouth: 'O' } : { name: 'determined' };
    arms = { armL: 150 * Math.min(1, k * 2), armR: 150 * Math.min(1, k * 2) };
  } else { // falling into the clouds below, fading away
    const d = inv(235.0, 237.2, t);
    cam = { zoom: 1.0, fx: 960, fy: 540, y: lerp(150, 950, d) };
    bx = 1320 - 200 * d; by = lerp(1100, 1700, d); rot = 200 * d;
    face = { name: 'scared', mouth: v || 'scream', fx: ['sweat2'] };
    arms = { armL: 150 + 30 * Math.sin(t * 20), armR: 150 - 30 * Math.sin(t * 20) };
  }
  let o = E3.towerOfPain(t, cam);
  const s = t > 235.0 ? lerp(0.5, 0.22, inv(235.0, 237.2, t)) : 0.5;
  o += S.g(cast2.banana({ x: bx, y: by, s, rot, face, nametag: NAMES2.banana, shadow: false, ...arms }), E.camTf(cam, 1));
  if (t > 234.1 && t < 235.0) o += C.sfx('*slip*', 1450, 420, inv(234.15, 234.25, t), 70, 8, '#FFFFFF');
  if (t > 233.5 && t < 235.0) o += S.g(S.rect(-150, -55, 300, 110, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One, sans-serif', 'font-size': 60, fill: '#FFE14D', 'text-anchor': 'middle' }, 'STAGE 1'), 'translate(300 140)');
  return o;
}

// ---------------------------------------------------------------- Grandma + DOORS (237.2 - 243.8)
const DOORS = { x: 960, base: 760, w: 300, h: 430, col: '#2E9C6A', name: 'DOORS', icon: 'house' };
function doorsScene(t, cam, world) {
  let o = E.plazaLayers(cam, t).bg;
  o += S.g(E.portal(DOORS, t), E.camTf(cam, 0.75));
  o += S.rect(0, 0, W, H, 0, { fill: '#0A0F1A', opacity: 0.25 });
  return o + S.g(world, E.camTf(cam, 1));
}
function shotDoors(t) {
  if (t < 239.4) { // grandma shuffles in with her walker
    const k = inv(237.4, 239.3, t);
    const cam = { zoom: 1.2, fx: 960, fy: 600 };
    const g = cast2.grandma({ x: 960, y: lerp(1150, 980, k), s: lerp(0.6, 0.3, k), view: 'back', ...A.walkFront(t * 6, 0.6), nametag: NAMES2.grandma, props: [{ svg: walker(), layer: 'front' }] });
    return doorsScene(t, cam, g);
  }
  if (t < 241.9) { // ten seconds later... (timer)
    const cam = { zoom: 1.4, fx: 960, fy: 560 };
    let o = doorsScene(t, cam, '');
    const sec = Math.min(10, Math.floor(inv(239.5, 241.8, t) * 10) + 1);
    o += S.g(S.rect(-240, -80, 480, 160, 34, { fill: '#121628', stroke: '#FFFFFF', 'stroke-width': 7 }) + S.el('text', { x: 0, y: 32, 'font-family': 'Lilita One, sans-serif', 'font-size': 100, fill: '#FFE14D', 'text-anchor': 'middle' }, `${sec} SEC`), 'translate(960 230)');
    if (t > 241.0) o += C.sfx('*screams inside*', 960, 860, inv(241.0, 241.1, t), 56, -4, '#FFFFFF');
    return o;
  }
  // the monster bursts out, terrified, grandma zooming after it on her walker
  const u = t - 241.9;
  const cam = { zoom: 1.0, fx: 960, fy: 560 };
  cam.sx = Math.sin(t * 60) * 8 * (1 - inv(241.9, 242.4, t)); cam.sy = Math.cos(t * 50) * 6 * (1 - inv(241.9, 242.4, t));
  const mx = lerp(960, -500, ease.in(inv(0.1, 1.6, u))), my = 1000;
  let w = E3.monster({ x: mx, y: my, s: 0.62, t, run: 1, scared: true });
  w += C.speedLines(mx + 160, mx + 700, 640, 8, 23);
  if (u > 0.55) {
    const gx = lerp(1300, -300, ease.in(inv(0.55, 1.9, u)));
    w += cast2.grandma({ x: gx, y: 1010, s: 0.42, face: { name: 'determined', eyes: { look: [-1, 0] } }, lean: -8, props: [{ svg: walker(), layer: 'front' }], nametag: NAMES2.grandma }) + C.speedLines(gx + 120, gx + 600, 900, 6, 77, '#FFE14D');
  }
  return doorsScene(t, cam, w);
}

// ---------------------------------------------------------------- the glitching portal (243.8 - 258.3)
const EGGP = E.PORTALS[4];
function shotGlitchPortal(t) { // 243.8 - 255.2
  if (t < 251.0) {
    // quiet: the camera drifts along the plaza edge toward the flickering portal; the hero walks up (back view)
    const k = ease.inOut(inv(243.8, 250.8, t));
    const cam = { zoom: lerp(1.1, 1.9, k), fx: EGGP.x, fy: lerp(520, 460, k), x: lerp(-500, 0, k) };
    let o = E.plazaLayers(cam, t).bg;
    const you = drawHero({ x: lerp(1100, 1600, k), y: 1180, s: lerp(0.62, 0.5, k), view: 'back', ...A.walkFront(t * 5, 0.5), nametag: tag });
    o += S.g(you, E.camTf(cam, 1.15));
    o += S.rect(0, 0, W, H, 0, { fill: '#1A0B3A', opacity: f(0.25 * k) });
    if (Math.sin(t * 23) > 0.7) o += S.rect(0, hash(Math.floor(t * 23)) * H, W, 20, 0, { fill: '#00F0FF', opacity: 0.3 });
    return o;
  }
  // the sign close-up + a flash of the tablet egg
  const z = 2.6 + 0.1 * inv(251.0, 255.2, t);
  const sy = EGGP.base - EGGP.h - 83;
  let o = S.g(E.plazaLayers({ zoom: 1 }, t).bg, `translate(960 520) scale(${f(1 + (z - 1) * 0.75)}) translate(${-EGGP.x} ${-(sy + 60)})`);
  o += S.rect(0, 0, W, H, 0, { fill: '#1A0B3A', opacity: 0.3 });
  if (t > 253.0 && t < 253.8) {
    const k = bump(t, 253.0, 253.8);
    o += S.rect(0, 0, W, H, 0, { fill: '#000', opacity: f(0.7 * k) }) + S.g(secretEgg({ x: 0, y: 0, size: 420, t }), `translate(960 540) scale(${f(0.6 + 0.4 * k)})`, { opacity: f(k) });
  }
  if (Math.sin(t * 31) > 0.5) o += S.rect(0, hash(Math.floor(t * 31)) * H, W, 26, 0, { fill: ['#00F0FF', '#FF3DF2'][Math.floor(t * 31) % 2], opacity: 0.4 });
  return o;
}

function shotLetsGo(t) { // 255.2 - 258.3
  const v = vis('YOU', t);
  const breath = bump(t, 256.6, 257.15);
  const pumped = t > 257.15;
  const cam = { zoom: 2.0 + 0.2 * (pumped ? ease.out(inv(257.15, 257.3, t)) : 0), fx: 960, fy: 520 };
  const L = E.plazaLayers({ zoom: 2.4, fx: EGGP.x, fy: 400 }, t);
  let o = S.g(L.bg, null, { filter: 'url(#blurBg)' });
  const face = pumped ? { name: 'determined', mouth: v || 'grin' } : breath > 0.1 ? { name: 'neutral', mouth: 'O', eyes: { type: 'closed' } } : { name: 'nervous', mouth: v || 'teeth', fx: ['sweat'] };
  o += S.g(drawHero({ x: 960, y: 1180, s: 0.8, nametag: tag, face, bodyY: -30 * breath, sx: 1 + 0.05 * breath, armR: pumped ? lerp(9, 160, ease.outBack(inv(257.15, 257.35, t))) : 9, armL: pumped ? 30 : 9, headRot: pumped ? -4 : 3 * Math.sin(t * 9) }), E.camTf(cam, 1));
  if (pumped) o += C.burst(1200, 400, inv(257.2, 257.6, t));
  return o;
}

function shotJump(t) { // 258.3 - 261.0
  if (t < 259.5) {
    const k = inv(258.3, 259.5, t);
    const cam = { zoom: 1.3, fx: 960, fy: 560, x: 1000 };
    let o = E.plazaLayers(cam, t).bg;
    // portal centre on screen (portal layer k = 0.75)
    const z = 1 + 0.3 * 0.75, PX = 960 + z * (EGGP.x - 960 - 750), PY = 560 + z * (EGGP.base - EGGP.h * 0.45 - 560);
    const ph = (t - 258.3) * 26;
    let p;
    if (k < 0.55) {
      const r = k / 0.55;
      p = { view: 'side', flip: true, x: lerp(250, PX - 180, ease.in(r)), y: 1040, s: 0.55, lean: -10, ...A.run(ph), face: { name: 'determined' } };
    } else {
      const j = (k - 0.55) / 0.45;
      p = { view: 'side', flip: true, x: lerp(PX - 180, PX, j), y: lerp(1040, PY + 120, j) - Math.sin(j * Math.PI) * 260, s: lerp(0.55, 0.15, j), rot: 60 * j, armL: 160, armR: 160, legL: -30, kneeL: 40, legR: -40, kneeR: 30, face: { name: 'excited' }, shadow: false };
    }
    o += drawHero({ ...p, nametag: tag });
    if (k < 0.55) o += C.speedLines(p.x - 700, p.x - 150, 820, 7, 51);
    o += S.rect(0, 0, W, H, 0, { fill: '#B06BFF', opacity: f(0.85 * inv(259.25, 259.5, t)) });
    return o;
  }
  let o = E3.portalTunnel(t, inv(259.5, 259.8, t));
  const k = inv(259.5, 261.0, t);
  o += S.g(drawHero({ x: 0, y: 470, s: 0.5, rot: 360 * k, armL: 160, armR: 160, legL: 20, legR: -20, face: { name: 'excited' }, shadow: false }), `translate(960 540) scale(${f(1 - 0.6 * k)})`);
  o += C.whiteFlash(inv(260.6, 261.0, t));
  return o;
}

function scene(t) {
  if (t < 198.1) return shotPortalsRise(t);
  if (t < 203.4) return shotPlazaWide(t);
  if (t < 209.4) return shotSigns(t);
  if (t < 211.5) return shotChoose(t);
  if (t < 221.9) return whip(t, 221.75, 222.05, shotMom(t));
  if (t < 230.4) return whip(t, 221.75, 222.05, shotDad(t));
  if (t < 237.2) return shotBanana(t);
  if (t < 243.8) return shotDoors(t);
  if (t < 255.2) return shotGlitchPortal(t);
  if (t < 258.3) return shotLetsGo(t);
  return shotJump(t);
}

module.exports = { scene, TRACK, LINES, START, END };
