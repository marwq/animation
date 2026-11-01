// Part 8 (7:46.4 - 8:37.2): THE GRIND. Touch grass x3, weird pets, money up, base upgrades,
// 1,047 zaps, the Speed Coil, face into a wall, and the night Rocky comes home.
'use strict';

const S = require('../rig/svg');
const F = require('../rig/face');
const E = require('./env');
const G = require('./env4');
const C = require('./common');
const U = require('./ui');
const A = require('./acting');
const { drawHero } = require('../rig/hero');
const { egg } = require('../rig/props');
const { chickenShades, toastDog, floatingEye } = require('../rig/creatures');
const { f, ease, inv, lerp, clamp } = S;
const { W, H, bump, blinkAt, hash } = C;

const START = 466.4, END = 517.2;
const LINES = [
  [466.80, 468.00, 'NARRATOR', 'So you *grind.*'],
  [468.20, 470.60, 'NARRATOR', 'Touch grass. Touch grass. Touch grass.'],
  [470.70, 472.10, 'NARRATOR', 'Buy egg. Hatch egg.'],
  [472.30, 473.80, 'NARRATOR', 'A chicken in *sunglasses!*'],
  [474.00, 475.40, 'NARRATOR', 'A dog made of *toast!*'],
  [475.60, 478.40, 'NARRATOR', 'A floating eyeball that just... *stares.*'],
  [478.80, 481.60, 'NARRATOR', 'One dollar a second. Fifty. A *THOUSAND.*'],
  [481.80, 484.00, 'NARRATOR', 'Your base gets bigger. And *shinier.*'],
  [484.40, 487.40, 'NARRATOR', 'You practice stealing. You get zapped. And zapped. And zapped.'],
  [487.60, 489.80, 'NARRATOR', '*One thousand and forty-seven* times.'],
  [490.20, 492.20, 'NARRATOR', 'And finally... you buy the *Speed Coil.*'],
  [492.40, 493.60, 'YOU', '*NEW SHOES!*'],
  [493.90, 496.60, 'NARRATOR', 'You zoom. You fly. You run straight into a *wall.*'],
  [497.00, 498.20, 'YOU', '...worth it.'],
  [498.80, 502.00, 'NARRATOR', "And one night... you go back to Speedy's base."],
  [502.20, 504.00, 'NARRATOR', 'Two hundred rocks. All the same.'],
  [504.20, 506.60, 'NARRATOR', 'But one of them... *looks back at you.*'],
  [507.00, 508.40, 'YOU', '*Rocky...?*'],
  [508.80, 509.60, 'NARRATOR', '*Rocky.*'],
  [510.00, 513.60, 'NARRATOR', 'You carry him home on your head, at half speed, crying the whole way.'],
  [514.00, 516.40, 'YOU', "You're home, buddy. You're *HOME.*"],
];
const TRACK = C.makeTrack(LINES);
const vis = (sp, t) => C.visemeAt(TRACK, sp, t);
const tag = { name: 'YOU', health: 1 };
const whip = (t, a, b, inner) => { const k = bump(t, a, b); return k > 0.02 ? S.g(inner, `translate(${f((t < (a + b) / 2 ? -1 : 1) * k * 160)} 0)`, { filter: 'url(#whip)' }) : inner; };

const YB = { x0: 300, x1: 1500, col: '#FF8FC8', sign: "YOU's Base", doorSide: 'right' };
const SB = { x0: 2400, x1: 3600, col: '#3BD16F', sign: "Speedy's Base", doorSide: 'left' };
const PED = (i, n = 3) => YB.x0 + ((i + 1) * (YB.x1 - YB.x0)) / (n + 1);

