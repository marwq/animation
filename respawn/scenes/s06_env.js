// Private helpers for SC 06 («СЛИШКОМ ИДЕАЛЬНО») and SC 11 («ПОСЛЕ») — the two scenes rhyme (Ivy's workshop, Dad's joke,
// Bea, Gary), so they share: camera/transition helpers, room compositing, the calendar title card, the rimshot drum kit,
// Dad's held spatula with a waffle/pancake, a waffle, Ivy's score card, the Elephant-Toothpaste easel, the memory polaroid,
// an animated Book of Fails (closing + handwriting on its pages), a pencil in the hero's hand, big-head "chibi" kids for
// the kindergarten flashback, crayon doodles and the paper frame.
'use strict';

const K = require('./kit');
const R = require('./respawn');
const H = require('./sets_home');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, view, actor } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const TS = (txt, x, y, size, fill, extra = {}) => T(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(esc(txt), x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const popOut = (t, tIn, tOut, d = 0.28, dOut = 0.2) => pop(t, tIn, d) * (1 - seg(t, tOut, tOut + dOut));
// camera centring world point (wx, wy) on screen at zoom z (parallax 1)
const at = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
const toScr = (cam, x, y) => { const z = cam.zoom ?? 1; return [960 + (cam.sx || 0) + z * (x - 960 - (cam.x || 0)), 540 + (cam.sy || 0) + z * (y - 540 - (cam.y || 0))]; };
const mixCam = (a, b, u) => ({ zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, u), x: lerp(a.x || 0, b.x || 0, u), y: lerp(a.y || 0, b.y || 0, u) });
function shakeAll(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
// slow drift between two cams over [a, b] (ease in-out)
const drift = (t, a, b, c0, c1, e = ease.inOut) => mixCam(c0, c1, e(seg(t, a, b)));
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s06c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}
const zoomAbout = (svg, cx, cy, z) => (Math.abs(z - 1) < 1e-4 ? svg : S.g(svg, `translate(${f(cx)} ${f(cy)}) scale(${f(z)}) translate(${f(-cx)} ${f(-cy)})`));

// ---------------------------------------------------------------- transitions
function whip(t, tc, dir = 1, dur = 0.1) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * HH, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(0.6 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
const dip = (k, col = '#0B1030') => (k > 0.002 ? S.rect(0, 0, W, HH, 0, { fill: col, opacity: f(clamp(k, 0, 1)) }) : '');
// radial zoom lines around (cx, cy) for punchlines
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 500;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
// soft letterbox for the quiet beats
const bars = (k, h = 70) => (k > 0 ? S.rect(0, 0, W, h * k, 0, { fill: '#0A0812' }) + S.rect(0, HH - h * k, W, h * k, 0, { fill: '#0A0812' }) : '');

// ---------------------------------------------------------------- room compositing (world space, one camera)
// L = set.layers(...): bg (parallax kbg), mid, [behind = chars behind the furniture], front, [floor = chars on the floor], fg, light
function room(L, cam, { behind = '', floor = '', over = '', kbg = 0.85 } = {}) {
  return view(cam, L.bg || '', kbg) + view(cam, (L.mid || '') + behind + (L.front || '') + floor + (L.fg || '') + (L.light || '') + over, 1);
}
const SW = H.SPOTS.workshop, SK = H.SPOTS.kitchen;
// the hero's checkpoint pad in Ivy's workshop (SC 06 only — SC 11 has none: the save was deleted)
const PAD = { x: 1470, y: 985, s: 0.5 };
const BOWL = { x: 1230, y: 560, s: 0.2 };         // Gary's bowl on the kitchen counter (agreed with SC 02)

// ---------------------------------------------------------------- the calendar title card (WEDNESDAY / SATURDAY / MONDAY)
// tear-off calendar page, slams in (k 0..1), stamp kStamp 0..1 (REHEARSAL), out 0..1 flies away
function calendarCard(x, y, k, day, o = {}) {
  const { stamp = '', kStamp = 0, out = 0, sub = '', col = '#E8453C', s = 1, rot = -4, stampCol = '#7A3FD0' } = o;
  if (k <= 0.001 || out >= 1) return '';
  const sc = s * lerp(1.7, 1, ease.outBack(clamp(k, 0, 1))) * (1 - 0.3 * ease.in(out));
  const op = clamp(k * 4, 0, 1) * (1 - out);
  let c = S.rect(-262, -150, 540, 320, 26, { fill: '#000', opacity: 0.25 });
  c += S.rect(-270, -160, 540, 320, 26, ol('#FFFDF6', 8));
  c += S.path('M-270 -100 L270 -100 L270 -134 Q270 -160 244 -160 L-244 -160 Q-270 -160 -270 -134 Z', ol(col, 8));
  for (const rx of [-170, -60, 60, 170]) c += S.rect(rx - 10, -186, 20, 52, 10, ol('#C9CED8', 5));
  c += TS(day, 0, 40, day.length > 8 ? 96 : 110, '#2A1640', { 'stroke-width': 0, 'letter-spacing': 2 });
  if (sub) c += TF(esc(sub), 0, 118, 38, '#7A6A8A');
  c += S.path('M-240 150 Q-120 138 0 152 Q120 140 240 150', ln(3, '#D8CFC0'));
  if (kStamp > 0) {
    const ks = ease.outBack(clamp(kStamp, 0, 1));
    const st = S.rect(-210, -46, 420, 92, 14, { fill: 'none', stroke: stampCol, 'stroke-width': 9 }) + T(esc(stamp), 0, 26, 64, stampCol, { 'letter-spacing': 4 });
    c += S.g(st, `translate(40 96) rotate(-9) scale(${f(lerp(2.2, 1, ks))})`, { opacity: f(clamp(kStamp * 3, 0, 1) * 0.92) });
  }
  return S.g(c, `translate(${f(x + out * 900)} ${f(y - out * 300)}) rotate(${f(rot + out * 30)}) scale(${f(sc)})`, { opacity: f(op) });
}
// small corner day tag ("MONDAY")
function dayTag(x, y, k, txt, col = '#2EC4B6') {
  if (k <= 0.001) return '';
  const w = R.textW(txt, 46, 'L') + 60;
  return S.g(S.rect(-w / 2, -40, w, 76, 22, ol(col, 6)) + T(esc(txt), 0, 18, 46, '#FFFFFF'), `translate(${f(x)} ${f(y)}) rotate(-4) scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
}

// ---------------------------------------------------------------- rimshot drum kit (rhymes with SC 02)
// (x, y) = floor centre of the kit, screen px. k 0..1 pops it in (sinks out with k → 0); hits [t1, t2] = ba-dum, tss = cymbal time;
// fizzle 0..1 = the sticks freeze and droop (the joke got cut off).
function drumKit(x, y, s, t, o = {}) {
  const { k = 1, hits = [], tss = null, fizzle = 0 } = o;
  if (k <= 0.001) return '';
  const hitK = (tt) => (tt === null || tt === undefined ? 0 : t >= tt && t < tt + 0.16 ? 1 - (t - tt) / 0.16 : 0);
  const h1 = hits.length ? Math.max(...hits.map(hitK)) : 0;
  const ht = hitK(tss);
  const wob = tss !== null && t >= tss ? Math.sin((t - tss) * 34) * 14 * Math.exp(-(t - tss) * 3.5) : 0;
  let o_ = '';
  // hi-hat / crash cymbal on a stand (right)
  o_ += S.path('M150 0 L150 -250 M120 0 L150 -60 L180 0', ln(8, '#8E96A6'));
  o_ += S.g(S.ellipse(0, 0, 110, 22, ol('#FFCF3A', 6)) + S.ellipse(0, -2, 26, 8, ol('#E0A81A', 4)) + S.path('M-80 -6 Q0 -18 80 -6', ln(4, '#FFF1A8')), `translate(150 -250) rotate(${f(-8 + wob)})`);
  // snare drum (left)
  o_ += S.path('M-160 0 L-120 -150 M-80 0 L-120 -150 M-120 -150 L-120 -170', ln(8, '#8E96A6'));
  o_ += S.rect(-215, -250, 190, 100, 14, ol('#E8453C', 6)) + S.path('M-215 -235 L-25 -235 M-215 -165 L-25 -165', ln(6, '#FFFFFF'));
  for (let i = 0; i < 4; i++) o_ += S.path(`M${-196 + i * 48} -235 L${-184 + i * 48} -165`, ln(4, '#C9CED8'));
  o_ += S.ellipse(-120, -250, 95, 22, ol('#F4F1E8', 6));
  // sticks: rest above the snare; strike on hits; droop when fizzled
  const a1 = lerp(-40, 8, h1) + fizzle * 55, a2 = lerp(-20, 30, Math.max(h1 * 0.6, ht)) + fizzle * 70;
  const stick = (px, py, a) => S.g(S.rect(-7, -170, 14, 180, 7, ol('#E9C58F', 4)) + S.ellipse(0, -172, 10, 12, ol('#E9C58F', 4)), `translate(${f(px)} ${f(py)}) rotate(${f(a)})`);
  o_ += stick(-170, -260 - 30 * (1 - h1), -60 - a1 * 0.5) + stick(-40, -270, 50 + a2);
  if (h1 > 0) o_ += K.C.burst(-120, -260, 1 - h1, '#FFFFFF');
  const sc = s * ease.outBack(clamp(k, 0, 1));
  return S.g(o_, `translate(${f(x)} ${f(y + (1 - clamp(k, 0, 1)) * 200)}) scale(${f(sc)})`);
}

// ---------------------------------------------------------------- food + hand props
// waffle: face-on square golden waffle (≈ 150 px at s 1), centre (x, y); cap = a tiny graduation cap (the joke); bite
function waffle(x, y, s = 1, rot = 0, o = {}) {
  const { cap = false, butter = true, syrup = false, sq = 1 } = o;
  let w = S.rect(-75, -75, 150, 150, 26, ol('#F2B24A', 6));
  let grid = '';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) grid += `M${-58 + i * 30} ${-58 + j * 30}h24v24h-24Z`;
  w += S.path(grid, { fill: '#D68A28', stroke: '#B86E1A', 'stroke-width': 2.5 });
  w += S.path('M-62 -64 L40 -64', ln(5, '#FFE2A0'));
  if (syrup) w += S.path('M-40 -50 Q-10 -30 10 -46 Q30 -20 50 -36 L46 10 Q38 30 30 6 Q20 40 8 10 Q-20 34 -30 4 Z', { fill: '#A3561A', opacity: 0.85 });
  if (butter) w += S.rect(-22, -22, 44, 36, 8, ol('#FFF0A0', 4)) + S.path('M-14 -14 L10 -14', ln(4, '#FFFFFF'));
  if (cap) {
    w += S.g(S.path('M-70 -18 L0 -48 L70 -18 L0 12 Z', ol('#22222E', 5)) + S.path('M-34 -6 L-34 22 Q0 38 34 22 L34 -6', ol('#22222E', 5)) + S.path('M0 -18 Q40 -10 46 30', ln(4, '#FFD23F')) + S.circle(46, 34, 7, ol('#FFD23F', 3)), 'translate(4 -86) rotate(-8)');
  }
  return S.g(w, `${tf(x, y, s, rot)} scale(${f(sq)} ${f(1 / sq)})`);
}
// Dad holding the spatula at an arbitrary angle (rot: 0 = blade up; arm angle decides where the hand is) with an optional item
// on the blade: item = 'pancake' | 'waffle' | 'waffleCap'; returns the pose with a 'front' prop
const D_DAD = CAST.D.dad;
function dadSpatula(pose, rot, item = null, o = {}) {
  const h = CAST.handAt(D_DAD, pose, 1);
  let p = X.spatula({ x: h[0], y: h[1], s: 0.8, rot });
  const r = (rot * Math.PI) / 180, L = 266 * 0.8;
  const bx = h[0] + Math.sin(r) * L, by = h[1] - Math.cos(r) * L;
  if (item === 'pancake') p += X.pancake({ x: bx + (o.dx || 0), y: by - 14 + (o.dy || 0), s: 0.9, rot: o.itemRot || 0 });
  else if (item === 'waffle' || item === 'waffleCap') p += waffle(bx + (o.dx || 0), by - 60 + (o.dy || 0), 0.95, o.itemRot ?? rot * 0.15, { cap: item === 'waffleCap', sq: o.sq || 1 });
  return { ...pose, props: [...(pose.props || []), { svg: p, layer: 'front' }], _blade: [bx, by] };
}
// score card on a stick (Ivy's "6/10"); (x, y) = grip, rot 0 = up; ≈ 260 wide at s 1
function scoreCard(x, y, s = 1, rot = 0, txt = '6/10') {
  let c = S.rect(-10, -170, 20, 190, 8, ol('#C98A52', 5));
  c += S.rect(-130, -330, 260, 180, 18, ol('#FFFFFF', 7)) + S.rect(-118, -318, 236, 156, 12, { fill: 'none', stroke: '#FFD23F', 'stroke-width': 5 });
  c += T(esc(txt), 0, -200, 104, '#E8453C', { 'letter-spacing': 2 });
  return S.g(c, tf(x, y, s, rot));
}
// a pencil (tip at 0,0, pointing down-left at rot 0) + the hero's white R6 hand and red cuff gripping it
function pencilHand(x, y, s = 1, rot = 0, o = {}) {
  const { hand = true } = o;
  let p = S.g(S.path('M0 0 L22 -40 L-4 -52 Z', ol('#F4D8A8', 4)) + S.path('M0 0 L8 -15 L-2 -20 Z', { fill: '#2A2A33' }) +
    S.path('M22 -40 L150 -300 L124 -312 L-4 -52 Z', ol('#FFD23F', 5)) + S.path('M14 -44 L138 -306', ln(4, '#E0A81A')) +
    S.path('M150 -300 L168 -338 L142 -350 L124 -312 Z', ol('#C9CED8', 4)) + S.path('M168 -338 L180 -364 Q174 -380 158 -374 L142 -350 Z', ol('#FF8FB0', 4)), '');
  if (hand) {
    p += S.g(S.rect(-60, -70, 130, 120, 30, ol('#FFFFFF', 6)) + S.path('M-40 -30 Q-10 -46 30 -40', ln(4, '#D8D8E0')), 'translate(86 -150) rotate(-26)');
    p += S.g(S.rect(-80, -40, 170, 300, 26, ol('#E23B34', 6)) + S.rect(-80, -40, 170, 46, 20, ol('#C42A24', 5)), 'translate(150 -40) rotate(-26)');
  }
  return S.g(p, tf(x, y, s, rot));
}
// glue bottle (kindergarten): bottom centre
function glueBottle(x, y, s = 1, rot = 0, squeeze = 0) {
  let g = S.path(`M-40 0 L-44 -120 Q-40 -${f(150 - 8 * squeeze)} 0 -${f(152 - 8 * squeeze)} Q40 -${f(150 - 8 * squeeze)} 44 -120 L40 0 Z`, ol('#FFFFFF', 6));
  g += S.rect(-36, -100, 72, 54, 8, ol('#FFD23F', 4)) + T('GLUE', 0, -63, 28, '#E8453C');
  g += S.path('M-16 -150 L-10 -196 L10 -196 L16 -150 Z', ol('#FF8A3D', 5)) + S.path('M-4 -196 L0 -222 L4 -196 Z', ol('#FF8A3D', 4));
  if (squeeze > 0) g += S.path(`M0 -222 Q-4 -${f(240 + 30 * squeeze)} 6 -${f(250 + 40 * squeeze)}`, ln(10, '#FFFFFF')) + S.path(`M0 -222 Q-4 -${f(240 + 30 * squeeze)} 6 -${f(250 + 40 * squeeze)}`, ln(3, '#D8D8E0'));
  return S.g(g, tf(x, y, s, rot));
}

// ---------------------------------------------------------------- the Elephant Toothpaste easel (Ivy whips the sheet off)
// (x, y) = floor centre; reveal 0..1 (the cover sheet flies off), t for the wobble
function easel(x, y, s, t, reveal = 0) {
  let e = S.path('M-150 0 L-110 -620 M150 0 L110 -620 M0 -40 L0 -560', ln(16, '#8A5A33')) + S.path('M-150 0 L-110 -620 M150 0 L110 -620', ln(8, '#B98552'));
  e += S.rect(-190, -260, 380, 26, 6, ol('#8A5A33', 5));
  // the chart
  let c = S.path('M-180 -660 L180 -664 L184 -250 L-184 -246 Z', ol('#FFFDF4', 6));
  c += S.rect(-40, -690, 80, 40, 6, ol('#C9CED8', 4));
  c += S.g(T('ELEPHANT', 0, 0, 52, '#7A3FD0') + T('TOOTHPASTE!', 0, 52, 48, '#E8453C'), 'translate(0 -590) rotate(-3)');
  // doodle: hat + foam volcano + elephant head with a toothbrush
  c += S.path('M-150 -300 L-150 -360 Q-110 -372 -70 -360 L-70 -300 Z', ol('#26222E', 4)) + S.path('M-160 -360 L-60 -360', ln(8));
  c += S.path('M-140 -372 Q-170 -420 -130 -440 Q-110 -480 -80 -446 Q-50 -460 -60 -420 Q-40 -390 -80 -372', { fill: '#FFFFFF', stroke: '#FF6FA8', 'stroke-width': 5, 'stroke-dasharray': '10 6' });
  c += S.path('M-30 -400 L20 -400', ln(5, '#3A3A48')) + S.path('M10 -412 L24 -400 L10 -388', ln(5, '#3A3A48'));
  c += S.ellipse(100, -390, 52, 48, ol('#B9C0CC', 4)) + S.ellipse(48, -396, 28, 40, ol('#9EA6B4', 4)) + S.ellipse(152, -396, 28, 40, ol('#9EA6B4', 4));
  c += S.path('M100 -360 Q104 -320 80 -300 Q70 -294 74 -286', ln(10, '#B9C0CC')) + S.circle(88, -398, 5, { fill: LINE }) + S.circle(112, -398, 5, { fill: LINE });
  c += S.path('M60 -292 L110 -300', ln(7, '#3BD16F')) + S.rect(104, -312, 24, 14, 4, ol('#FFFFFF', 3));
  c += TF('1 hat + 2 flasks', -60, -270, 22, '#2A3A6A', { 'text-anchor': 'start' });
  e += S.g(c, `rotate(${f(Math.sin(t * 2) * 0.6)} 0 -250)`);
  // the cover sheet: flies off up-right
  if (reveal < 1) {
    const u = ease.in(clamp(reveal, 0, 1));
    const sheet = S.path('M-196 -676 Q0 -690 196 -676 L210 -236 Q100 -222 0 -240 Q-100 -222 -210 -236 Z', ol('#D9D2EE', 6)) + S.path('M-120 -600 Q0 -580 120 -606 M-140 -420 Q0 -400 140 -430', ln(4, '#B9AED8'));
    e += S.g(sheet, `translate(${f(u * 700)} ${f(-u * 520)}) rotate(${f(u * 70)})`, { opacity: f(1 - seg(reveal, 0.7, 1)) });
  }
  return S.g(e, tf(x, y, s));
}
// chalk "blueprint" volcano sketch drawn over the hat (k 0..1 draws it on)
function chalkVolcano(x, y, s, k, t) {
  if (k <= 0) return '';
  const d = 'M-150 0 Q-120 -120 -60 -230 Q-40 -290 0 -300 Q40 -290 60 -230 Q120 -120 150 0';
  const len = 900;
  let o = S.path(d, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-dasharray': `${f(len * k)} ${len}`, opacity: 0.9 });
  const k2 = seg(k, 0.5, 1);
  if (k2 > 0) {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.45, r0 = 60, r1 = 60 + 120 * ease.out(k2);
      o += S.path(`M${f(Math.cos(a) * r0)} ${f(-300 + Math.sin(a) * r0)} L${f(Math.cos(a) * r1)} ${f(-300 + Math.sin(a) * r1)}`, { stroke: '#FFFFFF', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': '18 12', opacity: 0.85 });
    }
    o += S.path('M-40 -340 Q-70 -380 -30 -400 Q-10 -440 20 -410 Q60 -420 50 -380 Q80 -350 40 -340', { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 7, 'stroke-dasharray': '14 9', opacity: f(0.9 * k2) });
  }
  return S.g(o, tf(x, y + Math.sin(t * 3) * 2, s));
}

// ---------------------------------------------------------------- memory polaroid ("VERSION 87")
function polaroid(x, y, s, rot, k, inner, label) {
  if (k <= 0.001) return '';
  const id = S.uid('s06pol');
  let p = S.rect(-232, -212, 480, 470, 14, { fill: '#000', opacity: 0.25 }) + S.rect(-240, -220, 480, 470, 14, ol('#FFFDF6', 7));
  p += S.clipDef(id, S.rect(-210, -190, 420, 330, 6)) + S.g(S.rect(-210, -190, 420, 330, 0, { fill: '#C9C6D2' }) + inner, null, { 'clip-path': `url(#${id})` });
  p += S.rect(-210, -190, 420, 330, 6, { fill: 'none', stroke: LINE, 'stroke-width': 4 });
  p += TF(esc(label), 0, 205, 44, '#2A3A6A');
  p += S.rect(-60, -244, 120, 44, 6, { fill: '#FFF2B0', opacity: 0.85, stroke: LINE, 'stroke-width': 3, transform: 'rotate(4)' });
  return S.g(p, `${tf(x, y, s * ease.outBack(clamp(k, 0, 1)), rot)}`);
}

// ---------------------------------------------------------------- the Book of Fails, animated
// open spread with handwriting that writes on. lines: [{ txt, x, y, size, col, k (0..1 reveal), font }] in book units
// (open book = 400 x 250 at s 1, centre 0,0). vol 1 | 2. Returns { svg, pen: [x, y] (book units: the writing tip) }
function bookSpread(x, y, s, rot, o = {}) {
  const { vol = 1, lines = [], doodles = '' } = o;
  const v2 = vol === 2;
  const cover = v2 ? '#D8262E' : '#2F6FB0';
  let b = S.path('M-206 -116 L0 -106 L206 -116 L212 130 L0 140 L-212 130 Z', ol(cover, 6));
  b += S.path('M-194 -108 L0 -98 L0 124 L-196 118 Z', ol('#FFFDF4', 4)) + S.path('M0 -98 L194 -108 L196 118 L0 124 Z', ol('#FFFDF4', 4));
  let rl = '';
  for (let yy = -70; yy <= 100; yy += 24) rl += `M-180 ${yy} L-16 ${yy + 4} M16 ${yy + 4} L180 ${yy} `;
  b += S.path(rl, ln(2.2, '#9FC4E8')) + S.path('M-154 -100 L-154 120', ln(2.2, '#F2A0A8')) + S.path('M0 -98 L0 124', ln(5, '#C9BFA4'));
  b += S.rect(190, -80, 22, 30, 4, ol(v2 ? '#3BD16F' : '#FFD23F', 3));
  let pen = null;
  for (const L of lines) {
    const k = clamp(L.k ?? 1, 0, 1);
    if (k <= 0) continue;
    const size = L.size || 22, w = R.textW(L.txt, size, 'F') * 1.02;
    const txt = TF(esc(L.txt), L.x, L.y, size, L.col || '#2A3A6A', { 'text-anchor': 'start', 'font-weight': 600, transform: `rotate(${f(L.rot ?? -1.5)} ${f(L.x)} ${f(L.y)})` });
    if (k >= 1) { b += txt; continue; }
    const id = S.uid('s06w');
    b += S.clipDef(id, S.rect(L.x - 4, L.y - size * 1.1, w * k + 4, size * 1.6)) + S.g(txt, null, { 'clip-path': `url(#${id})` });
    pen = [L.x + w * k, L.y + 2 - (L.rot ?? -1.5) * 0.0175 * w * k];
  }
  b += doodles;
  return { svg: S.g(b, tf(x, y, s, rot)), pen: pen ? [x + pen[0] * s, y + pen[1] * s] : null };
}
// book closing (u 0..1): the left half flips over onto the right half; at 1 the closed cover lies where the right page was
function bookClosing(x, y, s, rot, u, o = {}) {
  const { vol = 1 } = o;
  u = clamp(u, 0, 1);
  if (u >= 1) return S.g(X.bookOfFails({ x: 100, y: 4, s: 1, vol }), tf(x, y, s, rot));
  const sp = bookSpread(0, 0, 1, 0, o);
  if (u <= 0) return S.g(sp.svg, tf(x, y, s, rot));
  // right page stays; left half = page (sx>0) or cover (sx<0)
  const id = S.uid('s06bk');
  let b = S.clipDef(id, S.rect(0, -140, 230, 290)) + S.g(sp.svg, null, { 'clip-path': `url(#${id})` });
  const sx = Math.cos(u * Math.PI);
  let half;
  if (sx > 0) { const id2 = S.uid('s06bk'); half = S.clipDef(id2, S.rect(-230, -140, 230, 290)) + S.g(sp.svg, null, { 'clip-path': `url(#${id2})` }); }
  else half = S.g(X.bookOfFails({ x: -100, y: 4, s: 1, vol }), 'scale(-1 1)');
  b += S.g(half, `scale(${f(Math.max(0.02, Math.abs(sx)) * Math.sign(sx || 1))} 1)`);
  return S.g(b, tf(x, y, s, rot));
}

// ---------------------------------------------------------------- kindergarten flashback
// big-head chibi: body at pose.s, head taken from a second draw at hs, clipped above the neck
function chibi(name, t, pose, hs, act = {}) {
  const neck = -545;
  const body = actor(name, t, { ...pose }, act);
  const big = { ...pose, s: hs, y: pose.y + neck * pose.s - neck * hs, shadow: false, legL: 0, legR: 0, kneeL: 0, kneeR: 0, props: [] };
  const id = S.uid('s06chb');
  const cut = pose.y + neck * pose.s + 4;
  return body + S.clipDef(id, S.rect(pose.x - 700, cut - 4000, 1400, 4000)) + S.g(actor(name, t, big, act), null, { 'clip-path': `url(#${id})` });
}
// crayon stroke: a wobbly path drawn twice (rough edge)
function crayon(d, col, w = 10, op = 0.9) {
  return S.path(d, { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op, 'stroke-dasharray': `${f(w * 6)} ${f(w * 0.5)}` }) +
    S.path(d, { fill: 'none', stroke: col, 'stroke-width': w * 0.5, 'stroke-linecap': 'round', opacity: op * 0.6, transform: 'translate(3 2)' });
}
// the kindergarten room as a child's crayon drawing (world 1920x1080). sunU 0..1 moves the sun across (1 = moon, dusk)
function kinderRoom(t, sunU = 0) {
  let o = S.rect(-400, -400, 2720, 1880, 0, { fill: '#FFF4DC' });
  // paper grain lines
  let g = '';
  for (let i = 0; i < 18; i++) g += `M-200 ${f(60 + i * 60 + hash(i) * 20)} Q960 ${f(40 + i * 60)} 2120 ${f(70 + i * 60)} `;
  o += S.path(g, { fill: 'none', stroke: '#F0DFC0', 'stroke-width': 3 });
  // floor
  o += S.path('M-300 800 Q300 784 960 796 Q1500 806 2220 790 L2220 1400 L-300 1400 Z', { fill: '#F9D9A8' }) + crayon('M-300 800 Q300 784 960 796 Q1500 806 2220 790', '#C98A52', 12);
  // window with the sun / moon
  o += crayon('M220 180 L620 172 L626 470 L214 476 Z', '#6FB7E8', 12) + crayon('M420 176 L424 472 M216 324 L622 320', '#6FB7E8', 8);
  const night = clamp((sunU - 0.75) / 0.2, 0, 1);
  o += S.path('M232 190 L612 184 L616 462 L226 466 Z', { fill: night > 0.5 ? '#3A3E7A' : '#CFEFFF', opacity: f(0.55 + 0.3 * night) });
  const sx = lerp(260, 580, sunU), sy = 330 - Math.sin(sunU * Math.PI) * 120;
  if (night < 1) { o += S.circle(sx, sy, 46, { fill: '#FFD23F', opacity: f(1 - night) }); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.5; o += crayon(`M${f(sx + Math.cos(a) * 60)} ${f(sy + Math.sin(a) * 60)} L${f(sx + Math.cos(a) * 92)} ${f(sy + Math.sin(a) * 92)}`, '#FFB800', 8, 1 - night); } }
  if (night > 0) o += S.path(`M${f(sx - 20)} ${f(sy - 40)} A44 44 0 1 0 ${f(sx + 30)} ${f(sy + 34)} A34 34 0 1 1 ${f(sx - 20)} ${f(sy - 40)} Z`, { fill: '#FFF2A8', opacity: f(night) });
  // rainbow + ABC blocks + the cubbies
  o += crayon('M1180 420 Q1420 140 1660 420', '#FF6F6F', 16) + crayon('M1210 420 Q1420 176 1630 420', '#FFB84D', 14) + crayon('M1240 420 Q1420 212 1600 420', '#7AD36A', 14) + crayon('M1270 420 Q1420 248 1570 420', '#6FA8FF', 14);
  const blk = (x, y, c, L, r) => S.g(S.rect(-50, -50, 100, 100, 8, { fill: c, stroke: '#7A5A3A', 'stroke-width': 6, opacity: 0.9 }) + T(L, 0, 26, 70, '#FFFFFF', { stroke: '#7A5A3A', 'stroke-width': 4, 'paint-order': 'stroke' }), tf(x, y, 1, r));
  o += blk(1580, 740, '#FF8FB0', 'A', -6) + blk(1700, 744, '#6FD3FF', 'B', 4) + blk(1640, 646, '#FFD23F', 'C', -3);
  o += crayon('M80 560 L80 790 M80 560 L380 556 L382 790 M80 676 L380 672', '#B98552', 12);
  o += TF('KINDERGARTEN', 960, 120, 64, '#E8453C', { opacity: 0.9, transform: 'rotate(-2 960 120)' });
  o += crayon('M700 140 Q960 128 1220 142', '#E8453C', 8, 0.7);
  return o;
}
// soft paper frame around the flashback (screen space): torn white edge + warm vignette
function paperFrame(k = 1) {
  if (k <= 0) return '';
  const d = 'M-40 -40 H1960 V1120 H-40 Z M60 70 Q500 50 960 64 Q1400 52 1860 72 Q1876 540 1852 1010 Q1400 1030 960 1016 Q500 1032 66 1008 Q44 540 60 70 Z';
  return S.path(d, { fill: '#FFF8EA', 'fill-rule': 'evenodd', opacity: f(k) }) + S.path('M60 70 Q500 50 960 64 Q1400 52 1860 72 Q1876 540 1852 1010 Q1400 1030 960 1016 Q500 1032 66 1008 Q44 540 60 70 Z', { fill: 'none', stroke: '#E8CFA0', 'stroke-width': 10, opacity: f(k) });
}

module.exports = {
  LINE, tf, esc, TS, TFS, pop, popOut, at, toScr, mixCam, shakeAll, drift, clipTo, zoomAbout,
  whip, smash, dip, zoomLines, bars, room, SW, SK, PAD, BOWL,
  calendarCard, dayTag, drumKit, waffle, dadSpatula, scoreCard, pencilHand, glueBottle, easel, chalkVolcano, polaroid,
  bookSpread, bookClosing, chibi, crayon, kinderRoom, paperFrame,
};
