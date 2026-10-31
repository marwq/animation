// ~10 s rig test: idle/blink/look -> talk + wave with lip-sync -> an egg drops ->
// shock jump -> sneak + grab -> run away with the egg -> title card.
// Usage: node tools/anim_test.js [out.mp4] [fps]
'use strict';

const path = require('path');
const S = require('../rig/svg');
const { drawHero } = require('../rig/hero');
const { egg } = require('../rig/props');
const F = require('../rig/face');
const { renderVideo } = require('./render');
const { f, ease, inv, lerp, clamp } = S;

const W = 1920, H = 1080, GROUND = 975, HERO_S = 0.72;
const EGG_BODY = 250; // egg size in hero space
const EGG_W = EGG_BODY * HERO_S; // same egg in world pixels
const NAME = 'Player';

// ---------------------------------------------------------------- background
function background() {
  let o = `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5EC2FF"/><stop offset="1" stop-color="#CDEFFF"/></linearGradient>
    <pattern id="studs" width="46" height="26" patternUnits="userSpaceOnUse"><ellipse cx="23" cy="13" rx="13" ry="6" fill="#71D46C"/><ellipse cx="23" cy="11" rx="13" ry="6" fill="#8BE385"/></pattern>
    <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></radialGradient>
  </defs>`;
  o += S.rect(-400, -400, W + 800, H + 800, 0, { fill: 'url(#sky)' });
  // square sun with glow
  o += S.circle(1600, 170, 150, { fill: '#FFF6B0', opacity: 0.35 });
  o += S.rect(1530, 100, 140, 140, 14, { fill: '#FFE45C', stroke: '#E8B400', 'stroke-width': 6 });
  // blocky clouds
  const cloud = (x, y, k) => S.g(
    S.rect(0, 30, 260, 70, 18, { fill: '#fff' }) + S.rect(50, 0, 120, 80, 18, { fill: '#fff' }) + S.rect(140, 14, 90, 70, 18, { fill: '#fff' }) +
    S.rect(0, 84, 260, 16, 8, { fill: '#DDEFFA' }), `translate(${x} ${y}) scale(${k})`);
  o += cloud(140, 120, 1) + cloud(820, 70, 0.8) + cloud(1180, 230, 0.6);
  // far blocky hills + houses
  o += S.path('M-400 760 L-100 760 L-100 700 L200 700 L200 650 L520 650 L520 720 L900 720 L900 680 L1300 680 L1300 640 L1700 640 L1700 710 L2400 710 L2400 900 L-400 900 Z', { fill: '#7FCB86' });
  const house = (x, y, c, r) => S.g(S.rect(0, 0, 150, 110, 6, { fill: c, stroke: '#151515', 'stroke-width': 5 }) +
    S.path('M-14 4 L75 -60 L164 4 Z', { fill: r, stroke: '#151515', 'stroke-width': 5, 'stroke-linejoin': 'round' }) +
    S.rect(58, 50, 34, 60, 4, { fill: '#7A4B2A', stroke: '#151515', 'stroke-width': 4 }) + S.rect(14, 26, 32, 28, 3, { fill: '#BFE8FF', stroke: '#151515', 'stroke-width': 4 }) +
    S.rect(104, 26, 32, 28, 3, { fill: '#BFE8FF', stroke: '#151515', 'stroke-width': 4 }), `translate(${x} ${y})`);
  o += house(260, 590, '#FFE2B8', '#E8504A') + house(1380, 560, '#D9E8FF', '#4A7BE8');
  // ground with studs
  o += S.rect(-400, 800, W + 800, 600, 0, { fill: '#5CC75A' });
  o += S.rect(-400, 800, W + 800, 600, 0, { fill: 'url(#studs)' });
  o += S.path(`M-400 800 L${W + 400} 800`, { stroke: '#3E9E3E', 'stroke-width': 6 });
  // blocky trees
  const tree = (x, y, k) => S.g(
    S.rect(-22, -150, 44, 150, 4, { fill: '#8A5A33', stroke: '#151515', 'stroke-width': 6 }) +
    S.rect(-110, -330, 220, 200, 18, { fill: '#3FB34F', stroke: '#151515', 'stroke-width': 6 }) +
    S.rect(-110, -200, 220, 70, 0, { fill: '#2E9A40', opacity: 0.6 }) +
    S.rect(-110, -330, 220, 200, 18, { fill: 'none', stroke: '#151515', 'stroke-width': 6 }), `translate(${x} ${y}) scale(${k})`);
  o += tree(110, 830, 0.95) + tree(1800, 840, 1.05);
  return o;
}
const BG = background();

