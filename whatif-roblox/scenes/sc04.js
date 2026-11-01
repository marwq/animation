// Part 3 (2:03.6 - 3:15.4): Dad the vintage noob sinks into the couch; stepping outside into the
// Roblox world: baseplate street, square sun, banana dentist, jetpack kid, hat lady, hot dog,
// the world obbies, cube Earth server, the system message: "pick ONE game".
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const E2 = require('./env2');
const C = require('./common');
const A = require('./acting');
const { drawHero } = require('../rig/hero');
const { draw: cast, NAMES } = require('../rig/cast');
const { draw: cast2, NAMES2, jetpack, hatTower } = require('../rig/cast2');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 123.6, END = 195.4;
const LINES = [
  [124.00, 124.60, 'NARRATOR', 'And Dad?'],
  [125.10, 127.00, 'NARRATOR', 'Dad never customized his avatar.'],
  [127.20, 129.60, 'NARRATOR', '*Yellow* head. *Blue* shirt. *Green* pants.'],
  [129.80, 130.90, 'NARRATOR', 'The classic *noob.*'],
  [131.20, 133.40, 'DAD', "I'm not a noob. I'm *VINTAGE.*"],
  [133.70, 136.10, 'NARRATOR', "He's been trying to sit on the couch for twenty minutes."],
  [136.20, 137.70, 'NARRATOR', 'He keeps sitting *INSIDE* it.'],
  [138.00, 139.30, 'DAD', "I'm comfortable."],
  [139.80, 141.40, 'DAD', "I'm part of the *couch* now."],
  [142.00, 143.30, 'NARRATOR', 'You step outside...'],
  [143.50, 144.30, 'NARRATOR', '*WOW.*'],
  [144.60, 146.80, 'NARRATOR', 'The street is a giant gray *baseplate.*'],
  [147.00, 148.60, 'NARRATOR', 'The sun is a perfect *square.*'],
  [148.80, 150.70, 'NARRATOR', 'The clouds are... also *squares.*'],
  [150.90, 152.40, 'NARRATOR', 'Everything is *squares.*'],
  [152.80, 154.60, 'NARRATOR', 'Your neighbor is a seven-foot *banana.*'],
  [155.10, 156.80, 'NARRATOR', 'Yesterday, he was a *dentist.*'],
  [157.00, 159.00, 'BANANA', 'Morning, YOU! *Floss daily!*'],
  [159.30, 160.90, 'NARRATOR', 'A kid on a *rainbow jetpack.*'],
  [161.00, 162.60, 'NARRATOR', 'A lady in *thirty-seven* hats.'],
  [162.70, 165.40, 'NARRATOR', "And a hot dog who hasn't stopped dancing since *six A.M.*"],
  [165.80, 167.30, 'NARRATOR', "And it's not just your street."],
  [167.40, 168.60, 'NARRATOR', "It's *EVERYWHERE.*"],
  [168.90, 170.30, 'NARRATOR', 'The Eiffel Tower? An *obby.*'],
  [170.50, 172.40, 'NARRATOR', 'The Great Wall? A *REALLY* long obby.'],
  [172.60, 173.60, 'NARRATOR', 'The ocean?'],
  [174.00, 174.90, 'NARRATOR', 'A *kill brick.*'],
  [175.30, 177.30, 'NARRATOR', 'Eight billion people. One *server.*'],
  [177.80, 179.40, 'NARRATOR', 'The ping is... *not great.*'],
  [179.80, 182.40, 'NARRATOR', 'Then the sky goes dark... and a *GIANT* message appears.'],
  [182.80, 185.60, 'SYSTEM', 'ATTENTION, PLAYERS. Welcome to *Roblox Earth.*'],
  [185.90, 188.80, 'SYSTEM', 'By sunset, every player must enter *ONE* game.'],
  [189.00, 191.30, 'SYSTEM', 'Players without a game... will be *kicked.*'],
  [191.70, 193.30, 'YOU', 'Kicked... from *EARTH?!*'],
  [193.70, 194.70, 'SYSTEM', '*Have fun!*'],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };
