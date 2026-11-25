// Shared helpers for SC 07 (obsession) and SC 11 (after) — the two mirror scenes: camera math (no rounding, so slow pushes stay
// smooth), world <-> screen, whip / flash transitions, the cold "desaturation" wash, comic speech bubbles (the smart kids'
// numbers), a hand + a dino-claw mitten for the tablet insert, the tablet's REALITY HUD app screen, little FX (chalk dust,
// ketchup drops, bulb sparks, laugh marks).
'use strict';

const K = require('./kit');
const H = require('./hud');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;

// ---------------------------------------------------------------- camera
// cam that puts world (x, y) at screen (sx, sy) with zoom z (same maths as sets_town.camAt, without rounding)
const camAt = (x, y, z = 1, sx = 960, sy = 540) => ({ x: x - 960 - (sx - 960) / z, y: y - 540 - (sy - 540) / z, zoom: z });
const camLerp = (a, b, u, e = ease.inOut) => {
  const k = e(clamp(u, 0, 1));
  return { x: lerp(a.x || 0, b.x || 0, k), y: lerp(a.y || 0, b.y || 0, k), zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, k) };
};
function shook(cam, t, hits) {
  let sx = 0, sy = 0;
  for (const [t0, dur, amp] of hits) { const s = K.shake(t, t0, dur, amp); sx += s.sx; sy += s.sy; }
  return { ...cam, sx: (cam.sx || 0) + sx, sy: (cam.sy || 0) + sy };
}
// world point on layer k -> screen [x, y, z]
function scr(cam, x, y, k = 1) {
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  return [960 + (cam.sx || 0) + z * (x - 960 - (cam.x || 0) * k), 540 + (cam.sy || 0) + z * (y - 540 - (cam.y || 0) * k), z];
}
// screen point -> world point on layer k
function unscr(cam, sx, sy, k = 1) {
  const z = 1 + ((cam.zoom ?? 1) - 1) * k;
  return [(sx - 960 - (cam.sx || 0)) / z + 960 + (cam.x || 0) * k, (sy - 540 - (cam.sy || 0)) / z + 540 + (cam.y || 0) * k, z];
}

// ---------------------------------------------------------------- transitions
// white flash + streaks at a cut (whip-pan feel); dir ±1 horizontal, 'up' / 'down' vertical
function whip(t, t0, dir = 1, dur = 0.12, col = '#FFFFFF') {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return '';
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: col, 'fill-opacity': f(0.5 * (1 - u) * (1 - u)) });
  let d = '';
  for (let i = 0; i < 16; i++) {
    const a = hash(i * 3.3 + t0), b = hash(i * 7.7 + t0);
    if (typeof dir === 'string') { const x = a * 1920, y = (b * 1400 - 200) + (dir === 'up' ? 1 : -1) * u * 500; d += `M${f(x)} ${f(y)} v${f(160 + 260 * b)}`; }
    else { const y = a * 1080, x = b * 2200 - 200 - dir * u * 600; d += `M${f(x)} ${f(y)} h${f(200 + 340 * b)}`; }
  }
  return o + S.path(d, ln(10, col, f(0.8 * (1 - u))));
}
const flashAt = (t, t0, dur = 0.15, amp = 0.8, col = '#FFFFFF') => {
  const u = (t - t0) / dur;
  return u < 0 || u > 1 ? '' : S.rect(0, 0, 1920, 1080, 0, { fill: col, 'fill-opacity': f(amp * (1 - u) * (1 - u)) });
};
// fade to a colour toward t1 (k 0 -> 1 over [t0, t1])
const fadeTo = (t, t0, t1, col = '#FFFFFF', amp = 1) => { const k = seg(t, t0, t1); return k > 0 ? S.rect(0, 0, 1920, 1080, 0, { fill: col, 'fill-opacity': f(amp * ease.in(k)) }) : ''; };
// full-frame flat wash (cheap "desaturate" / tint: one flat rect, fill-opacity only)
const wash = (col, op) => (op > 0.004 ? S.rect(0, 0, 1920, 1080, 0, { fill: col, 'fill-opacity': f(clamp(op, 0, 1)) }) : '');