function world(t, cam, w, o = {}) {
  const M = G.eggMap(cam, t, { beltOff: t * 120 });
  let b = G.base({ ...YB, locked: o.locked ?? true, gold: o.gold, pedestals: o.peds || [null, null, null], pedCount: o.pedCount }, t);
  b += G.base({ ...SB, locked: true, lockPanel: false, pedCount: 0 }, t);
  if (o.pile) b += G.rockPile(3050, 1010, 900, 420, t);
  return M.bg + M.ground + S.g(b + w, E.camTf(cam, 1));
}
const panel = (x, y, w, h, inner, k = 1) => S.g(S.rect(-w / 2, -h / 2, w, h, 26, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 6 }) + inner, `translate(${x} ${y}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
const big = (txt, y, size, col) => S.el('text', { x: 0, y, 'font-family': 'Lilita One', 'font-size': size, fill: col, 'text-anchor': 'middle' }, txt);

// ---------------------------------------------------------------- 466.4 - 470.7: card + touch grass x3
function shotGrindStart(t) {
  if (t < 468.15) {
    const cam = { zoom: 1.2, fx: 960, fy: 540, x: -60, y: 230 };
    return world(t, cam, drawHero({ x: 900, y: 1000, s: 0.55, nametag: tag, face: { name: 'determined' }, armL: 30, armR: 30 })) + U.chapterCard('THE GRIND', inv(466.5, 466.8, t), t, 'DAY 2 – 30');
  }
  // three panels, one touch each
  let o = S.rect(0, 0, W, H, 0, { fill: '#151515' });
  for (let i = 0; i < 3; i++) {
    const b = 468.2 + i * 0.8;
    const k = ease.out(inv(b, b + 0.15, t));
    if (k <= 0) continue;
    const touch = bump(t, b + 0.1, b + 0.55);
    const cam = { zoom: 1.4, fx: 960, fy: 540, x: 500, y: 260 };
    let w = G.grassBlock(1600, 1010, 1.0) + drawHero({ x: 1380, y: 1000, s: 0.55, nametag: null, turn: 0.5, bodyY: 80 * touch, lean: 18 * touch, armR: 40 * touch, face: { name: ['determined', 'deadpan', 'sleepy'][i] } });
    w += G.floatText('+$10', 1600, 840, t - b - 0.4, '#5CFF7A', 80);
    const id = `panel${i}`;
    o += S.clipDef(id, S.rect(i * 640 + 6, 0, 628, H)) + S.g(S.g(world(t, cam, w), `translate(${i * 640 - 640} 0)`), null, { 'clip-path': `url(#${id})`, opacity: f(k) });
  }
  return o;
}

// ---------------------------------------------------------------- 470.7 - 478.7: pets
function shotPets(t) {
  const cam = { zoom: 1.5, fx: 960, fy: 540, x: 200, y: 260 };
  const pets = [chickenShades({ x: 0, y: 0, s: 0.5, look: -0.3 }), toastDog({ x: 0, y: 0, s: 0.75, t }), ''];
  let w = '';
  const pk = (i) => (i === 0 ? 472.3 : i === 1 ? 474.0 : 475.6);
  for (let i = 0; i < 3; i++) {
    const at = pk(i);
    if (t < at - 0.6) { if (t > 470.7 && i === 0) w += S.g(egg({ x: 0, y: -60, size: 120, rarity: 'rare', glow: true, rot: Math.sin(t * 30) * 10 * inv(471.4, 472.1, t) }), `translate(${PED(i)} 888)`); continue; }
    if (t < at) { w += S.g(egg({ x: 0, y: -60, size: 120, rarity: ['rare', 'epic', 'mythic'][i], glow: true, rot: Math.sin(t * 30) * 12 }), `translate(${PED(i)} 888)`); continue; }
    const k = ease.outBack(inv(at, at + 0.25, t));
    if (i < 2) w += S.g(pets[i], `translate(${PED(i)} 888) scale(${f(k)})`);
    else w += floatingEye({ x: PED(i), y: 650, s: 0.6 * k, t, look: t > 476.6 ? [0, 0.2] : [-0.8, 0] });
    if (t < at + 0.35) w += S.g(F.sparkle(0, 0, 40), `translate(${PED(i)} 760)`);
  }
  // the hero side-eyes the staring eyeball
  const stare = t > 476.6;
  w += drawHero({ x: 1700, y: 1000, s: 0.5, nametag: tag, turn: -0.4, face: stare ? { name: 'nervous', eyes: { look: [-0.9, -0.2], cross: 0 }, fx: ['sweat'] } : { name: 'excited' } });
  let o = world(t, cam, w);
  if (stare) o += S.rect(0, 0, W, H, 0, { fill: '#1A0B3A', opacity: f(0.3 * inv(476.6, 477.2, t)) });
  return o;
}

