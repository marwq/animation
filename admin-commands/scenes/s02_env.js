// Private helpers for SC 02 (the normal noob) + SC 03 (the one-dollar laptop): camera shorthands, cut flashes / whips,
// room compositing with a cheap night light, player cards, tags + stamps, split panels, the "Easy Obby for Babies"
// game world, Granny's tiny car + the snail, the speedometer, the dream bubble, desk close-up, cookies / coins / dollar,
// the kid with the cast, holographic command chips, the Admin's shadow.
'use strict';

const K = require('./kit');
const SETS = require('./sets');
const { pancake } = require('../rig/cats');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, view, actor } = K;
const C = K.C;
const LINE = '#151515';

// ---------------------------------------------------------------- basics
const camAt = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
const pop = (k) => ease.outBack(clamp(k, 0, 1));
const OUT = (w = 10, col = LINE) => ({ stroke: col, 'stroke-width': w, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
const FULL = (fill, op) => S.rect(-1200, -1000, 4320, 3080, 0, { fill, ...(op !== undefined ? { opacity: f(clamp(op, 0, 1)) } : {}) });
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const circD = (cx, cy, r) => `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
// eased 0..1 between two times, safe when the times are swapped by a shifted voice
const kIn = (t, a, b) => seg(t, Math.min(a, b), Math.max(a, b) + (a === b ? 0.01 : 0));

function shakeCam(cam, t, t0, dur = 0.4, amp = 14) {
  const sh = K.shake(t, t0, dur, amp);
  return { ...cam, sx: (cam.sx || 0) + sh.sx, sy: (cam.sy || 0) + sh.sy };
}
function shakes(cam, t, list) { let c = cam; for (const [t0, d, a] of list) c = shakeCam(c, t, t0, d, a); return c; }
// soft white flash around each cut
function cutFlash(t, cuts, k = 0.4, w = 0.07) {
  let o = 0;
  for (const tc of cuts) if (Math.abs(t - tc) < w) o = Math.max(o, k * (1 - Math.abs(t - tc) / w));
  return o > 0 ? C.whiteFlash(o) : '';
}
// whip-pan: streaks + flash centred on tc
function whip(t, tc, dur = 0.14, dir = 1) {
  const u = (t - tc) / dur;
  if (u < -1 || u > 1) return '';
  const k = 1 - Math.abs(u);
  let d = '';
  for (let i = 0; i < 18; i++) {
    const y = hash(i * 3.7 + Math.floor(tc * 10)) * 1080, len = 300 + hash(i * 1.9) * 900, h = 8 + hash(i) * 26;
    const x = ((((hash(i * 7.3) * 2600 - dir * u * 1600) % 2600) + 2600) % 2600) - 340;
    d += `M${f(x)} ${f(y)} h${f(len)} v${f(h)} h${f(-len)} Z `;
  }
  return S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(d, { fill: '#FFFFFF', opacity: f(0.75 * k) });
}

// ---------------------------------------------------------------- rooms
// composite a room set: bg (parallax kbg) + mid + behind (seated / in bed) + front + chars (floor) + fg + light (unless light:false) + over
function room(setFn, t, cam, opts, p = {}) {
  const Ls = setFn.layers(t, opts);
  let o = view(cam, Ls.bg, p.kbg ?? 0.7) + (p.outside ? view(cam, p.outside, 1) : '') + view(cam, Ls.mid + (p.behind || '') + Ls.front + (p.chars || ''), 1);
  if (Ls.fg) o += view(cam, Ls.fg, 1.2);
  if (p.light !== false && Ls.light) o += view(cam, Ls.light, 1);
  if (p.light === false && p.night) o += view(cam, p.night, 1);
  if (p.over) o += view(cam, p.over, 1);
  return o;
}
// cheap night light (world space): a blue tint everywhere + a soft pool of light at (x, y) built from a few rings
function nightLight(x, y, r0 = 140, r1 = 900, op = 0.62, n = 6, col = '#0B0A2E') {
  let o = S.path(`M-2400 -2000 H4400 V3200 H-2400 Z ` + circD(x, y, r1), { fill: col, 'fill-rule': 'evenodd', opacity: f(op) });
  for (let i = 0; i < n; i++) {
    const a = r0 + (r1 - r0) * i / n, b = r0 + (r1 - r0) * (i + 1) / n, u = (i + 0.5) / n;
    o += S.path(circD(x, y, b) + ' ' + circD(x, y, a), { fill: col, 'fill-rule': 'evenodd', opacity: f(op * u * u * (3 - 2 * u)) });
  }
  return o;
}

// ---------------------------------------------------------------- cards, tags, stamps
// player card (screen space): "● you   LVL 12 / sub". (x, y) = left/top. k = slide in, out = slide away.
function playerCard(user, sub, k, out, t, x = 70, y = 120, col = '#FFB13B', badge = '') {
  if (k <= 0 || out >= 1) return '';
  const u = ease.outBack(clamp(k, 0, 1)), v = ease.in(clamp(out, 0, 1));
  const w = Math.max(430, user.length * 44 + 210, sub.length * 19 + 110), h = 150;
  let o = S.rect(10, 14, w, h, 26, { fill: '#000', opacity: 0.28 });
  o += S.rect(0, 0, w, h, 26, ol('#141824', 7)) + S.rect(0, 0, 18, h, 0, { fill: col }) + S.rect(-2, 0, 30, h, 26, { fill: col });
  o += S.circle(62, 52, 13, { fill: '#3DFF9A', stroke: LINE, 'stroke-width': 4 }) + S.circle(62, 52, 13 + 6 * (0.5 + 0.5 * Math.sin(t * 6)), { fill: 'none', stroke: '#3DFF9A', 'stroke-width': 3, opacity: 0.5 });
  o += T(esc(user), 90, 72, 64, col, { 'text-anchor': 'start', ...OUT(9) });
  o += TF(esc(sub), 48, 124, 32, '#EAF2FF', { 'text-anchor': 'start' });
  if (badge) o += S.g(S.rect(-70, -24, 140, 48, 16, ol(col, 4)) + TF(esc(badge), 0, 10, 26, LINE), `translate(${f(w - 90)} 46) rotate(6)`);
  const dx = lerp(-w - 160, 0, u) - v * (w + 300);
  return S.g(o, `translate(${f(x + dx)} ${f(y)}) rotate(-2)`);
}
// a label sticker (screen or world space), k pops in
function tag(text, x, y, k, col = '#FFD21F', rot = -4, size = 64, fg = LINE) {
  if (k <= 0) return '';
  const w = text.length * size * 0.56 + size * 1.1, h = size * 1.45;
  const o = S.rect(-w / 2 + 8, -h / 2 + 10, w, h, h * 0.3, { fill: '#000', opacity: 0.25 }) + S.rect(-w / 2, -h / 2, w, h, h * 0.3, ol(col, 7)) +
    T(esc(text), 0, size * 0.36, size, fg);
  return S.g(o, `${tr(x, y, 1, rot)} scale(${f(pop(k))})`);
}
// rubber stamp slam: drops from 2.2x to 1x with a jolt; k = 0..1 (0.25 s)
function stamp(text, x, y, k, col = '#E8243C', rot = -12, size = 90) {
  if (k <= 0) return '';
  const u = ease.in(clamp(k * 1.4, 0, 1)), sc = lerp(2.4, 1, u), op = clamp(k * 3, 0, 1);
  const w = text.length * size * 0.6 + size * 0.9, h = size * 1.5;
  let o = S.rect(-w / 2, -h / 2, w, h, 16, { fill: 'none', stroke: col, 'stroke-width': size * 0.12 }) + S.rect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 10, { fill: 'none', stroke: col, 'stroke-width': size * 0.04 });
  o += T(esc(text), 0, size * 0.36, size, col, { 'letter-spacing': 4 });
  return S.g(o, `${tr(x, y, 1, rot)} scale(${f(sc)})`, { opacity: f(op * 0.92) });
}
// freeze-frame callout: label box at (x, y) with a fat arrow to (tx, ty)
function callout(text, x, y, tx, ty, k, col = '#FFE14D', size = 70) {
  if (k <= 0) return '';
  const u = pop(k);
  const ax = lerp(x, tx, 0.18), ay = lerp(y, ty, 0.18), bx = lerp(x, tx, 0.86 * clamp(k * 1.5, 0, 1)), by = lerp(y, ty, 0.86 * clamp(k * 1.5, 0, 1));
  const ang = Math.atan2(by - ay, bx - ax) * 57.3;
  let o = S.path(`M${f(ax)} ${f(ay)} Q${f((ax + bx) / 2 + 60)} ${f((ay + by) / 2 - 80)} ${f(bx)} ${f(by)}`, ln(30, LINE)) + S.path(`M${f(ax)} ${f(ay)} Q${f((ax + bx) / 2 + 60)} ${f((ay + by) / 2 - 80)} ${f(bx)} ${f(by)}`, ln(16, col));
  o += S.g(S.path('M0 -34 L50 0 L0 34 Z', ol(col, 7)), tr(bx, by, 1, ang));
  o += S.g(T(esc(text), 0, 0, size, col, OUT(14)), `${tr(x, y, 1, -6)} scale(${f(u)})`);
  return o;
}

// ---------------------------------------------------------------- split panels
// framed panel (screen space): inner = 1920x1080 composition, scaled to cover the w x h box and centred on focus
function panel(x, y, w, h, inner, k = 1, o2 = {}) {
  if (k <= 0) return '';
  const { focus = [960, 540], zoom = 1, border = '#FFFFFF', rot = 0, bw = 10, label = '', labelCol = '#FFD21F' } = o2;
  const id = S.uid('s02p');
  const sc = zoom * Math.max(w / 1920, h / 1080);
  const cont = S.g(inner, `translate(${f(w / 2)} ${f(h / 2)}) scale(${f(sc)}) translate(${f(-focus[0])} ${f(-focus[1])})`);
  let o = S.rect(10, 14, w, h, 18, { fill: '#000', opacity: 0.3 });
  o += S.clipDef(id, S.rect(0, 0, w, h, 16)) + S.g(S.rect(0, 0, w, h, 0, { fill: '#222' }) + cont, null, { 'clip-path': `url(#${id})` });
  o += S.rect(0, 0, w, h, 16, { fill: 'none', stroke: LINE, 'stroke-width': bw + 8 }) + S.rect(0, 0, w, h, 16, { fill: 'none', stroke: border, 'stroke-width': bw });
  if (label) o += tag(label, w / 2, -6, 1, labelCol, -3, 46);
  const sc2 = pop(k);
  return S.g(o, `translate(${f(x + w / 2)} ${f(y + h / 2)}) rotate(${f(rot)}) scale(${f(sc2)}) translate(${f(-w / 2)} ${f(-h / 2)})`);
}

// ---------------------------------------------------------------- small props
function cookie(x, y, r = 30, bite = 0, rot = 0) {
  let d = circD(0, 0, r);
  let o = S.path(d, ol('#D9964E', Math.max(3, r * 0.12))) + S.circle(-r * 0.2, -r * 0.25, r * 0.6, { fill: '#E9AE66', opacity: 0.6 });
  for (let i = 0; i < 5; i++) { const a = i * 2.1, rr = r * (0.25 + 0.4 * hash(i * 3.3)); o += S.ellipse(Math.cos(a) * rr, Math.sin(a) * rr, r * 0.14, r * 0.11, { fill: '#5A3418' }); }
  if (bite > 0) o += S.circle(r * 0.8, -r * 0.6, r * 0.45 * bite, { fill: '#000', opacity: 0 }) + S.path(`M${f(r * 0.3)} ${f(-r)} q${f(r * 0.2)} ${f(r * 0.35)} ${f(r * 0.7)} ${f(r * 0.5)}`, ln(r * 0.1));
  return S.g(o, tr(x, y, 1, rot));
}
function coinS(x, y, r = 22, rot = 0, col = '#C9CED8') {
  return S.g(S.ellipse(0, 0, r, r * 0.92, ol(col, Math.max(3, r * 0.14))) + S.ellipse(0, 0, r * 0.62, r * 0.56, { fill: 'none', stroke: '#9AA2B2', 'stroke-width': r * 0.1 }) + S.path(`M${f(-r * 0.5)} ${f(-r * 0.3)} q${f(r * 0.3)} ${f(-r * 0.4)} ${f(r * 0.7)} ${f(-r * 0.35)}`, ln(r * 0.1, '#FFFFFF')), tr(x, y, 1, rot));
}
function dollar(x, y, s = 1, rot = 0, crumple = 0) {
  let o = S.path(`M-90 -42 L${f(-30 + crumple * 8)} ${f(-46 + crumple * 6)} L90 -40 L${f(94 - crumple * 6)} 42 L${f(10)} ${f(46 - crumple * 8)} L-92 40 Z`, ol('#9FD69A', 5));
  o += S.rect(-74, -28, 148, 56, 6, { fill: 'none', stroke: '#4E9A4E', 'stroke-width': 4 }) + S.circle(0, 0, 22, ol('#BFE8B8', 3)) + T('1', 0, 12, 34, '#2E6A34') + T('1', -60, -8, 18, '#2E6A34') + T('1', 60, 22, 18, '#2E6A34');
  if (crumple > 0) o += S.path('M-40 -40 L-20 40 M30 -42 L44 44', ln(3, '#4E9A4E', 0.6 * crumple));
  return S.g(o, tr(x, y, s, rot));
}
// sandwich (triangle) for the pigeon gag
function sandwich(x, y, s = 1, rot = 0, bitten = 0) {
  let o = S.path('M-60 30 L60 30 L0 -50 Z', ol('#F4D9A0', 5)) + S.path('M-54 20 L54 20', ln(9, '#5CB85A')) + S.path('M-50 10 L50 10', ln(7, '#E8243C')) + S.path('M-60 30 L0 -50 L60 30', ln(5, '#D9AE62'));
  if (bitten > 0) o += S.circle(36, -6, 22, { fill: '#EAF2FF', opacity: 0 });
  return S.g(o, tr(x, y, s, rot));
}
// a white thumb sticking up from a fist (body space: put at the hand of a raised arm)
const thumbUp = (hx, hy, s = 1) => S.g(S.rect(-18, -70, 30, 58, 14, ol('#FFFFFF', 6)) + S.rect(-30, -22, 62, 50, 14, ol('#FFFFFF', 6)), tr(hx, hy, s));
// small golden crown (body space: on top of the hero's head ~ y -1010)
function crown(x, y, s = 1, rot = 0) {
  const o = S.path('M-80 30 L-92 -50 L-44 -12 L0 -70 L44 -12 L92 -50 L80 30 Z', ol('#FFD21F', 7)) + S.rect(-84, 22, 168, 30, 8, ol('#FFC12E', 6)) +
    S.circle(-92, -54, 12, ol('#FF5A8A', 4)) + S.circle(0, -74, 13, ol('#4FD1FF', 4)) + S.circle(92, -54, 12, ol('#FF5A8A', 4)) + S.path('M-60 6 L-50 -14 M60 6 L50 -14', ln(5, '#FFF4B0'));
  return S.g(o, tr(x, y, s, rot));
}
// birds flying away (V shapes), k 0..1
function birds(x, y, k, n = 7, seed = 2) {
  if (k <= 0 || k >= 1) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (hash(i + seed) - 0.5) * 2.2, v = 500 + 500 * hash(i * 3 + seed);
    const bx = x + Math.cos(a) * v * k + (hash(i * 5) - 0.5) * 120, by = y + Math.sin(a) * v * k - 60 * k;
    const fl = Math.sin(k * 40 + i * 2) * 14, s = 22 + 10 * hash(i * 7);
    d += `M${f(bx - s)} ${f(by - fl)} Q${f(bx - s * 0.4)} ${f(by - 4)} ${f(bx)} ${f(by + 6)} Q${f(bx + s * 0.4)} ${f(by - 4)} ${f(bx + s)} ${f(by - fl)} `;
  }
  return S.path(d, ln(7, LINE, 1 - k * 0.5));
}

// ---------------------------------------------------------------- kid with the broken arm (cast + sling)
function castKid(t, pose) {
  const a = 18, r = (a * Math.PI) / 180;
  const sx = -100, sy = -515, ex = sx - 252 * Math.sin(r), ey = sy + 252 * Math.cos(r);
  const mx = lerp(sx, ex, 0.3), my = lerp(sy, ey, 0.3);
  const cast = S.g(S.rect(-50, 0, 100, 200, 34, ol('#FBFBFF', 8)) + S.path('M-26 50 l22 10 M-30 110 q14 -12 30 0 M-20 160 l28 -8', ln(6, '#E8243C', 0.8)) + S.path('M-22 78 l10 16 l14 -16', ln(6, '#3A7BFF', 0.8)), `translate(${f(mx)} ${f(my)}) rotate(${f(a)})`);
  const sling = S.path(`M80 -540 L${f(ex + 10)} ${f(ey - 60)}`, ln(44, LINE)) + S.path(`M80 -540 L${f(ex + 10)} ${f(ey - 60)}`, ln(30, '#4F8EF7')) +
    S.path(`M${f(ex - 70)} ${f(ey - 110)} L${f(ex + 60)} ${f(ey - 90)} L${f(ex - 10)} ${f(ey + 10)} Z`, ol('#4F8EF7', 7));
  return K.draw.kid(pose.i ?? 6, { ...pose, armL: a, props: [...(pose.props || []), { svg: sling + cast, layer: 'top' }] });
}

// ---------------------------------------------------------------- EASY OBBY FOR BABIES (game world, 1920x1080 world space)
// spawn pad x 300..640 top 700; the lava surface y 760; platform 1 x 790..1010; duck at 1260; finish far right.
const OB = { padX0: 300, padX1: 640, top: 700, lava: 760, p1: [790, 1010], p2: [1160, 1360], p3: [1540, 1760] };
function block(x0, x1, top, col, label = '') {
  let o = S.rect(x0, top, x1 - x0, 56, 10, ol(col, 6)) + S.rect(x0 + 10, top + 6, x1 - x0 - 20, 12, 6, { fill: '#FFFFFF', opacity: 0.45 });
  o += S.path(`M${x0 + 30} ${top + 56} L${x0 + 40} ${top + 140} M${x1 - 30} ${top + 56} L${x1 - 40} ${top + 140}`, ln(14, LINE)) + S.path(`M${x0 + 30} ${top + 56} L${x0 + 40} ${top + 140} M${x1 - 30} ${top + 56} L${x1 - 40} ${top + 140}`, ln(7, '#E9E4F2'));
  if (label) o += T(esc(label), (x0 + x1) / 2, top + 44, 34, '#FFFFFF', OUT(6));
  return o;
}
function abcBlock(x, y, s, letter, col) {
  return S.g(S.rect(-40, -80, 80, 80, 10, ol(col, 6)) + S.rect(-28, -68, 56, 56, 6, { fill: '#FFFFFF', opacity: 0.85 }) + T(letter, 0, -24, 46, col), tr(x, y, s));
}
function duck(x, y, s, t) {
  const b = Math.sin(t * 2.4) * 6;
  let o = S.path('M-90 0 Q-100 -70 -20 -60 Q-30 -130 30 -130 Q90 -130 80 -70 L120 -64 L80 -46 Q110 10 40 20 L-60 20 Q-90 16 -90 0 Z', ol('#FFE14D', 7));
  o += S.circle(40, -100, 9, { fill: LINE }) + S.circle(43, -103, 3, { fill: '#FFFFFF' }) + S.path('M-60 -20 Q-20 -40 10 -14', ln(6, '#F2C12E'));
  return S.g(o, tr(x, y + b, s));
}
function lavaSurf(x0, x1, y, t, amp = 10, deep = 0) {
  let d = `M${x0} ${y + (deep || 2400)} L${x0} ${y}`;
  for (let x = x0; x <= x1; x += 60) d += ` Q${x + 30} ${f(y - amp + Math.sin(t * 3 + x * 0.02) * amp)} ${x + 60} ${f(y + Math.sin(t * 2 + x * 0.03) * 4)}`;
  return d + ` L${x1} ${y + (deep || 2400)} Z`;
}
// back (sky, decor, platforms) and front (lava over anything sinking in it)
function obbyWorld(t, o = {}) {
  let b = S.rect(-3000, -2000, 9000, 4400, 0, { fill: 'url(#s02obbySky)' });
  for (let i = 0; i < 9; i++) b += SETS.cloud(-1400 + i * 640 + ((t * 18 + i * 90) % 640), 140 + 120 * hash(i * 3.3), 0.9 + 0.6 * hash(i), i % 2 ? '#FFF2FA' : '#FFFFFF', '#F6C9E8');
  // far pastel blocks floating
  for (let i = 0; i < 8; i++) { const x = -1600 + i * 720 + hash(i) * 200, y = 380 + 120 * hash(i * 2.2); b += S.rect(x, y, 140, 46, 10, { fill: ['#BFE6FF', '#FFD3EC', '#D9F5C9', '#FFF0B0'][i % 4], opacity: 0.7 }); }
  // baby banner arch
  if (o.banner !== false) {
    b += S.path('M120 300 Q960 120 1800 300', ln(16, LINE)) + S.path('M120 300 Q960 120 1800 300', ln(8, '#FF9EC4'));
    for (let i = 0; i < 9; i++) { const u = (i + 0.5) / 9, x = lerp(120, 1800, u), y = 300 - Math.sin(u * Math.PI) * 180 * 0.78; b += S.path(`M${f(x - 40)} ${f(y)} L${f(x + 40)} ${f(y)} L${f(x)} ${f(y + 70)} Z`, ol(['#FFE14D', '#9FE0FF', '#FF9EC4', '#9FF0A8'][i % 4], 4)); }
  }
  // giant pacifier sign + "JUMP!" arrow
  b += S.g(S.rect(-6, -260, 12, 260, 4, ol('#E9E4F2', 4)) + S.rect(-110, -330, 220, 90, 18, ol('#FFFFFF', 6)) + TF('STAGE 1 OF 1', 0, -276, 30, '#FF6FA8'), tr(470, OB.top));
  b += S.g(S.path('M0 -40 L30 0 L12 0 L12 50 L-12 50 L-12 0 L-30 0 Z', ol('#3DFF9A', 5)), tr(720, 600 + Math.sin(t * 6) * 8, 1, 180)) + T('JUMP!', 720, 520, 40, '#FFFFFF', OUT(7));
  // platforms
  b += block(OB.padX0, OB.padX1, OB.top, '#9FD8FF', 'SPAWN') + block(OB.p1[0], OB.p1[1], OB.top, '#FFB3D6') + block(OB.p2[0], OB.p2[1], OB.top - 40, '#B9F0A8') + block(OB.p3[0], OB.p3[1], OB.top - 70, '#FFE38A');
  b += abcBlock(340, OB.top, 0.8, 'A', '#FF6FA8') + abcBlock(400, OB.top, 0.8, 'B', '#3DA8FF') + abcBlock(370, OB.top - 64, 0.8, 'C', '#3BD16F');
  // finish flag far right
  b += S.g(S.rect(-6, -300, 12, 300, 3, ol('#FFFFFF', 4)) + S.path('M6 -300 L130 -270 L6 -240 Z', ol('#3BD16F', 4)) + TF('FINISH', 60, -200, 28, '#FFFFFF', OUT(5)), tr(1700, OB.top - 70));
  // lava back glow
  b += S.rect(-3000, OB.lava - 40, 9000, 60, 0, { fill: '#FFB13B', opacity: 0.35 });
  // lava (front)
  let fr = S.path(lavaSurf(-3000, 6000, OB.lava, t), { fill: 'url(#s02lava)', stroke: LINE, 'stroke-width': 6 });
  let bub = '';
  for (let i = 0; i < 16; i++) { const ph = (t * (0.5 + hash(i) * 0.6) + hash(i * 3)) % 1, x = -1800 + i * 330 + hash(i * 5) * 120; bub += circD(x, OB.lava + 30 + (1 - ph) * 80, 6 + 10 * ph); }
  fr += S.path(bub, { fill: '#FFE14D', opacity: 0.8 });
  fr += duck(1260, OB.lava + 6, 0.9, t);
  return { back: b, front: fr };
}
// game HUD (screen space)
function obbyHUD(deaths, k = 1) {
  if (k <= 0) return '';
  let o = S.rect(40, 40, 330, 120, 22, { fill: '#000', opacity: 0.45 }) + TF('STAGE 1', 66, 92, 40, '#FFFFFF', { 'text-anchor': 'start' }) + TF(`DEATHS: ${Math.round(deaths).toLocaleString('en-US')}`, 66, 140, 30, '#FF8A8A', { 'text-anchor': 'start' });
  o += S.rect(1640, 40, 240, 70, 20, { fill: '#000', opacity: 0.45 }) + TF('EASY MODE', 1760, 86, 30, '#9FF0A8');
  return o;
}
// the game's thumbnail / title card (centred on 0,0; ~1300 x 760). words 0..4 = how many title words are in; sub 0..1
function obbyTitle(t, words = 4, sub = 1, circle = 0) {
  let o = S.rect(-660, -390, 1320, 780, 40, ol('#FFFFFF', 12)) + S.rect(-640, -370, 1280, 740, 30, { fill: 'url(#s02obbySky)' });
  o += S.path(lavaSurf(-640, 580, 250, t, 8, 120), { fill: 'url(#s02lava)' });
  o += SETS.cloud(-420, -260, 1.1, '#FFFFFF', '#F6C9E8') + SETS.cloud(430, -200, 0.9, '#FFF2FA', '#F6C9E8');
  // rattle + baby bottle
  o += S.g(S.circle(0, -60, 60, ol('#FF9EC4', 7)) + S.circle(-18, -78, 14, { fill: '#FFFFFF', opacity: 0.7 }) + S.rect(-14, 0, 28, 120, 12, ol('#9FD8FF', 6)) + S.circle(0, 130, 26, ol('#FFE14D', 6)), tr(-520, 40, 0.75, -20 + 8 * Math.sin(t * 5)));
  o += S.g(S.rect(-40, -60, 80, 140, 22, ol('#FFFFFF', 6)) + S.rect(-40, 20, 80, 60, 0, { fill: '#FFF4C8' }) + S.path('M-24 -60 L-16 -100 L16 -100 L24 -60 Z', ol('#FFB3D6', 6)) + S.path('M-40 -10 H-20 M-40 20 H-20 M-40 50 H-20', ln(4, '#9FD8FF')), tr(520, 60, 0.75, 16 - 6 * Math.sin(t * 4)));
  const W = ['EASY', 'OBBY', 'FOR', 'BABIES'], cols = ['#3DA8FF', '#FF6FA8', '#3BD16F', '#FFB13B'];
  const pos = [[-250, -170, 150], [210, -170, 150], [-230, 10, 120], [150, 10, 150]];
  W.forEach((wd, i) => { const k = clamp(words - i, 0, 1); if (k > 0) o += S.g(T(wd, 0, 0, pos[i][2], cols[i], OUT(22)), `${tr(pos[i][0], pos[i][1], 1, i % 2 ? 4 : -4)} scale(${f(pop(k))})`); });
  o += S.g(S.rect(-120, -26, 240, 52, 18, ol('#FFE14D', 5)) + TF('AGES 0-1', 0, 12, 32, LINE), tr(470, -320, 1, 6));
  if (sub > 0) {
    o += S.g(TF('(THE WHOLE FLOOR IS LAVA)', 0, 0, 40, '#FFFFFF', OUT(8)), tr(0, 150, 1, -1), { opacity: f(clamp(sub, 0, 1)) });
    if (circle > 0) { const c = clamp(circle, 0, 1); o += S.path('M-10 102 C-260 96 -380 120 -370 150 C-360 190 -120 206 40 200 C240 194 380 180 376 146 C372 110 200 96 -40 108', { fill: 'none', stroke: '#FF2E4E', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-dasharray': `${f(1700 * c)} 3000` }); }
  }
  return o;
}

// ---------------------------------------------------------------- Granny's tiny car (side view, faces right), the snail, the speedometer
// origin = ground under the middle; ~520 x 300 at s 1. g = granny pose extras; t for the bob
function grannyCar(x, y, s, t, g = {}) {
  const bob = Math.sin(t * 9) * 2;
  let o = '';
  // interior dark + Granny (side view facing right) behind the body
  o += S.path('M-150 -150 Q-120 -270 20 -276 Q150 -276 190 -150 Z', { fill: '#3A3550' });
  const gid = S.uid('s02car');
  o += S.clipDef(gid, S.rect(-300, -420, 600, 380, 0)) + S.g(actor('granny', t, { x: -6, y: 34, s: 0.34, view: 'side', flip: true, armL: 64, armR: 70, shadow: false, ...g }, { arms: false }), null, { 'clip-path': `url(#${gid})` });
  // steering wheel
  o += S.g(S.ellipse(0, 0, 14, 40, { fill: 'none', stroke: LINE, 'stroke-width': 9 }), tr(102, -168, 1, -18));
  // body with the window hole
  const bodyD = 'M-250 -40 Q-262 -130 -170 -150 L-150 -150 Q-120 -280 20 -284 Q160 -284 196 -150 L230 -146 Q272 -136 268 -60 L264 -40 Q240 -6 190 -6 L-200 -6 Q-250 -10 -250 -40 Z';
  const winD = 'M-120 -158 Q-96 -256 20 -260 Q140 -260 168 -158 Z';
  o += S.path(bodyD + ' ' + winD, { fill: '#9FE6D6', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 7, 'stroke-linejoin': 'round' });
  o += S.path('M-250 -70 L268 -70', ln(6, '#FFFFFF', 0.8)) + S.path('M24 -258 L24 -150', ln(7, LINE)) + S.path(winD, ln(6, LINE));
  o += S.path('M-90 -238 Q-60 -250 -20 -250', ln(6, '#FFFFFF', 0.5));
  o += S.circle(250, -100, 14, ol('#FFF4B8', 4)) + S.rect(-262, -96, 20, 26, 6, ol('#FF5A5A', 4));
  // fuzzy dice + flowers
  o += S.path('M60 -258 L60 -220', ln(3)) + S.rect(48, -222, 22, 22, 5, ol('#FFFFFF', 3)) + S.circle(54, -214, 2.5, { fill: LINE }) + S.circle(63, -207, 2.5, { fill: LINE });
  for (let i = 0; i < 3; i++) o += S.circle(-200 + i * 26, -150 - (i % 2) * 10, 11, ol(['#FF9EC4', '#FFE14D', '#B98ED8'][i], 3));
  // wheels
  for (const wx of [-150, 170]) o += S.circle(wx, -12, 46, ol('#2A2D38', 7)) + S.circle(wx, -12, 20, ol('#D9DEE8', 5)) + S.path(`M${wx} -12 l${f(16 * Math.cos(t * 0.6))} ${f(16 * Math.sin(t * 0.6))}`, ln(4));
  return S.g(o, `${tr(x, y, s)} translate(0 ${f(bob)})`);
}
function snail(x, y, s = 1, t = 0, o2 = {}) {
  const sp = o2.speed ?? 1;
  let o = S.ellipse(0, 4, 150, 14, { fill: '#000', opacity: 0.15 });
  // body
  o += S.path('M-150 0 Q-160 -30 -120 -40 L60 -40 Q110 -40 130 -90 L150 -150 Q160 -170 176 -150 L170 -80 Q166 -20 120 0 Z', ol('#C9E07A', 6));
  o += S.path('M130 -100 L120 -190 M152 -110 L166 -196', ln(14, LINE)) + S.path('M130 -100 L120 -190 M152 -110 L166 -196', ln(7, '#C9E07A'));
  o += S.circle(120, -196, 14, ol('#FFFFFF', 4)) + S.circle(168, -202, 14, ol('#FFFFFF', 4)) + S.circle(124, -196, 6, { fill: LINE }) + S.circle(172, -202, 6, { fill: LINE });
  o += S.path('M150 -66 Q160 -56 172 -66', ln(5));
  // shell (spiral) + racing stripe + tiny goggles
  o += S.circle(-20, -110, 92, ol('#F2A14A', 7)) + S.path('M-20 -110 m0 -12 a12 12 0 1 1 -12 12 a26 26 0 1 1 26 26 a42 42 0 1 1 -42 -42 a62 62 0 1 1 62 62', ln(7, '#B8642A'));
  o += S.path('M-100 -150 Q-20 -210 60 -150', ln(10, '#FFFFFF', 0.8));
  // scarf flapping
  const fl = Math.sin(t * 18) * 14;
  o += S.path(`M110 -60 Q60 ${f(-70 + fl)} -10 ${f(-50 - fl)} L-6 ${f(-36 - fl)} Q60 ${f(-52 + fl)} 108 -44 Z`, ol('#E8243C', 4));
  if (sp > 0) o += S.path('M-200 -120 h-120 M-220 -70 h-180 M-210 -20 h-140', ln(10, '#FFFFFF', 0.85 * clamp(sp, 0, 1)));
  return S.g(o, `${tr(x, y, s)}${o2.flip ? ' scale(-1 1)' : ''}`);
}
// dashboard speedometer, (x, y) = dial centre; mph 0..120
function speedometer(x, y, s, mph, t) {
  let o = S.rect(-1400, -900, 2800, 1800, 0, { fill: '#C9A27A' }) + S.rect(-1400, -360, 2800, 900, 0, { fill: 'url(#s02dash)' });
  o += S.circle(0, 0, 330, ol('#2A2D38', 14)) + S.circle(0, 0, 300, { fill: '#F4F1E6' });
  let ticks = '', nums = '';
  for (let v = 0; v <= 120; v += 5) {
    const a = (-210 + (v / 120) * 240) * Math.PI / 180, big = v % 20 === 0;
    ticks += `M${f(Math.cos(a) * 280)} ${f(Math.sin(a) * 280)} L${f(Math.cos(a) * (big ? 236 : 256))} ${f(Math.sin(a) * (big ? 236 : 256))} `;
    if (big) nums += TF(String(v), Math.cos(a) * 196, Math.sin(a) * 196 + 16, 44, '#2A2D38');
  }
  o += S.path(ticks, ln(8, '#2A2D38')) + nums + TF('MPH', 0, 120, 46, '#8A8A99');
  const a = -210 + (mph / 120) * 240 + Math.sin(t * 31) * 0.9;
  o += S.g(S.path('M-14 0 L0 -250 L14 0 Z', ol('#E8243C', 5)), `rotate(${f(a + 90)})`) + S.circle(0, 0, 34, ol('#2A2D38', 6));
  o += S.g(S.rect(-90, -40, 180, 80, 14, ol('#10141E', 6)) + T(String(Math.round(mph)), 0, 24, 64, '#9FF0A8'), 'translate(0 210)');
  // a doily + a tiny cat bobblehead on the dash
  o += S.g(S.ellipse(0, 0, 110, 26, { fill: '#FFFFFF', stroke: '#D9D2E6', 'stroke-width': 4, 'stroke-dasharray': '10 6' }), 'translate(470 290)');
  o += pancake({ x: 470, y: 296, s: 0.5, t, pose: 'sit', mood: 'lazy', rot: Math.sin(t * 7) * 4, shadow: false });
  return S.g(o, tr(x, y, s));
}

// ---------------------------------------------------------------- dream bubble / dream frame
const BUB = [[0, 0, 1], [-0.55, 0.12, 0.62], [0.55, 0.1, 0.66], [-0.3, -0.42, 0.62], [0.32, -0.44, 0.6], [-0.78, -0.18, 0.44], [0.8, -0.2, 0.46], [0, 0.42, 0.62]];
function bubbleD(w, h) {
  const ex = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)} a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0 a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0 Z`;
  return BUB.map(([u, v, r]) => ex(u * w * 0.5, v * h * 0.5, r * w * 0.31, r * h * 0.5)).join(' ');
}
// thought bubble centred on (x, y), w x h, inner = 1920x1080 composition (cover), trail toward (tx, ty)
function dreamBubble(x, y, w, h, inner, k, tx, ty, focus = [960, 540], zoom = 1) {
  if (k <= 0) return '';
  const id = S.uid('s02db');
  const d = bubbleD(w, h);
  const sc = zoom * Math.max(w / 1920, h / 1080) * 1.1;
  let o = '';
  for (let i = 0; i < 3; i++) { const u = (i + 1) / 4, kk = clamp(k * 4 - i, 0, 1); if (kk > 0) o += S.circle(lerp(tx, x, u) - x, lerp(ty, y + h * 0.4, u) - y, (10 + i * 10) * pop(kk), ol('#FFFFFF', 5)); }
  let b = S.path(d, { fill: LINE, stroke: LINE, 'stroke-width': 16, 'stroke-linejoin': 'round' }) + S.clipDef(id, S.path(d));
  b += S.g(S.rect(-w, -h, 2 * w, 2 * h, 0, { fill: '#FFE9F6' }) + S.g(inner, `scale(${f(sc)}) translate(${f(-focus[0])} ${f(-focus[1])})`), null, { 'clip-path': `url(#${id})` });
  const kk = clamp(k * 1.6 - 0.4, 0, 1);
  if (kk > 0) o += S.g(b, `scale(${f(pop(kk))})`);
  return S.g(o, tr(x, y));
}
// dream frame for full-screen dream shots: soft puffy cloud border + pink haze
function dreamFrame(t) {
  let d = '';
  for (let i = 0; i < 26; i++) {
    const u = i / 26, side = i % 4;
    const p = side === 0 ? [u * 4 % 1 * 1920, -10] : side === 1 ? [1930, (u * 4 % 1) * 1080] : side === 2 ? [(u * 4 % 1) * 1920, 1090] : [-10, (u * 4 % 1) * 1080];
    d += circD(p[0], p[1], 70 + 40 * hash(i * 2.3) + 8 * Math.sin(t * 2 + i));
  }
  return S.rect(0, 0, 1920, 1080, 0, { fill: '#FF9ED8', opacity: 0.12 }) + S.path(d, { fill: '#FFFFFF', opacity: 0.92 }) + K.sparkles([[220, 200, 26], [1700, 260, 30], [1640, 820, 22], [300, 860, 24]], t);
}

// ---------------------------------------------------------------- desk close-up (front view): wall, monitor, keyboard (the hero's desk)
// screen = svg|fn(w, h) for the 900 x 520 monitor screen centred at (960, 430)
function deskClose(t, screen, o2 = {}) {
  let o = S.rect(-400, -400, 2720, 1880, 0, { fill: '#FFD99A' }) + S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#setsHRPix)' });
  o += S.rect(-400, 690, 2720, 60, 0, { fill: '#FF6A3D' }) + S.rect(-400, 750, 2720, 30, 0, { fill: '#FFC23A' });
  o += S.rect(-400, 800, 2720, 900, 0, ol('#D99A5C', 8)) + S.rect(-400, 800, 2720, 34, 0, { fill: '#E8AE6E' });
  o += S.rect(870, 700, 180, 120, 10, ol('#2A2D38', 7)) + S.ellipse(960, 820, 220, 30, ol('#2A2D38', 7));
  o += S.rect(470, 130, 980, 600, 34, ol('#2A2D38', 10));
  const id = S.uid('s02dk');
  o += S.clipDef(id, S.rect(510, 170, 900, 520, 12));
  const scr = typeof screen === 'function' ? screen(900, 520) : (screen || '');
  o += S.g(S.rect(510, 170, 900, 520, 0, { fill: '#0E1220' }) + S.g(scr, 'translate(960 430)'), null, { 'clip-path': `url(#${id})` });
  o += S.rect(510, 170, 900, 520, 12, { fill: 'url(#setsShine)' }) + S.rect(510, 170, 900, 520, 12, ln(5, '#0B0C10'));
  // password sticky on the bezel
  if (o2.note !== false) o += SETS.stickyNote(1400, 640, -8, ['PASSWORD:', 'pancake', '123'], { w: 110, size: 17 });
  if (o2.keyboard !== false) o += S.path('M520 900 L1400 900 L1440 990 L480 990 Z', { fill: 'url(#setsKeysDark)', stroke: LINE, 'stroke-width': 7, 'stroke-linejoin': 'round' }) + S.ellipse(1560, 950, 50, 30, ol('#2A2D38', 6));
  return o;
}
// screen content: a text editor / chat with text lines (for "kkkk" and ";;;;"), fn(w, h)
function textScreen(lines, o2 = {}) {
  return (w, h) => {
    let o = S.rect(-w / 2, -h / 2, w, h, 0, { fill: o2.bg || '#F4F6FB' }) + S.rect(-w / 2, -h / 2, w, h * 0.1, 0, { fill: o2.bar || '#3A7BFF' }) + TF(o2.title || 'Notes', -w / 2 + 20, -h / 2 + h * 0.07, h * 0.05, '#FFFFFF', { 'text-anchor': 'start' });
    const size = o2.size || h * 0.075;
    lines.forEach((l, i) => { o += TF(esc(l), -w / 2 + 24, -h / 2 + h * 0.1 + size * 1.3 * (i + 1), size, o2.ink || '#2A3140', { 'text-anchor': 'start' }); });
    return o;
  };
}

// ---------------------------------------------------------------- holographic command chips (SC 03)
const CHIP_COL = { fly: '#7DF0FF', speed: '#FFB13B', size: '#B06BFF', jail: '#3DFF9A', tp: '#4FD1FF', god: '#FFE14D', noclip: '#9AA6FF', freeze: '#BFF4FF', kick: '#FF4D5E' };
function chipIcon(name, col) {
  switch (name) {
    case 'fly': return S.path('M-18 6 Q-30 -18 -6 -14 Q0 -30 12 -14 Q30 -16 18 6 Z', { fill: 'none', stroke: col, 'stroke-width': 4 }) + S.path('M-22 -4 L-34 -16 M22 -4 L34 -16', ln(4, col));
    case 'speed': return S.path('M-6 -22 L-16 4 L0 4 L-6 24 L16 -6 L0 -6 L6 -22 Z', { fill: col });
    case 'size': return S.path('M-18 18 L18 -18 M6 -18 H18 V-6 M-18 6 V18 H-6', ln(5, col));
    case 'jail': return S.rect(-18, -18, 36, 36, 4, { fill: 'none', stroke: col, 'stroke-width': 4 }) + S.path('M-8 -18 V18 M0 -18 V18 M8 -18 V18', ln(3, col));
    case 'tp': return S.circle(0, 0, 18, { fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-dasharray': '8 5' }) + S.circle(0, 0, 6, { fill: col });
    case 'god': return S.path('M0 -22 L18 -12 V4 Q18 18 0 24 Q-18 18 -18 4 V-12 Z', { fill: 'none', stroke: col, 'stroke-width': 4 }) + S.path('M-7 2 L-1 8 L9 -6', ln(4, col));
    case 'noclip': return S.rect(-4, -22, 8, 44, 2, { fill: col, opacity: 0.5 }) + S.path('M-22 0 H22 M12 -8 L22 0 L12 8', ln(4, col));
    case 'freeze': return S.path('M0 -22 V22 M-19 -11 L19 11 M-19 11 L19 -11', ln(4, col)) + S.circle(0, 0, 5, { fill: col });
    case 'kick': return S.path('M-16 -16 L16 16 M16 -16 L-16 16', ln(6, col));
    default: return '';
  }
}
// chip centred at (x, y); k pops it in; glow pulse with t
function holoChip(cmd, x, y, s, k, t, o2 = {}) {
  if (k <= 0) return '';
  const name = cmd.replace(/^;/, ''), col = o2.col || CHIP_COL[name] || '#3DFF9A';
  const w = 120 + cmd.length * 26, h = 84, fl = 0.85 + 0.15 * Math.sin(t * 7 + x * 0.01);
  let o = S.rect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 30, { fill: col, opacity: f(0.16 * fl) });
  o += S.rect(-w / 2, -h / 2, w, h, 24, { fill: '#08221A', 'fill-opacity': 0.72, stroke: col, 'stroke-width': 5 });
  o += S.path(`M${f(-w / 2 + 16)} ${f(-h / 2 + 10)} H${f(w / 2 - 16)}`, ln(3, '#FFFFFF', 0.35));
  o += S.g(chipIcon(name, col), `translate(${f(-w / 2 + 46)} 0)`) + TF(esc(cmd), -w / 2 + 82, 14, 42, '#EAFFF6', { 'text-anchor': 'start' });
  // scanline flicker
  if (hash(Math.floor(t * 20) + x) > 0.9) o += S.rect(-w / 2, -6, w, 6, 0, { fill: col, opacity: 0.5 });
  return S.g(o, `${tr(x, y, s * pop(k), o2.rot || 0)}`, { opacity: f(clamp(k * 2, 0, 1) * (o2.op ?? 1)) });
}

// ---------------------------------------------------------------- the Admin's crowned shadow (SC 03 foreshadowing), origin = feet
function adminShadow(x, y, s, op = 0.5) {
  if (op <= 0) return '';
  const d = 'M-170 0 L-150 -380 Q-140 -470 -60 -500 L-70 -560 L-80 -760 L80 -760 L70 -560 L60 -500 Q140 -470 150 -380 L170 0 Z M-90 -770 L-110 -880 L-55 -830 L0 -900 L55 -830 L110 -880 L90 -770 Z';
  return S.g(S.path(d, { fill: '#120A2E' }), tr(x, y, s), { opacity: f(op) });
}

const DEFS = `<defs>
<linearGradient id="s02obbySky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD0FF"/><stop offset="0.55" stop-color="#E7D2FF"/><stop offset="1" stop-color="#FFD6EC"/></linearGradient>
<linearGradient id="s02lava" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB13B"/><stop offset="0.25" stop-color="#FF6A2E"/><stop offset="1" stop-color="#C8242E"/></linearGradient>
<linearGradient id="s02dash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A6A4A" stop-opacity="0"/><stop offset="1" stop-color="#3A2A1A" stop-opacity="0.5"/></linearGradient>
<linearGradient id="s02dream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB8E2"/><stop offset="0.5" stop-color="#FFE3A8"/><stop offset="1" stop-color="#C9E8FF"/></linearGradient>
</defs>`;

module.exports = {
  camAt, pop, OUT, FULL, tr, esc, circD, kIn, shakeCam, shakes, cutFlash, whip, room, nightLight,
  playerCard, tag, stamp, callout, panel, cookie, coinS, dollar, sandwich, thumbUp, crown, birds, castKid,
  OB, obbyWorld, obbyHUD, obbyTitle, grannyCar, snail, speedometer, dreamBubble, dreamFrame, deskClose, textScreen,
  CHIP_COL, holoChip, adminShadow, DEFS,
};
