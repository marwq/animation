// Private helpers shared by SC 01, SC 09, SC 10 and SC 11 (the Core: the chase, the Lag, the broadcast, ten seconds).
//   - small camera / transition helpers, characters with head props (Juno's soot), run cycles, Pip's "Ding!"
//   - the Lag with lag effects (stuttered time, aura of loading wheels, pixel blocks, racks slurped like spaghetti)
//   - lowAngle(): a custom low-angle view up the server tower (the Core set itself is a flat side view)
//   - the broadcast: Juno's live feed for every screen, the grey pop-up → Juno flip, the world montage props
//     (Dad's fishing laptop, Mom's tablets, bus, grandma, space station, phones)
//   - the three SHARED SHOTS of the cold open and its repeat in SC 10 (shot for shot): shotMinute (the Lag:
//     "One... min... min... minute... left."), shotPress ("Pip! Press the button!"), shotDing ("Ding!").
'use strict';

const K = require('./kit');
const F = require('./farm');
const SETS = require('./sets');
const A = require('./acting');
const LG = require('../rig/lag');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor } = K;
const C = K.C;
const V = K.V;
const { L } = V;

const LINE = '#151515';
const CORE = F.CORE, FL = CORE.floor;
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const P = (d, a = {}) => S.path(d, a);
const CI = (x, y, r, a = {}) => S.circle(x, y, r, a);
const EL = (x, y, rx, ry, a = {}) => S.ellipse(x, y, rx, ry, a);
const G = (inner, tf, extra) => (inner ? S.g(inner, tf, extra) : '');
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const OUT = (w = 8) => ({ stroke: LINE, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { ...OUT(size * 0.14), ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { ...OUT(size * 0.14), ...extra });
const camAt = (wx, wy, zoom = 1, extra = {}) => ({ zoom, x: wx - 960, y: wy - 540, ...extra });
const pop = (k) => (k <= 0 ? 0 : ease.outBack(Math.min(1, k)));
const FULL = (fill, op) => R(-3000, -3000, 7920, 7080, 0, { fill, ...(op !== undefined ? { opacity: f(clamp(op, 0, 1)) } : {}) });
const SCREEN = (fill, op) => R(-20, -20, 1960, 1120, 0, { fill, ...(op !== undefined ? { opacity: f(clamp(op, 0, 1)) } : {}) });
const RED = '#FF2E4D', GREEN = '#46F58C', CYAN = '#5CE1FF';

function hex2(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, k) { const A1 = hex2(a), B1 = hex2(b), u = clamp(k, 0, 1); return '#' + A1.map((v, i) => Math.round(lerp(v, B1[i], u)).toString(16).padStart(2, '0')).join(''); }

// ---------------------------------------------------------------- camera / transitions
function shakeCam(cam, t, t0, dur = 0.4, amp = 14) {
  const sh = K.shake(t, t0, dur, amp);
  return { ...cam, sx: (cam.sx || 0) + sh.sx, sy: (cam.sy || 0) + sh.sy };
}
const shakes = (cam, t, list) => list.reduce((c, [t0, d, a]) => shakeCam(c, t, t0, d, a), cam);
// white flash right at tc (screen space)
const flashAt = (t, tc, k = 0.6, dur = 0.14) => (t >= tc && t < tc + dur ? C.whiteFlash(k * (1 - (t - tc) / dur)) : '');
// whip-pan: horizontal blur streaks + flash in the first frames after a cut
function whip(t, tc, dir = 1, dur = 0.12) {
  if (t < tc || t > tc + dur) return '';
  const u = (t - tc) / dur;
  let o = C.whiteFlash(0.4 * (1 - u));
  for (let i = 0; i < 14; i++) {
    const y = hash(i * 3.7 + tc) * 1080, len = 300 + hash(i * 1.3) * 700, x = (hash(i * 7.1) * 2400 - 200) - dir * u * 600;
    o += R(x, y, len, 8 + hash(i) * 14, 6, { fill: '#FFFFFF', opacity: f(0.5 * (1 - u)) });
  }
  return o;
}
// a held frame for the "lag": returns t snapped back to the last hold point during [a, a+hold)
function lagHold(t, holds, hold = 0.18) {
  for (const a of holds) if (t >= a && t < a + hold) return a;
  return t;
}

// ---------------------------------------------------------------- characters
const SPK = { juno: 'JUNO', dex: 'DEX', pip: 'PIP', grandpa: 'GRANDPA', dad: 'DAD', streamer: 'STREAMER' };
// actor() + svg glued to the head (follows auto-acting head bob / tilt)
function who(name, t, pose = {}, act = {}, head = '') {
  if (head) {
    const auto = SPK[name] ? V.perform(SPK[name], t, { seed: name.length * 3.7 + (act.seed || 0), ...act }) : {};
    const hy = pose.headY ?? auto.headY ?? 0, hr = pose.headRot ?? auto.headRot ?? 0;
    pose = { ...pose, props: [...(pose.props || []), { svg: G(head, `translate(0 ${f(hy)}) rotate(${f(hr)} 0 -560)`), layer: 'front' }] };
  }
  return actor(name, t, pose, act);
}
// soot smudge on Juno's cheek (front view, body units)
const SOOT = P('M-128 -664 Q-118 -690 -90 -686 Q-62 -680 -66 -656 Q-72 -632 -100 -636 Q-126 -640 -128 -664 Z', { fill: '#3A2C34', opacity: 0.62 }) +
  P('M-112 -668 Q-100 -678 -84 -672', ln(5, '#2A2026', 0.5)) + CI(-58, -626, 7, { fill: '#3A2C34', opacity: 0.4 });
const SOOT_SIDE = P('M20 -664 Q30 -690 58 -686 Q84 -680 80 -656 Q74 -632 46 -636 Q20 -640 20 -664 Z', { fill: '#3A2C34', opacity: 0.45 });
// side-view running (faces right by default)
function runSide(name, t, x, y, s, o = {}) {
  const ph = o.ph ?? (t * (o.rate || 14) + name.length * 1.3);
  const r = A.run(ph, o.amp ?? 1);
  const pose = { x, y, s, view: 'side', flip: o.flip ?? true, ...r, lean: o.lean ?? -8, ...(o.pose || {}) };
  if (name === 'grandpa') pose.keysSwing = 28 * Math.sin(ph * 2);
  return who(name, t, pose, { arms: false, ...(o.act || {}) }, o.head || '');
}
// front view "running at the camera"
const runFront = (ph, a = 1) => ({ armL: 30 + 55 * Math.max(0, Math.sin(ph)) * a, armR: 30 + 55 * Math.max(0, -Math.sin(ph)) * a, legL: 7 * Math.sin(ph), legR: -7 * Math.sin(ph), kneeL: 14 * Math.max(0, Math.sin(ph)), kneeR: 14 * Math.max(0, -Math.sin(ph)), bodyY: 14 * Math.abs(Math.sin(ph)) * a, lift: 22 * Math.abs(Math.cos(ph)) * a });
// side-view hand tip (body units) for an arm angle (+ = forward)
const sideHand = (a) => [4 - 250 * Math.sin((a * Math.PI) / 180), -505 + 250 * Math.cos((a * Math.PI) / 180)];
// Grandpa's mop held in a side-view arm: svg in body space following the arm angle a; grip = where along the handle
function mopInArm(a, rot = -70, len = 760, grip = 0.55) {
  const m = S.g(require('../rig/cast').mop({ x: 0, y: 0, len }), `rotate(${f(rot)}) translate(0 ${f(len * grip)})`);
  return G(m, `translate(4 -505) rotate(${f(a)}) translate(0 250)`);
}
const mopProp = (o = {}) => require('../rig/cast').mop(o);

// Pip's "Ding!": a little elevator bell + sparkles + rings. k = 0..1 since the ding
function ding(x, y, k, s = 1, txt = true) {
  if (k <= 0 || k >= 1) return '';
  const sc = s * pop(k * 3.5) * (1 - 0.25 * k);
  let o = '';
  for (let i = 0; i < 2; i++) { const u = clamp(k * 1.6 - i * 0.25, 0, 1); if (u > 0 && u < 1) o += CI(0, -40, 60 + u * 160, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 10 * (1 - u), opacity: f(1 - u) }); }
  const sw = Math.sin(k * 40) * 14 * (1 - k);
  o += G(P('M-46 0 Q-46 -70 0 -76 Q46 -70 46 0 Z', ol('#FFD21F', 7)) + R(-58, -4, 116, 18, 8, ol('#E8A50E', 6)) + CI(0, -84, 10, ol('#FFD21F', 5)) + P('M-26 -54 Q-18 -64 -6 -66', ln(6, '#FFF6C0')) + CI(0, 20, 9, ol('#C98A12', 4)), `rotate(${f(sw)} 0 -84)`);
  o += K.F.sparkle(-80, -90, 24 * (1 - k)) + K.F.sparkle(84, -40, 18 * (1 - k)) + K.F.sparkle(40, -130, 14 * (1 - k));
  if (txt) o += G(T('DING!', 0, -112, 64, '#FFE14D', OUT(10)), `rotate(-8 0 -112)`);
  return G(o, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`);
}

// ---------------------------------------------------------------- the Lag
// lag sprite with lip-sync and stuttered ("lagging") animation time
function lagSprite(t, o = {}) {
  const { x = 960, y = 540, size = 1, mood = 'hungry', glitch = 0.15, speak = true, look = [0, 0.2], fps = 10, blink = 0 } = o;
  const tt = fps ? K.stutterT(t, fps) : t;
  const mouth = o.mouth !== undefined ? o.mouth : speak ? V.viseme('LAG', t) : null;
  return LG.lag({ x, y, size, t: tt, mouth, mood, glitch, look, blink });
}
// drifting loading wheels + grey pixel blocks around a Lag at (x, y)
function lagAura(t, x, y, size, k = 1, seed = 0, n = 9) {
  if (k <= 0) return '';
  let o = '';
  const st = K.stutterT(t, 6);
  for (let i = 0; i < n; i++) {
    const a = hash(i * 3.1 + seed) * Math.PI * 2 + st * 0.25 * (i % 2 ? 1 : -1);
    const rr = size * (330 + hash(i * 5.3 + seed) * 150);
    const wx = x + Math.cos(a) * rr * 1.25, wy = y + Math.sin(a) * rr * 0.75;
    const r = size * (12 + hash(i * 2.2 + seed) * 18);
    o += CI(wx, wy, r * 1.5, { fill: '#2A2F3C', opacity: f(0.35 * k) }) + K.loadingWheel(wx, wy, r, st + i * 0.13, k < 1 ? mix('#2A2F3C', '#D6DBE4', k) : '#D6DBE4', 8, null, 1.3);
  }
  let blocks = '';
  const step = Math.floor(t * 7);
  for (let i = 0; i < 10; i++) {
    const bx = x + (hash(step * 1.3 + i * 7.7 + seed) - 0.5) * size * 900, by = y + (hash(step * 2.1 + i * 3.3 + seed) - 0.5) * size * 600;
    const bs = size * (18 + hash(i + step) * 30);
    blocks += `M${f(bx)} ${f(by)}h${f(bs)}v${f(bs)}h${f(-bs)}Z`;
  }
  o += P(blocks, { fill: '#8A93A6', opacity: f(0.55 * k) });
  return o;
}
// cubic bezier sample
function bez(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
}
// server racks slurped like spaghetti: strands from `from` points into the mouth (mx, my). w = strand width.
// speed: slurps per second; drop 0..1 (SC 10: he lets them go — strands fall back down)
function slurp(t, from, mx, my, o = {}) {
  const { w = 44, speed = 0.35, alarm = 1, drop = 0, seed = 0 } = o;
  let out = '', leds = '', ledsR = '', chunks = '';
  from.forEach(([sx, sy], i) => {
    const ph = (t * speed + hash(i * 3.3 + seed)) % 1;
    const u0 = drop > 0 ? 0 : ease.in(ph) * 0.8;
    const wig = (u) => Math.sin(u * 9 + t * 5 + i) * 40 * (1 - u);
    const p0 = [sx, sy], p1 = [sx + (mx - sx) * 0.15, sy - 260 - 120 * hash(i)], p2 = [mx + (sx - mx) * 0.4, my + 260], p3 = [mx, my];
    let d = '';
    const N = 22;
    const pts = [];
    for (let j = 0; j <= N; j++) {
      const u = lerp(u0, 1 - drop * 0.9, j / N);
      const [bx, by] = bez(p0, p1, p2, p3, u);
      const nx = -(p3[1] - p0[1]), ny = p3[0] - p0[0], nl = Math.hypot(nx, ny) || 1;
      pts.push([bx + (nx / nl) * wig(u), by + (ny / nl) * wig(u) + drop * 500 * (1 - u)]);
    }
    d = 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L');
    out += P(d, ln(w + 14)) + P(d, ln(w, '#2A3A72')) + P(d, { ...ln(w * 0.3, '#4A5E9E'), transform: `translate(${f(-w * 0.15)} ${f(-w * 0.15)})` });
    leds += d + ' ';
    if (i % 2) ledsR += d + ' ';
    // the rack chunk at the tail end
    const [tx, ty] = pts[0];
    const ang = Math.atan2(pts[1][1] - ty, pts[1][0] - tx) * 180 / Math.PI;
    chunks += G(R(-w * 1.3, -w * 0.9, w * 2.6, w * 1.8, 8, ol('#151D3E', 5)) + R(-w * 1.1, -w * 0.7, w * 2.2, w * 1.4, 4, { fill: 'url(#farmRackFar)' }) + R(-w * 1.3, -w * 0.9, w * 2.6, 6, 3, { fill: alarm > 0.5 ? '#FF5A6E' : CYAN }), `translate(${f(tx)} ${f(ty)}) rotate(${f(ang + 90 + Math.sin(t * 6 + i) * 10)})`);
  });
  const off = -t * 520;
  out += P(leds, { fill: 'none', stroke: CYAN, 'stroke-width': w * 0.18, 'stroke-linecap': 'round', 'stroke-dasharray': `1 ${f(w * 0.55)}`, 'stroke-dashoffset': f(off) });
  if (alarm > 0) out += P(ledsR, { fill: 'none', stroke: '#FF5A6E', 'stroke-width': w * 0.18, 'stroke-linecap': 'round', 'stroke-dasharray': `1 ${f(w * 0.9)}`, 'stroke-dashoffset': f(off * 1.3 + 7), opacity: f(alarm) });
  return out + chunks;
}
// red "traffic" packets streaming from points into the mouth (players feeding him)
function traffic(t, from, mx, my, k = 1, col = '#FF5A6E', n = 5) {
  if (k <= 0) return '';
  let o = '';
  from.forEach(([sx, sy], i) => {
    for (let j = 0; j < n; j++) {
      const u = ((t * 0.7 + j / n + hash(i * 1.7)) % 1);
      const [x, y] = bez([sx, sy], [sx, sy - 300], [mx, my + 300], [mx, my], u);
      o += CI(x, y, 9 + 6 * (1 - u), { fill: col, stroke: LINE, 'stroke-width': 3, opacity: f(k * Math.min(1, u * 5)) });
    }
  });
  return o;
}

// ---------------------------------------------------------------- low-angle view up the tower
// Returns { bg, fg } in screen space. The Lag goes between bg and fg (typ. lagSprite at (960, 330), size 2.4).
// o: alarm 0..1, green 0..1, greenWave 0..1 (bottom→top), lowRes 0..1, lift (px, tilts the view: + = look higher),
//    lamps 0..1 (ceiling lamps; < 1 = swallowed), rail (default true): catwalk railing at the bottom
function lowAngle(t, o = {}) {
  const { alarm = 1, green = 0, greenWave = green, lowRes = 0, lift = 0, lamps = 1, rail = true } = o;
  const al = alarm * (1 - green);
  let bg = SCREEN('url(#farmCoreSky)');
  const glow = green > 0.5 ? 'url(#farmGlowGreen)' : al > 0 ? 'url(#farmGlowRed)' : 'url(#farmGlowBlue)';
  bg += CI(960, 1250 + lift, 1200, { fill: glow, opacity: f(0.45 + 0.2 * al * Math.sin(t * 5)) });
  // converging girders (far)
  const VY = -2600 + lift, B = 1320 + lift, HW = 820;
  for (const sd of [-1, 1]) bg += P(`M${960 + sd * 1500} ${B} L${960 + sd * 260} ${VY + 900} L${960 + sd * 310} ${VY + 900} L${960 + sd * 1700} ${B} Z`, { fill: '#0A0E22' });
  let tw = '';
  const N = 15, r = 0.86;
  const yAt = (i) => VY + (B - VY) * Math.pow(r, i);
  const hw = (y) => (HW * (y - VY)) / (B - VY);
  for (let i = 0; i < N; i++) {
    const y0 = yAt(i), y1 = yAt(i + 1);
    if (y1 > 1200 || y0 < -200) continue;
    const h0 = hw(y0), h1 = hw(y1), ym = (y0 + y1) / 2, hm = (h0 + h1) / 2;
    const hgt = i / N;
    const gk = green * clamp((greenWave * 1.15 - hgt) * 5, 0, 1);
    tw += P(`M${f(960 - h0)} ${f(y0)} L${f(960 + h0)} ${f(y0)} L${f(960 + h1)} ${f(y1)} L${f(960 - h1)} ${f(y1)} Z`, { fill: '#121A3A', stroke: LINE, 'stroke-width': 4 });
    tw += G(R(-500, -85, 1000, 170, 0, { fill: 'url(#farmRackFar)' }), `translate(960 ${f(ym)}) scale(${f((hm * 0.92) / 500)} ${f(((y0 - y1) * 0.78) / 170)})`);
    if (gk > 0.05) tw += P(`M${f(960 - h0)} ${f(y0)} L${f(960 + h0)} ${f(y0)} L${f(960 + h1)} ${f(y1)} L${f(960 - h1)} ${f(y1)} Z`, { fill: GREEN, 'fill-opacity': f(0.22 * gk) });
    const ring = gk > 0.5 ? GREEN : al > 0 ? (Math.floor(t * 6 + i) % 2 ? RED : '#7A1A2A') : CYAN;
    const bend = (y0 - y1) * 0.35;
    const rd = `M${f(960 - h0 - 16)} ${f(y0)} Q960 ${f(y0 + bend)} ${f(960 + h0 + 16)} ${f(y0)}`;
    tw += P(rd, ln(Math.max(6, 22 * (h0 / HW)))) + P(rd, ln(Math.max(3, 12 * (h0 / HW)), ring));
    if (gk > 0.5) tw += P(rd, ln(Math.max(8, 40 * (h0 / HW)), GREEN, 0.25));
  }
  tw += P(`M${960 - HW} ${B} L960 ${VY} L${960 + HW} ${B} Z`, { fill: 'url(#farmCyl)' });
  bg += tw;
  // hanging ceiling lamps (left/right, in perspective) — the Lag swallows them
  for (let i = 0; i < 4; i++) {
    for (const sd of [-1, 1]) {
      const k = clamp(lamps * 4 - (3 - i), 0, 1);
      const y = 140 + i * 110 + lift * 0.6, x = 960 + sd * (880 - i * 150), s = 1 - i * 0.18;
      if (k <= 0) { bg += K.pixelBlocks(x - 40 * s, y - 20, 80 * s, 50 * s, t, 0.8, '#8A93A6', 22 * s, i + sd); continue; }
      bg += P(`M${f(x)} ${f(y - 220)} L${f(x)} ${f(y)}`, ln(5 * s, '#2A3048')) + R(x - 50 * s, y, 100 * s, 22 * s, 8, ol('#3A4570', 4)) + EL(x, y + 26 * s, 46 * s, 10 * s, { fill: al > 0 ? '#FFB0B8' : '#C9E8FF', opacity: f(k) }) + P(`M${f(x - 46 * s)} ${f(y + 26 * s)} L${f(x - 160 * s)} ${f(y + 420 * s)} L${f(x + 160 * s)} ${f(y + 420 * s)} L${f(x + 46 * s)} ${f(y + 26 * s)} Z`, { fill: al > 0 ? 'url(#farmConeRed)' : 'url(#farmConeBlue)', opacity: f(0.25 * k) });
    }
  }
  if (lowRes > 0) bg += SCREEN('url(#farmLowRes)', lowRes * 0.6);
  let fg = '';
  if (rail) {
    // catwalk railing seen from below (dark, rim-lit)
    const rim = green > 0.5 ? GREEN : al > 0 ? '#FF5A6E' : CYAN;
    fg += P(`M-40 ${1005 + lift * 0.1} L1960 ${985 + lift * 0.1}`, ln(40, '#05060C')) + P(`M-40 ${990 + lift * 0.1} L1960 ${970 + lift * 0.1}`, ln(5, rim, 0.7));
    for (let x = -60; x < 2000; x += 300) fg += P(`M${x} 1100 L${x + 40} ${980 + lift * 0.1}`, ln(30, '#05060C')) + P(`M${x - 12} 1100 L${x + 28} ${980 + lift * 0.1}`, ln(4, rim, 0.5));
    fg += R(-40, 1050, 2000, 60, 0, { fill: '#05060C' });
  }
  let lt = '';
  if (al > 0) lt += SCREEN(RED, al * (0.08 + 0.05 * Math.sin(t * 9)));
  if (green > 0) lt += SCREEN(GREEN, green * 0.06);
  if (lowRes > 0) lt += SCREEN('#8A93A6', lowRes * 0.16);
  return { bg, fg: fg + lt };
}

// ---------------------------------------------------------------- the catwalk in one-point perspective
// Looking down the catwalk (vanishing point VP); characters run toward the camera. Returns { bg, fg } world space.
// Floor depth: a character at feet y has scale deepS(y) (0.62 at y 1040). o: alarm, green, run (scroll px of the
// grate/posts: the camera "dollies back" with the runners), eaten 0..1 (far end turns into pixel blocks)
const DEEP = { vx: 960, vy: 400, near: 1100 };
const deepS = (y, s0 = 0.62) => s0 * (y - DEEP.vy) / (1040 - DEEP.vy);
function catwalkDeep(t, o = {}) {
  const { alarm = 1, green = 0, run = 0, eaten = 0 } = o;
  const al = alarm * (1 - green);
  const { vx, vy } = DEEP;
  let bg = R(-400, -400, 2720, 1900, 0, { fill: 'url(#farmCoreSky)' });
  bg += CI(vx, vy + 900, 1300, { fill: green > 0.5 ? 'url(#farmGlowGreen)' : 'url(#farmGlowRed)', opacity: f(0.45 + 0.15 * Math.sin(t * 5)) });
  // the tower (right) and far structures
  let tw = R(1380, -400, 900, 1500, 0, { fill: '#121A3A', stroke: LINE, 'stroke-width': 6 }) + R(1420, -400, 820, 1500, 0, { fill: 'url(#farmRackFar)', opacity: 0.8 });
  for (let i = 0; i < 9; i++) { const y = -300 + i * 170; const c = green > 0.5 ? GREEN : al > 0 ? (Math.floor(t * 6 + i) % 2 ? RED : '#7A1A2A') : CYAN; tw += P(`M1370 ${y} Q1800 ${y - 40} 2300 ${y}`, ln(20)) + P(`M1370 ${y} Q1800 ${y - 40} 2300 ${y}`, ln(10, c)); }
  tw += R(1380, -400, 900, 1500, 0, { fill: 'url(#farmCyl)' });
  bg += tw;
  for (let i = 0; i < 4; i++) bg += R(-300 + i * 260, -400, 50, 1500, 0, { fill: '#0A0E22' }) + R(-400, 120 + i * 140, 1300, 26, 0, { fill: '#0A0E22' });
  // floor plane (the catwalk) + truss under it
  const W0 = 70, W1 = 1250;
  const xAt = (y, side) => vx + side * lerp(W0, W1, (y - vy) / (1080 - vy));
  bg += P(`M${vx - W0} ${vy} L${vx + W0} ${vy} L${vx + W1 + 600} ${1080 + 600 * (1080 - vy) / (W1 - W0)} L${vx - W1 - 600} ${1080 + 600 * (1080 - vy) / (W1 - W0)} Z`, { fill: '#1A2038' });
  // grate lines rushing toward the camera
  let gl = '';
  for (let i = 0; i < 14; i++) {
    const u = ((i / 14 + run * 0.0025) % 1);
    const y = vy + (1080 - vy) * Math.pow(u, 2.2) * 1.05;
    gl += `M${f(xAt(y, -1))} ${f(y)} L${f(xAt(y, 1))} ${f(y)} `;
  }
  bg += P(gl, ln(5, '#3A4570'));
  for (let j = -6; j <= 6; j++) bg += P(`M${vx + j * 10} ${vy} L${vx + j * 230} 1100`, ln(3, '#2A3150'));
  // hazard edges + lit strip
  for (const sd of [-1, 1]) {
    bg += P(`M${vx + sd * W0} ${vy} L${vx + sd * (W1 + 40)} 1080 L${vx + sd * (W1 + 140)} 1080 L${vx + sd * (W0 + 8)} ${vy} Z`, { fill: '#E8B21F' });
    bg += P(`M${vx + sd * W0} ${vy} L${vx + sd * (W1 + 140)} 1080`, ln(4, al > 0 ? RED : green > 0.5 ? GREEN : CYAN, 0.8));
  }
  // railings: top rail + mid rail converging, posts at perspective depths (scrolling)
  let rails = '', posts = '';
  for (const sd of [-1, 1]) {
    rails += `M${vx + sd * (W0 + 4)} ${vy - 34} L${vx + sd * (W1 + 260)} 640 M${vx + sd * (W0 + 4)} ${vy - 16} L${vx + sd * (W1 + 260)} 860 `;
    for (let i = 0; i < 9; i++) {
      const u = ((i / 9 + run * 0.0025) % 1);
      const y = vy + (1080 - vy) * Math.pow(u, 2.2) * 1.05;
      const x = xAt(y, sd) + sd * 20 * u;
      const top = y - lerp(34, 440, Math.pow(u, 2.2) * 1.05);
      posts += P(`M${f(x)} ${f(y)} L${f(x)} ${f(top)}`, ln(lerp(3, 26, u * u), '#3A4260'));
      if (i % 3 === 0 && u > 0.15) posts += F.beacon(x, top, t + i, green > 0.5 ? green : al, green > 0.5 ? 'green' : 'red', 260 * u);
    }
  }
  bg += posts + P(rails, ln(14, LINE)) + P(rails, ln(7, '#4A5478'));
  if (eaten > 0) bg += K.pixelBlocks(vx - 260, vy - 200, 520, 300, t, eaten, '#8A93A6', 40, 4);
  let lt = '';
  if (al > 0) lt += FULL(RED, al * (0.08 + 0.05 * Math.sin(t * 9)));
  if (green > 0) lt += FULL(GREEN, green * 0.06);
  return { bg, fg: lt };
}

// ---------------------------------------------------------------- the Core composite
// layers in order: core bg, `back` (world svg at parallax o.backK, e.g. the Lag behind the catwalk), core mid,
// characters (k 1), core fg, `over` (k 1), core light
// STATE.wall: set when a core shot drawn this frame shows the wall timer (scenes hide the HUD then; main.js calls
// scene(t) before timer(t)). Scenes reset it at the start of scene(t).
const STATE = { wall: false };
function coreShot(t, cam, opts, chars = '', o = {}) {
  const Ly = F.core(t, cam, opts);
  if (wallTimerVisible(cam)) STATE.wall = true;
  return Ly.bg + (o.count ? mapCount(cam, o.count, o.countCol) : '') + (o.back ? K.view(cam, o.back, o.backK ?? 0.75) : '') + Ly.mid + K.view(cam, chars, 1) + Ly.fg + (o.over ? K.view(cam, o.over, 1) : '') + Ly.light;
}
// the Core's world-map screens show dots × 812 M; overlay the real SYSTEM count on their headers (k .6 layer)
function mapCount(cam, txt, col = '#46F58C') {
  let o = '';
  for (const sx of [-120, 1490]) o += R(sx + 250, 263, 300, 32, 4, { fill: '#0A1A30' }) + T(txt, sx + 546, 289, 27, col, { 'text-anchor': 'end' });
  return K.view(cam, o, 0.6);
}
// is the wall timer visible with this camera? (it hangs on the tower at k .45)
function wallTimerVisible(cam) {
  const v = F.vis(cam, 0.45);
  return v.x1 > CORE.timer.x - 440 && v.x0 < CORE.timer.x + 440 && v.y0 < 300 && v.y1 > 50;
}

// ---------------------------------------------------------------- the broadcast: Juno on every screen
// Juno's live feed: head and shoulders, soot on her cheek, on a dark red Core backdrop. svg centred on (0, 0) in w x h.
// o: { shade (default false: cheap), face, pose, act, tag (LIVE tag, default true) }
function junoFeed(t, w, h, o = {}) {
  let s = R(-w / 2, -h / 2, w, h, 0, { fill: '#2A0E1E' }) + R(-w / 2, -h / 2, w, h * 0.5, 0, { fill: '#3A1428', opacity: 0.7 });
  for (let i = 0; i < 7; i++) s += CI(-w / 2 + hash(i * 3.1) * w, -h / 2 + hash(i * 5.7) * h * 0.7, h * (0.05 + hash(i) * 0.07), { fill: i % 3 ? '#FF4D63' : '#FFB13B', opacity: f(0.18 + 0.12 * Math.sin(t * 3 + i)) });
  const sc = (0.92 * h) / 600;
  const fy = -h / 2 + 0.06 * h + 1015 * sc;
  s += who('juno', t, { x: o.x ?? 0, y: fy, s: sc, shade: o.shade ?? false, shadow: false, armL: 6, armR: 6, ...(o.pose || {}) }, { arms: false, energy: 0.5, ...(o.act || {}) }, SOOT);
  // the mic in the corner
  s += G(R(-26, -40, 52, 80, 26, ol('#3A3F55', 5)) + P('M-14 -20 L14 -20 M-14 0 L14 0 M-14 20 L14 20', ln(3, '#7A8296')) + P('M0 40 L0 140', ln(12)), `translate(${f(w * 0.3)} ${f(h * 0.36)}) scale(${f(h / 400)}) rotate(-12)`);
  if (o.tag !== false) {
    const z = h / 400;
    s += G(R(0, 0, 112, 40, 12, ol('#E8243C', 4)) + CI(20, 20, 7, { fill: '#FFFFFF', opacity: f(0.5 + 0.5 * Math.sin(t * 6)) }) + TF('LIVE', 66, 31, 26, '#FFFFFF'), `translate(${f(-w / 2 + 14 * z)} ${f(-h / 2 + 14 * z)}) scale(${f(z)})`);
  }
  return s;
}
// screen content that flips from the grey shutdown pop-up (k < .5) to Juno's feed (k > .5) with a pixel wipe
function popToJuno(t, w, h, k, o = {}) {
  const bgGame = o.bg ? o.bg(w, h) : R(-w / 2, -h / 2, w, h, 0, { fill: '#5BC0EB' }) + R(-w / 2, h * 0.15, w, h * 0.35, 0, { fill: '#3FBF5A' });
  if (k < 0.5) {
    const z = Math.min(w / 640, h / 360);
    return bgGame + R(-w / 2, -h / 2, w, h, 0, { fill: '#000', opacity: 0.35 }) + G(K.popup(0, 0, 520, 230, 'SYSTEM', ['Shutdown in 1 minute.', 'Thanks for playing! :)'], 1, { size: 36 }), `scale(${f(z)})`) + (k > 0.3 ? pixelBand(w, h, (k - 0.3) / 0.2) : '');
  }
  return junoFeed(t, w, h, o) + (k < 0.7 ? pixelBand(w, h, 1 - (k - 0.5) / 0.2) : '');
}
function pixelBand(w, h, k) {
  let o = '';
  const n = 8, cw = w / n, rows = Math.ceil(h / cw);
  for (let r = 0; r < rows; r++) for (let c = 0; c < n; c++) if (hash(r * 13 + c * 7) < k) o += R(-w / 2 + c * cw, -h / 2 + r * cw, cw + 1, cw + 1, 0, { fill: ['#FF4D63', '#2A0E1E', '#FFD21F', '#8A93A6'][(r + c) % 4] });
  return o;
}

// ---------------------------------------------------------------- the world montage props
// generic silver laptop; origin = front edge centre; screen (fn(w,h) or svg) 480 x 270; lid 0..1
function laptop2(x, y, s, screen, lid = 1, t = 0, off = false) {
  let o = P('M-300 0 L300 0 L270 -40 L-270 -40 Z', ol('#B4BECC', 7)) + R(-250, -36, 500, 22, 6, { fill: '#9AA5B5' }) + R(-320, -2, 640, 20, 10, ol('#9AA5B5', 5));
  if (lid > 0.02) {
    let lidSvg = R(-280, -360, 560, 330, 22, ol('#C9D1DD', 7)) + R(-262, -342, 524, 296, 14, { fill: '#14161E' });
    if (!off) {
      const id = S.uid('s09lap');
      const inner = typeof screen === 'function' ? screen(480, 270) : screen || '';
      lidSvg += S.clipDef(id, R(-240, -330, 480, 270, 6)) + G(G(R(-240, -135, 480, 270, 0, { fill: '#2A3550' }) + inner, 'translate(0 -195)'), null, { 'clip-path': `url(#${id})` });
      lidSvg += R(-240, -330, 480, 270, 6, { fill: 'url(#setsScreenShine)' });
    } else lidSvg += R(-240, -330, 480, 270, 6, { fill: '#0E1018' });
    o = G(lidSvg, `translate(0 -30) scale(1 ${f(lid)}) translate(0 30)`) + o;
  }
  return G(o, tr(x, y, s));
}
// Dad's fishing game ("BOBBER BAY", LVL 900 — same look as SC 04's screen) with the Golden Fish
function fishGame(w, h, t, o = {}) {
  const { fish = 0, hooked = 0, release = 0, lvl = 900 } = o;
  let s = R(-w / 2, -h / 2, w, h * 0.42, 0, { fill: '#FFB36B' }) + CI(w * 0.28, -h * 0.18, h * 0.12, { fill: '#FFF2A8' });
  s += R(-w / 2, -h * 0.08, w, h * 0.58, 0, { fill: '#2F8FBF' }) + R(-w / 2, -h * 0.08, w, h * 0.04, 0, { fill: '#7FD6F0' });
  for (let i = 0; i < 4; i++) s += P(`M${f(-w / 2 + ((i * w * 0.31 + t * 40) % w))} ${f(h * (0.05 + i * 0.09))} q${f(w * 0.03)} ${f(-h * 0.02)} ${f(w * 0.06)} 0`, ln(Math.max(2, w * 0.006), '#9FE8FF'));
  s += R(-w / 2, -h * 0.12, w * 0.3, h * 0.07, 2, ol('#A86B3C', Math.max(2, w * 0.006)));
  const fx = w * 0.1 + release * w * 0.5, fy = h * 0.22 + Math.sin(t * 9) * h * 0.02 * hooked;
  const ly = hooked > 0.5 && release < 0.05 ? fy - h * 0.06 : -h * 0.05;
  s += P(`M${f(-w * 0.3)} ${f(-h * 0.45)} Q${f(-w * 0.05)} ${f(-h * 0.2)} ${f(release > 0 ? w * 0.05 : fx - w * 0.06)} ${f(release > 0 ? -h * 0.05 : ly)}`, ln(Math.max(1.5, w * 0.004), '#FFFFFF'));
  if (fish > 0) s += goldFish(fx, fy, (h / 420) * fish, t, 0, release > 0 ? -1 : 1);
  const fz = Math.max(12, h * 0.07);
  s += R(-w / 2 + w * 0.02, -h / 2 + h * 0.03, w * 0.36, h * 0.12, h * 0.03, { fill: '#10203A', opacity: 0.75 }) + T('BOBBER BAY', -w / 2 + w * 0.2, -h / 2 + h * 0.03 + fz * 1.15, fz, '#FFD21F');
  s += R(w / 2 - w * 0.3, -h / 2 + h * 0.03, w * 0.28, h * 0.12, h * 0.03, { fill: '#10203A', opacity: 0.75 }) + T(`LVL ${lvl}`, w / 2 - w * 0.16, -h / 2 + h * 0.03 + fz * 1.15, fz, '#7CFF6B');
  if (hooked > 0.5 && release < 0.05) s += G(R(-w * 0.22, -h * 0.06, w * 0.44, h * 0.12, h * 0.03, ol('#FFD21F', 3)) + T('GOLDEN FISH ON THE HOOK!', 0, h * 0.03, h * 0.065, '#2A1640'), `translate(0 ${f(h * 0.36)})`);
  if (release > 0.05) s += G(R(-w * 0.17, -h * 0.06, w * 0.34, h * 0.12, h * 0.03, ol('#FFFFFF', 3)) + T('RELEASED ♥', 0, h * 0.03, h * 0.07, '#2F8FBF'), `translate(0 ${f(h * 0.36)})`);
  return s;
}
function goldFish(x, y, s = 1, t = 0, wink = 0, dir = 1) {
  const sw = Math.sin(t * 8) * 8;
  let o = P(`M90 0 L140 ${f(-46 + sw)} L130 0 L140 ${f(46 + sw)} Z`, ol('#FFB000', 6));
  o += P('M-120 0 Q-60 -80 60 -40 Q110 -20 100 0 Q110 20 60 40 Q-60 80 -120 0 Z', ol('#FFD21F', 7));
  o += P('M-60 -54 Q-20 -96 30 -46 Z', ol('#FFB000', 5)) + P('M-40 -20 Q-10 0 -40 20 M-10 -26 Q20 0 -10 26 M20 -24 Q48 0 20 24', ln(5, '#FFB000'));
  o += P('M-90 -20 Q-60 -50 -20 -46', ln(7, '#FFF4C4'));
  o += wink > 0.5 ? P('M-92 -12 Q-80 -2 -68 -12', ln(6)) : CI(-80, -10, 11, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4 }) + CI(-78, -10, 5, { fill: LINE });
  o += P('M-118 8 Q-108 18 -96 12', ln(5)) + K.F.sparkle(-40, -70, 16 * (0.6 + 0.4 * Math.sin(t * 7))) + K.F.sparkle(70, 50, 12 * (0.6 + 0.4 * Math.sin(t * 6 + 1)));
  return G(o, `translate(${f(x)} ${f(y)}) scale(${f(s * (dir < 0 ? -1 : 1))} ${f(s)})`);
}
// a little "picture in picture" of Juno's broadcast in the corner of another screen (w x h screen)
const pip = (t, w, h, k = 1) => (k > 0 ? G(R(-w * 0.2 - 6, -h * 0.2 - 6, w * 0.4 + 12, h * 0.4 + 12, 8, ol('#E8243C', 4)) + G(junoFeed(t, w * 0.4, h * 0.4, { tag: false }), null), `translate(${f(w * 0.27)} ${f(-h * 0.24)}) scale(${f(pop(k))})`) : '');
// held smartphone (screen space): screen svg/fn(w,h) 300 x 600 box; glow spill
function phoneHeld(x, y, s, screen, rot = 0, off = false) {
  return SETS.screens('phone', x, y, s, screen, 0, { off, rot });
}
// a city bus at dusk (side view, faces right) with passengers in the windows; phonesOff 0..1 (one by one)
function bus(t, x, y, s, phonesOff = 0, o = {}) {
  let b = R(-560, -330, 1120, 300, 40, ol('#FFC21F', 8)) + R(-560, -90, 1120, 34, 0, { fill: '#E8A50E' }) + R(-540, -310, 1080, 20, 10, { fill: '#FFE37A' });
  b += R(450, -300, 90, 170, 14, ol('#BFE8FF', 6)) + TF('42', 400, -276, 28, '#2A2246');
  const n = 6;
  for (let i = 0; i < n; i++) {
    const wx = -520 + i * 150, id = S.uid('s09bus');
    const off = phonesOff * n > i + 0.5;
    let inside = R(wx, -290, 130, 150, 0, { fill: off ? '#FFD9A0' : '#2A3050' });
    const kid = i % 2 ? K.draw.kid(i + 20, { x: wx + 65, y: -40, s: 0.17, shade: false, shadow: false, face: off ? 'happy' : 'neutral', turn: off ? 0.6 : 0, headRot: off ? -8 : 10, armR: off ? 10 : 70, armL: off ? 10 : 50 }) : K.draw.adult(i + 7, { x: wx + 65, y: -32, s: 0.15, shade: false, shadow: false, face: off ? 'happy' : 'neutral', turn: off ? 0.6 : 0, headRot: off ? -8 : 10, armR: off ? 10 : 70, armL: off ? 10 : 50 });
    inside += kid;
    if (!off) inside += CI(wx + 65, -160, 40, { fill: '#7CF7FF', opacity: 0.28 });
    b += S.clipDef(id, R(wx, -290, 130, 150, 12)) + G(inside, null, { 'clip-path': `url(#${id})` }) + R(wx, -290, 130, 150, 12, { fill: 'none', stroke: LINE, 'stroke-width': 6 });
  }
  for (const wx of [-380, 340]) b += CI(wx, -30, 62, ol('#2B2A33', 8)) + CI(wx, -30, 26, ol('#9AA3B2', 5));
  b += R(-560, -150, 40, 30, 6, ol('#FF5A5A', 4)) + EL(548, -120, 16, 12, { fill: '#FFF2B0' });
  return G(b, tr(x, y, s));
}