// ---------------------------------------------------------------- 478.7 - 484.3: money + base upgrade
function shotMoney(t) {
  const up = t > 481.8;
  const cam = { zoom: up ? 1.05 : 1.35, fx: 960, fy: 540, x: -60, y: up ? 200 : 260 };
  const n = up ? 6 : 3;
  const peds = [];
  for (let i = 0; i < n; i++) peds.push(i < 3 ? [chickenShades({ x: 0, y: 0, s: 0.4 }), toastDog({ x: 0, y: 0, s: 0.6, t }), floatingEye({ x: 0, y: -200, s: 0.45, t, look: [0, 0.4] })][i] : egg({ x: 0, y: -58, size: 100, rarity: ['legendary', 'epic', 'mythic'][i - 3], glow: true }));
  const shine = up ? inv(482.8, 483.6, t) : 0;
  let o = world(t, cam, drawHero({ x: 1300, y: 1000, s: 0.5, nametag: tag, face: { name: 'rich' }, armL: 150, armR: 150, lift: 30 * Math.abs(Math.sin(t * 6)) }), { peds, gold: shine > 0.5 });
  const rate = t < 479.9 ? '$1' : t < 480.7 ? '$50' : '$1,000';
  const pulse = Math.max(bump(t, 479.9, 480.2), bump(t, 480.7, 481.0));
  o += panel(960, 200, 640, 150, big(`${rate} / SEC`, 32, 96, '#5CFF7A'), inv(478.9, 479.1, t) * (up ? 1 - inv(481.8, 482.0, t) : 1));
  if (pulse > 0) o += C.burst(960, 200, pulse, '#5CFF7A');
  if (up) {
    o += panel(960, 180, 560, 130, big('BASE UPGRADED!', 26, 74, '#FFE14D'), inv(481.9, 482.1, t));
    for (let i = 0; i < 8; i++) o += F.sparkle(200 + hash(i) * 1500, 500 + hash(i * 3) * 400, 30 * bump(t, 482.8 + hash(i) * 0.6, 483.9), '#FFFFFF');
  }
  return o;
}

// ---------------------------------------------------------------- 484.3 - 490.0: zapped x1047
function shotZapped(t) {
  const beats = [485.3, 486.1, 486.9];
  let zap = 0;
  for (const b of beats) zap = Math.max(zap, bump(t, b, b + 0.35));
  const count = t < 487.6 ? beats.filter((b) => t > b).length : Math.min(1047, Math.floor(3 + 1044 * ease.in(inv(487.6, 489.3, t))));
  const burnt = t > 487.5;
  const cam = { zoom: 1.6, fx: 960, fy: 540, x: 5900 - 960, y: 250 };
  const M = G.eggMap(cam, t, {});
  let b = G.base({ x0: 5100, x1: 6900, col: '#C9CED8', sign: 'PRACTICE', doorSide: 'left', locked: true, lockPanel: false, pedCount: 3 }, t);
  for (let i = 0; i < 3; i++) b += E.beam(5100, 700 + i * 110, 6900, 700 + i * 110 + 60 * Math.sin(t * 2 + i), 1);
  const you = { x: 5900, y: 1000, s: 0.55, nametag: { name: 'YOU', health: burnt ? 0.1 : 1 - 0.3 * zap }, face: zap > 0.3 ? { name: 'oof' } : burnt ? { name: 'deadpan', eyes: { upper: 0.5 } } : { name: 'determined', fx: ['mask'] }, armL: zap > 0.3 ? 160 : 9, armR: zap > 0.3 ? 160 : 9, lift: 60 * zap };
  let o = M.bg + M.ground + S.g(b + drawHero(you), E.camTf(cam, 1));
  if (burnt) o += S.g(S.path('M-40 -40 q20 -60 0 -110 M20 -40 q20 -60 0 -110', { fill: 'none', stroke: '#8A8A99', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.7 }), 'translate(960 300)');
  if (zap > 0.3) o += C.whiteFlash(0.5 * zap) + C.sfx('ZAP!', 1400, 280, zap, 120, 8, '#7CF7FF');
  o += panel(1600, 140, 420, 120, big(`ZAPPED: ${count.toLocaleString('en-US')}`, 24, 60, '#FF4D6D'), inv(485.3, 485.5, t));
  return o;
}