// ---------------------------------------------------------------- captions
const CAPTIONS = [
  // [start, end, text, color]
  [1.75, 2.15, 'HEY!', '#FFD21F'], [2.15, 2.45, 'WANNA', '#fff'], [2.45, 2.7, 'SEE', '#fff'],
  [2.7, 3.12, 'SOMETHING', '#fff'], [3.12, 3.8, 'COOL?!', '#7CF07A'],
  [4.8, 5.5, 'AN EGG?!', '#FFD21F'], [6.66, 7.0, 'MINE.', '#FF8FD0'], [7.4, 8.4, 'RUUUN!', '#FF5A5A'],
];
function caption(t) {
  const c = CAPTIONS.find(([a, b]) => t >= a && t < b);
  if (!c) return '';
  const k = ease.outBack(inv(c[0], c[0] + 0.14, t));
  const sc = lerp(0.55, 1, k);
  return S.g(S.el('text', {
    x: 0, y: 0, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 96, fill: c[3],
    stroke: '#151515', 'stroke-width': 16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': 'middle',
  }, c[2]), `translate(960 1052) scale(${f(sc)})`);
}

// visemes for the spoken words (spread across each caption window)
const SPOKEN = { 'HEY!': 'HCB', WANNA: 'FDBD', SEE: 'BBC', SOMETHING: 'BCACBB', 'COOL?!': 'BFFH', 'AN EGG?!': 'CBCDB', 'MINE.': 'ADCB', 'RUUUN!': 'BFFFFB' };
function viseme(t) {
  const c = CAPTIONS.find(([a, b]) => t >= a && t < b);
  if (!c) return null;
  const seq = SPOKEN[c[2]];
  const end = c[2] === 'RUUUN!' ? c[1] : Math.min(c[1], c[0] + seq.length * 0.075 + 0.05);
  if (t > end) return null;
  const i = Math.min(seq.length - 1, Math.floor(((t - c[0]) / (end - c[0])) * seq.length));
  return seq[i];
}

// ---------------------------------------------------------------- timeline
const EGG_X = 1330;
const GRAB_X = EGG_X - 190; // where the hero stops to grab
const GRAB_BODY_Y = 30;
function eggWorld(t) {
  // falls 4.2 -> 4.75, bounces until 5.1, sits, then hops into the hero's arms 6.45 -> 6.65
  if (t < 4.2 || t >= 6.65) return null;
  const size = EGG_W;
  const restY = GROUND - size / 2 + 6;
  if (t < 4.75) {
    const k = ease.in(inv(4.2, 4.75, t)) * 0.6 + inv(4.2, 4.75, t) * 0.4;
    return { x: EGG_X, y: lerp(-120, restY, k), size, sx: 0.92, sy: 1.1, rot: lerp(-30, 0, k) };
  }
  if (t >= 6.45) {
    const k = ease.inOut(inv(6.45, 6.65, t));
    const tx = GRAB_X + 18 * HERO_S, ty = GROUND + (-385 + GRAB_BODY_Y) * HERO_S;
    return { x: lerp(EGG_X, tx, k), y: lerp(restY, ty, k) - Math.sin(k * Math.PI) * 140, size, sx: 1, sy: 1, rot: -360 * k };
  }
  const b = inv(4.75, 5.1, t);
  const squash = Math.sin(b * Math.PI * 3) * (1 - b) * 0.22;
  const hop = Math.max(0, Math.sin(b * Math.PI * 2)) * (1 - b) * 40;
  return { x: EGG_X, y: restY - hop, size, sx: 1 + squash, sy: 1 - squash, rot: Math.sin(t * 9) * 4 * (1 - inv(5.1, 5.6, t)) };
}