// ---------------------------------------------------------------- the countdown pill (copy of the HUD, in green)
function greenPill(sec, t, k = 1, label = 'SHUTDOWN CANCELED') {
  if (k <= 0) return '';
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  let o = R(-230, -44, 460, 88, 44, { fill: '#0E2018', opacity: 0.86, stroke: GREEN, 'stroke-width': 5 }) + R(-230, -44, 460, 88, 44, { fill: GREEN, opacity: f(0.12 * pulse) });
  o += TF(label, 0, -14, 20, '#9CFFBE', { 'letter-spacing': 3 }) + T(K.clock(sec), 0, 30, 50, GREEN, { 'letter-spacing': 2 });
  o += G(P('M-12 0 L-4 9 L12 -9', ln(6, GREEN)), 'translate(-186 0)') + G(P('M-12 0 L-4 9 L12 -9', ln(6, GREEN)), 'translate(186 0)');
  return G(o, `translate(960 64) scale(${f(pop(k))})`);
}
// a big spinning countdown (screen space), for the rewind: value shown = sec, blur = 0..1 motion streaks
function bigClock(x, y, s, sec, t, blur = 0, col = '#FF3B4E') {
  let o = R(-460, -130, 920, 260, 40, ol('#10131C', 10)) + R(-430, -100, 860, 200, 26, { fill: '#05070F' });
  const txt = K.clock(sec);
  if (blur > 0) for (let i = 1; i <= 3; i++) o += T(txt, 0, 60 - i * 40 * blur, 160, col, { opacity: f(0.25 * blur / i), 'letter-spacing': 6 }) + T(txt, 0, 60 + i * 40 * blur, 160, col, { opacity: f(0.25 * blur / i), 'letter-spacing': 6 });
  o += T(txt, 0, 60, 160, col, { 'letter-spacing': 6 }) + R(-430, -100, 860, 200, 26, { fill: 'url(#farmScan)' });
  return G(o, tr(x, y, s));
}