const whip = (t, a, b, inner) => { const k = bump(t, a, b); return k > 0.02 ? S.g(inner, `translate(${f((t < (a + b) / 2 ? -1 : 1) * k * 160)} 0)`, { filter: 'url(#whip)' }) : inner; };
const label = (txt, x, y, k, col = '#FFE14D', size = 70, rot = -4) => (k > 0 ? S.g(F.markText(txt, 0, 0, size, rot, col), `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`) : '');

// ---------------------------------------------------------------- living room (123.6 - 141.6)
const DAD_X = 960;
function living(t, cam, dad, extra = '', you = null) {
  const L = E2.livingLayers(cam, t);
  let w = '';
  if (you) w += drawHero(you);
  return L.back + S.g(cast.dad(dad) + w + extra, E.camTf(cam, 1)) + (dad.inCouch ? L.front : '') + (dad.inCouch ? '' : '');
}

function shotDadIntro(t) { // 123.6 - 131.1
  const cam = { zoom: 1.15, fx: 960, fy: 560 };
  const dad = { x: DAD_X, y: 990, s: 0.62, nametag: 'Dad', face: 'happy', ...A.breathe(t), armR: 9 + 140 * bump(t, 125.2, 126.4) };
  let o = '';
  if (t < 125.0) {
    // you peek in from the left
    const you = { x: lerp(-200, 330, ease.out(inv(123.6, 124.4, t))), y: 990, s: 0.62, turn: 0.5, nametag: tag, face: { name: 'confused', fx: [] } };
    return living(t, cam, { ...dad, face: 'neutral' }, '', you);
  }
  if (t < 127.1) {
    o += living(t, cam, dad);
    const k = ease.outBack(inv(125.6, 125.8, t));
    o += S.g(S.rect(-260, -70, 520, 140, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + S.el('text', { x: 0, y: -12, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 32, fill: '#9AA3BC', 'text-anchor': 'middle' }, 'AVATAR LAST UPDATED:') +
      S.el('text', { x: 0, y: 42, 'font-family': 'Lilita One, sans-serif', 'font-size': 56, fill: '#FFE14D', 'text-anchor': 'middle' }, '2006'), `translate(1450 260) scale(${f(k)})`);
    return o;
  }
  // yellow head / blue shirt / green pants punch-ins
  const beats = [[127.2, 455, '#F5CD3D', 'YELLOW HEAD'], [128.0, 690, '#1E73E8', 'BLUE SHIRT'], [128.8, 880, '#3BB24A', 'GREEN PANTS']];
  let fy = 560, z = 1.15, lab = '';
  for (const [b, y, col, txt] of beats) {
    if (t >= b && t < b + 0.8) {
      const k = ease.out(inv(b, b + 0.12, t));
      fy = lerp(560, y, k); z = lerp(1.15, 2.1, k);
      lab = S.g(S.rect(-60, -60, 120, 120, 20, { fill: col, stroke: '#151515', 'stroke-width': 8 }) + F.markText(txt, 230, 26, 64, -4, '#FFFFFF') + S.path('M-30 0 L-8 24 L34 -24', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 14, 'stroke-linecap': 'round' }), `translate(1300 260) scale(${f(ease.outBack(inv(b, b + 0.15, t)))})`);
    }
  }
  o += living(t, { zoom: z, fx: DAD_X, fy }, { ...dad, face: 'happy' }) + lab;
  if (t > 129.7) {
    o = living(t, cam, { ...dad, face: 'joy', armL: 120, armR: 120 });
    const k = ease.outBack(inv(129.8, 130.0, t));
    o += S.g(S.rect(-300, -80, 600, 160, 30, { fill: 'none', stroke: '#FF4D6D', 'stroke-width': 12 }) + S.el('text', { x: 0, y: 30, 'font-family': 'Lilita One, sans-serif', 'font-size': 92, fill: '#FF4D6D', 'text-anchor': 'middle' }, 'CLASSIC NOOB'), `translate(1420 300) rotate(-10) scale(${f(2 - k)})`, { opacity: f(k) });
  }
  return o;
}

