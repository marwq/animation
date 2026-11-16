// Private helpers for SC 09 (the truth), SC 10 (fix everything) and SC 12 (outro): the seated old man, the hero with the
// panel laptop, teleport FX, the cutaway gags (a very confused dinosaur, the nine-foot fellow of 1964), the CRT montages,
// the dawn-repair props (bathroom, family monitors, dream bubbles) and the end card.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const CS = require('./city');
const ST = require('./sets');
const A = require('./acting');
const CAST = require('../rig/cast');
const CATS = require('../rig/cats');
const F = K.F;

const LINE = '#151515';
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const P = (d, a = {}) => (d ? S.path(d, a) : '');
const CI = (x, y, r, a = {}) => S.circle(x, y, r, a);
const EL = (x, y, rx, ry, a = {}) => S.ellipse(x, y, rx, ry, a);
const G = (inner, tfm, extra) => (inner ? S.g(inner, tfm, extra) : '');
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OUT = (w = 8) => ({ stroke: LINE, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const outT = (txt, x, y, size, fill, sw = 10, extra = {}) => T(esc(txt), x, y, size, fill, { ...OUT(sw), ...extra });
const outTF = (txt, x, y, size, fill, sw = 8, extra = {}) => TF(esc(txt), x, y, size, fill, { ...OUT(sw), ...extra });
const ob = (k) => ease.outBack(clamp(k, 0, 1));
const io = (k) => ease.inOut(clamp(k, 0, 1));
const eo = (k) => ease.out(clamp(k, 0, 1));
// camera centred on world point (px, py)
const at = (px, py, zoom = 1) => ({ zoom, x: px - 960, y: py - 540 });
// soft camera drift (handheld feel for intimate shots)
const drift = (cam, t, amp = 6) => ({ ...cam, x: cam.x + Math.sin(t * 0.7) * amp, y: cam.y + Math.cos(t * 0.53) * amp * 0.6 });
const withShake = (cam, t, hits) => { let sx = 0, sy = 0; for (const [t0, dur, amp] of hits) { const s = K.shake(t, t0, dur, amp); sx += s.sx; sy += s.sy; } return { ...cam, sx: (cam.sx || 0) + sx, sy: (cam.sy || 0) + sy }; };
const white = (k) => (k > 0.001 ? R(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(clamp(k, 0, 1)) }) : '');
const black = (k) => (k > 0.001 ? R(0, 0, 1920, 1080, 0, { fill: '#0B0710', opacity: f(clamp(k, 0, 1)) }) : '');
// a quick white flash: peaks at t0, decays over dur
const flashAt = (t, t0, peak = 0.9, dur = 0.3) => (t >= t0 && t < t0 + dur ? white(peak * (1 - (t - t0) / dur)) : '');
// whip-pan cut: white streaks for ~0.12 s around a cut at tc (dir +1 = to the right)
function whip(t, tc, dir = 1, col = '#FFFFFF') {
  const u = (t - tc + 0.07) / 0.16;
  if (u < 0 || u > 1) return '';
  const k = Math.sin(u * Math.PI);
  let o = R(0, 0, 1920, 1080, 0, { fill: col, opacity: f(0.55 * k) });
  let d = '';
  for (let i = 0; i < 14; i++) { const y = hash(i * 3.3) * 1080, len = 300 + hash(i * 7.7) * 700, x = (hash(i * 1.9) * 2400 - 300) + dir * u * 600; d += `M${f(x)} ${f(y)} h${f(len)}`; }
  return o + P(d, ln(10 + 18 * k, col, 0.8 * k));
}

// ================================================================ the server room with the old man seated in the big chair
const SEAT = { x: 480, hip: 730, s: 0.46 };
const OLD_Z = 0.75;
const seatFeet = (s = SEAT.s) => SEAT.hip + 306 * s * OLD_Z;
// knitted lap blanket over the old man's thighs (body units of the old man: hips at y -306)
function lapBlanket(t) {
  const sw = Math.sin(t * 0.8) * 4;
  const d = `M-178 -350 Q-190 -300 -168 -190 Q-120 ${f(-150 + sw)} -60 -176 Q0 ${f(-150 - sw)} 60 -176 Q120 ${f(-150 + sw)} 168 -190 Q190 -300 178 -350 Q0 -380 -178 -350 Z`;
  return P(d, { fill: 'url(#cityKnit)', stroke: LINE, 'stroke-width': 9, 'stroke-linejoin': 'round' }) + P('M-150 -330 Q0 -356 150 -330', ln(6, '#FFFFFF', 0.45)) +
    P(`M-168 -190 Q-120 ${f(-150 + sw)} -60 -176 Q0 ${f(-150 - sw)} 60 -176 Q120 ${f(-150 + sw)} 168 -190`, { ...ln(12, '#F6E8C8'), 'stroke-dasharray': '4 12' });
}
// a dainty teacup on a saucer (screen/body space; origin = bottom of the saucer)
function teacup(x, y, s = 1, t = 0, steam = 1, col = '#7FB2F0') {
  let o = EL(0, -6, 62, 12, ol('#FFFFFF', 5)) + P('M-44 -70 Q-46 -14 -16 -10 H16 Q46 -14 44 -70 Z', ol(col, 6)) + EL(0, -70, 44, 10, ol('#B9773E', 5));
  o += P('M42 -58 q30 -2 26 20 q-4 16 -28 12', { ...ln(14), fill: 'none' }) + P('M42 -58 q30 -2 26 20 q-4 16 -28 12', { ...ln(6, col), fill: 'none' });
  o += P('M-30 -54 q4 26 18 32', ln(5, '#FFFFFF', 0.6)) + CI(0, -40, 7, { fill: '#FFFFFF', opacity: 0.7 });
  if (steam > 0.02) {
    let d = '';
    for (let j = 0; j < 2; j++) { const u = (t * 0.55 + j * 0.5) % 1; d += `M${-12 + j * 24} ${f(-86 - u * 70)}q${f(10 + Math.sin(t * 2 + j) * 5)} -14 0 -28q-10 -14 0 -28`; }
    o += P(d, { ...ln(7, '#FFFFFF'), fill: 'none', opacity: f(0.55 * steam) });
  }
  return G(o, tr(x, y, s));
}
// THE DAILY SERVER newspaper (centre x, y; 640 x 460 at s 1)
function newspaper(x, y, s = 1, rot = 0, sy = 1) {
  let o = R(-320, -230, 640, 460, 6, ol('#F4EFE2', 7)) + P('M0 -226 V226', ln(4, '#C9C0A8'));
  o += T('THE DAILY SERVER', 0, -168, 58, '#2A2433') + P('M-296 -150 H296 M-296 -140 H296', ln(3, '#2A2433'));
  o += T('CITY FLIES!', -150, -86, 50, '#B23A48') + T('CAT 100x?!', 160, -86, 46, '#2A2433');
  o += R(-296, -62, 270, 160, 4, ol('#CFC8B6', 4)) + CATS.pancake({ x: -160, y: 92, s: 0.55, pose: 'sit', mood: 'smug' });
  o += R(26, -62, 270, 120, 4, ol('#D8D2C2', 4)) + P('M40 40 L110 -20 L160 20 L210 -30 L280 40 Z', { fill: '#9AA0AE' }) + R(150, -42, 46, 30, 6, ol('#FFB52E', 3));
  let lines = '';
  for (let i = 0; i < 6; i++) { lines += `M-296 ${118 + i * 18} H${-40 - (i % 3) * 20} `; lines += `M30 ${78 + i * 22} H${290 - (i % 2) * 40} `; }
  o += P(lines, ln(5, '#8A8478'));
  return G(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)} ${f(s * sy)})`);
}
// the old man seated in the big chair. pose: usual fields; extra: paper 0..1 (newspaper up), cup 0..1 (raises his teacup),
// sipping (bool), lapBlanket true
function oldSeated(t, pose = {}, act = {}) {
  const s = pose.s ?? SEAT.s;
  const props = [...(pose.props || [])];
  props.push({ svg: lapBlanket(t), layer: 'mid' });
  const p = { x: SEAT.x, y: seatFeet(s), s, legL: 5 + 3 * Math.sin(t * 1.6), legR: 4 - 3 * Math.sin(t * 1.6 + 1), armL: 24, armR: 24, ...pose };
  const paper = pose.paper || 0;
  if (paper > 0.01) {
    const k = io(paper);
    p.armL = lerp(24, 68, k); p.armR = lerp(24, 68, k);
    const hy = -515 + 252 * Math.cos((p.armR * Math.PI) / 180);
    props.push({ svg: newspaper(0, lerp(-260, hy - 150, k), 1.02, Math.sin(t * 0.9) * 1.2, lerp(0.35, 1, k)), layer: 'front' });
  }
  if (pose.cup !== undefined) {
    const k = io(pose.cup);
    p.armR = lerp(28, 104, k);
    const h = A.hand(p.armR, 1);
    props.push({ svg: teacup(h[0] - 20 * k, h[1] + 80, 1.35, t, 1), layer: 'front' });
  }
  delete p.paper; delete p.cup;
  p.props = props;
  return K.actor('oldman', t, p, { arms: pose.armL === undefined && !(paper > 0.01) && pose.cup === undefined, ...act });
}
// compose the server room: bg + seated old man + chair arms/blanket + hero(es) + fg + light
// o: room opts (logs, green, lamp, mainScreen, screens...), old: svg of the old man (world), hero: svg (world), front: svg (world, over fg)
function room(t, cam, o = {}, old = '', hero = '', front = '', over = '') {
  const L = CS.serverRoom(t, cam, o);
  return L.bg + K.view(cam, old, 1) + L.mid + K.view(cam, hero, 1) + L.fg + K.view(cam, front, 1) + L.light + over;
}

// ================================================================ the hero + the panel laptop
// laptop held at the hero's hands. o: open (screen toward the camera) | back (lid back, default), screen (fn|svg),
// glow 0..1, s (laptop scale), dy, battery
function heroLap(t, pose = {}, act = {}, o = {}) {
  const a = pose.armL ?? 12, b = pose.armR ?? 12;
  const hl = A.hand(a, -1), hr = A.hand(b, 1);
  const ls = o.s ?? 0.5;
  const lx = (hl[0] + hr[0]) / 2, ly = Math.max(hl[1], hr[1]) + (o.dy ?? 24);
  const scr = o.screen || ST.adminScreen(t, { battery: o.battery ?? 1, lines: o.lines, typed: o.typed });
  const lap = ST.laptop(lx, ly, ls, scr, { back: !o.open, glow: o.glow ?? 0.55, t, dust: 0.25, rot: o.rot || 0 });
  const props = [...(pose.props || []), { svg: (o.cable ? o.cable(lx, ly, ls) : '') + lap, layer: 'front' }];
  return K.actor('you', t, { armL: a, armR: b, ...pose, props }, { arms: false, ...act });
}

// ================================================================ teleport FX
// arrival: the body drops in from a light column, squashes on landing. Returns pose bits + fx svg (world, around x,y)
function teleIn(t, t0, x, y, s, col = '#9DFFD0', dur = 0.55) {
  const u = (t - t0) / dur;
  if (u < 0) return { show: false, lift: 0, sx: 1, sy: 1, fx: '' };
  const drop = clamp(u / 0.55, 0, 1);
  const lift = (1 - ease.in(drop)) * 420 * s;
  const land = u > 0.55 ? bump(u, 0.55, 0.95) : 0;
  let fx = '';
  const beam = 1 - seg(u, 0.5, 1.3);
  if (beam > 0.01) {
    fx += R(x - 140 * s, -400, 280 * s, y + 400, 60 * s, { fill: col, opacity: f(0.22 * beam) }) + R(x - 60 * s, -400, 120 * s, y + 400, 40 * s, { fill: '#FFFFFF', opacity: f(0.35 * beam) });
    let d = '';
    for (let i = 0; i < 18; i++) {
      const ph = (u * 1.6 + hash(i * 3.1)) % 1, a = hash(i * 5.7) * Math.PI * 2, r = (1 - ph) * 260 * s + 30 * s;
      const px = x + Math.cos(a) * r, py = y - 470 * s + Math.sin(a) * r * 1.4, sz = (10 + 14 * hash(i)) * s;
      d += `M${f(px - sz / 2)} ${f(py - sz / 2)} h${f(sz)} v${f(sz)} h${f(-sz)} Z`;
    }
    fx += P(d, { fill: col, opacity: f(beam), stroke: LINE, 'stroke-width': 3 * s });
  }
  if (u > 0.5 && u < 1.2) fx += K.C.dust(x - 120 * s, y, t0 + 0.55 * dur, t) + K.C.dust(x + 40 * s, y, t0 + 0.58 * dur, t);
  return { show: true, lift, sx: 1 + 0.16 * land, sy: 1 - 0.18 * land + (drop < 1 ? 0.12 * (1 - drop) : 0), fx, flash: 1 - seg(u, 0, 0.5) };
}
// departure: rising pixels + fading body (k 0..1)
function teleOut(k, x, y, s, col = '#9DFFD0') {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < 26; i++) {
    const ph = clamp(k * 1.4 - hash(i * 2.3) * 0.4, 0, 1);
    if (ph <= 0) continue;
    const px = x + (hash(i * 4.1) - 0.5) * 300 * s, py = y - hash(i * 6.7) * 900 * s - ph * 500 * s, sz = (14 + 18 * hash(i * 9.1)) * s * (1 - ph * 0.5);
    d += `M${f(px)} ${f(py)} h${f(sz)} v${f(sz)} h${f(-sz)} Z`;
  }
  return R(x - 160 * s, -300, 320 * s, y + 300, 60 * s, { fill: col, opacity: f(0.3 * Math.sin(k * Math.PI)) }) + P(d, { fill: col, stroke: LINE, 'stroke-width': 3 * s, opacity: f(1 - k * 0.3) });
}

// ================================================================ CRT grid montage (every screen a different city)
const CITY_FEEDS = [['TOKYO', 'city'], ['PARIS', 'traffic'], ['OSLO', 'snow'], ['RIO', 'beach'], ['CAIRO', 'desert'], ['YOUR TOWN', 'fly']];
// a wall of 6 CRTs in screen space; k = power-on progress per monitor index (fn i → 0..1), live 0..1 (LIVE badges)
function feedWall(t, onK, live = 0, names = CITY_FEEDS) {
  let o = R(0, 0, 1920, 1080, 0, { fill: '#2A1E26' }) + R(-200, -200, 2400, 1500, 0, { fill: 'url(#cityMonA)', opacity: 0.55 }) + R(0, 0, 1920, 1080, 0, { fill: '#1A0C10', opacity: 0.45 });
  const W = 600, H = 430, gx = 30, gy = 46, x0 = (1920 - (3 * W + 2 * gx)) / 2, y0 = 70;
  const styles = ['cream', 'grey', 'beige', 'wood', 'dark', 'cream'];
  names.forEach(([name, kind], i) => {
    const x = x0 + (i % 3) * (W + gx), y = y0 + Math.floor(i / 3) * (H + gy);
    const k = onK(i);
    const sw = W - 24, sh = H - 40;
    let content = '';
    if (k > 0.02) {
      content = CS.liveScreen(kind, sw, sh, t + i * 1.3);
      // CRT power-on: a bright line opens vertically
      if (k < 1) { const v = eo(k); content = G(content, `translate(0 ${f(sh / 2 * (1 - v))}) scale(1 ${f(Math.max(0.02, v))})`) + R(0, sh / 2 - 3, sw, 6, 0, { fill: '#FFFFFF', opacity: f(1 - v) }); }
    }
    o += CS.crt(x, y, W, H, styles[i], content, 0);
    if (k > 0.5) {
      o += G(R(-6, -26, 12 + name.length * 19 + 22, 40, 10, ol('#1A1418', 4)) + TF(esc(name), 14, 4, 26, '#FFE2B0', { 'text-anchor': 'start' }), tr(x + 26, y + H - 64));
      if (live > 0.01) { const bl = Math.floor(t * 2.2 + i) % 2 === 0 ? 1 : 0.35; o += G(R(-4, -24, 110, 38, 10, ol('#2A0C12', 4)) + CI(18, -5, 9, { fill: '#FF3B4E', opacity: f(bl) }) + TF('LIVE', 66, 6, 24, '#FF6A6A'), `${tr(x + W - 140, y + 54)} scale(${f(ob(live))})`); }
    }
  });
  return o;
}

// ================================================================ CUTAWAY: a very confused dinosaur (65,000,000 BC)
function dino(t, o = {}) {
  const { x = 0, y = 0, s = 1, look = 0, reach = 0, peck = 0, blink = 0, confused = 1 } = o;
  const C = { body: '#86D45E', hi: '#A8E880', shade: '#5DAA3E', belly: '#F4E7A8', spot: '#4E9A36', claw: '#FFF6E0' };
  const sway = Math.sin(t * 1.7) * 4;
  // the whole upper body tilts forward for the peck (pivot at the hips)
  const tilt = 24 * peck + 3 * Math.sin(t * 2.1);
  let o2 = '';
  // tail
  o2 += G(P('M-40 -300 C-200 -330 -380 -250 -540 -110 Q-560 -88 -530 -92 C-360 -140 -230 -170 -60 -180 Z', ol(C.body, 9)) +
    P('M-150 -300 l-10 -34 l34 18 M-260 -270 l-14 -30 l36 14 M-360 -222 l-16 -26 l34 10', ol(C.shade, 6)), `rotate(${f(sway)} -60 -240)`);
  // far leg
  o2 += P('M-110 -200 Q-150 -120 -120 -40 L-90 0 H-10 Q0 -20 -30 -40 Q-40 -120 -40 -190 Z', ol(C.shade, 8));
  // upper body (tilts)
  let up = '';
  up += P('M-150 -330 Q-160 -440 -40 -470 Q60 -490 120 -430 Q170 -360 140 -250 Q110 -150 -10 -150 Q-150 -160 -150 -330 Z', ol(C.body, 9));
  up += P('M60 -420 Q140 -360 120 -260 Q100 -180 20 -168 Q90 -260 60 -420 Z', { fill: C.belly, stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  up += P(`M-110 -430 l-6 -40 l36 22 M-50 -462 l0 -40 l32 30 M10 -476 l10 -38 l22 36`, ol(C.shade, 6));
  up += P('M-90 -360 a18 14 0 1 0 36 0 a18 14 0 1 0 -36 0 M-30 -400 a14 11 0 1 0 28 0 a14 11 0 1 0 -28 0 M-120 -270 a12 10 0 1 0 24 0 a12 10 0 1 0 -24 0', { fill: C.spot, opacity: 0.8 });
  // neck + head
  let hd = '';
  hd += P('M40 -440 Q60 -520 120 -560 L170 -470 Q120 -440 110 -380 Z', ol(C.body, 9));
  hd += P('M70 -640 Q70 -700 150 -704 L300 -690 Q370 -684 372 -630 L370 -590 Q368 -556 330 -556 L120 -546 Q70 -546 70 -600 Z', ol(C.body, 9));
  const jawO = 6 + 10 * bump(peck, 0.6, 1);
  hd += P(`M110 -548 L330 -556 Q362 -556 360 ${f(-530 + jawO)} Q356 ${f(-506 + jawO)} 320 ${f(-504 + jawO)} L150 ${f(-506 + jawO * 0.5)} Q110 -508 110 -548 Z`, ol(C.hi, 8));
  let teeth = '';
  for (let i = 0; i < 7; i++) { const tx = 150 + i * 28; teeth += `M${tx} -552 l10 18 l10 -18 Z`; }
  hd += P(teeth, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 4, 'stroke-linejoin': 'round' });
  hd += CI(338, -650, 8, { fill: LINE }) + P('M150 -700 q40 -16 80 -6', ln(5, C.hi, 0.8));
  // eye (looks down at the laptop → forward at us)
  const ex = 200, ey = -632, er = 34;
  if (blink > 0.5) hd += P(`M${ex - er} ${ey} Q${ex} ${ey + 16} ${ex + er} ${ey}`, ln(9));
  else {
    hd += CI(ex, ey, er, ol('#FFFFFF', 7));
    const px = ex + lerp(12, 4, look), py = ey + lerp(12, 2, look);
    hd += CI(px, py, 14, { fill: LINE }) + CI(px - 5, py - 6, 5, { fill: '#FFFFFF' });
  }
  // confused brows: one up, one down
  hd += P(`M${ex - 40} ${f(ey - 50 - 16 * confused)} q38 ${f(-16 + 6 * confused)} 70 ${f(4 + 10 * confused)}`, ln(12));
  up += G(hd, `rotate(${f(-6 * look + 8 * peck)} 110 -460)`);
  // tiny arms (reaching for the keyboard, way too short)
  const ra = reach * (20 + 12 * Math.sin(t * 18));
  for (const [ax, ay, k] of [[118, -330, 1], [98, -314, 0.8]]) {
    up += G(P('M0 0 Q30 4 46 24', ln(22)) + P('M0 0 Q30 4 46 24', ln(12, k < 1 ? C.shade : C.body)) + P('M44 22 l14 4 M42 26 l8 12', ln(6, LINE)), `translate(${ax} ${ay}) rotate(${f(-ra * k)})`);
  }
  o2 += G(up, `rotate(${f(tilt)} -40 -190)`);
  // near leg
  o2 += P('M-90 -260 Q20 -300 40 -180 Q50 -110 10 -60 L40 -24 Q120 -20 120 0 H-30 Q-50 -40 -60 -80 Q-150 -150 -90 -260 Z', ol(C.body, 9));
  o2 += P('M80 -6 l14 -16 M104 -4 l14 -14', ln(7, C.claw));
  return G(o2, tr(x, y, s));
}
function volcano(t, x, y, s) {
  let o = P('M-420 0 L-120 -420 Q-80 -450 -40 -440 L40 -440 Q80 -450 120 -420 L420 0 Z', ol('#6A4A6E', 8));
  o += P('M-110 -414 L-60 -330 L-20 -380 L20 -300 L60 -390 L100 -414 Q60 -440 0 -440 Q-60 -440 -110 -414 Z', { fill: '#FF6A2E', stroke: LINE, 'stroke-width': 6, 'stroke-linejoin': 'round' });
  o += P('M-20 -380 L-40 -250 M60 -390 L80 -220', ln(10, '#FF9A3A'));
  let d = '';
  for (let i = 0; i < 5; i++) { const u = (t * 0.25 + i / 5) % 1; d += `M${f(-40 + Math.sin(i * 2 + t) * 30 + u * 80)} ${f(-470 - u * 380)} a${f(40 + u * 70)} ${f(36 + u * 60)} 0 1 0 0.1 0Z`; }
  o += P(d, { fill: '#C9B8D8', opacity: 0.8, stroke: LINE, 'stroke-width': 5 });
  return G(o, tr(x, y, s));
}
function fern(x, y, s, sw = 0, col = '#3E9A4A') {
  let d = '';
  for (let i = 0; i < 5; i++) { const a = -70 + i * 35 + sw; const r = 160 - Math.abs(i - 2) * 22; const ex = Math.sin((a * Math.PI) / 180) * r, ey = -Math.cos((a * Math.PI) / 180) * r; d += `M0 0 Q${f(ex * 0.3)} ${f(ey * 0.9)} ${f(ex)} ${f(ey)}`; }
  return G(P(d, ln(30)) + P(d, ln(20, col)), tr(x, y, s));
}
function prehistoric(t) {
  let o = `<defs><linearGradient id="s09jura" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A5A"/><stop offset="0.55" stop-color="#FFC27A"/><stop offset="1" stop-color="#FFE6A8"/></linearGradient></defs>`;
  o += R(-600, -600, 3120, 2280, 0, { fill: 'url(#s09jura)' });
  o += CI(1500, 260, 120, { fill: '#FFF2B0', opacity: 0.55 }) + CI(1500, 260, 84, ol('#FFE36A', 6));
  o += volcano(t, 600, 760, 1.0);
  o += P('M-600 760 Q-200 600 200 720 Q600 640 1000 740 Q1400 620 2600 720 V1700 H-600 Z', { fill: '#C98A5A', stroke: LINE, 'stroke-width': 7 });
  // pterodactyl
  const px = ((t * 120) % 2600) - 300, py = 180 + Math.sin(t * 2) * 20, fl = Math.sin(t * 9) * 26;
  o += G(P(`M-70 ${f(-fl)} Q-30 -10 0 0 Q30 -10 70 ${f(-fl)} Q30 6 0 14 Q-30 6 -70 ${f(-fl)} Z M0 0 l40 -12 l-30 16 Z`, { fill: '#7A4A6E', stroke: LINE, 'stroke-width': 5, 'stroke-linejoin': 'round' }), tr(px, py, 0.9));
  o += R(-600, 880, 3120, 900, 0, { fill: '#B8743E' }) + P('M-600 880 H2600', ln(8)) + R(-600, 880, 3120, 900, 0, { fill: 'url(#cityPlank)', opacity: 0.08 });
  o += fern(150, 900, 1.4, Math.sin(t) * 3) + fern(330, 900, 1.0, Math.sin(t + 1) * 4, '#5CB45A') + fern(1720, 900, 1.5, Math.sin(t + 2) * 3) + fern(1880, 900, 1.1, Math.sin(t + 3) * 4, '#5CB45A');
  return o;
}