// ---------------------------------------------------------------- comic bits
// speech bubble with a tail pointing at (tx, ty); text in Lilita; k pops it (overshoot), out shrinks it away
function bubble(x, y, text, k, o = {}) {
  if (k <= 0 || (o.out || 0) >= 1) return '';
  const size = o.size || 40;
  const w = Math.max(90, String(text).length * size * 0.56 + 44), h = size + 34;
  const sc = ease.outBack(clamp(k, 0, 1)) * (1 - ease.in(o.out || 0));
  const fill = o.fill || '#E6EEF5', ink = o.ink || '#1D2B3A', edge = o.edge || '#151515';
  const tx = (o.tx ?? x) - x, ty = (o.ty ?? (y + h)) - y;
  const sx = clamp(tx * 0.25, -w / 2 + 26, w / 2 - 26);
  let g = S.path(`M${f(sx - 18)} ${f(h / 2 - 6)} L${f(tx)} ${f(ty)} L${f(sx + 18)} ${f(h / 2 - 6)} Z`, ol(fill, 5));
  g += S.rect(-w / 2, -h / 2, w, h, h / 2, ol(fill, 5));
  g += S.path(`M${f(sx - 15)} ${f(h / 2 - 4)} L${f(sx + 15)} ${f(h / 2 - 4)}`, ln(8, fill));
  g += T(text, 0, size * 0.36, size, ink);
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(o.rot || 0)}) scale(${f(sc)})`);
}
// chalk dust puff at (x, y), age seconds
function chalkDust(x, y, age, s = 1) {
  if (age < 0 || age > 0.7) return '';
  const u = age / 0.7;
  let o = '';
  for (let i = 0; i < 7; i++) {
    const a = hash(i * 2.1 + x) * Math.PI * 2, r = (10 + 50 * ease.out(u)) * (0.6 + 0.6 * hash(i * 4.3)) * s;
    o += S.circle(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7 + 18 * u * s, (7 + 5 * hash(i)) * s * (1 - 0.5 * u), { fill: '#F4F4EE', 'fill-opacity': f(0.85 * (1 - u)) });
  }
  return o;
}
// little electric sparks around (x, y)
function sparks(x, y, age, s = 1, col = '#FFE45A', n = 6) {
  if (age < 0 || age > 0.45) return '';
  const u = age / 0.45;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = hash(i * 5.1 + x * 0.01) * Math.PI * 2, r0 = 16 * s, r1 = (30 + 50 * ease.out(u)) * s;
    d += `M${f(x + Math.cos(a) * r0)} ${f(y + Math.sin(a) * r0)} L${f(x + Math.cos(a + 0.2) * (r0 + r1) * 0.6)} ${f(y + Math.sin(a + 0.2) * (r0 + r1) * 0.6)} L${f(x + Math.cos(a) * (r0 + r1))} ${f(y + Math.sin(a) * (r0 + r1))}`;
  }
  return S.path(d, { ...ln(5 * s, col), 'stroke-opacity': f(1 - u) });
}
// "ha ha" laugh marks rising near (x, y)
function laughMarks(x, y, t, k = 1, s = 1, seed = 0) {
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 2; i++) {
    const u = ((t * 1.1 + i * 0.5 + seed * 0.37) % 1);
    o += TF('HA', x + (i ? 60 : -30) * s + Math.sin(u * 6 + i) * 8 * s, y - 70 * u * s, 44 * s, '#FFFFFF', { stroke: '#151515', 'stroke-width': 7 * s, 'paint-order': 'stroke', 'fill-opacity': f(k * (1 - u)), 'stroke-opacity': f(k * (1 - u)), transform: `rotate(${i ? 8 : -10} ${f(x)} ${f(y)})` });
  }
  return o;
}
// a falling ketchup drop path (from (x, y0) to the floor y1, splats at the end)
function ketchupDrop(x, y0, y1, age, s = 1) {
  if (age < 0) return '';
  const fall = 1400 * age * age;
  if (y0 + fall < y1) {
    const y = y0 + fall;
    return S.path(`M${f(x)} ${f(y - 22 * s)} Q${f(x + 11 * s)} ${f(y + 2 * s)} ${f(x)} ${f(y + 9 * s)} Q${f(x - 11 * s)} ${f(y + 2 * s)} ${f(x)} ${f(y - 22 * s)} Z`, ol('#D91E2A', 3 * s));
  }
  const tImpact = Math.sqrt((y1 - y0) / 1400), a = age - tImpact;
  if (a > 2.5) return S.ellipse(x, y1, 30 * s, 8 * s, ol('#D91E2A', 3 * s));
  const u = ease.outBack(seg(a, 0, 0.18));
  let o = S.ellipse(x, y1, 30 * s * u, 8 * s * u, ol('#D91E2A', 3 * s));
  for (let i = 0; i < 5; i++) { const an = Math.PI * (0.1 + 0.8 * (i / 4)), r = 50 * s * ease.out(seg(a, 0, 0.3)); if (a < 0.35) o += S.circle(x - Math.cos(an) * r, y1 - Math.sin(an) * r * 0.6 + 120 * a * a * s, 5 * s, { fill: '#D91E2A' }); }
  return o;
}

// ---------------------------------------------------------------- the tablet insert (SC 11 end)
// the REALITY HUD app on the tablet screen (fn(w, h) for X.tablet's screenBox): an OFF/ON toggle (on 0..1), t
function hudApp(on, t) {
  return (w, h) => {
    const bgc = on > 0.5 ? '#0A2A3A' : '#1C2230';
    let o = S.rect(0, 0, w, h, 0, { fill: bgc });
    if (on > 0) o += S.rect(0, 0, w, h, 0, { fill: '#2EE6FF', 'fill-opacity': f(0.18 * on) });
    o += H.eyeLogo(w / 2, h * 0.22, 30, on > 0.5 ? '#3BE8FF' : '#7F96AA', t);
    o += T('REALITY HUD', w / 2, h * 0.36, 34, on > 0.5 ? '#E8FBFF' : '#AAB6C4');
    o += TF('v1.0', w / 2, h * 0.42, 18, '#7F96AA');
    // toggle
    const tw = 170, th = 84, tx = w / 2 - tw / 2, ty = h * 0.55;
    const tr = on > 0.5 ? '#2EE6A0' : '#4A5468';
    o += S.rect(tx, ty, tw, th, th / 2, ol(tr, 6));
    const kx = lerp(tx + th / 2, tx + tw - th / 2, ease.inOut(clamp(on, 0, 1)));
    o += S.circle(kx, ty + th / 2, th / 2 - 9, ol('#FFFFFF', 5));
    o += T(on > 0.5 ? 'ON' : 'OFF', w / 2, ty + th + 56, 44, on > 0.5 ? '#3BFFB0' : '#9AA8B6');
    o += TF('PEOPLE · PETS · OBJECTS', w / 2, h * 0.92, 15, '#5E6E80', { 'letter-spacing': 1 });
    return o;
  };
}
// the hero's blocky white hand with the red sleeve, thumb out; (x, y) = thumb tip, rot deg (0 = thumb pointing up)
function heroThumb(x, y, s = 1, rot = 0, press = 0) {
  let g = S.rect(-70, 70, 140, 260, 16, ol('#E8433C', 7)) + S.rect(-74, 62, 148, 40, 12, ol('#C8302C', 7));
  g += S.rect(-62, -60, 124, 140, 26, ol('#FFFFFF', 7));
  g += S.rect(-20, -150, 52, 120, 24, ol('#FFFFFF', 7)) + S.path('M-8 -130 L18 -130', ln(5, '#D8D8D8'));
  g += S.path('M-40 -20 L36 -20 M-40 14 L36 14', ln(5, '#D8D8D8'));
  return S.g(g, `translate(${f(x)} ${f(y + 8 * press)}) rotate(${f(rot)}) scale(${f(s)}) translate(-6 150)`);
}
// Max's green dino-onesie claw mitten reaching in; (x, y) = claw tip, rot deg
function dinoClaw(x, y, s = 1, rot = 0) {
  let g = S.rect(-80, 40, 160, 300, 30, ol('#5DBB4A', 7)) + S.path('M-80 120 Q0 140 80 120', ln(5, '#3F8F33'));
  g += S.path('M-78 60 Q-86 -60 0 -70 Q86 -60 78 60 Z', ol('#6FCF5A', 7));
  for (const dx of [-42, 0, 42]) g += S.path(`M${dx - 14} -52 L${dx} -104 L${dx + 14} -52 Z`, ol('#FFF3D6', 5));
  return S.g(g, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)}) translate(0 100)`);
}

module.exports = { camAt, camLerp, shook, scr, unscr, whip, flashAt, fadeTo, wash, bubble, chalkDust, sparks, laughMarks, ketchupDrop, hudApp, heroThumb, dinoClaw };