function shotVintage(t) { // 131.1 - 133.6
  const v = vis('DAD', t);
  const vin = t > 132.5;
  const cam = { zoom: 2.0, fx: DAD_X, fy: 520 };
  let o = living(t, cam, { x: DAD_X, y: 990, s: 0.62, nametag: 'Dad', face: { name: 'smug', mouth: v || 'smirk' }, headRot: vin ? -6 : 0, armL: vin ? 30 : 9, armR: vin ? 30 : 9 });
  if (vin) {
    const k = inv(132.5, 132.7, t);
    o += S.rect(0, 0, W, H, 0, { fill: '#C9A36A', opacity: f(0.35 * k), style: 'mix-blend-mode:multiply' }) + S.rect(0, 0, W, H, 0, { fill: 'url(#vignette)' });
    o += label('VINTAGE ✓', 1450, 300, inv(132.55, 132.75, t), '#FFE14D', 90, -8) + F.sparkle(1180, 380, 40 * bump(t, 132.6, 133.4));
  }
  return o;
}

function shotCouch(t) { // 133.6 - 141.6
  const cam = { zoom: t < 137.9 ? 1.25 : 1.9, fx: DAD_X, fy: t < 137.9 ? 620 : 600 };
  let dad = { x: DAD_X, y: 990, s: 0.62, nametag: 'Dad', inCouch: true, face: 'happy' };
  let extra = '';
  if (t < 137.9) {
    // tries to sit, sinks through, pops back up (loop)
    const cyc = ((t - 133.6) % 1.4) / 1.4;
    const sink = cyc < 0.55 ? ease.in(inv(0.05, 0.55, cyc)) : 1 - ease.outBack(inv(0.75, 0.95, cyc));
    dad = { ...dad, y: 990 + 300 * sink, bodyY: 40 * Math.min(1, cyc * 4), face: sink > 0.4 ? { name: 'shocked', fx: [] } : 'happy', armL: 9 + 60 * sink, armR: 9 + 60 * sink };
    if (cyc > 0.75 && cyc < 0.85) extra += F.markText('*glitch*', DAD_X + 280, 420, 50, 8, '#7CF7FF');
    const mins = Math.min(20, Math.floor(inv(133.6, 137.6, t) * 20));
    extra += S.g(S.rect(-150, -50, 300, 100, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 22, 'font-family': 'Lilita One, sans-serif', 'font-size': 64, fill: '#FFE14D', 'text-anchor': 'middle' }, `${mins} MIN`), 'translate(1500 230)');
  } else {
    // embedded in the couch, calm
    const v = vis('DAD', t);
    dad = { ...dad, y: 1100, face: { name: 'happy', mouth: v || 'smile', eyes: { type: t > 139.7 ? 'happy' : 'open' } }, nametag: t > 140.4 ? 'Dad (Couch)' : 'Dad', headRot: 3 * Math.sin(t * 2) };
  }
  const L = E2.livingLayers(cam, t);
  let o = L.back + S.g(cast.dad(dad), E.camTf(cam, 1)) + L.front + S.g(extra.includes('MIN') ? '' : extra, E.camTf(cam, 1));
  if (extra.includes('MIN')) o += extra;
  return whip(t, 141.45, 141.75, o);
}