// ================================================================= SHARED SHOTS (SC 01 cold open = SC 10 repeat)
// Every timing comes from the line passed in, so the two scenes match shot for shot.

// 1) "One... min... min... minute... left." — low angle: the Lag rears over the catwalk, slurping racks; the camera
// pushes in in lagging jumps on every "min", the frame freezes and rubber-bands.
function shotMinute(t, id, o = {}) {
  const l = L(id);
  const a = l.a - 0.08, w1 = l.word('min').t0, w2 = l.word('min', 1).t0, w3 = l.word('minute').t0, w4 = l.word('left').t0;
  // lagging push-in: holds then jumps on each syllable
  const steps = [[a, 1.0], [w1, 1.1], [w2, 1.2], [w3, 1.32], [w4, 1.46]];
  let z = 1, yy = 0;
  for (const [ts, zz] of steps) if (t >= ts) { z = zz; yy = (zz - 1) * 260; }
  const tt = lagHold(t, [w1, w2, w3], 0.16);
  const rub = K.rubber(t, w2, 0.5, 40, 2) + K.rubber(t, w3, 0.5, -30, 2);
  const cam = shakes({ zoom: z, x: rub, y: -yy }, t, [[w1, 0.25, 10], [w2, 0.25, 12], [w3, 0.3, 16], [w4, 0.5, 26]]);
  const la = lowAngle(tt, { alarm: 1, lamps: 1 - seg(t, w3, l.b + 0.4) * 0.5, lift: 0 });
  const LY = 400, LS = 2.05;
  let mid = slurp(tt, [[560, 1060], [1360, 1080], [1700, 860], [240, 880], [960, 1100]], 960, LY + 120, { w: 42, speed: 0.4 });
  mid += lagAura(t, 960, LY, LS, 1, 3, 10);
  const gl = 0.2 + 0.6 * (bump(t, w1, w1 + 0.3) + bump(t, w2, w2 + 0.3) + bump(t, w3, w3 + 0.3));
  mid += lagSprite(tt, { x: 960, y: LY, size: LS, mood: t > w4 ? 'angry' : 'hungry', glitch: clamp(gl, 0, 1), look: [0, 0.55], mouth: V.viseme('LAG', t) });
  let out = la.bg + K.view(cam, mid, 1) + la.fg;
  out += flashAt(t, l.a - 0.08, 0.5);
  return out;
}

