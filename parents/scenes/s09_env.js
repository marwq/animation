// Private helpers for SC 09 (the Block King) and SC 10 (the family raid): the voice-derived cut/beat tables (shared with
// audio/cues/gen_sc09.js / gen_sc10.js), cameras with rotation + shakes, transitions (whip, flash, pixel wipe, letterbox),
// the stone FX (giant fist, flying cubes, shock rings, dust), cookies, screen-space chat bubbles, split-screen panels,
// Granny's receipt, helmets, the thought bubble and the moonlight.
'use strict';

const K = require('./kit');
const GS = require('./sets_game');
const G = require('./gameui');
const L6 = require('../rig/looks6');
const X = require('../rig/extras');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;

const LINE = '#151515';
const W = 1920, H = 1080;

// ================================================================ timing (from the voice only)
// times09(V) / times10(V) with V = require('./vo'): every cut (C) and beat (B) of the scene. The cue generators call them too.
function times09(V) {
  const L = V.L;
  const n = Array.from({ length: 14 }, (_, i) => L('09.' + i));
  const w = (i, word, k = 0) => n[i].word(word, k).t0;
  const w1 = (i, word, k = 0) => n[i].word(word, k).t1;
  const START = V.TL.scenes['SC 09'].start, END = V.TL.scenes['SC 10'].start;
  const C = {}, B = {};
  // --- A: the Block King rises behind the city
  C.a1 = START;
  B.king = w(0, 'King');
  C.a2 = w(0, 'The', 1) - 0.12;                    // "The biggest boss..."
  B.title = w(0, 'biggest');
  B.history = w(0, 'history');
  // --- B: "CUBE CITY... IS MINE!"
  C.b1 = n[1].a - 0.15;
  B.cube = w(1, 'CUBE'); B.city = w(1, 'CITY');
  C.b2 = w(1, 'IS') - 0.1;
  B.mine = w(1, 'MINE');
  B.mineEnd = n[1].b;
  // --- C: the smashes
  C.c1 = n[2].a - 0.16;
  B.arena = w(2, 'arena');
  C.c2 = w(2, 'He', 1) - 0.12;
  B.tycoon = w(2, 'Tycoon');
  C.c3 = w(2, 'He', 2) - 0.12;
  B.factory = w(2, 'factory');
  // --- D: "MY COOKIES!" (the real Granny)
  C.d1 = n[3].a - 0.14;
  B.cookies = w(3, 'COOKIES');
  // --- E: DarkBlade's clan
  C.e1 = n[4].a - 0.14;
  B.attack = w(4, 'attack');
  B.flick = lerp(w1(4, 'attack'), w(4, 'Clan', 1), 0.45);
  C.e2 = B.flick - 0.35;
  C.e3 = w(4, 'CLAN', 2) - 0.16;
  B.clan2 = w(4, 'CLAN', 2);
  // --- F: Noodle calls for help
  C.f1 = n[5].a - 0.14;
  B.need = w(5, 'need');
  // --- G: the server health bar
  C.g1 = n[6].a - 0.1;
  C.g2 = w(6, 'Ninety') - 0.08; B.ninety = w(6, 'Ninety');
  C.g3 = w(6, 'Fifty') - 0.08; B.fifty = w(6, 'Fifty');
  C.g4 = w(6, 'Twenty') - 0.08; B.twenty = w(6, 'Twenty');
  // --- H: the bedroom
  C.h1 = Math.min(n[7].a - 0.06, w1(6, 'Twenty') + 0.05);
  C.h2 = w(7, 'I') - 0.08;
  C.h3 = n[8].a - 0.08;
  B.dont = w(8, "don't");
  // --- I: down the stairs, into the living room
  C.i1 = n[8].b + 0.02;
  B.mom = w(9, 'Mom'); B.grandma = w(9, 'Grandma');
  C.i2 = w(9, 'The') - 0.12;
  B.needs = w(9, 'needs');
  // --- J: "It's eleven p.m., young man. Bedtime."
  C.j1 = n[10].a - 0.08;
  B.eleven = w(10, 'eleven');
  C.j2 = w(10, 'young') - 0.12;
  C.j3 = w(10, 'Bedtime') - 0.1;
  B.bedtime = w(10, 'Bedtime');
  // --- K: the silent beat: tea down, headset on, "...Five minutes. Let's go."
  C.k1 = n[10].b + 0.04;
  B.clink = C.k1 + 0.42;
  C.k2 = Math.min(C.k1 + 0.78, n[11].a - 0.2);
  B.five = w(11, 'Five');
  C.k3 = w(11, "Let's") - 0.08;
  B.go = w(11, 'go');
  // --- L: Granny cracks her knuckles
  C.l1 = n[12].a - 0.14;
  B.crack1 = w(12, 'coming'); B.crack2 = w(12, 'dear');
  // --- M: the whole family logs in
  C.m1 = n[13].a - 0.08;
  C.m2 = w(13, 'your') - 0.08;
  B.pan = [w(13, 'your'), w(13, 'whole'), w(13, 'family'), w(13, 'logged')];
  B.logged = w(13, 'logged');
  C.m3 = w(13, 'Together') - 0.1;
  B.together = w(13, 'Together');
  B.dive = END - 0.75;                            // push into the monitor -> white -> SC 10
  return { START, END, C, B, n };
}

