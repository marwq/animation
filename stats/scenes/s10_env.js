// SC 10 helpers: the cut list + beats from the voice (shared with audio/cues/gen_sc10.js), camera helpers, transitions
// (whip, flash, eyelids), light FX (sun rays, lens flare, motes, colour bloom ring), memory bubbles, speed / focus lines,
// dust puffs, Mom's hands for the group hug, the wobbly-dino climb cycle. No HUD anywhere in this scene.
'use strict';

const K = require('./kit');
const FS = require('./sets_fair');
const { S, f, clamp, lerp, ease, seg, bump, hash, ln } = K;

// ================================================================ times (from the voice only)
function times(V) {
  const { L } = V;
  const l = (i) => L('10.' + i);
  const START = V.scene('SC 10').start, END = V.scene('SC 11').start;
  const C = {}, B = {};
  // -- "No numbers. Just colors. And sounds. And faces."
  C.wake = START;
  B.open = l(0).word('numbers').t0 + 0.05;               // the hero opens his eyes
  C.pov = l(0).word('Just').t0 - 0.3;                     // POV: eyelids open on the grey fair
  B.colors = l(0).word('colors').t0 - 0.05;               // colour floods back (quiet 1 -> 0, dusk -> golden)
  C.sounds = l(0).word('And').t0 - 0.12;
  B.pop = l(0).word('sounds').t0 + 0.08;                  // a balloon pops at the booth
  C.faces = l(0).word('And', 1).t0 - 0.12;
  C.heroFace = l(0).b + 0.35;                             // the hero seeing faces for the first time
  // -- "And you didn't need stats to know your brother."
  C.stand = l(1).a - 0.12;
  B.up = l(1).word('need').t0;                            // he stands up from the bench
  B.fist = l(1).word('brother').t0;
  // -- YOU: "Max loves dinosaurs. He says 'rawr' at everything. And he always wants to be up high."
  C.think = l(2).a - 0.25;
  B.memA = l(2).word('dinosaurs').t0 - 0.1;
  C.rawrs = l(2).word('He').t0 - 0.12;
  B.rawr1 = l(2).word('rawr').t0;
  B.rawr2 = l(2).word('at').t0 - 0.05;
  B.rawr3 = l(2).word('everything').t0 + 0.12;
  C.high = l(2).word('And').t0 - 0.12;
  B.memC = l(2).word('always').t0 - 0.05;
  B.eureka = l(2).word('high').t0;                        // eyes snap up, the bubbles burst
  // -- BENJI: "I heard! I know the fair map! I've been here eleven times!"
  C.benji = l(2).word('high').t0 + 0.24;
  B.skid = C.benji + 0.42;
  B.mapOut = l(3).word('know').t0;
  C.mapIns = l(3).word('fair').t0 - 0.15;
  C.eleven = l(3).word("I've").t0 - 0.12;
  B.trip = l(3).word('times').t0 - 0.25;
  // -- TANK: "I'm tall. Get on."
  C.tank = l(4).a - 0.45;
  B.shadow = C.tank + 0.05;
  C.getOn = l(4).word('Get').t0 - 0.15;
  B.kneel = l(4).word('Get').t0 - 0.1;
  B.hop = l(4).b - 0.25;                                  // the hero hops onto his shoulders
  B.hopLand = B.hop + 0.38;
  C.rise = l(4).b + 0.12;                                 // low angle: Tank stands up, the hero rises over the crowd
  B.rise = C.rise + 0.1;
  B.point = C.rise + 0.75;
  // -- "You ran past the Ferris wheel. Past the cotton candy. Past the giant teacups."
  C.run1 = l(5).a - 0.15;
  C.run2 = l(5).word('Past', 1).t0 - 0.12;
  C.run3 = l(5).word('Past', 2).t0 - 0.12;
  C.scan = l(5).b + 0.15;
  // -- "The kid with level four. The kid with three health. And you."  (the heroic trio, slow motion)
  C.trio = l(6).a - 0.25;
  B.four = l(6).word('level').t0;
  B.three = l(6).word('three').t0;
  B.you = l(6).word('And').t0;
  // -- BENJI: "Not the Ferris wheel. Max hates the Ferris wheel. It's too slow."
  C.notFerris = l(7).a - 0.15;
  C.hates = l(7).word('Max').t0 - 0.12;
  C.slow = l(7).word("It's").t0 - 0.12;
  // -- TANK: "Cotton candy? Every kid goes to cotton candy."
  C.candy = l(8).a - 0.25;
  C.kids = l(8).word('Every').t0 - 0.12;
  // -- YOU: "No. Max doesn't want sweets. Max wants to be a DINOSAUR. Up high."
  C.no = l(9).a - 0.15;
  C.sweets = l(9).word('Max').t0 - 0.12;
  C.dino = l(9).word('DINOSAUR').t0 - 0.08;
  C.upHigh = l(9).word('Up').t0 - 0.1;
  // -- YOU: "THERE! On top of the dinosaur!"
  C.there = l(10).a - 0.06;
  C.top = l(10).word('On').t0 - 0.1;
  // -- the dash, Tank's boost, the leap onto the wobbly dinosaur
  C.dash = l(10).b + 0.05;
  B.plant = C.dash + 0.5;                                 // Tank plants his feet under the dinosaur
  B.leap = C.dash + 0.72;                                 // the hero jumps off Tank's shoulders
  B.land = B.leap + 0.5;                                  // lands on the dino's back (BOING)
  // -- MAX: "RAWR!"  + the hero climbing up the neck into view
  C.rawr = l(11).a - 0.3;
  B.rawr = l(11).a;
  // -- YOU: "Found you, T-rex."   MAX: "I was the king of the dinosaurs! RAWR!"
  C.found = l(12).a - 0.1;
  B.hug = l(12).a + 0.05;
  C.king = l(13).a - 0.1;
  B.stand = l(13).word('king').t0 - 0.1;                  // Max stands up on the dino's head
  C.below = l(13).word('RAWR').t0 - 0.2;
  B.roar = l(13).word('RAWR').t0;
  // -- the beat: Tank + Benji high-five (Benji lifted into the air), the boys slide down the dinosaur
  C.high5 = l(13).b + 0.2;
  B.high5 = C.high5 + 0.32;
  C.slide = C.high5 + 0.92;                               // cut: the boys slide down the whole dinosaur
  B.slide = C.slide - 0.05;
  B.slideEnd = l(14).a - 0.62;
  // -- MOM: "Don't you EVER do that again!"
  C.mom = l(14).a - 0.45;
  B.grab = l(14).a - 0.1;
  B.ever = l(14).word('EVER').t0;
  // -- MAX: "...Can we do it again?"  -> reactions -> crane back -> SC 11
  C.again = l(15).a - 0.12;
  C.react = l(15).b + 0.12;
  B.laugh = C.react + 0.55;
  C.pull = C.react + 1.05;
  B.out = END - 0.45;
  return { START, END, C, B };
}