// positions on the control platform (world, core cam)
const PRESS = { button: CORE.button, pipStart: 3080, junoX: 2620 };
// 2) "Pip! Press the button!" — whip-pan to the control wall: Juno in the foreground points, Pip sprints for the
// BROADCAST button, the Lag's cloud swells in from the left.
function shotPress(t, id, o = {}) {
  const l = L(id);
  const a = l.a - 0.05, tPress = l.word('Press').t0, tBtn = l.word('button').t0, b = l.b + 0.07;
  const u = seg(t, a, b);
  const cam = shakes(camKeys2(t, [[a, camAt(2700, 520, 0.9)], [a + 0.25, camAt(3020, 540, 0.92)], [b, camAt(3120, 560, 1.0)]]), t, [[tBtn, 0.4, 10]]);
  // the Lag swelling in from the left (behind the catwalk)
  const lagX = lerp(2050, 2250, u);
  const back = lagSprite(t, { x: lagX, y: 400, size: 2.2, mood: 'angry', glitch: 0.35, speak: false, look: [0.8, 0.2] }) + lagAura(t, lagX, 400, 2.0, 1, 5, 7);
  // Pip sprints toward the button
  const px = lerp(2820, 3250, ease.inOut(seg(t, a, b + 0.2)));
  let chars = runSide('pip', t, px, FL, 0.5, { rate: 18, act: { face: 'determined' } });
  // Grandpa + Dex arriving (left, smaller in the depth of the platform)
  chars += runSide('dex', t, lerp(2380, 2520, u), FL - 10, 0.42, { rate: 16, act: { face: 'scared' } });
  // Juno, foreground left, pointing at the button
  const jp = seg(t, tPress - 0.25, tPress + 0.05);
  chars += who('juno', t, { x: 2600, y: FL + 170, s: 0.76, turn: 0.55, armR: lerp(30, 95, jp), armL: 20 + 15 * Math.sin(t * 9), lean: -4 * jp, headRot: -4 }, { arms: false, energy: 1.4 }, SOOT);
  let out = coreShot(t, cam, { alarm: 1, timer: o.timer || '00:00:56', broadcast: 0 }, chars, { back, backK: 0.85 });
  out += whip(t, a, 1, 0.14);
  return out;
}
// camKeys with plain cam objects
function camKeys2(t, keys) { return K.camKeys(t, keys); }