function times10(V) {
  const L = V.L;
  const n = Array.from({ length: 14 }, (_, i) => L('10.' + i));
  const w = (i, word, k = 0) => n[i].word(word, k).t0;
  const w1 = (i, word, k = 0) => n[i].word(word, k).t1;
  const START = V.TL.scenes['SC 10'].start, END = V.TL.scenes['SC 11'].start;
  const C = {}, B = {};
  // --- A: spawn + "Party formed." + the slow-motion formation walk
  C.a1 = START;
  B.pops = [0.06, 0.3, 0.54, 0.78].map((d) => START + d);
  B.formed = n[0].a;
  C.a2 = w(0, 'Party', 1) - 0.12;
  B.name = w(0, 'name');
  B.family = w(0, 'Family');
  // --- B: the hero's commands
  C.b1 = n[1].a - 0.12;
  B.tank = w(1, 'tank');
  C.b2 = w(1, 'Granny') - 0.12;
  B.gear = w(1, 'gear');
  // --- C: "Swords for everyone! Put it on my tab!"
  C.c1 = n[2].a - 0.1;
  B.swords = w(2, 'Swords');
  C.c2 = w(2, 'Put') - 0.1;
  B.tab = w(2, 'tab');
  // --- D: "Kids! Formation! And wear your helmets!"
  C.d1 = n[3].a - 0.12;
  B.kids = w(3, 'Kids'); B.formation = w(3, 'Formation');
  C.d2 = w(3, 'And') - 0.12;
  B.helmets = w(3, 'helmets');
  // --- E: the fist on the pot lid
  C.e1 = n[4].a - 0.12;
  B.block = w(4, 'you');
  C.e2 = w(4, 'Everybody') - 0.14;
  // --- F: "Mom blocked the punches. You led the attack. Even DarkBlade joined your team." + 2 s
  C.f1 = n[5].a - 0.1;
  B.blocked = w(5, 'blocked'); B.punches = w(5, 'punches');
  C.f2 = w(5, 'You') - 0.12;
  B.attackSlash = w(5, 'attack');
  C.f3 = w(5, 'Even') - 0.12;
  B.dbLand = w(5, 'DarkBlade') + 0.1;
  B.joined = w(5, 'joined');
  C.f4 = n[5].b + 0.15;
  // --- G: "Just this once."
  C.g1 = n[6].a - 0.15;
  B.bump = n[6].b + 0.08;
  // --- H: potions
  C.h1 = n[7].a - 0.12;
  B.potions = w(7, 'potions'); B.hundred = w(7, 'hundred');
  C.h2 = w(7, 'Family') - 0.12;
  B.discount = w(7, 'discount');
  // --- I: the attack orders
  C.i1 = n[8].a - 0.11;
  B.left = w(8, 'left');
  C.i2 = w(8, 'DarkBlade') - 0.11;
  B.right = w(8, 'right');
  C.i3 = w(8, 'Everybody') - 0.12;
  B.attack = w(8, 'ATTACK');
  C.j1 = n[8].b + 0.25;
  B.dome = C.j1 + 0.35;                            // the dome rises as the charge lands
  B.hits = [0.75, 1.0, 1.25, 1.55, 1.8, 2.1].map((d) => C.j1 + d).filter((x) => x < n[9].a - 0.2);
  // --- K: "FOOLS! My shield cannot break!"
  C.k1 = n[9].a - 0.12;
  C.k2 = w(9, 'My') - 0.12;
  B.shield = w(9, 'shield'); B.cannot = w(9, 'cannot'); B.break = w(9, 'break');
  // --- L: Noodle: the crystal
  C.l1 = n[10].a - 0.12;
  C.l2 = w(10, 'On') - 0.1;
  B.tower = w(10, 'tower');
  C.l3 = w(10, 'Someone') - 0.12;
  B.jump = w(10, 'jump');
  // --- M: "I can't! If I leave, the whole team falls apart!"
  C.m1 = n[11].a - 0.12;
  C.m2 = w(11, 'the') - 0.12;
  B.falls = w(11, 'falls');
  // --- N: "Everybody was fighting. Everybody... except one."
  C.n1 = n[12].a - 0.1;
  C.n2 = w(12, 'Everybody', 1) - 0.12;
  B.except = w(12, 'except'); B.one = w(12, 'one');
  // --- O: "Son. I've been practicing."
  C.o1 = n[13].a - 0.12;
  C.o2 = w(13, "I've") - 0.12;
  B.practicing = w(13, 'practicing');
  C.o3 = n[13].b + 0.35;
  return { START, END, C, B, n };
}