function heroAt(t) {
  const p = { x: 960, y: GROUND, s: HERO_S, nametag: { name: NAME, health: 1 }, face: { name: 'neutral' } };
  const breathe = Math.sin((t * Math.PI * 2) / 1.5);
  p.bodyY = 3 + 3 * breathe;
  p.headY = 2 * breathe;
  let look = [0, 0];
  let blink = 0;
  const bl = (c) => Math.max(0, 1 - Math.abs(t - c) / 0.07);

  // A: idle (0 - 1.6)
  if (t < 1.6) {
    look = [lerp(0, -0.7, ease.inOut(inv(0.25, 0.45, t))) + lerp(0, 1.4, ease.inOut(inv(1.0, 1.2, t))), 0];
    blink = bl(0.75);
    p.face = { name: 'neutral', eyes: { look }, blink };
  }
  // B: talk + wave (1.6 - 4.2)
  else if (t < 4.2) {
    p.turn = 0.3 * ease.out(inv(1.6, 1.85, t)) * (1 - ease.inOut(inv(3.9, 4.15, t)));
    const up = ease.outBack(inv(1.6, 1.85, t)) * (1 - ease.inOut(inv(3.6, 4.0, t)));
    p.armR = lerp(9, 150 + 16 * Math.sin((t - 1.85) * Math.PI * 2 * 2.2), up);
    p.armL = 6;
    p.headRot = 3 * Math.sin(t * 13) * (viseme(t) ? 1 : 0.3);
    blink = bl(3.35);
    p.face = { name: 'talkHappy', mouth: viseme(t) || 'smile', blink };
  }
  // C: egg drops, shock, cheer (4.2 - 5.7)
  else if (t < 5.7) {
    const e = eggWorld(t);
    const lx = 0.9, ly = e && t < 4.75 ? lerp(-0.9, 0.6, inv(4.3, 4.75, t)) : 0.5;
    if (t < 4.75) {
      p.face = { name: 'amazed', eyes: { look: [lx, ly], cross: 0 }, fx: [] };
      p.headRot = lerp(0, 6, inv(4.3, 4.7, t));
      p.bodyY += 10 * inv(4.5, 4.75, t);
    } else if (t < 5.25) {
      const k = inv(4.75, 5.25, t);
      p.lift = Math.sin(k * Math.PI) * 100;
      p.sy = 1 + 0.08 * Math.sin(k * Math.PI);
      p.sx = 1 - 0.05 * Math.sin(k * Math.PI);
      p.armL = p.armR = lerp(9, 75, ease.outBack(inv(4.75, 4.9, t)));
      p.headY = -16 * Math.sin(k * Math.PI);
      p.face = { name: 'shocked', mouth: viseme(t) || 'O', eyes: { look: [0.8, 0.4], pupil: 0.5, cross: 0 } };
    } else {
      const k = inv(5.25, 5.7, t);
      p.sy = 1 - 0.1 * Math.sin(Math.min(1, k * 3) * Math.PI);
      p.armL = p.armR = lerp(75, 155, ease.outBack(inv(5.25, 5.45, t)));
      p.face = { name: 'excited', mouth: viseme(t) || 'bigGrin' };
    }
  }
  // D: sneak to the egg and grab it (5.7 - 7.0)
  else if (t < 7.0) {
    const k = inv(5.75, 6.3, t);
    p.turn = 0.85 * ease.out(inv(5.7, 5.9, t));
    const walking = t > 5.75 && t < 6.3;
    p.bodyY = GRAB_BODY_Y * ease.out(inv(5.7, 5.9, t)) + (walking ? 6 * Math.abs(Math.sin(t * 16)) : 0);
    p.lean = 6;
    p.x = lerp(960, GRAB_X, ease.inOut(k));
    const step = walking ? Math.sin(t * 16) * 12 : 0;
    p.legL = step; p.legR = -step;
    p.armL = lerp(155, 20, ease.out(inv(5.7, 5.9, t)));
    p.armR = lerp(155, 20, ease.out(inv(5.7, 5.9, t)));
    const lookX = t < 6.3 ? 0.95 : t < 6.42 ? -0.95 : 0.95;
    p.face = { name: 'sneaky', mouth: viseme(t) || 'smirk', eyes: { look: [lookX, 0], cross: 0 } };
    if (t >= 6.45) {
      const g = ease.outBack(inv(6.5, 6.7, t));
      p.armL = lerp(20, -30, g); p.armR = lerp(20, -18, g);
    }
    if (t >= 6.65) {
      const pop = 1 + 0.12 * Math.sin(inv(6.65, 6.85, t) * Math.PI);
      p.props = [{ svg: egg({ x: 18, y: -385, size: EGG_BODY * pop, rarity: 'legendary', glow: false }), layer: 'mid' }];
      p.face = { name: 'sneaky', mouth: viseme(t) || 'smirk', eyes: { look: [0.95, 0], cross: 0 }, fx: t < 6.95 ? ['sparkles'] : [] };
    }
  }
  // E: run away (7.0 - 9.0)
  else {
    p.view = 'side'; p.flip = true;
    const startX = GRAB_X;
    const anticip = inv(7.0, 7.25, t);
    const run = inv(7.25, 8.9, t);
    p.x = startX - 30 * Math.sin(anticip * Math.PI) + 1250 * ease.in(run);
    const ph = (t - 7.25) * Math.PI * 2 * 3.4;
    const running = t >= 7.25;
    p.legL = running ? 36 * Math.sin(ph) : -10;
    p.legR = running ? -36 * Math.sin(ph) : 14;
    p.lift = running ? 22 * Math.abs(Math.sin(ph)) : 0;
    p.bodyY = running ? 6 - 6 * Math.abs(Math.sin(ph)) : 24 * Math.sin(anticip * Math.PI);
    p.lean = running ? -10 : 10 * Math.sin(anticip * Math.PI);
    p.armL = 62 + (running ? 6 * Math.sin(ph) : 0);
    p.armR = 58 - (running ? 6 * Math.sin(ph) : 0);
    p.props = [{ svg: egg({ x: -150, y: -420, size: EGG_BODY * 0.92, rarity: 'legendary', glow: false }), layer: 'mid' }];
    p.face = { name: 'scream', mouth: viseme(t) || 'scream' };
  }
  return p;
}

