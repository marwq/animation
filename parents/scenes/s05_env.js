// Private helpers for SC 05 (Mom in the arena) and SC 06 (Granny's empire): transitions (whip, smash, zoom lines,
// letterbox), split-screen panels, the real living room with the family at their devices, the 1998 arcade + VHS OSD +
// polaroid (Mom's memory), water bottles, the "10 MINUTES LATER" card, the fast-forward OSD, little gags.
'use strict';

const K = require('./kit');
const G = require('./gameui');
const H = require('./sets_house');
const X = require('../rig/extras');
const CAST = require('../rig/cast');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, view, actor } = K;

const LINE = '#151515';
const W = 1920, HH = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.16, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const sc = (inner, x, y, k) => (k <= 0.001 ? '' : k === 1 ? inner : S.g(inner, `translate(${f(x)} ${f(y)}) scale(${f(k)}) translate(${f(-x)} ${f(-y)})`));
function shakeAll(cam, t, list) {
  const c = { ...cam };
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); c.sx = (c.sx || 0) + s.sx; c.sy = (c.sy || 0) + s.sy; }
  return c;
}
// squash/stretch impulse after t0 -> { sx, sy }
function boing(t, t0, amp = 0.25, dur = 0.7) {
  const k = t - t0;
  if (k < 0 || k > dur) return { sx: 1, sy: 1 };
  const v = amp * Math.exp(-k * 7) * Math.cos(k * 20);
  return { sx: 1 - v * 0.6, sy: 1 + v };
}
function clipTo(x, y, w, h, inner, r = 0) {
  const id = S.uid('s05c');
  return S.clipDef(id, S.rect(x, y, w, h, r)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
}

// ---------------------------------------------------------------- transitions
// whip-pan streaks + white wash around a cut at tc
function whip(t, tc, dir = 1, dur = 0.12) {
  const d = t - tc;
  if (Math.abs(d) > dur) return '';
  const k = 1 - Math.abs(d) / dur;
  let p = '';
  for (let i = 0; i < 16; i++) {
    const y = hash(i * 3.7) * HH, len = 300 + hash(i) * 700, th = 8 + hash(i * 2.2) * 16;
    const x = ((hash(i * 5.1) * 2600 + dir * d * 16000) % 2600 + 2600) % 2600 - 400;
    p += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.rect(0, 0, W, HH, 0, { fill: '#FFFFFF', opacity: f(0.55 * k) }) + S.path(p, { fill: '#FFFFFF', opacity: f(0.85 * k) });
}
const smash = (t, tc, dur = 0.14, a = 0.75) => (t >= tc && t < tc + dur ? K.C.whiteFlash(a * (1 - (t - tc) / dur)) : '');
// radial zoom lines around (cx, cy) for punchlines (k 0..1)
function zoomLines(cx, cy, k, t, col = '#FFFFFF', n = 22, r0b = 380) {
  if (k <= 0) return '';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i * 3.1) * 0.2, r0 = r0b + hash(i + Math.floor(t * 12)) * 160, r1 = r0 + 900;
    const w = 10 + hash(i * 1.7) * 14;
    const ax = Math.cos(a), ay = Math.sin(a), nx = -ay * w, ny = ax * w;
    d += `M${f(cx + ax * r0)} ${f(cy + ay * r0)}L${f(cx + ax * r1 + nx)} ${f(cy + ay * r1 + ny)}L${f(cx + ax * r1 - nx)} ${f(cy + ay * r1 - ny)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(0.75 * k) });
}
// horizontal speed streaks across a band (screen space)
function streaks(t, y0, y1, n, seed, col = '#FFFFFF', op = 0.6, speed = 2600, dir = -1) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const y = lerp(y0, y1, hash(i * 2.3 + seed)), len = 160 + hash(i * 5.7 + seed) * 380, th = 5 + hash(i * 1.1 + seed) * 9;
    const x = (((hash(i * 7.9 + seed) * 2600 + dir * t * speed * (0.6 + 0.8 * hash(i + seed))) % 2600) + 2600) % 2600 - 340;
    d += `M${f(x)} ${f(y)}h${f(len)}v${f(th)}h${f(-len)}Z`;
  }
  return S.path(d, { fill: col, opacity: f(op) });
}
const letterbox = (k, h = 96) => (k > 0 ? S.rect(-10, -10, W + 20, 10 + h * k, 0, { fill: '#05070C' }) + S.rect(-10, HH - h * k, W + 20, h * k + 10, 0, { fill: '#05070C' }) : '');
// pixel-block wipe in Cube City colours (p 0..1 covers left -> right)
function blockWipe(p, dir = 1, size = 120) {
  if (p <= 0) return '';
  const cols = ['#FF4B5C', '#FFC83D', '#17C3B2', '#3B8BFF', '#B57BFF', '#FF8A2B'];
  const nx = Math.ceil(W / size) + 1, ny = Math.ceil(HH / size);
  const byCol = {};
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const u = (dir > 0 ? i : nx - 1 - i) / nx;
    const k = clamp((p * 1.6 - u * 0.9 - hash(i * 3.1 + j * 7.7) * 0.25) / 0.35, 0, 1);
    if (k <= 0) continue;
    const c = cols[Math.floor(hash(i * 1.7 + j * 2.9) * cols.length)];
    const s = size * ease.outBack(k), x = i * size + (size - s) / 2, y = j * size + (size - s) / 2;
    byCol[c] = (byCol[c] || '') + `M${f(x)} ${f(y)}h${f(s)}v${f(s)}h${f(-s)}Z`;
  }
  return Object.entries(byCol).map(([c, d]) => S.path(d, { fill: c, stroke: LINE, 'stroke-width': 5 })).join('');
}

// ---------------------------------------------------------------- split-screen panels
// draw `inner` (authored for a full 1920x1080 frame) scaled into the screen rect (x, y, w, h)
function panel(x, y, w, h, inner, o = {}) {
  const k = o.k ?? 1;
  if (k <= 0.001) return '';
  const s = Math.max(w / W, h / HH) * (o.zoom || 1);
  const cx = x + w / 2, cy = y + h / 2;
  const id = S.uid('s05p');
  let g = S.clipDef(id, S.rect(x, y, w, h, o.r ?? 0));
  g += S.g(S.g(inner, `translate(${f(cx)} ${f(cy)}) scale(${f(s)}) translate(${f(-960 - (o.dx || 0))} ${f(-540 - (o.dy || 0))})`), null, { 'clip-path': `url(#${id})` });
  g += S.rect(x, y, w, h, o.r ?? 0, { fill: 'none', stroke: o.rim || '#FFFFFF', 'stroke-width': o.border ?? 12 });
  g += S.rect(x - 6, y - 6, w + 12, h + 12, o.r ?? 0, { fill: 'none', stroke: LINE, 'stroke-width': 5 });
  if (k < 1) {
    const e = ease.outBack(k);
    return S.g(g, `translate(${f(cx)} ${f(cy)}) scale(${f(e)}) translate(${f(-cx)} ${f(-cy)})`, { opacity: f(seg(k, 0, 0.3)) });
  }
  return g;
}
// label chip on a panel
function panelTag(x, y, text, col = '#151A26', fg = '#FFFFFF', s = 1) {
  const w = (text.length * 19 + 44) * s;
  return S.g(S.rect(0, 0, w, 52 * s, 26 * s, { fill: col, stroke: LINE, 'stroke-width': 4 }) + TF(text, w / 2, 36 * s, 28 * s, fg, { 'letter-spacing': 1 }), tf(x, y));
}

// ---------------------------------------------------------------- THE REAL LIVING ROOM (game night, evening)
// room(t, cam, o): the family at their devices, YOU in the gaming chair facing camera (frog-sit), Mom with the #1 MOM mug
// and her tablet on her lap, Dad behind his laptop lid, Granny knitting with her phone propped on the armchair's arm.
// o.you / o.dad / o.mom / o.gran = extra pose fields (false hides), o.*Act = act options, o.over = svg on top (world),
// o.phoneScreen = fn(w, h) for Granny's phone, o.lamp, o.glow (k of the screen-light pools), o.time.
const LRS = H.SPOTS.livingRoom;
const FROG = { legL: 90, legR: 90, kneeL: 90, kneeR: 90 };
function room(t, cam, o = {}) {
  const z = cam.zoom ?? 1, vol = z >= 1.75 ? false : undefined;
  const gk = o.glow ?? 0.55;
  const glows = H.deviceGlows(['dad', 'mom', 'grandma'], gk);
  const L = H.livingRoom.layers(t, { time: o.time || 'evening', chair: 'front', glow: glows, lamp: o.lamp, pcScreen: o.pcScreen });
  const seat = (who, size, extra) => H.seatPose(LRS.seats[who], size, extra);
  let mid = '', dev = '';
  if (o.you !== false) mid += actor('you', t, seat('you', 1, { ...FROG, turn: 0.42, volume: vol, ...(o.you || {}) }), o.youAct || {});
  if (o.dad !== false) mid += actor('dad', t, seat('dad', 1.1, { volume: vol, glasses: 'on', ...(o.dad || {}) }), o.dadAct || {});
  if (o.mom !== false) mid += actor('mom', t, seat('mom', 1.04, { mug: true, t, volume: vol, ...(o.mom || {}) }), o.momAct || {});
  // Granny sits forward on the armchair's edge (frog-sit drawn after the chair front) so her knitting stays in view
  const gran = o.gran !== false ? actor('grandma', t, seat('grandma', 0.9, { ...FROG, knitting: true, t, volume: vol, ...(o.gran || {}) }), o.granAct || {}) : '';
  if (o.dad !== false) dev += X.laptopOld({ ...LRS.devices.laptop, face: 'lid' });
  if (o.mom !== false) dev += X.tablet({ x: LRS.seats.mom.x - 18, y: 772, s: 0.4, rot: -4, face: 'back', landscape: true });
  if (o.gran !== false) dev += grannyPhone(t, o.phoneScreen) + gran;
  return view(cam, L.bg, 0.8) + view(cam, L.mid + mid + L.front + dev + L.table + (o.over || '') + L.fg + L.light);
}
// Granny's phone propped up on a little stand on the armchair's left arm, screen to camera (her empire on it)
function grannyPhone(t, screen) {
  const x = 1612, y = 742;
  let g = S.path(`M${x - 34} ${y + 92} L${x - 10} ${y + 40} L${x + 10} ${y + 40} L${x + 34} ${y + 92} Z`, ol('#C9A0D8', 4));
  g += X.phone({ x, y, s: 0.34, rot: -6, face: 'screen', glow: 0.35, screen: screen || ((w, h) => phoneShop(w, h, t)) });
  return g;
}
// a tiny "GRANNY'S GOODIES" shop UI for her phone screen (w, h ≈ 176 x 340)
function phoneShop(w, h, t, o = {}) {
  let g = S.rect(0, 0, w, h, 0, { fill: '#FFE3F0' }) + S.rect(0, 0, w, 54, 0, { fill: '#FF6FB0' });
  g += TF("GRANNY'S", w / 2, 24, 18, '#FFFFFF') + TF('GOODIES', w / 2, 46, 18, '#FFFFFF');
  g += S.circle(w / 2, 136, 48, ol('#E0A35A', 5)) + [[-16, -12], [12, -18], [6, 14], [-14, 16], [22, 6]].map(([a, b]) => S.circle(w / 2 + a, 136 + b, 6, { fill: '#6B3A1E' })).join('');
  if (o.label) g += TF(o.label, w / 2, 200, 16, '#B0306A');
  const v = o.coins ?? Math.floor(1200 + t * 37) % 99999;
  g += S.rect(14, 214, w - 28, 44, 22, ol('#1E2A44', 4)) + G.coinIcon(38, 236, 14, t * 3) + TF(String(v), w / 2 + 14, 246, 24, '#FFC83D');
  g += S.rect(24, 276, w - 48, 40, 14, ol('#3BD16F', 4)) + TF('SELL!', w / 2, 304, 22, '#FFFFFF');
  return g;
}
// a little pop of "+1 WIN" etc. rising from a point (k 0..1 over ~1.2 s)
function floatTag(x, y, k, text, col = '#3BD16F', size = 40) {
  if (k <= 0 || k >= 1) return '';
  const a = 1 - seg(k, 0.7, 1);
  return S.g(S.rect(-text.length * size * 0.3 - 18, -size * 0.85, text.length * size * 0.6 + 36, size * 1.2, size * 0.6, ol('#1E2A44', 4)) + TF(text, 0, size * 0.1, size, col),
    tf(x, y - 120 * ease.out(k), ease.outBack(seg(k, 0, 0.25))), { opacity: f(a) });
}

// ---------------------------------------------------------------- 1998: the arcade (VHS memory)
// A world ~ x -700 … 3500: back wall with neon stripes + ARCADE sign, a row of cabinets (x -420 … 1820, the champion's
// cabinet at x 960 is bigger), the championship STAGE at x 2700 (banner, riser, spotlights). Floor line y 880.
const ARC = { floor: 880, stage: { x: 2700, top: 760 }, cab: 960 };
const PIX = ['#FF4FD8', '#3FF2FF', '#FFE14D', '#7CFF6B'];
function pixelInvaders(x, y, w, h, t, seed) {
  // a few pixel aliens marching (cheap: one path per colour)
  let o = '';
  for (let c = 0; c < 2; c++) {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const px = x + 20 + ((i * 47 + t * 40 + seed * 13) % (w - 60)), py = y + 18 + c * 34 + (i % 2) * 8;
      d += `M${f(px)} ${f(py)}h16v6h6v6h-28v-6h6Z`;
    }
    o += S.path(d, { fill: PIX[(c + seed) % 4] });
  }
  o += S.rect(x + w / 2 - 12, y + h - 22, 24, 10, 0, { fill: '#7CFF6B' });
  return o;
}
function cabinet(x, base, s, col, t, seed, o = {}) {
  // front view, (x, base) = bottom centre; ~ 300 x 640 at s 1
  const w = 300;
  let g = S.path('M-150 0 V-470 L-130 -640 H130 L150 -470 V0 Z', ol('#1D1838', 7));
  g += S.path('M-150 0 V-470 L-130 -640 H-110 L-128 -470 V0 Z', { fill: col, opacity: 0.9 }) + S.path('M150 0 V-470 L130 -640 H110 L128 -470 V0 Z', { fill: col, opacity: 0.9 });
  g += S.rect(-128, -628, 256, 74, 8, ol(col, 5)) + S.rect(-118, -620, 236, 58, 6, { fill: '#FFFFFF', opacity: 0.35 });
  g += TS(o.name || ['GALAXOIDS', 'PIXEL KONG', 'TURBO 98', 'NEON RACER', 'BLOCK BUSTER'][seed % 5], 0, -578, 34, '#FFFFFF');
  g += S.rect(-118, -540, 236, 196, 14, ol('#0B0B1A', 7));
  g += S.g(pixelInvaders(-110, -532, 220, 180, t, seed), null, { opacity: 0.95 });
  g += S.path('M-140 -330 L140 -330 L150 -270 L-150 -270 Z', ol('#2C2552', 6));
  g += S.path('M-70 -312 V-350', ln(10)) + S.circle(-70, -356, 15, ol('#FF4B5C', 5));
  for (let i = 0; i < 3; i++) g += S.ellipse(10 + i * 40, -298, 15, 9, ol(PIX[(i + seed) % 4], 4));
  g += S.rect(-60, -200, 120, 70, 8, ol('#3A3266', 5)) + S.rect(-16, -186, 32, 42, 4, { fill: '#FFC83D', stroke: LINE, 'stroke-width': 3 });
  return S.g(g, tf(x, base, s));
}
function arcade(t, cam, o = {}) {
  const fl = ARC.floor;
  let bg = S.rect(-1400, -900, 6400, fl + 900, 0, { fill: '#24124A' });
  // neon stripes + squiggle wallpaper
  let sq = '';
  for (let i = 0; i < 26; i++) { const x = -1300 + i * 190 + hash(i) * 60, y = 120 + hash(i * 3.3) * 520; sq += `M${f(x)} ${f(y)}q20 -30 40 0t40 0t40 0`; }
  bg += S.path(sq, ln(8, '#5B2FA8')) + S.path('M-1400 60 H5000', ln(16, '#FF4FD8')) + S.path('M-1400 92 H5000', ln(10, '#3FF2FF'));
  bg += S.path(`M-1400 ${fl - 200} H5000`, ln(10, '#FF4FD8', 0.7));
  // ARCADE neon sign
  bg += T('ARCADE', 700, 250, 150, 'none', { stroke: '#FF4FD8', 'stroke-width': 34, opacity: 0.25, 'stroke-linejoin': 'round' }) + T('ARCADE', 700, 250, 150, '#FFE6FB', { stroke: '#FF4FD8', 'stroke-width': 10, 'paint-order': 'stroke' });
  bg += T('★ HIGH SCORE ZONE ★', 1700, 230, 52, '#BDFBFF', { stroke: '#18C7E0', 'stroke-width': 6, 'paint-order': 'stroke' });
  // floor: carpet with neon confetti
  let fd = S.rect(-1400, fl, 6400, 900, 0, { fill: '#170C2E' }) + S.path(`M-1400 ${fl} H5000`, ln(8));
  let cf = ['', '', '', ''];
  for (let i = 0; i < 70; i++) { const x = -1300 + hash(i * 1.3) * 6000, y = fl + 30 + hash(i * 2.7) * 500; cf[i % 4] += `M${f(x)} ${f(y)}l${f(20 + 20 * hash(i))} ${f(-14 + 28 * hash(i * 5))}`; }
  fd += cf.map((d, i) => S.path(d, ln(7, PIX[i], 0.8))).join('');
  // cabinets
  let cabs = '';
  [[-420, '#7A3CC8'], [-120, '#17C3B2'], [180, '#FF4B5C'], [480, '#3B8BFF'], [1440, '#FF8A2B'], [1740, '#B57BFF']].forEach(([x, c], i) => { cabs += cabinet(x, fl, 0.82, c, t, i); });
  // the champion's cabinet (bigger, centre): screen with the score roll
  cabs += cabinet(ARC.cab, fl, 1.05, '#FFC83D', t, 7, { name: 'STATE FINALS' });
  // stage (championship)
  const st = ARC.stage;
  let stage = S.rect(st.x - 520, st.top, 1040, fl - st.top, 10, ol('#3A2A7A', 7)) + S.rect(st.x - 520, st.top, 1040, 26, 8, ol('#FFC83D', 6));
  stage += S.rect(st.x - 360, -40, 720, 150, 16, ol('#FF4FD8', 7)) + TS('STATE ARCADE', st.x, 22, 56, '#FFFFFF') + TS('CHAMPIONSHIP 1998', st.x, 88, 50, '#FFE14D');
  stage += S.path(`M${st.x - 360} -40 L${st.x - 420} -140 M${st.x + 360} -40 L${st.x + 420} -140`, ln(5, '#B9B0D8'));
  for (const sx of [-1, 1]) stage += S.path(`M${st.x + sx * 560} -200 L${st.x + sx * 200} ${st.top} L${st.x + sx * 460} ${st.top} Z`, { fill: '#FFF3B0', opacity: 0.12 });
  const mid = fd + cabs + stage;
  // cam: camcorder handheld wobble is added by the caller
  return { bg: view(cam, bg, 0.9), mid: view(cam, mid, 1) };
}
// champion screen content (drawn in the big cabinet's screen box; world coords)
function champScreen(t, score, k = 1, o = {}) {
  const s = 1.05, x = ARC.cab, y = ARC.floor;
  const sx = x - 118 * s, sy = y - 540 * s, w = 236 * s, h = 196 * s;
  let g = S.rect(sx, sy, w, h, 14, ol('#0B0B1A', 7));
  g += TF('HI-SCORE', x, sy + 44, 30, '#3FF2FF') + TF(String(score).padStart(6, '0'), x, sy + 98, 52, '#FFE14D');
  if (o.record) g += TF('NEW RECORD!', x, sy + 150, 30, Math.floor(t * 6) % 2 ? '#FF4FD8' : '#FFFFFF');
  else g += TF('PLAYER 1', x, sy + 150, 26, '#7CFF6B');
  return S.g(g, null, { opacity: f(k) });
}
// VHS on-screen display: PLAY ▶ / PAUSE ❚❚, SP, date + clock; plus scanlines + tracking from common.vhs
function vhsOSD(t, o = {}) {
  const { mode = 'play', date = 'MAR. 14 1998', k = 1 } = o;
  let g = K.C.vhs(t, '', 0.8 * k);
  const blink = Math.floor(t * 2) % 2 === 0;
  const txt = (s, x, y, a = 'start', size = 54) => TF(s, x, y, size, '#FFFFFF', { 'text-anchor': a, stroke: '#1A1030', 'stroke-width': 7, 'paint-order': 'stroke', 'letter-spacing': 3 });
  if (mode === 'play') g += txt('PLAY', 90, 130) + (blink ? S.path('M262 92 L300 112 L262 132 Z', { fill: '#FFFFFF', stroke: '#1A1030', 'stroke-width': 5 }) : '');
  else if (mode === 'pause') g += txt('PAUSE', 90, 130) + S.rect(290, 90, 14, 42, 2, { fill: '#FFFFFF' }) + S.rect(312, 90, 14, 42, 2, { fill: '#FFFFFF' });
  else if (mode === 'rec') g += txt('REC', 90, 130) + (blink ? S.circle(250, 112, 18, { fill: '#FF3B4E' }) : '');
  g += txt('SP', 1830, 130, 'end');
  const sec = Math.floor(t * 1) % 60;
  g += txt(date, 90, 980, 'start', 50) + txt(`AM 11:4${Math.floor(t / 10) % 10}:${String(sec).padStart(2, '0')}`, 1830, 980, 'end', 50);
  return S.g(g, null, { opacity: f(k) });
}
// warm faded "old tape" tint (cheap flat overlays)
const tapeTint = (k = 1) => S.rect(0, 0, W, HH, 0, { fill: '#FFB070', opacity: f(0.12 * k) }) + S.rect(0, 0, W, HH, 0, { fill: '#30104A', opacity: f(0.1 * k) });
// polaroid: `inner` = a full frame, shrunk into a photo with a white border; (cx, cy) centre, s scale (1 = 1100 px wide photo)
function polaroid(inner, cx, cy, s, rot, o = {}) {
  const pw = 1100, ph = 619, bw = 44, bb = 150;
  const id = S.uid('s05pol');
  let g = S.rect(-pw / 2 - bw + 16, -ph / 2 - bw + 22, pw + 2 * bw, ph + bw + bb, 10, { fill: '#000000', opacity: 0.3 });
  g += S.rect(-pw / 2 - bw, -ph / 2 - bw, pw + 2 * bw, ph + bw + bb, 10, { fill: '#FBF7EE', stroke: LINE, 'stroke-width': 6 });
  g += S.clipDef(id, S.rect(-pw / 2, -ph / 2, pw, ph)) + S.g(S.g(inner, `scale(${f(pw / W)}) translate(-960 -540)`), null, { 'clip-path': `url(#${id})` });
  g += S.rect(-pw / 2, -ph / 2, pw, ph, 0, { fill: '#FFC890', opacity: 0.16 });
  if (o.caption) g += T(o.caption, 0, ph / 2 + 98, 64, '#3A2A7A', { 'font-style': 'italic' });
  return S.g(g, tf(cx, cy, s, rot));
}

// ---------------------------------------------------------------- small props + cards
// water bottle (centre; ~80 x 200 at s 1, body units like the rig props)
function waterBottle(x, y, s = 1, rot = 0) {
  let g = S.rect(-24, -112, 48, 26, 7, ol('#2F7BFF', 5));
  g += S.path('M-28 -88 Q-42 -66 -42 -44 V82 Q-42 100 -24 100 H24 Q42 100 42 82 V-44 Q42 -66 28 -88 Z', ol('#D8F6FF', 6));
  g += S.path('M-36 -18 V80 Q-36 92 -22 92 H22 Q36 92 36 80 V-18 Z', { fill: '#5CC8FF', opacity: 0.85 });
  g += S.rect(-42, 4, 84, 48, 4, ol('#FFFFFF', 4)) + S.path('M-22 16 Q-14 30 -22 40 Q-30 30 -22 16 Z', { fill: '#2F7BFF' }) + TF('H2O', 10, 40, 24, '#2F7BFF');
  g += S.path('M-26 -50 V-14', ln(6, '#FFFFFF', 0.8));
  return S.g(g, tf(x, y, s, rot));
}
// "TEN MINUTES LATER..." card: cream panel, spinning clock, k pop / out
function laterCard(t, k, out = 0, text = '10 MINUTES LATER...') {
  if (k <= 0 || out >= 1) return '';
  const e = ease.outBack(clamp(k, 0, 1)) * (1 - ease.in(out));
  let g = S.rect(-520, -110, 1040, 220, 40, ol('#FFF8EC', 9)) + S.rect(-520, -110, 1040, 220, 40, { fill: 'none', stroke: '#17C3B2', 'stroke-width': 8, transform: 'translate(0 0) scale(0.97)' });
  g += S.circle(-380, 0, 74, ol('#FFFFFF', 8)) + G.clockIcon(-380, 0, 64, t * 9, '#FFFFFF');
  g += TS(text, 90, 26, 72, '#FF8A2B');
  return S.g(g, tf(960, 540, e, -3 + 3 * Math.sin(t * 3)));
}
// fast-forward OSD (">> x100") + spinning clock (screen space)
function ffOSD(t, k = 1, label = '▶▶ x100') {
  if (k <= 0) return '';
  let g = S.rect(1500, 46, 370, 96, 48, { fill: '#10162A', opacity: 0.85, stroke: '#17C3B2', 'stroke-width': 5 });
  g += S.path('M1540 70 L1580 94 L1540 118 Z M1580 70 L1620 94 L1580 118 Z', { fill: '#FFFFFF' });
  g += TF(label.replace('▶▶ ', ''), 1745, 112, 52, '#FFFFFF');
  return S.g(g, null, { opacity: f(k) });
}
// a cartoon crown popping over a head (k 0..1), sparkles with t
function crownPop(x, y, k, t, r = 54) {
  if (k <= 0) return '';
  const e = ease.outBack(clamp(k, 0, 1));
  let g = G.crown(0, 0, r, '#FFC83D') + K.F.sparkle(-r * 1.4, -r * 0.9, 16 + 6 * Math.sin(t * 9)) + K.F.sparkle(r * 1.5, -r * 1.2, 12 + 5 * Math.sin(t * 7 + 1));
  return S.g(g, tf(x, y - 20 * Math.abs(Math.sin(t * 4)), e, 8 * Math.sin(t * 3)));
}
// counter pill for KOs / staff etc. (uses gameui statPill with a custom icon)
function pill(o) {
  return G.statPill({ x: 60, y: 80, anchor: 'left', size: 56, ...o });
}

module.exports = {
  LINE, W, HH, tf, TS, TFS, pop, sc, shakeAll, boing, clipTo,
  whip, smash, zoomLines, streaks, letterbox, blockWipe, panel, panelTag,
  room, FROG, LRS, grannyPhone, phoneShop, floatTag,
  ARC, arcade, champScreen, vhsOSD, tapeTint, polaroid,
  waterBottle, laterCard, ffOSD, crownPop, pill,
};