// ---------------------------------------------------------------- outside (141.6 - 165.6)
function shotDoor(t) { // 141.6 - 143.5
  const open = ease.inOut(inv(141.9, 142.6, t));
  const cam = { zoom: 1.0 + 0.25 * ease.in(inv(142.6, 143.5, t)), fx: 960, fy: 520 };
  let o = E.layer(E2.doorShot(t, open, { zoom: 1 }), cam, 1);
  const you = drawHero({ x: 960, y: 1180 - 80 * ease.in(inv(142.7, 143.5, t)), s: 0.85 - 0.15 * inv(142.7, 143.5, t), view: 'back', ...A.walkFront((t - 141.6) * 10, inv(142.6, 142.8, t)), nametag: tag });
  o += S.g(you, E.camTf(cam, 1));
  if (t > 143.2) o += S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(inv(143.2, 143.5, t)) });
  return whip(t, 141.45, 141.75, o);
}

function townShot(t, cam, world = '', opts = {}) {
  const L = E.townLayers(cam, t, opts);
  return L.bg + L.street + S.g(world, E.camTf(cam, 1)) + L.fg;
}

function shotWow(t) { // 143.5 - 152.6
  let o = '';
  if (t < 144.5) {
    const k = ease.out(inv(143.5, 144.4, t));
    const cam = { zoom: lerp(2.3, 1.1, k), fx: 960, fy: 640, x: 2000 };
    o = townShot(t, cam, drawHero({ x: 2960, y: 1042, s: 0.5, nametag: tag, face: { name: 'amazed', fx: ['sparkles'] }, armL: 70 * k, armR: 70 * k }));
    o += S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(1 - inv(143.5, 143.75, t)) });
    return o;
  }
  if (t < 146.9) { // the baseplate street: low pan with stud highlight
    const cam = { zoom: 1.7, fx: 960, fy: 880, x: 1700 + (t - 144.5) * 260 };
    o = townShot(t, cam, '', { noFg: true });
    const k = inv(145.4, 145.6, t);
    o += S.rect(0, 0, W, H, 0, { fill: '#FFFFFF', opacity: f(0.18 * bump(t, 145.4, 146.2)) });
    o += label('BASEPLATE', 960, 300, k, '#FFFFFF', 110, -3);
    return o;
  }
  if (t < 148.7) { // the square sun
    const z = 2.3 + 0.2 * inv(146.9, 148.7, t);
    o = S.g(townShot(t, { zoom: 1, x: 0 }, '', { noFg: true }), `translate(960 600) scale(${f(z)}) translate(-1500 -200)`);
    const k = ease.outBack(inv(147.6, 147.8, t));
    if (k > 0) o += S.g(S.rect(-170, -170, 340, 340, 30, { fill: 'none', stroke: '#FF4D6D', 'stroke-width': 12, 'stroke-dasharray': '34 20' }) + F.markText('90°', 230, -150, 70, 8, '#FF4D6D'), `translate(960 600) scale(${f(k * z / 2.3)})`);
    return o;
  }
  if (t < 150.8) { // the clouds
    // a dedicated sky of square clouds drifting by
    let sky = S.rect(0, 0, W, H, 0, { fill: 'url(#skyDay)' });
    const u = t - 148.7;
    for (const [cx, cy, cs] of [[-200, 160, 1.6], [520, 420, 1.2], [1160, 120, 1.8], [1500, 560, 1.1], [80, 700, 1.3]]) sky += E.cloud(cx + u * 60, cy, cs);
    if (t > 149.7) [[-200, 160, 1.6], [1160, 120, 1.8]].forEach(([cx, cy, cs], i) => { sky += S.rect(cx + u * 60 - 44 * cs, cy - 14 * cs, 375 * cs, 146 * cs, 16, { fill: 'none', stroke: '#FF4D6D', 'stroke-width': 10, 'stroke-dasharray': '26 16', opacity: f(inv(149.75 + i * 0.15, 149.9 + i * 0.15, t)) }); });
    o = S.g(sky, `translate(960 540) scale(${f(1 + 0.05 * u)}) translate(-960 -540)`);
    return o;
  }
  // everything is squares: square confetti burst around the amazed hero
  const cam = { zoom: 1.5, fx: 960, fy: 640, x: 2000 };
  const spin = inv(150.8, 152.6, t);
  let conf = '';
  for (let i = 0; i < 40; i++) {
    const a = hash(i) * Math.PI * 2, r = 200 + 700 * spin * (0.5 + hash(i * 3));
    conf += S.rect(2960 + Math.cos(a) * r - 18, 700 + Math.sin(a) * r * 0.6 - 18 + 200 * spin * spin, 36, 36, 6, { fill: C.hash(i * 5) > 0.5 ? ['#FF5A5A', '#FFE14D', '#3BD16F', '#34C3FF', '#B06BFF'][i % 5] : '#FFFFFF', stroke: '#151515', 'stroke-width': 4, transform: `rotate(${f(spin * 360 * (hash(i) - 0.5))} ${f(2960 + Math.cos(a) * r)} ${f(700 + Math.sin(a) * r * 0.6)})` });
  }
  o = townShot(t, cam, drawHero({ x: 2960, y: 1042, s: 0.5, nametag: tag, turn: 0.4 * Math.sin(t * 3), face: { name: 'excited' }, armL: 150, armR: 150, lift: 60 * bump(t, 151.0, 151.5) }) + conf);
  return o;
}