// 3) "Ding!" — Pip leaps onto the big button, Juno leaps for the mic, the Lag lunges. o.freeze = time to freeze at
// (SC 01: freeze frame + Juno turns to camera, drawn by the scene); without it (SC 10) Pip lands and the button lights.
const DING = { pipFrom: [3250, FL], pipTop: [3530, 480], junoFrom: [2700, FL], junoTo: [3040, FL] };
function dingTimes(id) {
  const l = L(id);
  const a = l.a - 0.25;
  return { a, d: l.a, land: l.b + 0.1, b: l.b };
}
// state of the ding shot at time tt (no camera): returns { back, chars, over, cam, broadcast }
function dingState(t, id, o = {}) {
  const T0 = dingTimes(id);
  const tt = o.freeze !== undefined ? Math.min(t, o.freeze) : t;
  const jump = seg(tt, T0.a, T0.land);
  // Pip: leaps from the floor in an arc and stomps the top of the button with both feet (lands at T0.land)
  const pu = seg(tt, T0.a + 0.08, T0.land);
  const px = lerp(DING.pipFrom[0], CORE.button.x, ease.inOut(pu));
  const py = lerp(FL, CORE.button.top - 16, pu) - 4 * 270 * pu * (1 - pu);
  const landed = tt >= T0.land;
  const sq = landed ? 1 - 0.25 * bump(tt, T0.land, T0.land + 0.3) : 1;
  const pressed = landed;
  const drop = pu;
  const pipPose = landed
    ? { x: CORE.button.x, y: CORE.button.top - 4, s: 0.5, sy: sq, sx: 2 - sq, armL: 150, armR: 150, legL: 8, legR: -8, face: 'excited', shadow: false }
    : { x: px, y: py, s: 0.5, view: 'side', flip: true, legL: 40, kneeL: 90, legR: -20, kneeR: 100, armL: lerp(60, 160, Math.min(1, pu * 2)), armR: lerp(30, 150, Math.min(1, pu * 2)), lean: -6, rot: -12 * Math.sin(pu * Math.PI), shadow: false, face: 'excited' };
  // Juno: leaping toward the mic
  const ju = ease.inOut(seg(tt, T0.a - 0.2, T0.land + 0.5));
  const jx = lerp(DING.junoFrom[0], DING.junoTo[0], ju), jy = FL - Math.sin(clamp(ju, 0, 1) * Math.PI) * 230;
  const junoPose = { x: jx, y: jy, s: 0.6, view: 'side', flip: true, legL: 60, kneeL: 40, legR: -50, kneeR: 70, armL: 120, armR: -60, lean: -14, shadow: false, face: 'determined' };
  // Grandpa + Dex behind, running (Grandpa with the mop)
  const gx = lerp(2330, 2470, seg(tt, T0.a, T0.land + 0.5)), dx = lerp(2470, 2610, seg(tt, T0.a, T0.land + 0.5));
  // the Lag lunging in from the left: a giant cloud arm / face edge
  const lu = ease.out(seg(tt, T0.a - 0.3, T0.land + 0.3));
  const lag = { x: lerp(1650, 1880, lu), y: 420, size: 2.8, look: [1, 0.1] };
  return { T0, tt, pipPose, junoPose, gx, dx, lag, pressed, drop, landed };
}
function shotDing(t, id, o = {}) {
  const st = dingState(t, id, o);
  const { T0, tt } = st;
  const cam0 = K.camKeys(t, [[T0.a, camAt(3020, 560, 0.86)], [T0.land + 0.6, camAt(3060, 560, 0.9)]]);
  const cam = shakes(cam0, t, [[T0.d, 0.3, 8], [T0.land, 0.5, o.freeze !== undefined ? 0 : 22]]);
  const back = lagSprite(tt, { ...st.lag, mood: 'angry', glitch: 0.4, speak: false }) + lagAura(tt, st.lag.x, st.lag.y, 2.2, 1, 9, 8);
  const gp = A.run(tt * 15 + 2);
  let chars = runSide('grandpa', tt, st.gx, FL - 6, 0.42, { ph: tt * 13, pose: { armL: 100, armR: 30 }, act: { face: 'scared' }, });
  chars += runSide('dex', tt, st.dx, FL, 0.42, { ph: tt * 15 + 1, act: { face: 'scream' } });
  void gp;
  if (!o.hideJuno) chars += who('juno', tt, st.junoPose, { arms: false }, SOOT_SIDE);
  chars += who('pip', t < (o.freeze ?? 1e9) ? t : o.freeze, st.pipPose, { arms: false });
  // the ding sparkle at Pip's hand when he says it
  let over = ding(st.pipPose.x + 70, st.pipPose.y - 360, seg(tt, T0.d, T0.d + 0.9), 0.9);
  const lit = st.pressed ? 1 : 0;
  let out = coreShot(t, cam, { alarm: 1, timer: o.timer || '00:00:53', broadcast: lit }, chars, { back, backK: 0.85, over });
  if (st.pressed && o.freeze === undefined) out += flashAt(t, T0.land, 0.8, 0.25) + K.view(cam, C.burst(CORE.button.x, CORE.button.top - 40, seg(t, T0.land, T0.land + 0.5), '#FFE14D'), 1);
  return out;
}