// ================================================================ camera
const camAt = FS.camAt;
const camLerp = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), zoom: lerp(a.zoom, b.zoom, u), ...(a.sx !== undefined || b.sx !== undefined ? { sx: lerp(a.sx || 0, b.sx || 0, u), sy: lerp(a.sy || 0, b.sy || 0, u) } : {}) });
const withShake = (cam, t, t0, dur = 0.35, amp = 12) => { const s = K.shake(t, t0, dur, amp); return s.sx || s.sy ? { ...cam, sx: (cam.sx || 0) + s.sx, sy: (cam.sy || 0) + s.sy } : cam; };
const toScr = (cam, x, y, k = 1) => { const p = FS.toScreen(cam, { x, y, k }); return [p.x, p.y]; };

// ================================================================ transitions
// whip-pan streaks + a soft flash right after a cut (dir ±1 = horizontal, 'up' | 'down' vertical)
function whip(t, tc, dir = 1, dur = 0.16) {
  const a = t - tc;
  if (a < 0 || a > dur) return '';
  const u = a / dur, k = 1 - u;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFF6E0', opacity: f(0.55 * k * k) });
  let d = '';
  const vert = dir === 'up' || dir === 'down';
  for (let i = 0; i < 16; i++) {
    const p = hash(i * 3.7 + tc) * (vert ? 1920 : 1080), len = 300 + 700 * hash(i * 5.1 + tc), w = 6 + 16 * hash(i * 1.3);
    const off = (hash(i * 7.9) * 2400 - 300) + (typeof dir === 'number' ? dir : dir === 'down' ? 1 : -1) * 900 * u;
    d += vert ? `M${f(p)} ${f(off)}h${f(w)}v${f(len)}h${f(-w)}Z` : `M${f(off)} ${f(p)}h${f(len)}v${f(w)}h${f(-len)}Z`;
  }
  o += S.path(d, { fill: '#FFFFFF', opacity: f(0.75 * k) });
  return o;
}
const flash = (t, tc, dur = 0.22, k0 = 0.85, col = '#FFFFFF') => { const a = t - tc; return a < 0 || a > dur ? '' : S.rect(0, 0, 1920, 1080, 0, { fill: col, opacity: f(k0 * (1 - a / dur) ** 2) }); };
// black eyelids (k 1 = closed, 0 = open), soft curved edges
function eyelids(k) {
  if (k <= 0.001) return '';
  const h = 560 * clamp(k, 0, 1), c = 120 * (1 - k);
  return S.path(`M-20 -20 H1940 V${f(h - c * 0.2)} Q960 ${f(h + c)} -20 ${f(h - c * 0.2)} Z`, { fill: '#0A0614' }) +
    S.path(`M-20 1100 H1940 V${f(1080 - h + c * 0.2)} Q960 ${f(1080 - h - c)} -20 ${f(1080 - h + c * 0.2)} Z`, { fill: '#0A0614' });
}
// letterbox bars (k 0..1)
const letterbox = (k, h = 92) => (k > 0.001 ? S.rect(-10, -10, 1940, 10 + h * k, 0, { fill: '#120A1E' }) + S.rect(-10, 1080 - h * k, 1940, h * k + 10, 0, { fill: '#120A1E' }) : '');