function shotBanana(t) { // 152.6 - 159.2
  const camX = 3600;
  const cam = { zoom: 1.45, fx: 960, fy: 640, x: camX };
  const bx = camX + 1350, yx = camX + 650;
  const v = vis('BANANA', t);
  let banana = { x: bx, y: 1042, s: 0.58, nametag: NAMES2.banana, turn: -0.3, face: { name: 'happy', mouth: v || 'smile' } };
  if (t < 157.0) banana.armR = 140 + 20 * Math.sin(t * 10);
  else Object.assign(banana, A.floss(t), { face: { name: 'joy', mouth: v || 'bigGrin' } });
  const you = { x: yx, y: 1042, s: 0.5, turn: 0.4, nametag: tag, face: t < 155.0 ? { name: 'amazed', eyes: { look: [0.8, -0.4], cross: 0 } } : { name: 'deadpan', eyes: { look: [0.8, -0.3], cross: 0 } } };
  let o = townShot(t, cam, drawHero(you) + cast2.banana(banana));
  // "yesterday" flashback bubble
  if (t > 155.1 && t < 156.9) {
    const k = ease.outBack(inv(155.1, 155.3, t));
    let th = S.circle(0, 0, 150, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 7 }) + S.circle(-150, 130, 26, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 6 }) + S.circle(-190, 180, 14, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 5 });
    th += E2.mini(0, 110, 1.6, '#FFFFFF', '#F6CFA6') + S.circle(0, -60, 12, { fill: '#E3E8F0', stroke: '#151515', 'stroke-width': 3 }) + S.path('M40 30 L90 -20', { stroke: '#C9CED8', 'stroke-width': 10, 'stroke-linecap': 'round' });
    th += S.el('text', { x: 0, y: -100, 'font-family': 'Lilita One, sans-serif', 'font-size': 34, fill: '#1F2233', 'text-anchor': 'middle' }, 'DR. BOB, DDS');
    o += S.g(th, `translate(1500 260) scale(${f(k)})`);
  }
  return whip(t, 159.05, 159.35, o);
}