// ---------------------------------------------------------------- 490.0 - 498.6: Speed Coil, wall
function coilShoe(x, y, s, t) {
  return S.g(S.rect(-90, -30, 180, 60, 18, { fill: '#34C3FF', stroke: '#151515', 'stroke-width': 6 }) + S.rect(-90, 24, 180, 22, 10, { fill: '#FFFFFF', stroke: '#151515', 'stroke-width': 5 }) +
    S.path('M-60 -30 L-40 -60 L-20 -30 M0 -30 L20 -60 L40 -30', { fill: 'none', stroke: '#FFE14D', 'stroke-width': 8, 'stroke-linejoin': 'round' }) + S.circle(0, 0, 130, { fill: '#34C3FF', opacity: f(0.15 + 0.1 * Math.sin(t * 8)) }), `translate(${x} ${y}) scale(${s})`);
}
function shotCoil(t) {
  if (t < 492.3) { // shop UI
    let o = S.rect(0, 0, W, H, 0, { fill: '#2A0E5E' });
    for (let i = 0; i < 14; i++) o += S.path('M0 0 L-70 -1200 L70 -1200 Z', { fill: '#FFFFFF', opacity: 0.06, transform: `translate(960 520) rotate(${f(i * 25.7 + t * 20)})` });
    o += panel(960, 540, 900, 700, big('SHOP', -260, 90, '#FFE14D') + coilShoe(0, -40, 1.6, t) + big('SPEED COIL', 140, 84, '#7CF7FF') + S.g(S.rect(-150, -45, 300, 90, 22, { fill: '#3BD16F', stroke: '#151515', 'stroke-width': 6 }) + big('BUY', 26, 70, '#FFFFFF'), `translate(0 250) scale(${f(1 - 0.1 * bump(t, 491.6, 491.9))})`), inv(490.3, 490.6, t));
    if (t > 491.6) o += S.circle(960, 790, 30 + 110 * inv(491.6, 492.0, t), { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 14 * (1 - inv(491.6, 492.0, t)) });
    return o;
  }
  if (t < 493.8) { // NEW SHOES!
    const v = vis('YOU', t);
    const cam = { zoom: 1.6, fx: 960, fy: 540, x: -60, y: 250 };
    let o = world(t, cam, drawHero({ x: 900, y: 1000, s: 0.55, nametag: tag, face: { name: 'excited', mouth: v || 'bigGrin' }, armL: 150, armR: 150, lift: 40 * Math.abs(Math.sin(t * 7)) }) + S.circle(900, 990, 120, { fill: '#34C3FF', opacity: f(0.25 + 0.1 * Math.sin(t * 10)) }));
    return o + C.burst(960, 900, inv(492.4, 492.8, t), '#7CF7FF');
  }
  if (t < 496.7) { // zoom, fly, wall
    const u = t - 493.8;
    const hit = t > 495.9;
    const x = hit ? 2280 : lerp(600, 2280, ease.in(inv(493.9, 495.9, t)));
    const fly = Math.sin(clamp((t - 494.6) / 1.2, 0, 1) * Math.PI) * 260;
    const cam = { zoom: 1.0, fx: 960, fy: 540, x: Math.min(x, 2280) - 1300, y: 160 };
    let w = '';
    if (!hit) w += drawHero({ view: 'side', flip: true, x, y: 1000, s: 0.55, lean: -16, ...A.run(u * 40), lift: fly, face: { name: 'excited' }, nametag: tag }) + C.speedLines(x - 900, x - 200, 760 - fly * 0.5, 10, 33, '#7CF7FF');
    else w += drawHero({ view: 'side', flip: true, x: 2250, y: 1000, s: 0.55, sx: 0.7, armL: 170, armR: 170, face: { name: 'oof' }, nametag: tag });
    // the wall (Speedy's base fence turned into a big brick wall)
    w += S.rect(2300, 500, 120, 520, 10, { fill: '#C9805A', stroke: '#151515', 'stroke-width': 7 });
    for (let y = 520; y < 1000; y += 60) w += S.path(`M2300 ${y} L2420 ${y}`, { stroke: '#8A5A33', 'stroke-width': 5 });
    let o = world(t, cam, w);
    if (hit) o += C.sfx('SPLAT!', 1400, 320, inv(495.9, 496.0, t), 130, -8, '#FFE14D');
    return o;
  }
  // ...worth it (face in the wall, thumbs up)
  const cam = { zoom: 2.2, fx: 960, fy: 540, x: 2250 - 960, y: 200 };
  let w = drawHero({ view: 'side', flip: true, x: 2250, y: 1000, s: 0.55, sx: 0.85, armL: 150, armR: 100, face: { name: 'oof' }, nametag: tag });
  w += S.rect(2300, 500, 120, 520, 10, { fill: '#C9805A', stroke: '#151515', 'stroke-width': 7 });
  for (let y = 520; y < 1000; y += 60) w += S.path(`M2300 ${y} L2420 ${y}`, { stroke: '#8A5A33', 'stroke-width': 5 });
  w += S.path('M2300 620 L2270 580 M2300 700 L2260 720 M2300 650 L2250 650', { stroke: '#151515', 'stroke-width': 6, 'stroke-linecap': 'round' });
  return world(t, cam, w) + C.sfx('👍', 1100, 360, inv(497.1, 497.3, t), 90, 0, '#FFFFFF');
}