// ================================================================= SHARED: the Lag deflates (end of SC 10 → start of SC 11)
// t0 = start, the balloon zips around and shrinks; at t0 + DEFLATE.dur a tiny loading wheel (Buffer) lands on the
// catwalk at DEFLATE.land. Juno, Grandpa and Pip watch from the right.
const DEFLATE = { dur: 0.75, from: [2560, 470], land: [2760, FL], cam: camAt(2860, 560, 1.12) };
function deflateState(t, t0) {
  const u = clamp((t - t0) / DEFLATE.dur, 0, 1);
  const e = ease.in(u);
  const x = lerp(DEFLATE.from[0], DEFLATE.land[0], e) + Math.sin(u * 15) * 320 * (1 - u);
  const y = lerp(DEFLATE.from[1], DEFLATE.land[1] - 60, e) - Math.abs(Math.sin(u * 10)) * 160 * (1 - u);
  const size = 1.15 * Math.pow(1 - u, 1.4) + 0.05;
  return { u, x, y, size, rot: u * 900 };
}
function shotDeflate(t, t0, o = {}) {
  const st = deflateState(t, t0);
  const landed = t >= t0 + DEFLATE.dur;
  const cam = shakes(DEFLATE.cam, t, [[t0 + DEFLATE.dur, 0.25, 8]]);
  let back = '', chars = '';
  const look = [clamp((st.x - 3100) / 600, -1, 1), clamp((st.y - 500) / 400, -1, 1)];
  chars += who('grandpa', t, { x: 3300, y: FL, s: 0.46, turn: -0.4, armL: 30, armR: 40, face: { name: 'shocked', eyes: { look } }, keysSwing: 8 * Math.sin(t * 5) }, { arms: false });
  chars += who('juno', t, { x: 3080, y: FL + 30, s: 0.5, turn: -0.5, armL: 20, armR: 60, face: { name: 'shocked', eyes: { look } } }, { arms: false }, SOOT);
  chars += who('pip', t, { x: 3460, y: FL + 40, s: 0.5, turn: -0.6, armL: 20, armR: 20, face: { name: 'amazed', eyes: { look } } }, { arms: false });
  if (!landed) {
    let lg = lagSprite(t, { x: 0, y: 0, size: st.size, mood: 'scared', glitch: 0.3, speak: false, fps: 0, mouth: 'O' });
    chars += G(lg, `translate(${f(st.x)} ${f(st.y)}) rotate(${f(st.rot)})`);
    // air jet + streaks behind
    for (let i = 1; i <= 5; i++) {
      const s2 = deflateState(t - i * 0.03, t0);
      chars += CI(s2.x, s2.y, 40 * st.size + 10, { fill: '#C8CED8', opacity: f(0.35 - i * 0.06) });
    }
    chars += G(T('PFFFFT!', 0, 0, 70, '#FFFFFF', OUT(10)), `translate(${f(st.x + 160)} ${f(st.y - 140)}) rotate(-12) scale(${f(0.6 + 0.5 * st.u)})`);
  } else {
    const k = t - t0 - DEFLATE.dur;
    chars += LG.buffer({ x: DEFLATE.land[0], y: FL, s: 0.75, t, mood: 'surprised', hop: Math.max(0, 0.6 - k * 3) * (k < 0.2 ? 1 : 0), look: [1, -0.3] });
    chars += C.dust(DEFLATE.land[0] - 60, FL, t0 + DEFLATE.dur, t);
  }
  return coreShot(t, cam, { alarm: o.alarm ?? 1, timer: o.timer || '00:00:04', broadcast: 1 }, chars);
}

module.exports = {
  DEFLATE, deflateState, shotDeflate, STATE,
  LINE, CORE, FL, R, P, CI, EL, G, tr, OUT, TS, TFS, camAt, pop, FULL, SCREEN, RED, GREEN, CYAN, mix,
  shakeCam, shakes, flashAt, whip, lagHold,
  who, SOOT, SOOT_SIDE, runSide, runFront, sideHand, mopInArm, mopProp, ding,
  lagSprite, lagAura, slurp, traffic, bez, lowAngle, coreShot, wallTimerVisible, mapCount, catwalkDeep, deepS, DEEP,
  junoFeed, popToJuno, pixelBand, laptop2, fishGame, goldFish, pip, phoneHeld, bus, greenPill, bigClock,
  shotMinute, shotPress, shotDing, dingState, dingTimes, PRESS, DING,
};