function shotTownsfolk(t) { // 159.2 - 165.6
  if (t < 160.95) { // rainbow jetpack kid across the sky
    const cam = { zoom: 1.0, fx: 960, fy: 540, x: 1000 };
    const u = inv(159.2, 160.95, t);
    const kx = 1000 + lerp(-300, 2300, u), ky = 600 - Math.sin(u * Math.PI) * 280;
    let trail = '';
    const cols = ['#FF5A5A', '#FFB000', '#FFE14D', '#3BD16F', '#34C3FF', '#B06BFF'];
    cols.forEach((c, i) => { trail += S.path(`M${f(kx - 2600)} ${f(ky - 120 + i * 22 + 300)} Q${f(kx - 1300)} ${f(ky - 560 + i * 22)} ${f(kx - 60)} ${f(ky - 150 + i * 22)}`, { fill: 'none', stroke: c, 'stroke-width': 24, 'stroke-linecap': 'round' }); });
    return townShot(t, cam, trail + cast2.jetkid({ x: kx, y: ky, s: 0.42, rot: 12, face: 'joy', armL: 150, armR: 150, legL: 20, kneeL: 40, legR: 10, kneeR: 50, shadow: false, nametag: NAMES2.jetkid, props: [{ svg: jetpack(true, t), layer: 'back' }] }));
  }
  if (t < 162.65) { // hat lady wobbling along
    const cam = { zoom: 1.35, fx: 960, fy: 560, x: 1500 };
    const ph = (t - 160.95) * 8;
    const lx = 1500 + lerp(500, 1400, inv(160.95, 162.65, t));
    let o = townShot(t, cam, cast2.hatlady({ x: lx, y: 1042, s: 0.55, turn: 0.3, face: 'happy', ...A.walkFront(ph), props: [{ svg: hatTower(16, t, 1.2), layer: 'top' }] }));
    const n = Math.min(37, Math.floor(inv(161.1, 162.4, t) * 37));
    o += S.g(S.rect(-170, -55, 340, 110, 26, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 24, 'font-family': 'Lilita One, sans-serif', 'font-size': 68, fill: '#FFE14D', 'text-anchor': 'middle' }, `HATS: ${n}`), 'translate(1600 950)');
    return o;
  }
  // the hot dog that hasn't stopped dancing since 6 A.M.
  const cam = { zoom: 1.5, fx: 960, fy: 600, x: 2400 };
  const k = Math.sin(t * 8);
  let o = townShot(t, cam, cast2.hotdog({ x: 3360, y: 1042, s: 0.55, face: { name: 'joy', fx: t > 164.2 ? ['sweat2'] : [] }, armL: 150 + 20 * k, armR: 150 - 20 * k, bodyY: 30 * Math.abs(k), lean: 6 * k, nametag: NAMES2.hotdog }) + C.musicNotes(t, 3500, 520));
  const hour = 6 + Math.floor(inv(162.8, 165.3, t) * 4);
  o += S.g(S.rect(-160, -60, 320, 120, 26, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + S.el('text', { x: 0, y: 26, 'font-family': 'Lilita One, sans-serif', 'font-size': 70, fill: '#5CFF7A', 'text-anchor': 'middle' }, `${hour}:${hour === 6 ? '00' : '43'} AM`), 'translate(1600 220)');
  return o;
}

// ---------------------------------------------------------------- the world (165.6 - 179.7)
function shotEverywhere(t) { // 165.6 - 168.8: camera flies up, the town becomes a cube planet
  if (t < 167.2) {
    const k = ease.in(inv(165.6, 167.2, t));
    const cam = { zoom: lerp(1.0, 0.25, k), fx: 960, fy: 700, x: 2200 };
    let o = townShot(t, cam, '', { noFg: true });
    o += S.rect(0, 0, W, H, 0, { fill: '#0B1033', opacity: f(inv(166.6, 167.2, t)) });
    return o;
  }
  const k = ease.out(inv(167.2, 168.0, t));
  let o = E2.cubeEarth(t, 960, 560, lerp(2.2, 1.0, k), 6 * Math.sin(t * 0.8));
  o += S.rect(0, 0, W, H, 0, { fill: '#0B1033', opacity: f(1 - inv(167.2, 167.5, t)) });
  return o;
}

function shotPostcards(t) { // 168.8 - 175.2
  let o;
  if (t < 170.45) o = E2.eiffelObby(t);
  else if (t < 172.5) o = S.g(E2.wallObby(t), 'translate(960 640) scale(1.45) translate(-760 -760)');
  else o = E2.oceanKill(t, inv(173.9, 174.6, t));
  const z = 1 + 0.06 * ((t - 168.8) % 2);
  return S.g(o, `translate(960 540) scale(${f(z)}) translate(-960 -540)`);
}