// ================================================================ cameras
const camAt = (x, y, z = 1, rot = 0) => ({ ...GS.camAt(x, y, z), rot });
function camLerp(a, b, u, e = ease.inOut) {
  const k = e(clamp(u, 0, 1));
  return { x: lerp(a.x || 0, b.x || 0, k), y: lerp(a.y || 0, b.y || 0, k), zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, k), rot: lerp(a.rot || 0, b.rot || 0, k) };
}
// add screen shakes: hits = [[t0, dur, amp], ...]
function shook(cam, t, hits) {
  let sx = cam.sx || 0, sy = cam.sy || 0;
  for (const [t0, dur, amp] of hits) { const s = K.shake(t, t0, dur, amp); sx += s.sx; sy += s.sy; }
  return { ...cam, sx, sy };
}
// a punch-in on top of a cam: zoom += amt over [t0, t0 + dur] (ease out, then hold)
const punch = (cam, t, t0, amt, dur = 0.12) => ({ ...cam, zoom: (cam.zoom ?? 1) * (1 + amt * ease.out(seg(t, t0, t0 + dur))) });
// rotate a finished frame (dutch angle) about the centre; scaled a touch so the corners stay covered
function rotFrame(svg, rot) {
  if (!rot) return svg;
  const sc = 1 + Math.abs(Math.sin((rot * Math.PI) / 180)) * 0.62;
  return S.g(svg, `translate(960 540) rotate(${f(rot)}) scale(${f(sc)}) translate(-960 -540)`);
}
// world point -> screen for a k 1 plane
const scr = (cam, x, y, k = 1) => GS.toScreen(cam, { x, y, k });