function speedLines(t, x) {
  if (t < 7.3 || t > 9.0) return '';
  let o = '';
  for (let i = 0; i < 7; i++) {
    const y = 520 + i * 52 + ((i * 37) % 23);
    const len = 160 + ((i * 53) % 120);
    const off = ((t * 1800 + i * 140) % 260);
    o += S.rect(x - 380 - len - off, y, len, 9, 4.5, { fill: '#fff', opacity: 0.85 });
  }
  return o;
}

function titleCard(t) {
  if (t < 8.85) return '';
  const k = ease.outBack(inv(8.85, 9.2, t));
  const k2 = ease.outBack(inv(9.05, 9.4, t));
  const txt = (s, y, size, fill, sc) => S.g(S.el('text', {
    x: 0, y: 0, 'font-family': 'Lilita One, sans-serif', 'font-size': size, fill, stroke: '#151515', 'stroke-width': size * 0.16,
    'paint-order': 'stroke', 'stroke-linejoin': 'round', 'text-anchor': 'middle',
  }, s), `translate(960 ${y}) scale(${f(sc)})`);
  return txt('WHAT IF THE WHOLE WORLD', 420, 110, '#fff', k) + txt('BECAME ROBLOX?!', 560, 150, '#FFD21F', k2);
}

function frame(t) {
  const p = heroAt(t);
  // camera: slow push-in, punch-in on the shock, shake on landing
  let zoom = 1 + 0.03 * inv(0, 1.6, t);
  zoom += 0.10 * ease.out(inv(4.75, 4.9, t)) * (1 - ease.inOut(inv(5.3, 5.8, t)));
  const shake = t > 4.75 && t < 5.0 ? (1 - inv(4.75, 5.0, t)) * 14 : 0;
  const sx = shake * Math.sin(t * 90), sy = shake * Math.cos(t * 77);
  const fx = 1150, fy = 720;
  const cam = `translate(${f(fx + sx)} ${f(fy + sy)}) scale(${f(zoom)}) translate(${-fx} ${-fy})`;

  let world = BG;
  const e = eggWorld(t);
  if (e) {
    world += S.ellipse(e.x, GROUND + 4, 110 * clamp(1 - (GROUND - e.y) / 1400, 0.3, 1), 16, { fill: 'rgba(0,0,0,0.16)' });
    world += S.g(egg({ x: 0, y: 0, size: e.size, rarity: 'legendary', rot: e.rot }), `translate(${f(e.x)} ${f(e.y)}) scale(${f(e.sx)} ${f(e.sy)})`);
  }
  world += speedLines(t, p.x);
  world += drawHero(p);
  if (t > 4.75 && t < 4.95) { // impact burst
    const k = inv(4.75, 4.95, t);
    world += F.markText('THUD!', EGG_X + 40, GROUND - 260 - 40 * k, 90, -8, '#FFD21F');
  }
  let o = S.g(world, cam);
  o += S.rect(0, 0, W, H, 0, { fill: 'url(#vig)' });
  o += caption(t);
  if (t > 8.85) o += S.rect(0, 0, W, H, 0, { fill: '#000', opacity: 0.35 * inv(8.85, 9.2, t) });
  o += titleCard(t);
  return o;
}

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, '..', 'concept', 'rig_test.mp4');
  const fps = Number(process.argv[3] || 60);
  renderVideo(frame, { w: W, h: H, fps, duration: 10, out }).catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { frame };