function shotServer(t) { // 175.2 - 179.7
  let o = E2.cubeEarth(t, 700, 600, 0.9, 5 * Math.sin(t * 0.8));
  const n = Math.floor(lerp(7999999000, 8000000000, ease.out(inv(175.3, 176.6, t))));
  const fmt = (x) => x.toLocaleString('en-US');
  const k = ease.outBack(inv(175.3, 175.5, t));
  o += S.g(S.rect(-420, -120, 840, 240, 34, { fill: '#121628', stroke: '#FFFFFF', 'stroke-width': 7, opacity: 0.94 }) +
    S.el('text', { x: 0, y: -40, 'font-family': 'Lilita One, sans-serif', 'font-size': 56, fill: '#7CF7FF', 'text-anchor': 'middle' }, 'SERVER: EARTH') +
    S.el('text', { x: 0, y: 50, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 56, fill: '#FFFFFF', 'text-anchor': 'middle' }, `${fmt(n)} / 8,000,000,000`), `translate(1380 300) scale(${f(k * 0.8)})`);
  if (t > 177.6) {
    const pk = ease.outBack(inv(177.7, 177.9, t));
    const jit = Math.sin(t * 50) * 6;
    let ping = S.rect(-300, -80, 600, 160, 30, { fill: '#121628', stroke: '#FF3B5C', 'stroke-width': 7 });
    for (let i = 0; i < 4; i++) ping += S.rect(-250 + i * 46, 40 - i * 26, 30, 26 + i * 26, 6, { fill: i === 0 ? '#FF3B5C' : '#3A3F5E' });
    ping += S.el('text', { x: 70, y: 28, 'font-family': 'Lilita One, sans-serif', 'font-size': 84, fill: '#FF3B5C', 'text-anchor': 'middle' }, 'PING 9999');
    o += S.g(ping, `translate(${f(1380 + jit)} 640) scale(${f(pk * 0.85)})`);
    if (Math.floor(t * 12) % 3 === 0) o += S.rect(0, hash(Math.floor(t * 12)) * 1080, W, 30, 0, { fill: '#7CF7FF', opacity: 0.35 });
  }
  return o;
}

// ---------------------------------------------------------------- the message (179.7 - 195.4)
function crowd(t, camX, lookUp = 1) {
  const people = [
    [cast2.banana, camX + 260, 0.5, NAMES2.banana], [cast.mom, camX + 560, 0.5, 'Mom'], [cast.dad, camX + 760, 0.5, 'Dad'],
    [cast2.hatlady, camX + 1260, 0.48, NAMES2.hatlady], [cast2.hotdog, camX + 1560, 0.48, NAMES2.hotdog], [cast.pinky, camX + 1760, 0.48, 'PinkPop'],
  ];
  let o = '';
  people.forEach(([fn, x, s, n], i) => {
    const props = n === NAMES2.hatlady ? [{ svg: hatTower(10, t, 0.6), layer: 'top' }] : [];
    o += fn({ x, y: 1042, s, nametag: n, face: { name: 'shocked', eyes: { look: [0, -0.9 * lookUp], cross: 0, pupil: 0.6 }, fx: [] }, headRot: (i % 2 ? 3 : -3), props });
  });
  return o;
}