// ================================================================ transitions / screen FX
const flash = (k, col = '#FFFFFF') => (k > 0.001 ? S.rect(-40, -40, W + 80, H + 80, 0, { fill: col, opacity: f(clamp(k, 0, 1)) }) : '');
function flashAt(t, t0, dur = 0.12, op = 0.85, col = '#FFFFFF') {
  if (t < t0 || t > t0 + dur) return '';
  return flash(op * (1 - (t - t0) / dur), col);
}
// whip-pan cut: streaks racing across + a white flash at the start of the new shot
function whip(t, t0, dir = 1, dur = 0.14, col = '#FFFFFF') {
  if (t < t0 || t > t0 + dur) return '';
  const k = 1 - (t - t0) / dur;
  let d = '';
  for (let i = 0; i < 14; i++) {
    const y = hash(i * 3.7) * H, h = 6 + 26 * hash(i * 1.3), len = 500 + 900 * hash(i * 5.1);
    const x = dir > 0 ? lerp(-len, W, 1 - k) + (hash(i) - 0.5) * 600 : lerp(W, -len, 1 - k) - (hash(i) - 0.5) * 600;
    d += `M${f(x)} ${f(y)} h${f(len)} v${f(h)} h${f(-len)} Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) }) + flash(0.7 * k * k, col);
}
// cinema bars for slow motion (k 0..1)
function letterbox(k, h = 92) {
  if (k <= 0.001) return '';
  const hh = h * ease.out(clamp(k, 0, 1));
  return S.rect(-20, -20, W + 40, hh + 20, 0, { fill: '#05030A' }) + S.rect(-20, H - hh, W + 40, hh + 20, 0, { fill: '#05030A' });
}
// coloured wash over the frame
const wash = (col, op) => (op > 0.001 ? S.rect(-40, -40, W + 80, H + 80, 0, { fill: col, opacity: f(clamp(op, 0, 1)) }) : '');
// radial speed lines toward (cx, cy) (screen space), k = strength
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 26, r0 = 380) {
  if (k <= 0.01) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2 + Math.floor(t * 20) * 0.37;
    const r1 = r0 + 160 * hash(i * 7.7 + Math.floor(t * 20)), r2 = 1400, wd = 0.012 + 0.018 * hash(i * 1.9);
    d += `M${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)} L${f(cx + Math.cos(a - wd) * r2)} ${f(cy + Math.sin(a - wd) * r2)} L${f(cx + Math.cos(a + wd) * r2)} ${f(cy + Math.sin(a + wd) * r2)} Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.55 * clamp(k, 0, 1)) });
}
// horizontal speed streaks (screen) for running shots
function streaks(t, k, dir = 1, col = '#FFFFFF', n = 12, seed = 1) {
  if (k <= 0.01) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = 80 + hash(i * 3.3 + seed) * 860, len = 220 + 420 * hash(i * 1.7 + seed), h = 4 + 8 * hash(i * 9.1 + seed);
    const x = ((hash(i * 5.5 + seed) * 2600 - dir * t * 3200) % 2600 + 2600) % 2600 - 340;
    d += `M${f(x)} ${f(y)} h${f(len)} v${f(h)} h${f(-len)} Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.4 * k) });
}

// ================================================================ stone FX
// a stone cube (the Block King's) at (x, y), size w
const stoneCube = (x, y, w, rot = 0, lw = 5, seed = 1, crack = 0) => L6.bkCube(x, y, w, w * 0.92, rot, lw, { seed, crack });
// stone cubes bursting out of (x, y): ballistic, bounce once on floorY, fade by `life` (n <= 24)
function cubeDebris(x, y, age, o = {}) {
  const { n = 14, s = 1, seed = 3, power = 1, floorY = y, life = 1.6, up = 1, spread = 1, dir = 0 } = o;
  if (age < 0 || age > life) return '';
  let out = '';
  for (let i = 0; i < Math.min(24, n); i++) {
    const h1 = hash(i * 3.1 + seed), h2 = hash(i * 7.7 + seed), h3 = hash(i * 1.3 + seed);
    const vx = ((h1 - 0.5) * 1500 * spread + dir * 500) * power * s, vy = -(500 + 900 * h2) * power * up * s;
    const g = 2600 * s;
    let px = x + vx * age, py = y + vy * age + 0.5 * g * age * age;
    if (py > floorY && age > 0.05) { py = floorY - Math.abs(Math.sin(age * 9 + i)) * 20 * s * (1 - seg(age, 0.5, 1)); px = x + vx * Math.min(age, 0.6) * 0.9; }
    const sz = (26 + 46 * h3) * s, op = 1 - seg(age, life * 0.7, life);
    if (op <= 0) continue;
    out += S.g(stoneCube(0, 0, sz, age * (h1 - 0.5) * 900, Math.max(2.5, 5 * s), i + seed * 7), `translate(${f(px)} ${f(py)})`, op < 1 ? { opacity: f(op) } : {});
  }
  return out;
}
// an expanding ring on the ground (ry = flatten)
function shockRing(x, y, age, r = 500, o = {}) {
  const { dur = 0.6, col = '#FFFFFF', w = 18, flat = 0.28 } = o;
  if (age < 0 || age > dur) return '';
  const u = age / dur, rr = r * ease.out(u);
  return S.ellipse(x, y, rr, rr * flat, { fill: 'none', stroke: col, 'stroke-width': f(w * (1 - u) + 2), opacity: f(0.9 * (1 - u)) });
}
// round dust puffs (cheap circles) rising from the ground
function dustPuff(x, y, age, o = {}) {
  const { r = 120, n = 9, dur = 1.1, col = '#C9B8D8', seed = 2, spread = 1 } = o;
  if (age < 0 || age > dur) return '';
  const u = age / dur;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1) - 0.5) * Math.PI * 0.95, h = hash(i * 2.7 + seed);
    const px = x + Math.sin(a) * r * 2.4 * ease.out(u) * spread, py = y - Math.abs(Math.cos(a)) * r * 0.7 * ease.out(u) - 30 * u;
    const rr = r * (0.35 + 0.35 * h) * (0.6 + 0.8 * ease.out(u)) * (1 - 0.4 * u);
    d += `M${f(px - rr)} ${f(py)}a${f(rr)} ${f(rr)} 0 1 0 ${f(2 * rr)} 0a${f(rr)} ${f(rr)} 0 1 0 ${f(-2 * rr)} 0Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * (1 - u)) });
}
// the Block King's giant fist alone (+ forearm cubes going up/out at `armRot`), fist centre (x, y), scale s (≈ boss scale)
function giantFist(x, y, s = 1, o = {}) {
  const { rot = 0, armRot = 0, len = 3, lw = 10, crack = 0, side = 1 } = o;
  let arm = '';
  for (let i = len; i >= 1; i--) arm += stoneCube(0, -150 - (i - 1) * 132, 150, (i % 2 ? 2 : -2), lw, 20 + i, crack);
  let fist = L6.bkCube(0, 0, 236 * 1.2, 214 * 1.2, 0, lw, { seed: 7, crack });
  const fk = 1.2;
  fist += S.path(`M${f(-60 * fk)} ${f(40 * fk)} L${f(-60 * fk)} ${f(104 * fk)} M0 ${f(40 * fk)} L0 ${f(104 * fk)} M${f(60 * fk)} ${f(40 * fk)} L${f(60 * fk)} ${f(104 * fk)}`, ln(lw * 0.9, '#3A3C46'));
  fist += L6.bkCube(-side * 122 * fk, -10 * fk, 70 * fk, 120 * fk, 0, lw, { seed: 11 });
  return S.g(S.g(arm, `rotate(${f(armRot)})`) + fist, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// impact star (white core + spikes) for big hits
function impactStar(x, y, age, r = 260, col = '#FFFFFF', col2 = '#FFE14D') {
  if (age < 0 || age > 0.35) return '';
  const u = age / 0.35, rr = r * (0.5 + 0.7 * ease.out(u));
  let d = '';
  const nn = 12;
  for (let i = 0; i < nn; i++) {
    const a0 = (i / nn) * Math.PI * 2 + hash(i) * 0.2, ri = i % 2 ? rr * 0.42 : rr;
    const a1 = a0 + Math.PI / nn;
    d += (i ? 'L' : 'M') + f(x + Math.cos(a0) * ri) + ' ' + f(y + Math.sin(a0) * ri) + 'L' + f(x + Math.cos(a1) * rr * 0.3) + ' ' + f(y + Math.sin(a1) * rr * 0.3);
  }
  return S.path(d + 'Z', { fill: col2, stroke: LINE, 'stroke-width': 6, opacity: f(1 - u * 0.8) }) + S.circle(x, y, rr * 0.32, { fill: col, opacity: f(1 - u) });
}

// ================================================================ cookies
// cookies + crumbs flying out of (x, y)
function cookieBurst(x, y, age, o = {}) {
  const { n = 10, s = 1, seed = 4, floorY = y + 200, life = 2.2, power = 1 } = o;
  if (age < 0 || age > life) return '';
  let out = '';
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 2.3 + seed), h2 = hash(i * 5.9 + seed), h3 = hash(i * 8.1 + seed);
    const vx = (h1 - 0.5) * 1700 * s * power, vy = -(700 + 900 * h2) * s * power, g = 2400 * s;
    let px = x + vx * age, py = y + vy * age + 0.5 * g * age * age;
    if (py > floorY) { py = floorY; px = x + vx * Math.min(age, (-vy + Math.sqrt(vy * vy + 2 * g * (floorY - y))) / g); }
    out += X.cookie({ x: px, y: py, s: s * (0.6 + 0.6 * h3), rot: age * (h1 - 0.5) * 700, bite: i % 3 === 0 ? 0.6 : 0 });
  }
  return out;
}