// ================================================================ light FX
// slowly turning sun rays from a point (screen space)
function sunRays(x, y, t, k = 1, r = 1500, n = 14, col = '#FFE7A8') {
  if (k <= 0.01) return '';
  return S.g(K.rays(0, 0, n, r, col, 0.13 * k, t * 4), `translate(${f(x)} ${f(y)})`);
}
// soft lens flare: translucent discs along the line from the light through the frame centre
function lensFlare(x, y, k = 1) {
  if (k <= 0.01) return '';
  const dx = 960 - x, dy = 540 - y;
  let o = FS.glow(x, y, 260, 'sfGlowGold', 0.9 * k);
  [[0.35, 26, '#FFF2C0', 0.32], [0.62, 44, '#FFC88A', 0.18], [0.9, 18, '#FFFFFF', 0.3], [1.25, 70, '#FFB0C8', 0.12], [1.55, 32, '#C8E8FF', 0.16]].forEach(([u, r, c, a]) => {
    o += S.circle(x + dx * u, y + dy * u, r, { fill: c, opacity: f(a * k) });
  });
  return o;
}
// golden dust motes drifting up through the light (screen space; cheap circles)
function motes(t, n = 26, seed = 1, k = 1, box = [0, 0, 1920, 1080]) {
  if (k <= 0.01) return '';
  const [x0, y0, w, h] = box;
  let d = '';
  for (let i = 0; i < n; i++) {
    const r = 3 + 6 * hash(i * 2.3 + seed);
    const x = x0 + ((hash(i * 7.1 + seed) * w + Math.sin(t * 0.7 + i) * 30) % w);
    const y = y0 + (((hash(i * 3.9 + seed) * h - t * (18 + 30 * hash(i))) % h) + h) % h;
    d += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0Z`;
  }
  return S.path(d, { fill: '#FFF1C4', opacity: f(0.55 * k) });
}
// the colour bloom: a warm ring of light expanding from a point (u 0..1)
function bloomRing(x, y, u) {
  if (u <= 0 || u >= 1) return '';
  const r = 60 + 1500 * ease.out(u), k = 1 - u;
  return S.circle(x, y, r, { fill: 'none', stroke: '#FFE9B0', 'stroke-width': f(140 * k + 10), opacity: f(0.35 * k) }) +
    S.circle(x, y, r * 0.92, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': f(30 * k + 4), opacity: f(0.4 * k) });
}
// radial focus lines for smash zooms (k 0..1)
function focusLines(cx, cy, k, t, n = 30, col = '#FFFFFF') {
  if (k <= 0.01) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.3 + Math.floor(t * 12)) * 0.12, w = 0.012 + 0.016 * hash(i * 5.5);
    const r0 = 380 + 260 * hash(i * 2.1 + Math.floor(t * 12)), r1 = 1400;
    d += `M${f(cx + Math.cos(a - w) * r1)} ${f(cy + Math.sin(a - w) * r1)}L${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)}L${f(cx + Math.cos(a + w) * r1)} ${f(cy + Math.sin(a + w) * r1)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.6 * k) });
}
// horizontal speed streaks (screen space) for the run
function speedStreaks(t, k = 1, seed = 1, dir = -1, y0 = 120, y1 = 900, n = 14, col = '#FFF6DE') {
  if (k <= 0.01) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + hash(i * 2.7 + seed) * (y1 - y0), len = 160 + 340 * hash(i * 4.1 + seed), w = 4 + 6 * hash(i * 1.9 + seed);
    const span = 1920 + len + 400;
    const x = ((hash(i * 6.3 + seed) * span + dir * t * (1600 + 900 * hash(i))) % span + span) % span - len - 200;
    d += `M${f(x)} ${f(y)}h${f(len)}v${f(w)}h${f(-len)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.55 * k) });
}
// little dust clouds from a foot (age seconds), world or screen space
function dustPuff(x, y, age, s = 1, dir = -1) {
  if (age < 0 || age > 0.5) return '';
  const u = age / 0.5;
  let o = '';
  for (let i = 0; i < 3; i++) {
    const r = (20 + 26 * u) * s * (1 - i * 0.2);
    o += S.ellipse(x + dir * (20 + 90 * u + i * 34) * s, y - (8 + 22 * u * (i + 1) * 0.5) * s, r * 1.3, r * 0.85, { fill: '#FBE7C4', stroke: '#151515', 'stroke-width': f(4 * s), opacity: f(0.85 * (1 - u)) });
  }
  return o;
}

// ================================================================ memory bubbles (the hero remembers who Max IS)
// a cloud-edged bubble at (x, y), w × h; k = pop 0..1 (overshoot), out = 0..1 burst away; inner(w, h) drawn in local space
// (-w/2..w/2, -h/2..h/2), clipped to the inside; tail = [tx, ty] (screen point the thought dots lead to)
function memBubble(x, y, w, h, k, inner, o = {}) {
  const sc = ease.outBack(clamp(k, 0, 1)) * (1 + 0.25 * ease.out(clamp(o.out || 0, 0, 1)));
  const alpha = 1 - clamp(o.out || 0, 0, 1);
  if (sc < 0.02 || alpha < 0.02) return '';
  const id = S.uid('s10mb');
  const hw = w / 2, hh = h / 2, r = Math.min(hw, hh) * 0.26;
  // scallops around the rounded rect
  const scal = [];
  const nx = Math.max(3, Math.round(w / 110)), ny = Math.max(2, Math.round(h / 110));
  for (let i = 0; i <= nx; i++) { const u = i / nx; scal.push([-hw + w * u, -hh, r * (0.9 + 0.25 * hash(i + 1.3))], [-hw + w * u, hh, r * (0.9 + 0.25 * hash(i + 5.1))]); }
  for (let j = 1; j < ny; j++) { const u = j / ny; scal.push([-hw, -hh + h * u, r * (0.9 + 0.2 * hash(j + 2.2))], [hw, -hh + h * u, r * (0.9 + 0.2 * hash(j + 7.7))]); }
  const circ = (cx, cy, rr) => `M${f(cx - rr)} ${f(cy)}a${f(rr)} ${f(rr)} 0 1 1 ${f(2 * rr)} 0a${f(rr)} ${f(rr)} 0 1 1 ${f(-2 * rr)} 0Z`;
  const sd = scal.map(([a, b, rr]) => circ(a, b, rr)).join('');
  const body = `M${f(-hw)} ${f(-hh)}H${f(hw)}V${f(hh)}H${f(-hw)}Z`;
  let g = S.path(sd + body, { fill: '#000', opacity: 0.18, transform: 'translate(12 16)' });
  g += S.path(sd, { fill: '#FFF7E6', stroke: '#151515', 'stroke-width': 12, 'stroke-linejoin': 'round' }) + S.path(sd + body, { fill: '#FFF7E6' });
  const pad = r * 0.15;
  g += S.clipDef(id, S.rect(-hw + pad, -hh + pad, w - 2 * pad, h - 2 * pad, r * 0.9));
  g += S.g(inner(w, h), null, { 'clip-path': `url(#${id})` });
  // warm memory wash + inner rim
  g += S.rect(-hw + pad, -hh + pad, w - 2 * pad, h - 2 * pad, r * 0.9, { fill: '#FFD9A0', opacity: 0.14 });
  g += S.rect(-hw + pad, -hh + pad, w - 2 * pad, h - 2 * pad, r * 0.9, { fill: 'none', stroke: '#E8C48A', 'stroke-width': 8 });
  let dots = '';
  if (o.tail && k > 0.3) {
    const [tx, ty] = o.tail;
    for (let i = 0; i < 3; i++) {
      const u = 0.3 + i * 0.22, px = lerp(x, tx, u + 0.15), py = lerp(y + hh * 0.6, ty, u + 0.15), rr = (26 - i * 7) * clamp((k - 0.3 - i * 0.1) * 4, 0, 1);
      if (rr > 1) dots += S.circle(px, py, rr, { fill: '#FFF7E6', stroke: '#151515', 'stroke-width': 7 });
    }
  }
  return S.g(dots, null, { opacity: f(alpha) }) + S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(o.rot || 0)}) scale(${f(sc)})`, { opacity: f(alpha) });
}
// a flat pastel "room" backdrop for memories: wall + floor (local box)
function memRoom(w, h, wall = '#BFE3F2', floor = '#F2C98A', fy = 0.3, deco = 'stars') {
  let o = S.rect(-w, -h, 2 * w, 2 * h, 0, { fill: wall }) + S.rect(-w, h * fy, 2 * w, h, 0, { fill: floor }) + S.path(`M${-w} ${f(h * fy)}H${w}`, ln(6, '#151515', 0.6));
  if (deco === 'stars') for (let i = 0; i < 9; i++) o += S.path(require('../rig/face').starPath(-w * 0.45 + (i % 5) * w * 0.22 + (i > 4 ? w * 0.11 : 0), -h * 0.35 + (i > 4 ? h * 0.25 : 0), 18, 8), { fill: '#FFFFFF', opacity: 0.55 });
  if (deco === 'tiles') for (let i = 0; i < 6; i++) o += S.rect(-w * 0.5 + i * w * 0.2, -h * 0.4, w * 0.18, h * 0.18, 8, { fill: '#FFFFFF', opacity: 0.35 });
  return o;
}

// ================================================================ hug helpers
// a hand (mitten) in screen/world space: skin + outline, rotated
function hand(x, y, s, rot, skin = '#F6D2B8') {
  return S.g(S.path('M-34 -46 Q-38 -60 -20 -62 L22 -62 Q40 -60 36 -40 L34 30 Q30 52 0 52 Q-30 52 -34 30 Z', { fill: skin, stroke: '#151515', 'stroke-width': 7, 'stroke-linejoin': 'round' }) +
    S.path('M-14 -10 L-14 26 M6 -10 L6 28', { fill: 'none', stroke: '#C99478', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.6 }), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// tears flying off a crying face (screen/world), k = time
function tearDrops(x, y, s, t, n = 4) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const ph = (t * 1.6 + i / n) % 1, side = i % 2 ? 1 : -1;
    const px = x + side * (70 + 160 * ph) * s, py = y - 40 * s + (-60 * ph + 260 * ph * ph) * s;
    o += S.path(`M${f(px)} ${f(py - 22 * s)} Q${f(px + 14 * s)} ${f(py)} ${f(px)} ${f(py + 10 * s)} Q${f(px - 14 * s)} ${f(py)} ${f(px)} ${f(py - 22 * s)}Z`, { fill: '#8FD8FF', stroke: '#151515', 'stroke-width': f(4 * s), opacity: f(1 - ph) });
  }
  return o;
}

// ================================================================ climbing cycle on the inflatable
// phase ph (radians): arms reach alternately, legs push; side view facing the climb direction
const climb = (ph, amp = 1) => ({
  armL: 120 + 50 * amp * Math.sin(ph), armR: 120 - 50 * amp * Math.sin(ph), legL: 40 + 30 * amp * Math.sin(ph), legR: 40 - 30 * amp * Math.sin(ph),
  kneeL: 50 + 30 * Math.max(0, Math.sin(ph)) * amp, kneeR: 50 + 30 * Math.max(0, -Math.sin(ph)) * amp, lean: 18,
});

module.exports = {
  times, camAt, camLerp, withShake, toScr, whip, flash, eyelids, letterbox, sunRays, lensFlare, motes, bloomRing, focusLines, speedStreaks,
  dustPuff, memBubble, memRoom, hand, tearDrops, climb,
};