function shotSkyDark(t) { // 179.7 - 191.6
  const camX = 2400;
  const dark = ease.inOut(inv(179.9, 181.4, t));
  const cam = { zoom: t < 182.6 ? 1.0 : 1.15, fx: 960, fy: t < 182.6 ? 600 : 500, x: camX };
  let o = townShot(t, cam, crowd(t, camX) + drawHero({ x: camX + 1000, y: 1042, s: 0.5, nametag: tag, face: { name: 'shocked', eyes: { look: [0, -0.9], cross: 0, pupil: 0.6 } } }), { noFg: true });
  o += S.rect(0, 0, W, H, 0, { fill: '#160B33', opacity: f(0.62 * dark) });
  // the message
  let lines = [], k = 0;
  if (t > 181.9) {
    k = inv(181.9, 182.2, t);
    lines = [{ text: 'ATTENTION, PLAYERS.' }, { text: 'Welcome to Roblox Earth.', col: '#7CF7FF' }];
    if (t > 185.8) lines = [{ text: 'By sunset, every player must' }, { text: 'enter ONE game.', col: '#FFE14D', size: 76 }];
    if (t > 188.9) lines = [{ text: 'Players without a game...' }, { text: 'will be KICKED.', col: '#FF4D6D', size: 80 }];
  }
  const shake = t > 189.0 ? Math.sin(t * 60) * 6 * (1 - inv(189.0, 189.6, t)) : 0;
  o += S.g(E2.skyMessage(lines, k, { y: 300 }), `translate(${f(shake)} 0)`);
  return o;
}

function shotKicked(t) { // 191.6 - 195.4
  const v = vis('YOU', t);
  const camX = 2400;
  if (t < 193.5) {
    const cam = { zoom: 2.4, fx: 960, fy: 520, x: camX };
    let o = townShot(t, cam, drawHero({ x: camX + 960, y: 1042, s: 0.5, nametag: tag, face: { name: 'scared', mouth: v || 'wavy', eyes: { pupil: 0.45, look: [0, -0.5] }, fx: ['sweat2'] }, headRot: 3 * Math.sin(t * 30) }), { noFg: true });
    o += S.rect(0, 0, W, H, 0, { fill: '#160B33', opacity: 0.55 });
    o += C.sfx('*gulp*', 1350, 420, inv(191.75, 191.9, t) * (1 - inv(192.4, 192.6, t)), 60, 8, '#FFFFFF');
    return o;
  }
  // "Have fun!" — the scary window turns cheerful
  const cam = { zoom: 1.0, fx: 960, fy: 600, x: camX };
  let o = townShot(t, cam, crowd(t, camX) + drawHero({ x: camX + 1000, y: 1042, s: 0.5, nametag: tag, face: { name: 'deadpan', eyes: { look: [0, -0.9], cross: 0 }, blink: blinkAt(t, 194.6) } }), { noFg: true });
  o += S.rect(0, 0, W, H, 0, { fill: '#160B33', opacity: 0.4 });
  o += E2.skyMessage([{ text: 'Have fun!  : )', col: '#5CFF7A', size: 96 }], 1, { y: 300, h: 300, headCol: '#3BD16F', title: '♥ SYSTEM MESSAGE' });
  for (let i = 0; i < 24; i++) { const ph = ((t - 193.6) * 0.8 + hash(i)) % 1; o += S.rect(hash(i * 3) * 1920, ph * 1100 - 50, 22, 22, 4, { fill: ['#FF5A5A', '#FFE14D', '#3BD16F', '#34C3FF', '#B06BFF'][i % 5], transform: `rotate(${f(ph * 300)} ${f(hash(i * 3) * 1920 + 11)} ${f(ph * 1100 - 39)})` }); }
  return o;
}

function scene(t) {
  if (t < 131.1) return shotDadIntro(t);
  if (t < 133.6) return shotVintage(t);
  if (t < 141.6) return shotCouch(t);
  if (t < 143.5) return shotDoor(t);
  if (t < 152.6) return shotWow(t);
  if (t < 159.2) return shotBanana(t);
  if (t < 165.6) return whip(t, 159.05, 159.35, shotTownsfolk(t));
  if (t < 168.8) return shotEverywhere(t);
  if (t < 175.2) return shotPostcards(t);
  if (t < 179.7) return shotServer(t);
  if (t < 191.6) return shotSkyDark(t);
  return shotKicked(t);
}

module.exports = { scene, TRACK, LINES, START, END };