// ================================================================ UI bits in screen space
// chat bubble at a WORLD point (tail tip) seen through cam; size in screen px
function bubbleAt(cam, wx, wy, o = {}) {
  const p = scr(cam, wx, wy);
  return G.chatBubble({ ...o, x: p.x + (o.dx || 0), y: p.y + (o.dy || 0) });
}
// a big arrow + word ("LEFT SIDE" / "RIGHT SIDE"), dir -1 / 1
function arrowSign(x, y, dir, k, text, col = '#17C3B2', t = 0) {
  if (k <= 0.001) return '';
  const kk = ease.outBack(clamp(k, 0, 1));
  const wob = 10 * Math.sin(t * 9);
  const tw = G.textW(text, 64, 'L');
  const L_ = tw / 2 + 60;
  let c = S.path(`M${f(-dir * L_)} -46 L${f(dir * (L_ - 40))} -46 L${f(dir * (L_ - 40))} -96 L${f(dir * (L_ + 70))} 0 L${f(dir * (L_ - 40))} 96 L${f(dir * (L_ - 40))} 46 L${f(-dir * L_)} 46 Z`, ol(col, 9));
  c += T(text, 0, 22, 64, '#FFFFFF', { stroke: LINE, 'stroke-width': 10, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
  return S.g(c, `translate(${f(x + dir * wob)} ${f(y)}) scale(${f(kk)})`);
}
// panel with an inner picture: rounded clip + white border (split screens); inner is a full 1920x1080 frame scaled to w x h
function panel(x, y, w, h, inner, o = {}) {
  const { k = 1, border = 10, col = '#FFFFFF', rot = 0, sc = null } = o;
  if (k <= 0.001) return '';
  const id = S.uid('s09p');
  const s = sc ?? Math.max(w / W, h / H);
  const ox = (w - W * s) / 2 + (o.ox || 0), oy = (h - H * s) / 2 + (o.oy || 0);
  const kk = ease.outBack(clamp(k, 0, 1));
  const body = S.clipDef(id, S.rect(0, 0, w, h, 22)) + S.g(S.g(inner, `translate(${f(ox)} ${f(oy)}) scale(${f(s)})`), null, { 'clip-path': `url(#${id})` }) +
    S.rect(0, 0, w, h, 22, { fill: 'none', stroke: col, 'stroke-width': border }) + S.rect(-border / 2 - 3, -border / 2 - 3, w + border + 6, h + border + 6, 26, { fill: 'none', stroke: LINE, 'stroke-width': 6 });
  return S.g(body, `translate(${f(x + w / 2)} ${f(y + h / 2)}) rotate(${f(rot)}) scale(${f(kk)}) translate(${f(-w / 2)} ${f(-h / 2)})`);
}
// thought bubble (cloud) at (x, y) with inner svg drawn around (0, 0); k pops it, tail toward (tx, ty)
function thoughtBubble(x, y, rx, ry, inner, k, tx, ty) {
  if (k <= 0.001) return '';
  const kk = ease.outBack(clamp(k, 0, 1));
  let d = '';
  const nn = 12;
  for (let i = 0; i < nn; i++) {
    const a = (i / nn) * Math.PI * 2, r = 0.26 * (rx + ry) * (0.85 + 0.3 * hash(i * 3.3));
    const cx = Math.cos(a) * rx * 0.86, cy = Math.sin(a) * ry * 0.86;
    d += `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  }
  d += `M${f(-rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
  const id = S.uid('s09t');
  let c = S.path(d, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 8 });
  c += S.path(d, { fill: '#FFFFFF' });
  c += S.clipDef(id, S.ellipse(0, 0, rx * 0.92, ry * 0.9)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
  let dots = '';
  if (tx !== undefined) for (let i = 1; i <= 3; i++) { const u = i / 4, px = lerp(x, tx, 0.55 + u * 0.4), py = lerp(y + ry, ty, u); dots += S.circle(px, py, 26 - i * 6, ol('#FFFFFF', 6)); }
  return dots + S.g(c, `translate(${f(x)} ${f(y)}) scale(${f(kk)})`);
}
// Granny's receipt: a paper strip unrolling down from (x, y) to length len*k (top-centre anchor)
function receipt(x, y, k, o = {}) {
  const { w = 300, len = 760, rot = 6, t = 0, lines = [] } = o;
  if (k <= 0.001) return '';
  const hh = len * ease.out(clamp(k, 0, 1));
  const id = S.uid('s09r');
  let c = '';
  let zig = `M0 0 L${w} 0 L${w} ${f(hh)}`;
  for (let i = 0; i <= 10; i++) zig += ` L${f(w - (i * w) / 10)} ${f(hh + (i % 2 ? 14 : 0))}`;
  zig += ' Z';
  c += S.path(zig, { fill: '#FFFDF4', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  let tx = '';
  tx += T("GRANNY'S GOODIES", w / 2, 50, 30, '#B57BFF');
  tx += S.path(`M20 70 H${w - 20}`, { ...ln(3, '#8A8A9A'), 'stroke-dasharray': '8 8' });
  lines.forEach((l, i) => { const yy = 110 + i * 46; tx += TF(l[0], 22, yy, 24, '#3A3A4A', { 'text-anchor': 'start' }) + TF(l[1], w - 22, yy, 24, '#3A3A4A', { 'text-anchor': 'end' }); });
  c += S.clipDef(id, S.rect(0, 0, w, hh)) + S.g(tx, null, { 'clip-path': `url(#${id})` });
  // the roll at the bottom edge
  c += S.rect(-14, hh - 18, w + 28, 36, 18, ol('#F2ECDC', 6));
  return S.g(c, `translate(${f(x)} ${f(y)}) rotate(${f(rot + 2 * Math.sin(t * 3))}) translate(${f(-w / 2)} 0)`);
}
// a little gold helmet that drops onto a head at (x, y) (head top), k 0..1 drop + bounce, s scale (≈ 1 for a noob at s .3)
function helmet(x, y, s, k, col = '#FFC93C') {
  if (k <= 0.001) return '';
  const drop = k < 0.5 ? -180 * (1 - ease.in(k / 0.5)) : 0;
  const sq = k >= 0.5 ? bump(k, 0.5, 0.8) : 0;
  let c = S.path('M-78 10 C-78 -70 78 -70 78 10 Z', ol(col, 6));
  c += S.rect(-90, 0, 180, 26, 10, ol('#E09A00', 6)) + S.path('M-40 -40 C-20 -58 20 -58 40 -40', ln(8, '#FFF2B0')) + S.rect(-8, -78, 16, 26, 6, ol('#FF5FA8', 5));
  return S.g(c, `translate(${f(x)} ${f(y + drop * s)}) scale(${f(s * (1 + 0.15 * sq))} ${f(s * (1 - 0.12 * sq))})`);
}
// soft moonlight cone (screen or world) from (x0, y0) widening down to (x1, y1)
function moonBeam(x0, y0, x1, y1, w0, w1, op = 0.18, col = '#DDE6FF') {
  return S.path(`M${f(x0 - w0)} ${f(y0)} L${f(x0 + w0)} ${f(y0)} L${f(x1 + w1)} ${f(y1)} L${f(x1 - w1)} ${f(y1)} Z`, { fill: col, opacity: f(op) }) + S.ellipse(x1, y1, w1 * 1.05, w1 * 0.22, { fill: col, opacity: f(op * 1.4) });
}
// floating embers (screen space), purple/orange
function embers(t, k = 1, n = 22, seed = 1, cols = ['#FF9A3C', '#FF5A5A', '#C77DFF']) {
  if (k <= 0.01) return '';
  let out = '';
  for (let i = 0; i < n; i++) {
    const h1 = hash(i * 3.3 + seed), h2 = hash(i * 7.9 + seed), sp = 60 + 120 * h2;
    const y = H + 40 - (((t * sp + h1 * 1200) % 1200)), x = h1 * W + 40 * Math.sin(t * 1.3 + i);
    out += S.rect(x - 5, y - 5, 10 + 6 * h2, 10 + 6 * h2, 2, { fill: cols[i % cols.length], opacity: f(0.7 * k), transform: `rotate(${f(t * 90 + i * 40)} ${f(x)} ${f(y)})` });
  }
  return out;
}
// a big lens-flare/glint star (screen)
function glint(x, y, k, r = 120, rot = 0) {
  if (k <= 0.001 || k >= 1) return '';
  const rr = r * Math.sin(Math.PI * k);
  const d = (rad, a) => `M${f(x)} ${f(y - rad)} L${f(x + rad * 0.13)} ${f(y - rad * 0.13)} L${f(x + rad)} ${f(y)} L${f(x + rad * 0.13)} ${f(y + rad * 0.13)} L${f(x)} ${f(y + rad)} L${f(x - rad * 0.13)} ${f(y + rad * 0.13)} L${f(x - rad)} ${f(y)} L${f(x - rad * 0.13)} ${f(y - rad * 0.13)} Z`;
  return S.g(S.path(d(rr), { fill: '#FFFFFF' }) + S.circle(x, y, rr * 0.2, { fill: '#FFFFFF' }), `rotate(${f(rot + 45 * k)} ${f(x)} ${f(y)})`);
}

module.exports = {
  LINE, W, H, times09, times10, camAt, camLerp, shook, punch, rotFrame, scr, flash, flashAt, whip, letterbox, wash, zoomLines, streaks,
  stoneCube, cubeDebris, shockRing, dustPuff, giantFist, impactStar, cookieBurst, bubbleAt, arrowSign, panel, thoughtBubble, receipt,
  helmet, moonBeam, embers, glint,
};