// ================================================================ CUTAWAY: 1964, the nine-foot fellow
const DOOR = { x: 560, w: 230, top: 370, floor: 960 };
const FT = 84; // px per foot at the stand line
function house1964(t, chart = 1) {
  let o = R(-800, -600, 3520, 2300, 0, { fill: '#A9C9D8' });
  o += R(-800, 140, 3520, 820, 0, { fill: '#E9D3A8' });
  let sid = '';
  for (let y = 160; y < 960; y += 34) sid += `M-800 ${y} H2720 `;
  o += P(sid, ln(4, '#C9AE80'));
  o += R(-800, 120, 3520, 34, 0, ol('#8A5A3A', 6));
  // door with frame
  const D = DOOR;
  o += R(D.x - 26, D.top - 30, D.w + 52, D.floor - D.top + 30, 4, ol('#F4EFE2', 7)) + R(D.x, D.top, D.w, D.floor - D.top, 4, ol('#7A3A2A', 7));
  o += R(D.x + 26, D.top + 30, D.w - 52, 160, 8, { fill: '#6A2E22', stroke: LINE, 'stroke-width': 4 }) + R(D.x + 26, D.top + 230, D.w - 52, 300, 8, { fill: '#6A2E22', stroke: LINE, 'stroke-width': 4 });
  o += CI(D.x + D.w - 34, D.top + 300, 14, ol('#E8C070', 4));
  o += T('1964', D.x + D.w / 2, D.top - 54, 44, '#7A3A2A');
  // window with curtains
  o += R(1420, 330, 340, 300, 6, ol('#F4EFE2', 7)) + R(1440, 350, 300, 260, 2, { fill: '#7FB8D8' }) + P('M1440 350 Q1500 480 1460 610 H1440 Z M1740 350 Q1680 480 1720 610 H1740 Z', ol('#E07A6A', 5)) + P('M1590 350 V610 M1440 480 H1740', ln(6, '#F4EFE2'));
  o += R(1400, 626, 380, 26, 6, ol('#F4EFE2', 6));
  // porch lamp + plant
  o += R(D.x + D.w + 50, 450, 40, 64, 10, ol('#FFE9A0', 5)) + P(`M${D.x + D.w + 70} 450 V420`, ln(6));
  o += P('M300 960 L280 860 H380 L360 960 Z', ol('#C8604A', 6)) + fern(330, 870, 0.55, Math.sin(t) * 4);
  // height chart (feet)
  if (chart > 0) {
    let c = R(1000, D.floor - 9.3 * FT, 90, 9.3 * FT, 6, ol('#FFF6DA', 6));
    let ticks = '';
    for (let i = 1; i <= 9; i++) { const y = D.floor - i * FT; ticks += `M1000 ${f(y)} h40 `; c += TF(`${i} FT`, 1066, y + 10, 22, i === 9 ? '#B23A48' : '#5A4A3A'); }
    for (let i = 0; i < 18; i++) ticks += `M1000 ${f(D.floor - (i + 0.5) * FT)} h18 `;
    c += P(ticks, ln(5));
    o += c;
  }
  // porch + sidewalk
  o += R(-800, 960, 3520, 40, 0, ol('#BDB6A8', 6)) + R(-800, 1000, 3520, 700, 0, { fill: '#8E9A72' });
  return o;
}
function fedora(s = 1) {
  return P('M-150 -950 Q-160 -930 -120 -926 H120 Q160 -930 150 -950 Q110 -962 96 -960 Q100 -1060 40 -1056 Q0 -1040 -40 -1056 Q-100 -1060 -96 -960 Q-110 -962 -150 -950 Z', ol('#5A4A3E', 7)) + P('M-96 -974 H96', ln(16, '#2A2028'));
}
// old film look over a frame (sepia, flicker, scratches, dust, gate)
function oldFilm(t, k = 1, label = '') {
  if (k <= 0) return '';
  const fr = Math.floor(t * 12);
  let o = R(0, 0, 1920, 1080, 0, { fill: '#C49A5A', opacity: f(0.34 * k) }) + R(0, 0, 1920, 1080, 0, { fill: '#2A1A0A', opacity: f((0.06 + 0.05 * hash(fr)) * k) });
  let d = '';
  for (let i = 0; i < 3; i++) if (hash(fr * 3 + i) > 0.45) { const x = hash(fr * 7 + i) * 1920; d += `M${f(x)} 0 L${f(x + (hash(i + fr) - 0.5) * 30)} 1080 `; }
  o += P(d, ln(2.5, '#FFF6E0', 0.5 * k));
  let sp = '';
  for (let i = 0; i < 9; i++) { const x = hash(fr * 11 + i * 3) * 1920, y = hash(fr * 13 + i * 5) * 1080, r = 2 + hash(i * fr) * 5; sp += `M${f(x - r)} ${f(y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`; }
  o += P(sp, { fill: '#1A1008', opacity: f(0.45 * k) });
  // gate: rounded dark edges
  o += P('M0 0 H1920 V1080 H0 Z M60 40 Q960 10 1860 40 Q1900 540 1860 1040 Q960 1070 60 1040 Q20 540 60 40 Z', { fill: '#1A1008', 'fill-rule': 'evenodd', opacity: f(0.75 * k) });
  if (label) o += G(R(-10, -44, 240, 64, 12, { fill: '#1A1008', opacity: 0.7 }) + T(esc(label), 110, 4, 52, '#FFE9B8'), tr(110, 120), { opacity: f(k) });
  return o;
}
// tiny rain cloud
function rainCloud(x, y, s, t) {
  let o = P('M-90 10 Q-120 10 -116 -20 Q-110 -50 -76 -46 Q-66 -86 -20 -84 Q20 -110 56 -76 Q100 -84 104 -40 Q130 -30 120 0 Q116 14 90 14 Z', ol('#8A8FA0', 6));
  let d = '';
  for (let i = 0; i < 6; i++) { const u = (t * 2.2 + i / 6) % 1; const dx = -70 + i * 28; d += `M${dx} ${f(30 + u * 160)} l-4 22 `; }
  return G(o + P(d, ln(6, '#6FA8E0')), tr(x, y, s));
}