// ---------------------------------------------------------------- 498.6 - 517.2: Rocky comes home (night)
function night(t, inner, glow = []) { return inner + C.nightGrade(1, glow); }
function shotNightSneak(t) { // 498.6 - 504.1
  const u = t - 498.6;
  const x = lerp(1700, 2150, inv(498.8, 502.0, t));
  const cam = t < 502.1 ? { zoom: 1.4, fx: 960, fy: 540, x: x - 960 + 200, y: 250 } : { zoom: 1.2, fx: 960, fy: 540, x: 3050 - 960, y: 150 };
  const step = Math.sin(u * 7);
  let w = drawHero({ x, y: 1000, s: 0.55, nametag: tag, turn: 0.85, bodyY: 26 + 8 * Math.abs(step), legL: 8 * step, legR: -8 * step, armL: -24, armR: -20, face: { name: 'sneaky', eyes: { look: [0.95, 0], cross: 0 }, fx: ['mask'] } });
  const o = world(t, cam, w, { pile: true });
  return night(t, o, [{ x: 1700, y: 120, r: 400, col: '#C9D8FF', a: 0.35 }]);
}
function shotLooksBack(t) { // 504.1 - 509.7
  const z = lerp(1.6, 3.4, ease.inOut(inv(504.2, 506.4, t)));
  // the rock that looks back sits at row 2 of the pile; we draw a lone highlighted Rocky in front
  const rx = 3050 + 60, ry = 1010 - 0.22 * 420;
  const cam = { zoom: z, fx: 960, fy: 540, x: rx - 960, y: ry - 540 - 60 };
  const open = t > 505.4;
  let w = G.rocky({ x: rx, y: ry, s: 0.5, t, blink: open ? blinkAt(t, 507.5) : 1, face: t > 508.8 ? 'love' : 'happy', sparkle: t > 508.8 });
  let o = world(t, cam, w, { pile: true });
  o = night(t, o, [{ x: 960, y: 540, r: 300, col: '#FFF3C2', a: open ? 0.6 : 0.2 }]);
  if (t > 507.0 && t < 508.6) { // the hero's tearful face, inset
    const v = vis('YOU', t);
    const k = ease.outBack(inv(507.0, 507.2, t));
    o += S.g(S.circle(0, 0, 230, { fill: '#2A3060', stroke: '#FFFFFF', 'stroke-width': 8 }) + S.g(drawHero({ x: 0, y: 0, s: 0.5, face: { name: 'sad', mouth: v || 'o', eyes: { pupil: 1.6, sparkle: true }, fx: ['tears'] }, shadow: false }), 'translate(0 330)'), `translate(1500 380) scale(${f(k)})`);
  }
  return o;
}
function shotCarryHome(t) { // 509.7 - 513.9
  const u = t - 509.7;
  const x = lerp(2300, 1600, u / 4.2);
  const cam = { zoom: 1.4, fx: 960, fy: 540, x: x - 960, y: 130 };
  const rk = G.rocky({ x: 0, y: -1010, s: 1.3, t, face: 'love' });
  let w = drawHero({ view: 'side', x, y: 1000, s: 0.55, ...A.walk(u * 4), face: { name: 'crying', fx: ['tears'] }, nametag: tag, props: [{ svg: rk, layer: 'top' }] });
  return night(t, world(t, cam, w, { pile: true }), [{ x: 960, y: 200, r: 420, col: '#C9D8FF', a: 0.3 }]) + S.g(S.rect(-120, -50, 240, 100, 24, { fill: '#1F2233', stroke: '#FFFFFF', 'stroke-width': 5 }) + big('0.5x', 26, 70, '#FFE14D'), 'translate(1680 300)');
}
function shotHome(t) { // 513.9 - 517.2
  const v = vis('YOU', t);
  const cam = { zoom: 1.8, fx: 960, fy: 540, x: PED(1) - 960, y: 250 };
  let w = drawHero({ x: PED(1) - 140, y: 1000, s: 0.55, nametag: tag, turn: 0.4, bodyY: 40, armR: -30, armL: 30, face: { name: 'crying', mouth: v || 'wail', fx: ['tears', 'blush'] } });
  let o = world(t, cam, w, { peds: [null, G.rocky({ x: 0, y: 0, s: 0.95, t, face: 'love', sparkle: true }), null] });
  o = night(t, o, [{ x: 960, y: 560, r: 500, col: '#FFE3A8', a: 0.5 }]);
  for (let i = 0; i < 6; i++) { const ph = ((t - 513.9) * 0.6 + i / 6) % 1; o += S.g(S.path(F.heartPath(0, 0, 26), { fill: '#FF5A9A', stroke: '#151515', 'stroke-width': 4 }), `translate(${f(760 + i * 80)} ${f(560 - ph * 320)})`, { opacity: f(1 - ph) }); }
  return o;
}

function scene(t) {
  if (t < 470.7) return shotGrindStart(t);
  if (t < 478.7) return shotPets(t);
  if (t < 484.3) return shotMoney(t);
  if (t < 490.0) return shotZapped(t);
  if (t < 498.6) return shotCoil(t);
  if (t < 504.1) return shotNightSneak(t);
  if (t < 509.7) return shotLooksBack(t);
  if (t < 513.9) return shotCarryHome(t);
  return shotHome(t);
}

module.exports = { scene, TRACK, LINES, START, END };