// ================================================================ montage: what most people want (fly / fast / big / win)
function wantCell(kind, w, h, t) {
  let o = '';
  if (kind === 'fly') {
    o += CS.thumb('day', 0, 0, w, h);
    const u = (t * 0.35) % 1;
    o += CS.flyer(w * 0.5 + Math.sin(t * 2) * 30, h * (0.8 - 0.45 * u), 2.4, -10 + Math.sin(t * 3) * 8, { t, seed: 2 });
    o += CS.flyer(w * 0.22, h * 0.32 + Math.sin(t * 2.4) * 10, 1.4, 14, { t, seed: 5 });
  } else if (kind === 'fast') {
    o += CS.thumb('park', 0, 0, w, h);
    const x = ((t * 900) % (w + 400)) - 200;
    o += K.C.speedLines(x - 380, x - 60, h * 0.72, 6, 3, '#FFFFFF', 90) + CS.tinyPerson(x, h * 0.86, 3.2, 3, t * 30, 0, -12);
    o += K.C.dust(x - 120, h * 0.86, t - 0.1, t);
  } else if (kind === 'big') {
    o += CS.thumb('day', 0, 0, w, h);
    const g = 1 + 0.06 * Math.sin(t * 3);
    o += CS.tinyPerson(w * 0.5, h * 1.02, 6.2 * g, 6, 0, 0, 0);
    let hs = '';
    for (const [hx, hw] of [[0.08, 70], [0.24, 56], [0.68, 64], [0.84, 80]]) hs += G(R(-hw / 2, -hw * 0.7, hw, hw * 0.7, 3, ol('#F2C26B', 3)) + P(`M${-hw / 2 - 6} ${-hw * 0.7} L0 ${-hw * 1.2} L${hw / 2 + 6} ${-hw * 0.7} Z`, ol('#D9604F', 3)) + R(-8, -24, 16, 24, 2, { fill: '#7A3A2A' }), tr(w * hx, h * 0.97));
    o += hs + CS.tinyPerson(w * 0.33, h * 0.97, 1.0, 1, t * 8, 0, 0) + CS.tinyPerson(w * 0.75, h * 0.97, 1.0, 4, t * 8, 0, 0);
  } else {
    o += R(0, 0, w, h, 0, { fill: '#3A2A6A' }) + K.rays(w / 2, h * 0.45, 14, w, '#FFE58A', 0.18, t * 20);
    o += G(P('M-70 -90 H70 Q70 10 0 30 Q-70 10 -70 -90 Z', ol('#FFD24F', 7)) + P('M-70 -70 Q-120 -70 -110 -30 Q-100 0 -60 0 M70 -70 Q120 -70 110 -30 Q100 0 60 0', { ...ln(9), fill: 'none' }) + R(-14, 30, 28, 40, 4, ol('#E8A800', 5)) + R(-56, 70, 112, 26, 6, ol('#8A5636', 5)) + T('#1', 0, -26, 54, '#B88A1A'), tr(w / 2, h * 0.5, 1.15 + 0.04 * Math.sin(t * 5)));
    for (let i = 0; i < 12; i++) { const u = (t * 0.6 + hash(i) ) % 1; o += R(hash(i * 3) * w, u * h, 10, 16, 3, { fill: ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF'][i % 4], transform: `rotate(${f(t * 200 + i * 40)} ${f(hash(i * 3) * w + 5)} ${f(u * h + 8)})` }); }
  }
  return o;
}
const WANTS = [['fly', ';fly me', '1873'], ['fast', ';speed me', '1911'], ['big', ';size me 50', '1958'], ['win', ';win everything', '1999']];
function wantsQuad(t, onK) {
  let o = R(0, 0, 1920, 1080, 0, { fill: '#241820' }) + R(-200, -200, 2400, 1500, 0, { fill: 'url(#cityMonA)', opacity: 0.35 }) + R(0, 0, 1920, 1080, 0, { fill: '#120810', opacity: 0.5 });
  const W = 880, H = 470, x0 = 60, y0 = 40, gx = 40, gy = 30;
  WANTS.forEach(([kind, cmd, year], i) => {
    const x = x0 + (i % 2) * (W + gx), y = y0 + Math.floor(i / 2) * (H + gy);
    const k = onK(i);
    const sw = W - 24, sh = H - 40;
    let content = R(0, 0, sw, sh, 0, { fill: '#0A0806' });
    if (k <= 0.02) {
      let st = '';
      for (let j = 0; j < 7; j++) { const yy = hash(j * 3 + Math.floor(t * 15) + i * 7) * sh; st += `M0 ${f(yy)} H${f(sw * (0.3 + 0.7 * hash(j + i)))} `; }
      content += P(st, ln(3, '#5A5A66', 0.5)) + TF('NO SIGNAL', sw / 2, sh / 2 + 12, 34, '#4A4A56');
    }
    if (k > 0.02) {
      let c = wantCell(kind, sw, sh, t + i);
      c += G(K.chatCommand(0, 0, cmd, clamp((k - 0.15) * 3, 0, 1), { s: 0.9, t, user: 'player' }), tr(sw / 2, sh - 62));
      c += G(R(-8, -30, 150, 44, 10, { fill: '#000', opacity: 0.55 }) + TF(year, 66, 2, 30, '#FFE2B0'), tr(30, 50));
      const v = eo(clamp(k * 3, 0, 1));
      content += k < 0.34 ? G(c, `translate(0 ${f(sh / 2 * (1 - v))}) scale(1 ${f(Math.max(0.02, v))})`) + R(0, sh / 2 - 3, sw, 6, 0, { fill: '#FFFFFF', opacity: f(1 - v) }) : c;
    }
    o += CS.crt(x, y, W, H, ['grey', 'cream', 'wood', 'beige'][i], content, 0);
  });
  return o;
}

// ================================================================ screens (main CRT 556 x 350 local)
// the hero's log with a search box: q = typed query, found 0..1 shows "0 results"
const HERO_LOG = ['fly me', 'speed Granny', 'size Pancake 10', 'tp me to the fridge', 'fly Dad', 'god me', 'jail Brick', 'tp me to the front', 'speed me', 'noclip me', 'fly all', 'size all cats 100', 'god me', 'jail Admin', 'size me 100', 'tp me to the Admin'];
function searchScreen(w, h, t, q = '', found = 0, scroll = 0) {
  let o = R(0, 0, w, h, 0, { fill: '#04140A' });
  o += TF('ADMIN LOG — user: you', 22, 40, 26, '#8CFFA8', { 'text-anchor': 'start' }) + P(`M18 54H${w - 18}`, ln(3, '#2E7A44'));
  const n = HERO_LOG.length, off = scroll * (n - 6);
  let lines = '';
  for (let i = 0; i < n; i++) { const y = 92 + (i - off) * 34; if (y < 70 || y > h - 70) continue; lines += TF(esc('> ' + HERO_LOG[i]), 24, y, 25, '#8CFFA8', { 'text-anchor': 'start', opacity: f(found > 0 ? 0.35 : 1) }); }
  o += lines;
  // search box
  o += R(14, h - 60, w - 28, 46, 10, { fill: '#0B2A16', stroke: '#8CFFA8', 'stroke-width': 3 }) + TF(esc('FIND: ' + q) + (Math.floor(t * 3) % 2 && found < 0.5 ? '_' : ''), 30, h - 28, 26, '#FFFFFF', { 'text-anchor': 'start' });
  if (found > 0) o += G(R(-190, -50, 380, 100, 18, { fill: '#2A0C12', stroke: '#FF4D5E', 'stroke-width': 6 }) + T('0 RESULTS', 0, 20, 56, '#FF6A78', OUT(6)), `${tr(w / 2, h / 2 - 30)} scale(${f(ob(found))})`);
  return o;
}
// "panel history" (every hundred years, one person)
const HISTORY = [['1726', 'a shepherd'], ['1826', 'a baker'], ['1926', 'a mailman'], ['2026', 'you']];
function historyScreen(w, h, t, k) {
  let o = R(0, 0, w, h, 0, { fill: '#1A0E06' }) + TF('PANEL HOLDERS — one per 100 years', 22, 40, 24, '#FFC266', { 'text-anchor': 'start' }) + P(`M18 54H${w - 18}`, ln(3, '#7A4E1E'));
  HISTORY.forEach(([y, who], i) => {
    const kk = clamp(k * 4.2 - i, 0, 1);
    if (kk <= 0) return;
    const last = i === HISTORY.length - 1;
    o += G(TF(y, 30, 0, 34, last ? '#FFFFFF' : '#FFC266', { 'text-anchor': 'start' }) + TF(esc('— ' + who), 140, 0, 32, last ? '#FFE14D' : '#FFD9A0', { 'text-anchor': 'start' }) + (last ? R(-10, -34, w - 40, 48, 8, { fill: '#FFC266', opacity: 0.16 }) : ''), tr(20, 110 + i * 56), { opacity: f(kk) });
  });
  return o;
}

// ================================================================ SC 10 props
// cookie: half 0 = whole, -1 = left half, +1 = right half (origin = centre)
function cookie(x, y, s = 1, half = 0, rot = 0) {
  const r = 46;
  const d = half === 0 ? `M${-r} 0 a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`
    : half < 0 ? `M2 ${-r} A${r} ${r} 0 0 0 2 ${r} L-4 30 L6 12 L-2 -6 L8 -22 Z` : `M6 ${-r} A${r} ${r} 0 0 1 6 ${r} L12 30 L2 12 L10 -6 L0 -22 Z`;
  let o = P(d, ol('#E8B060', 6));
  const chips = [[-20, -18], [14, -24], [-6, 6], [22, 14], [-24, 22], [4, 30]].filter(([cx]) => half === 0 || (half < 0 ? cx < 2 : cx > 4));
  o += P(chips.map(([cx, cy]) => `M${cx - 6} ${cy} a6 5 0 1 0 12 0 a6 5 0 1 0 -12 0 Z`).join(''), { fill: '#5A3420' });
  return G(o, tr(x, y, s, rot));
}
// the hero's own sticky note for Mom
function heroNote(x, y, s = 1, rot = 0) {
  return ST.stickyNote(x, y, rot, ['SORRY.', "I'll clean", 'my room.', '— me'], { w: 230, size: 34, col: '#FFE45C', s, sw: 5, ink: '#2A2A55' });
}
// glowing ring portal (the server room's spare charger comes out of it) + the cable
function portalRing(x, y, s, t) {
  const sp = t * 2;
  let o = EL(0, 0, 120, 44, { fill: '#2A1E26', opacity: 0.9 }) + EL(0, 0, 120, 44, { fill: 'none', stroke: '#FFD24F', 'stroke-width': 18, opacity: 0.35 });
  o += EL(0, 0, 120, 44, { fill: 'none', stroke: LINE, 'stroke-width': 12 }) + EL(0, 0, 120, 44, { fill: 'none', stroke: '#FFC93C', 'stroke-width': 6 });
  o += EL(0, 0, 96, 30, { fill: '#FFB347', opacity: 0.25 });
  o += K.sparkles([[Math.cos(sp) * 130, Math.sin(sp) * 50, 14], [Math.cos(sp + 3) * 130, Math.sin(sp + 3) * 50, 10]], t);
  return G(o, tr(x, y, s));
}
function cable(x0, y0, x1, y1, sag = 120) {
  const d = `M${f(x0)} ${f(y0)} C${f(x0 + 60)} ${f(y0 + sag)} ${f(x1 - 40)} ${f(y1 + sag)} ${f(x1)} ${f(y1)}`;
  return P(d, { ...ln(14), fill: 'none' }) + P(d, { ...ln(7, '#F2EEE6'), fill: 'none' });
}
// little dawn street front (for the cats landing in their owners' arms): screen space, sidewalk at y 980
function catStreet(t) {
  let o = `<defs><linearGradient id="s10dawnSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9AA6EC"/><stop offset="0.6" stop-color="#F4AFC8"/><stop offset="1" stop-color="#FFE2B8"/></linearGradient></defs>`;
  o += R(-300, -300, 2520, 1700, 0, { fill: 'url(#s10dawnSky)' });
  o += P('M-300 300 H160 V140 H420 V260 H700 V60 H980 V200 H1320 V110 H1600 V240 H2220 V1200 H-300 Z', { fill: '#C9A6D8', opacity: 0.55 });
  // two shop fronts
  const shop = (x, w, col, sign, awn) => {
    let s = R(x, 120, w, 880, 0, ol(col, 7)) + R(x + 40, 560, w - 80, 230, 10, ol('#FFE6B8', 6)) + R(x + 40, 560, w - 80, 230, 10, { fill: '#FFFFFF', opacity: 0.25 });
    s += R(x + 60, 200, 150, 170, 8, ol('#FFE9B0', 5)) + R(x + w - 210, 200, 150, 170, 8, ol('#BFE6FF', 5)) + P(`M${x + 135} 200 V370 M${x + w - 135} 200 V370`, ln(5));
    let aw = `M${x + 20} 470 H${x + w - 20} V520`;
    const n = 8, sw = (w - 40) / n;
    for (let i = 0; i < n; i++) aw += `q${f(-sw / 2)} 26 ${f(-sw)} 0`;
    s += P(aw + 'Z', ol(awn, 6)) + P(Array.from({ length: n / 2 }, (_, i) => `M${f(x + 20 + (2 * i + 1) * sw)} 470 v50`).join(''), ln(sw * 0.9, '#FFFFFF', 0.45));
    s += R(x + w / 2 - 170, 410, 340, 54, 10, ol('#2A2246', 5)) + TF(sign, x + w / 2, 450, 38, '#FF8AD8');
    return s;
  };
  o += shop(-60, 1000, '#E58FB0', 'CAT CAFE', '#7A4FC8') + shop(940, 1060, '#7FC6A4', 'MEOW MART', '#E8453C');
  o += R(-300, 990, 2520, 400, 0, ol('#D4B8C8', 6)) + R(-300, 1040, 2520, 400, 0, { fill: '#9A82A8' });
  o += R(-300, 0, 2520, 1200, 0, { fill: '#FFB08A', opacity: 0.07 });
  return o;
}
// the bathtub guy's bathroom (screen space): tiles, window, towel, a hole in the ceiling (hole 0..1)
function bathroom(t, hole = 1) {
  let o = R(-300, -300, 2520, 1700, 0, { fill: '#BDEBFA' }) + R(-300, 140, 2520, 820, 0, { fill: 'url(#bathTiles)' });
  o += R(-300, 940, 2520, 400, 0, ol('#F2E2C8', 6)) + R(-300, 960, 2520, 40, 0, { fill: '#E2CDB0' });
  o += R(-300, -300, 2520, 440, 0, ol('#F4F0EA', 6));
  o += R(1380, 260, 300, 300, 12, ol('#FFFFFF', 7)) + R(1400, 280, 260, 260, 4, { fill: '#F9C2B0' }) + P('M1530 280 V540 M1400 410 H1660', ln(7, '#FFFFFF'));
  o += R(260, 300, 220, 300, 16, ol('#DDEFFA', 6)) + R(280, 320, 180, 260, 10, { fill: '#BFE0F2' }) + P('M300 360 L380 330 M300 420 L420 360', ln(6, '#FFFFFF', 0.7));
  o += R(1160, 420, 160, 12, 6, ol('#C9CED8', 4)) + P('M1180 432 H1300 V640 Q1240 660 1180 640 Z', ol('#FF8FC0', 5)) + P('M1180 600 H1300', ln(5, '#FFFFFF', 0.7));
  if (hole > 0) {
    const k = clamp(hole, 0, 1);
    o += P(`M${f(960 - 330 * k)} 140 L${f(960 - 260 * k)} ${f(140 - 120 * k)} L${f(960 - 90 * k)} ${f(140 - 150 * k)} L${f(960 + 120 * k)} ${f(140 - 140 * k)} L${f(960 + 300 * k)} ${f(140 - 90 * k)} L${f(960 + 340 * k)} 140 Z`, { fill: '#F7C2C8', stroke: LINE, 'stroke-width': 7, 'stroke-linejoin': 'round' });
    o += P(`M${f(960 - 320 * k)} 140 L${f(960 - 380 * k)} 170 M${f(960 + 330 * k)} 140 L${f(960 + 400 * k)} 176 M${f(960 + 60 * k)} 140 L${f(960 + 40 * k)} 180`, ln(5));
  }
  return o;
}
// five live monitors on the server-room wall: Mom, Dad, Granny, Zoe, Brick. Strip coords: x 0..3300 (monitor i at 160 + i*640)
const FAMILY = ['mom', 'dad', 'granny', 'zoe', 'brick'];
function familyFeed(name, w, h, t) {
  let o = '';
  const bg = { mom: '#FFE08E', dad: '#A8D0F2', granny: '#FFC2A8', zoe: '#C9B2F2', brick: '#F4AFC8' }[name];
  o += R(0, 0, w, h, 0, { fill: bg }) + R(0, h * 0.72, w, h * 0.28, 0, { fill: '#000', opacity: 0.12 });
  const bx = w / 2;
  if (name === 'mom') {
    o += R(w * 0.62, h * 0.08, w * 0.32, h * 0.9, 16, ol('#8ED8E6', 5)) + heroNote(w * 0.78, h * 0.3, 0.45, 4) + ST.stickyNote(w * 0.7, h * 0.62, -6, 'MILK!', { w: 60 });
    o += K.actor('mom', t, { x: bx - 40, y: h + 330, s: 0.62, turn: 0.35, face: { name: 'happy', fx: ['blush'] }, volume: false, shadow: false });
  } else if (name === 'dad') {
    o += R(w * 0.06, h * 0.16, w * 0.3, h * 0.44, 8, ol('#FFFFFF', 4)) + P(`M${w * 0.21} ${h * 0.16} V${h * 0.6} M${w * 0.06} ${h * 0.38} H${w * 0.36}`, ln(4));
    o += K.actor('dad', t, { x: bx + 40, y: h + 360, s: 0.6, turn: -0.3, face: { name: 'talkHappy', mouth: Math.floor(t * 7) % 2 ? 'O' : 'smile' }, armR: 40, volume: false, shadow: false });
  } else if (name === 'granny') {
    const zx = ((t * 600) % (w + 700)) - 350;
    o += CS.thumb('day', 0, 0, w, h * 0.8) + R(0, h * 0.78, w, h * 0.22, 0, { fill: '#7ED957' });
    o += CAST.fireTrail({ x: zx + 60, y: h * 0.7, len: 420, angle: 180, w: 60, t }) + K.actor('granny', t, { x: zx, y: h * 0.95, s: 0.32, fast: true, view: 'side', flip: true, ...A.run(t * 30), face: 'joy', volume: false, shadow: false });
  } else if (name === 'zoe') {
    o += K.actor('zoe', t, { x: bx, y: h + 320, s: 0.6, laptop: true, armL: 24, armR: 24, face: { name: 'smug' }, volume: false, shadow: false });
  } else {
    o += R(0, h * 0.5, w, h * 0.5, 0, { fill: '#6E7488' });
    o += K.actor('brick', t, { x: bx, y: h + 430, s: 0.48, armR: 60, face: { name: 'happy', fx: ['blush'] }, volume: false, shadow: false, props: [{ svg: cookie(A.hand(60, 1)[0], A.hand(60, 1)[1] - 20, 1.4, 1, 10), layer: 'front' }] });
  }
  return o;
}
function familyWall(t, pan, look = -1) {
  let o = R(-200, -200, 2400, 1500, 0, { fill: '#2A1E26' }) + G(R(-1000, -100, 5000, 1300, 0, { fill: 'url(#cityMonA)' }), `translate(${f(-pan * 0.6)} 0)`) + R(-200, -200, 2400, 1500, 0, { fill: '#1A0C10', opacity: 0.4 });
  const W = 560, H = 420;
  FAMILY.forEach((name, i) => {
    const x = 160 + i * 640 - pan, y = 300;
    if (x > 1960 || x + W < -40) return;
    const hl = look === i ? 1 : 0;
    o += CS.crt(x, y, W, H, ['cream', 'grey', 'wood', 'beige', 'dark'][i], familyFeed(name, W - 24, H - 40, t + i), 0);
    o += G(R(-10, -30, name.length * 24 + 40, 46, 12, ol('#1A1418', 4)) + TF(name.toUpperCase(), 10, 4, 30, '#FFE2B0', { 'text-anchor': 'start' }), tr(x + 30, y + H + 50));
    if (hl) o += R(x - 10, y - 10, W + 20, H + 20, 20, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 8, opacity: 0.8 });
  });
  return o;
}
// thought bubble with clipped content (content drawn for a w x h box at 0,0); tail toward (tx, ty)
function dreamBubble(x, y, w, h, k, content, tx, ty) {
  if (k <= 0) return '';
  const id = S.uid('s10db');
  const r = Math.min(w, h) * 0.18;
  let o = '';
  for (let i = 0; i < 3; i++) { const u = (i + 1) / 4; o += CI(lerp(tx, x + w / 2, u) - x, lerp(ty, y + h / 2, u) - y, 10 + i * 9, ol('#FFFFFF', 5)); }
  let bumps = '';
  const nx = Math.round(w / 90), ny = Math.round(h / 90);
  for (let i = 0; i <= nx; i++) bumps += `M${f(i * w / nx - r)} 0 a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z M${f(i * w / nx - r)} ${h} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  for (let j = 1; j < ny; j++) bumps += `M${-r} ${f(j * h / ny)} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z M${w - r} ${f(j * h / ny)} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  o += P(bumps, { fill: '#FFFFFF', stroke: LINE, 'stroke-width': 6 }) + R(0, 0, w, h, r, { fill: '#FFFFFF' });
  o += S.clipDef(id, R(10, 10, w - 20, h - 20, r * 0.8)) + G(content, null, { 'clip-path': `url(#${id})` }) + R(10, 10, w - 20, h - 20, r * 0.8, { fill: 'none', stroke: '#FFE58A', 'stroke-width': 4 });
  const sc = ob(k);
  return G(o, `translate(${f(x + w / 2)} ${f(y + h / 2)}) scale(${f(sc)}) translate(${f(-w / 2)} ${f(-h / 2)})`, { opacity: f(clamp(k * 3, 0, 1)) });
}

module.exports = {
  LINE, R, P, CI, EL, G, tr, esc, OUT, outT, outTF, ob, io, eo, at, drift, withShake, white, black, flashAt, whip,
  SEAT, seatFeet, oldSeated, teacup, newspaper, room, heroLap, teleIn, teleOut,
  feedWall, dino, prehistoric, DOOR, FT, house1964, fedora, oldFilm, rainCloud, wantsQuad, searchScreen, historyScreen, HERO_LOG,
  cookie, heroNote, portalRing, cable, catStreet, bathroom, familyWall, FAMILY, dreamBubble,
  CS, ST, A, CAST, CATS,
};
