// Private helpers for SC 06 (the road) and SC 07 (the Server Farm): props, Dex's doorstep, FX, custom captions.
'use strict';

const K = require('./kit');
const FM = require('./farm');
const A = require('./acting');
const SETS = require('./sets');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, view, actor } = K;
const C = K.C, FX = K.F;
const LINE = '#151515';
const G = (inner, tf, extra) => (inner ? S.g(inner, tf, extra) : '');
const tr = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const outT = (txt, x, y, size, fill, sw = 8, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const outTF = (txt, x, y, size, fill, sw = 6, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': sw, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const R = (x, y, w, h, r = 0, a = {}) => S.rect(x, y, w, h, r, a);
const P = (d, a = {}) => S.path(d, a);
const Ci = (x, y, r, a = {}) => S.circle(x, y, r, a);

// ---------------------------------------------------------------- set composition
// farm.js desertRoad returns its road (mid) layer in world space, not through the camera: wrap it ourselves
// (guarded, so it keeps working if the shared set is fixed later).
const fixMid = (L, cam) => (L.mid && !L.mid.startsWith('<g') ? view(cam, L.mid, 1) : L.mid);
// screen-space colour wash (the shared sets' light layers do not always cover a zoomed/panned frame)
const wash = (col, op) => (op > 0 ? R(-20, -20, 1960, 1120, 0, { fill: col, opacity: f(clamp(op, 0, 1)) }) : '');

// ---------------------------------------------------------------- transitions
// whip-pan: camera x offset around a cut at tc (outgoing shot slides out, incoming slides in)
function whipX(t, tc, dir = 1, d = 0.13, amp = 1500) {
  if (t < tc && t > tc - d) return dir * amp * ease.in((t - (tc - d)) / d);
  if (t >= tc && t < tc + d) return -dir * amp * (1 - ease.out((t - tc) / d));
  return 0;
}
// streaks + a quick white flash on the cut
function whipFx(t, tc, d = 0.13) {
  const k = 1 - Math.abs(t - tc) / d;
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 22; i++) {
    const y = hash(i * 3.1 + 7) * 1080, w = 500 + hash(i * 1.7) * 1100, x = hash(i * 5.3 + Math.floor(t * 40)) * 1920 - w / 2;
    o += R(x, y, w, 10 + hash(i) * 26, 12, { fill: '#FFFFFF', opacity: f(0.55 * k) });
  }
  return o + C.whiteFlash(0.55 * k * k);
}
const flash = (t, t0, d = 0.16, k = 0.8) => (t >= t0 && t < t0 + d ? C.whiteFlash(k * (1 - (t - t0) / d)) : '');
// stepped "lag" freeze: hold time for `hold` seconds every `period` (returns the time to animate with)
function lagHold(t, period = 1.1, hold = 0.35, ph = 0) {
  const u = (t + ph) % period;
  return u < hold ? t - u : t;
}

// ---------------------------------------------------------------- FX
// Pip's "Ding!": a little golden elevator bell + sparkles + rays; k = 0..1 envelope
function dingFx(x, y, k, t, s = 1, word = 'DING!') {
  if (k <= 0) return '';
  const sc = s * ease.outBack(clamp(k * 1.4, 0, 1));
  let o = K.rays(0, 0, 12, 170, '#FFE88A', 0.28 * k, t * 40);
  const sw = Math.sin(t * 38) * 14 * k;
  o += G(P('M-34 24 Q-34 -28 0 -30 Q34 -28 34 24 Z', ol('#FFD34D', 7)) + R(-42, 20, 84, 14, 7, ol('#FFC21F', 6)) + Ci(0, 40, 9, ol('#FFD34D', 4)) + Ci(0, -36, 7, ol('#FFD34D', 4)) + P('M-20 -12 Q-16 -22 -6 -24', ln(6, '#FFF6C8')), `rotate(${f(sw)})`);
  o += FX.sparkle(-70, -40, 20 * k) + FX.sparkle(76, -56, 26 * k) + FX.sparkle(60, 50, 14 * k);
  if (word) o += outT(word, 0, -70, 54, '#FFE14D', 9, { transform: 'rotate(-6)' });
  return G(o, tr(x, y, sc), { opacity: f(clamp(k * 2, 0, 1)) });
}
// red "X" stamp
function stampX(x, y, k, s = 1) {
  if (k <= 0) return '';
  const sc = s * (1 + 0.6 * (1 - ease.out(clamp(k, 0, 1))));
  const d = 'M-60 -60 L60 60 M60 -60 L-60 60';
  return G(P(d, ln(46)) + P(d, ln(30, '#FF3B4E')), tr(x, y, sc, -4), { opacity: f(clamp(k * 3, 0, 1)) });
}
// HUD tiles for Dex's list: respawn, checkpoint, mini-map
function hudTile(kind, x, y, s, t) {
  let o = R(-90, -90, 180, 180, 34, ol('#1F2233', 8)) + R(-80, -80, 160, 30, 15, { fill: '#FFFFFF', opacity: 0.1 });
  if (kind === 'respawn') {
    o += P('M-46 -6 A48 48 0 1 1 -18 40', ln(16, '#7CF7FF')) + P('M-66 -18 L-44 12 L-22 -16 Z', { fill: '#7CF7FF', stroke: LINE, 'stroke-width': 4 });
    o += P(FX.heartPath ? FX.heartPath(4, 8, 26) : 'M4 30 L-20 6 Q-24 -16 4 -6 Q30 -16 26 6 Z', ol('#FF5A6E', 5));
  } else if (kind === 'checkpoint') {
    o += P('M-30 60 L-30 -62', ln(12, '#E9EDF3')) + P(`M-30 -62 L${f(46 + Math.sin(t * 6) * 6)} -42 L-30 -18 Z`, ol('#3BD16F', 5)) + R(-56, 54, 52, 16, 6, ol('#9AA3B2', 4));
  } else {
    o += Ci(0, 0, 66, ol('#2E7D4E', 6)) + P('M-40 -20 L10 -36 L36 10 L-6 40 Z', { fill: '#5CD66E', opacity: 0.7 }) + P('M-60 6 L60 -2', ln(8, '#E9D9A8'));
    o += G(P('M0 -18 L12 12 L0 4 L-12 12 Z', ol('#FFD21F', 4)), `rotate(${f(t * 90)})`);
  }
  const label = { respawn: 'RESPAWN', checkpoint: 'CHECKPOINT', minimap: 'MINI-MAP' }[kind];
  o += outTF(label, 0, 128, 34, '#FFFFFF', 7);
  return G(o, tr(x, y, s));
}
// crinkly bag of chips
function snacks(x, y, s = 1, rot = 0, t = 0) {
  let o = P('M-74 -110 L74 -110 L82 110 L-82 110 Z', ol('#FF5A3A', 7));
  o += P('M-80 -110 L-70 -132 L-56 -112 L-42 -132 L-28 -112 L-14 -132 L0 -112 L14 -132 L28 -112 L42 -132 L56 -112 L70 -132 L80 -110 Z', ol('#FF5A3A', 6));
  o += P('M-82 110 L-70 130 L-56 112 L-42 130 L-28 112 L-14 130 L0 112 L14 130 L28 112 L42 130 L56 112 L70 130 L82 110 Z', ol('#FF5A3A', 6));
  o += R(-62, -70, 124, 70, 14, ol('#FFE14D', 5)) + outT('CHIPS', 0, -22, 44, '#FF5A3A', 6);
  o += Ci(-20, 46, 26, ol('#FFC24A', 5)) + Ci(26, 56, 22, ol('#FFD86A', 5)) + P('M-56 -96 L-40 90', ln(10, '#FFFFFF', 0.35));
  o += FX.sparkle(92, -120, 18 + 6 * Math.sin(t * 7)) + FX.sparkle(-96, -40, 12 + 4 * Math.sin(t * 9 + 1));
  return G(o, tr(x, y, s, rot));
}
// Roblox-style chat bubble anchored at its tail tip
function chatBubble(txt, x, y, k, s = 1, col = '#151515', bg = '#FFFFFF') {
  if (k <= 0) return '';
  const w = 70 + txt.length * 30;
  let o = R(-w / 2, -150, w, 100, 30, ol(bg, 6)) + P('M-22 -54 L0 0 L22 -54 Z', ol(bg, 6)) + R(-26, -62, 52, 14, 0, { fill: bg });
  o += TF(txt, 0, -82, 52, col);
  return G(o, tr(x, y, s * ease.outBack(clamp(k, 0, 1))));
}
// hold-progress ring
function holdRing(x, y, r, k, col = '#FFE14D', label = '') {
  const a = clamp(k, 0, 1) * Math.PI * 2 - 1e-4;
  let o = Ci(x, y, r, { fill: 'none', stroke: '#151515', 'stroke-width': 22, opacity: 0.6 });
  if (k > 0) o += P(`M${f(x)} ${f(y - r)} A${f(r)} ${f(r)} 0 ${a > Math.PI ? 1 : 0} 1 ${f(x + Math.sin(a) * r)} ${f(y - Math.cos(a) * r)}`, ln(14, col));
  if (label) o += outT(label, x, y + r + 70, 64, col, 9);
  return o;
}
// Roblox-ish graphics quality slider: k 0..1 filled
function gfxBar(x, y, k, t, op = 1) {
  if (op <= 0) return '';
  const n = 10, on = Math.round(clamp(k, 0, 1) * n);
  let o = R(-250, -62, 500, 124, 22, { fill: '#1F2233', opacity: 0.88, stroke: '#FFFFFF', 'stroke-width': 4 });
  o += TF('GRAPHICS QUALITY', -110, -18, 26, '#FFFFFF', { 'text-anchor': 'start' }) + Ci(-150, -26, 16, ol('#9AA3B2', 3)) + Ci(-150, -26, 6, { fill: '#1F2233' });
  for (let i = 0; i < n; i++) o += R(-220 + i * 44, 8, 36, 34, 6, { fill: i < on ? (i >= 8 ? '#FFD21F' : '#3BD16F') : '#3A3F55' });
  o += TF(on >= n ? 'MAX' : String(on), 222, -18, 26, on >= n ? '#FFD21F' : '#FFFFFF', { 'text-anchor': 'end' });
  if (on >= n) o += FX.sparkle(232, 30, 16 + 6 * Math.sin(t * 8));
  return G(o, tr(x, y), { opacity: f(op) });
}
// custom caption (used where the shared caption cannot work, e.g. the cashier's one-word run-on line)
const SPK = { CASHIER: ['#FFD0C4', '#FF7A5A'], MODBOT: ['#FFB0B0', '#FF4D5E'] };
function caption(txt, t, t0, sp, hi = false, y = 1010) {
  const sc = lerp(0.5, 1, ease.outBack(clamp((t - t0) / 0.13, 0, 1))) * (hi ? 1.08 : 1);
  return C.captionText(txt, SPK[sp][hi ? 1 : 0], sc, y, hi ? -3 : 0);
}

// ---------------------------------------------------------------- character props (body space)
// head-attached prop: pose must carry explicit headRot/headY so the prop follows the head
const onHead = (pose, svg) => ({ svg: G(svg, `translate(0 ${f(pose.headY || 0)}) rotate(${f(pose.headRot || 0)} 0 -560)`), layer: 'front' });
// Dex's comfy blanket cape (pastel with stars) + nightcap on the spikes
function dexBlanket() {
  let b = P('M-160 -560 Q-230 -420 -250 -250 Q-200 -230 -150 -260 Q-90 -230 -40 -262 Q0 -236 40 -262 Q90 -230 150 -260 Q200 -230 250 -250 Q230 -420 160 -560 Q0 -604 -160 -560 Z', ol('#8EC5FF', 8));
  for (const [x, y] of [[-150, -420], [130, -380], [-200, -300], [190, -300], [40, -480]]) b += P(FX.starPath(x, y, 22, 10), { fill: '#FFF2A8' });
  const front = P('M-160 -556 Q-120 -470 -150 -380', ln(10, '#6FA8EE')) + P('M160 -556 Q120 -470 150 -380', ln(10, '#6FA8EE')) + Ci(0, -548, 18, ol('#FFD21F', 5));
  return [{ svg: b, layer: 'back' }, { svg: front, layer: 'front' }];
}
function nightcap(t) {
  const sw = Math.sin(t * 3) * 8;
  let o = P(`M-130 -1040 Q-40 -1230 120 -1060 Q${f(170 + sw)} -1150 ${f(200 + sw)} -1240 Q40 -1250 -130 -1040 Z`, ol('#E8453C', 7));
  o += P(`M-70 -1110 Q20 -1180 110 -1100 M-20 -1170 Q60 -1220 ${f(150 + sw * 0.6)} -1180`, ln(16, '#FFFFFF'));
  o += R(-150, -1064, 290, 40, 20, ol('#FFFFFF', 6)) + Ci(204 + sw, -1250, 30, ol('#FFFFFF', 6));
  return G(o, 'rotate(-8 0 -1040)');
}
// Grandpa's disguise: upside-down mop bucket with a red "!" sticker
function bucketHead(t, k = 1) {
  if (k <= 0) return '';
  const dy = (1 - ease.out(clamp(k, 0, 1))) * -400;
  let o = P('M-150 -700 L150 -700 L120 -1010 L-120 -1010 Z', ol('#FFD21F', 9));
  o += P('M-150 -700 L150 -700', ln(22)) + P('M-150 -700 L150 -700', ln(12, '#E8B210'));
  o += P('M-112 -980 L-138 -730', ln(12, '#FFFFFF', 0.4)) + R(-70, -940, 140, 150, 18, ol('#1B1E28', 6)) + T('!', 0, -808, 140, '#FF3B4E');
  o += P('M-150 -840 Q-210 -900 -190 -990', ln(8)) + Ci(-190, -996, 10, ol('#C9CED8', 3)); // handle as an antenna
  o += Ci(-34, -716, 12, { fill: '#151515' }) + Ci(34, -716, 12, { fill: '#151515' }); // eye holes
  return G(o, `translate(0 ${f(dy)})`);
}
// janitor cart: (x, y) ground point, faces right; s = 1 → ~420 wide
function mopCart(x, y, s = 1, t = 0, o2 = {}) {
  const { roll = 0, bucket = true, mop = true } = o2;
  let o = S.ellipse(0, 0, 230, 18, { fill: '#000', opacity: 0.2 });
  o += R(-200, -150, 400, 24, 10, ol('#5A6478', 6)) + R(-190, -300, 18, 170, 6, ol('#8E9AB0', 5)) + P('M-200 -300 L-150 -300', ln(14)) + P('M-200 -300 L-150 -300', ln(8, '#3A3F55'));
  if (bucket) {
    o += P('M-120 -150 L140 -150 L160 -300 L-140 -300 Z', ol('#FFD21F', 7)) + R(-150, -312, 320, 24, 10, ol('#E8B210', 6)) + P('M-110 -170 L-128 -290', ln(9, '#FFFFFF', 0.4));
    o += R(70, -360, 70, 60, 8, ol('#8E9AB0', 5)) + P('M140 -350 L190 -400', ln(10));
    o += P('M-60 -312 Q-40 -326 -20 -312 Q0 -326 20 -312', { fill: '#6FB8E8', stroke: LINE, 'stroke-width': 4 });
  }
  if (mop) o += P('M-20 -312 L-70 -620', ln(16)) + P('M-20 -312 L-70 -620', ln(9, '#D59A5C'));
  for (const wx of [-160, 160]) o += G(Ci(0, 0, 30, ol('#2B2A33', 6)) + P('M-18 0 L18 0 M0 -18 L0 18', ln(4, '#8E9AB0')), `translate(${wx} -30) rotate(${f(roll)})`);
  o += R(-170, -66, 340, 20, 8, ol('#5A6478', 5));
  return G(o, tr(x, y, s));
}

// ---------------------------------------------------------------- Dex's doorstep at dawn (custom set)
// Layers in WORLD space through cam: house front (door at DEXH.door), porch step, yard, kerb + street on the right.
// Dex stands in the doorway at (DEXH.door.x, DEXH.floor). The street kerb runs at DEXH.street (Betsy parks there).
const DEXH = { floor: 905, street: 1010, door: { x: 640, w: 230, top: 470 }, van: { x: 1560, s: 0.62 } };
function dexHouse(t, cam = {}, o2 = {}) {
  const { porchLight = 1 } = o2;
  let sky = R(-1200, -900, 4400, 2800, 0, { fill: 'url(#farmSkyDawn)' });
  sky += Ci(1700, 760, 600, { fill: 'url(#farmSunGlow)' }) + R(1640, 700, 120, 120, 28, { fill: '#FFB04A', stroke: '#E07A1A', 'stroke-width': 7 });
  for (let i = 0; i < 18; i++) { const s2 = 4 + hash(i) * 4; sky += R(hash(i * 3) * 2400 - 200, hash(i * 7) * 300 - 100, s2, s2, 1, { fill: '#FFF6E0', opacity: f(0.3 + 0.4 * Math.abs(Math.sin(t * 1.7 + i))) }); }
  let far = '';
  for (let i = 0; i < 9; i++) {
    const x = -700 + i * 420 + hash(i) * 80, h = 220 + hash(i * 3) * 120;
    far += R(x, 860 - h, 340, h + 300, 8, { fill: '#7A5A8E' }) + P(`M${x - 30} ${860 - h} L${x + 170} ${760 - h} L${x + 370} ${860 - h} Z`, { fill: '#6A4A7E' });
    for (let j = 0; j < 2; j++) far += R(x + 60 + j * 150, 900 - h + 40, 60, 60, 6, { fill: hash(i * 5 + j) > 0.6 ? '#FFD98A' : '#5A3A6E' });
  }
  far += R(-1200, 840, 4400, 400, 0, { fill: '#6A4A7E' });
  // the house (k = 1)
  const { x: dx, w: dw, top: dt } = DEXH.door, fl = DEXH.floor;
  let h = R(-1200, 840, 4400, 600, 0, { fill: '#7DBA6A' }) + R(-1200, 840, 4400, 600, 0, { fill: 'url(#farmSandRip)', opacity: 0.25 });
  // sidewalk, kerb, street
  h += P(`M1180 ${fl + 20} L3200 ${fl + 20} L3200 ${DEXH.street} L1100 ${DEXH.street} Z`, { fill: '#C9C1D6' }) + R(1100, DEXH.street - 6, 2200, 18, 4, ol('#E9E4F0', 4)) + R(1100, DEXH.street + 12, 2200, 500, 0, { fill: '#4C4558' });
  for (let x = 1240; x < 3200; x += 160) h += P(`M${x} ${fl + 22} L${x - 30} ${DEXH.street - 6}`, ln(3, '#AEA6BE'));
  h += R(-1200, 160, 2380, fl - 160, 0, { fill: '#8FA9E8' }) + R(-1200, 160, 2380, fl - 160, 0, { fill: 'url(#setsSiding)' });
  h += R(1150, 160, 40, fl - 160, 6, ol('#F4F1EA', 5)) + R(-1200, 120, 2440, 60, 10, ol('#5A4A7A', 7)) + R(-1200, 170, 2440, 14, 0, { fill: '#000', opacity: 0.12 });
  // window with a gamer glow + "NO STAIRS" sticker
  h += R(90, 360, 320, 260, 12, ol('#2A2246', 7)) + R(104, 374, 292, 232, 6, { fill: '#3A2E7A' }) + R(104, 374, 292, 232, 6, { fill: '#27C4FF', opacity: f(0.25 + 0.1 * Math.sin(t * 5)) });
  h += P('M250 374 L250 606 M104 490 L396 490', ln(8, '#F4F1EA')) + R(80, 610, 340, 26, 8, ol('#F4F1EA', 5));
  h += R(140, 520, 80, 60, 6, { fill: '#1C1E26' }) + R(150, 528, 60, 36, 3, { fill: '#27C4FF', opacity: 0.8 });
  // door frame + open door + warm hallway light
  h += R(dx - dw / 2 - 30, dt - 40, dw + 60, fl - dt + 40, 10, ol('#F4F1EA', 7)) + R(dx - dw / 2, dt, dw, fl - dt, 4, { fill: '#5A3A2A' });
  h += R(dx - dw / 2 + 10, dt + 10, dw - 20, fl - dt - 10, 4, { fill: '#FFD98A', opacity: 0.55 }) + P(`M${dx - dw / 2 + 30} ${dt + 30} L${dx + dw / 2 - 40} ${dt + 30} L${dx + dw / 2 - 40} ${fl - 160} L${dx - dw / 2 + 30} ${fl - 160} Z`, { fill: '#FFF0C8', opacity: 0.35 });
  h += P(`M${dx + dw / 2} ${dt} L${dx + dw / 2 + 70} ${dt - 20} L${dx + dw / 2 + 70} ${fl + 20} L${dx + dw / 2} ${fl} Z`, ol('#3E6FD8', 6)) + Ci(dx + dw / 2 + 50, (dt + fl) / 2, 8, ol('#FFD21F', 3));
  h += R(dx - 90, dt - 110, 180, 56, 10, ol('#FFFFFF', 5)) + TF('NO STAIRS', dx, dt - 74, 26, '#E8453C') + P(`M${dx - 70} ${dt - 100} L${dx + 70} ${dt - 64}`, ln(4, '#E8453C', 0.7));
  // porch lamp
  const pl = porchLight * (0.85 + 0.15 * Math.sin(t * 13));
  h += R(dx + dw / 2 + 110, dt + 60, 40, 70, 10, ol('#3A3F55', 5)) + R(dx + dw / 2 + 118, dt + 70, 24, 50, 6, { fill: porchLight > 0 ? '#FFF0B8' : '#7A6A50' });
  if (porchLight > 0) h += Ci(dx + dw / 2 + 130, dt + 95, 180, { fill: 'url(#farmGlowWarm)', opacity: f(pl) });
  // step + doormat + plant + house number
  h += R(dx - dw / 2 - 90, fl - 6, dw + 180, 34, 8, ol('#D9D2E0', 6)) + R(dx - dw / 2 - 130, fl + 26, dw + 260, 34, 8, ol('#C2BAD0', 6));
  h += R(dx - 90, fl - 16, 180, 16, 6, ol('#27C4FF', 3)) + TF('GG', dx, fl - 3, 16, '#1C1E26');
  h += P(`M${dx - dw / 2 - 160} ${fl} L${dx - dw / 2 - 150} ${fl - 80} L${dx - dw / 2 - 80} ${fl - 80} L${dx - dw / 2 - 70} ${fl} Z`, ol('#E8804A', 5)) + Ci(dx - dw / 2 - 115, fl - 120, 46, ol('#5CC24A', 5)) + Ci(dx - dw / 2 - 90, fl - 150, 28, ol('#7BDB5A', 4));
  h += R(dx + dw / 2 + 100, dt + 170, 64, 48, 8, ol('#FFFFFF', 4)) + T('12', dx + dw / 2 + 132, dt + 208, 36, '#3E6FD8');
  // hedge + mailbox by the kerb
  h += R(1200, fl - 70, 220, 90, 40, ol('#4CA85A', 5)) + R(1700, fl - 140, 20, 160, 4, ol('#8A5A3A', 4)) + R(1660, fl - 190, 100, 60, 26, ol('#3E6FD8', 5)) + R(1748, fl - 200, 10, 40, 3, { fill: '#E8453C' });
  // fg: lawn tufts (k 1.3)
  let fg = '';
  for (let i = 0; i < 9; i++) { const x = -200 + i * 290; fg += P(`M${x} 1100 l14 -48 l10 40 l12 -60 l10 60 l14 -40 l8 48 Z`, ol('#4CA85A', 4)); }
  return { bg: view(cam, sky, 0) + view(cam, far, 0.45), mid: view(cam, h, 1), fg: view(cam, fg, 1.3), light: wash('#FF9A6A', 0.08) };
}

// ---------------------------------------------------------------- Juno's blueprint of the Server Farm (cross-section insert)
// full-frame insert; k = drawing progress of the red circle around the Core, look 0..1 tilts down the page
function blueprint(t, cam, ring = 0, cob = 0) {
  let o = R(-400, -400, 2720, 2400, 0, { fill: '#2457A8' });
  for (let x = -400; x < 2400; x += 60) o += P(`M${x} -400 L${x} 2000`, ln(2, '#5C8AD8', 0.45));
  for (let y = -400; y < 2000; y += 60) o += P(`M-400 ${y} L2400 ${y}`, ln(2, '#5C8AD8', 0.45));
  o += outT('SERVER FARM — CROSS SECTION', 960, 120, 64, '#FFFFFF', 0, { stroke: 'none', opacity: 0.95 });
  const floors = ['ROOF · FANS', 'LOBBY', 'RACK HALL', 'COOLING (BRR)', 'CABLE JUNGLE', 'LOST & FOUND', 'THE ARCHIVE'];
  floors.forEach((nm, i) => {
    const y = 200 + i * 150;
    o += R(560, y, 800, 130, 6, { fill: 'none', stroke: '#E9F2FF', 'stroke-width': 6 }) + TF(nm, 960, y + 82, 40, '#E9F2FF');
    o += P(`M1360 ${y + 65} L1460 ${y + 65}`, ln(4, '#E9F2FF', 0.6)) + TF(`${i}F`, 1500, y + 78, 34, '#E9F2FF', { 'text-anchor': 'start' });
  });
  // the Core, the very bottom
  const yc = 200 + floors.length * 150 + 40;
  o += R(500, yc, 920, 300, 10, { fill: '#1A3E7E', stroke: '#FFFFFF', 'stroke-width': 8, 'stroke-dasharray': '22 14' });
  o += outT('THE CORE', 960, yc + 90, 70, '#FFFFFF', 0, { stroke: 'none' });
  o += K.loadingWheel(960, yc + 190, 50, t, '#E9F2FF', 8, 12);
  o += Ci(960, yc + 190, 80, { fill: 'none', stroke: '#E9F2FF', 'stroke-width': 4, 'stroke-dasharray': '10 10' });
  // cobwebs + dust ("nobody's been down there in years")
  if (cob > 0) {
    const web = (x, y, sx) => G(P('M0 0 L120 0 M0 0 L0 120 M0 0 L90 90 M0 0 L110 46 M0 0 L46 110 M30 0 Q24 24 0 30 M70 0 Q56 56 0 70 M110 0 Q90 90 0 110', ln(4, '#E9F2FF', 0.9)), tr(x, y, ease.outBack(clamp(cob, 0, 1)) * sx));
    o += web(500, yc, 1) + G(web(0, 0, 1), `translate(1420 ${yc}) scale(-1 1)`);
    o += TF('(NOBODY. IN YEARS.)', 1250, yc + 280, 30, '#E9F2FF', { opacity: f(clamp(cob * 2, 0, 1)) });
  }
  // red marker circle drawn on "Core"
  if (ring > 0) {
    const n = 40, m = Math.ceil(n * clamp(ring, 0, 1));
    let d = '';
    for (let i = 0; i <= m; i++) { const a = -2.4 + (i / n) * Math.PI * 2.15, rr = 1 + 0.04 * Math.sin(i * 1.3); d += (i ? ' L' : 'M') + `${f(960 + Math.cos(a) * 560 * rr)} ${f(yc + 150 + Math.sin(a) * 210 * rr)}`; }
    o += P(d, ln(16, '#FF3B4E'));
    if (ring >= 1) o += outT('LAG HERE!', 1520, yc + 40, 56, '#FF3B4E', 8, { transform: `rotate(-8 1520 ${yc + 40})` });
  }
  // paper edge + Juno's pencil
  o += R(380, 40, 1160, yc + 380, 18, { fill: 'none', stroke: '#E9F2FF', 'stroke-width': 10 });
  return view(cam, o, 1);
}

// ---------------------------------------------------------------- the speedometer close-up (Betsy's dial ends at 40)
function speedo(t, x, y, s, mph, glow = 0) {
  let o = Ci(0, 0, 230, ol('#22252F', 12)) + Ci(0, 0, 200, ol('#FFF4DC', 8));
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (0.8 + i * 0.175);
    o += P(`M${f(Math.cos(a) * 196)} ${f(Math.sin(a) * 196)} L${f(Math.cos(a) * (i % 2 ? 172 : 156))} ${f(Math.sin(a) * (i % 2 ? 172 : 156))}`, ln(i % 2 ? 5 : 9, '#3A3F55'));
    if (i % 2 === 0) o += T(String(i * 5), Math.cos(a) * 120, Math.sin(a) * 120 + 18, 50, i === 8 ? '#E8504A' : '#3A3F55');
  }
  o += P(`M${f(Math.cos(Math.PI * 2.2) * 200)} ${f(Math.sin(Math.PI * 2.2) * 200)} A200 200 0 0 1 ${f(Math.cos(Math.PI * 2.32) * 200)} ${f(Math.sin(Math.PI * 2.32) * 200)}`, ln(18, '#E8504A'));
  o += TF('MPH', 0, 110, 34, '#3A3F55') + R(-74, 130, 148, 46, 8, ol('#1A1A22', 4)) + TF('1998', 0, 165, 32, '#FFB238');
  const a = Math.PI * (0.8 + clamp(mph / 40, 0, 1.04) * 1.4) + Math.sin(t * 40) * 0.025;
  o += P(`M0 0 L${f(Math.cos(a) * 168)} ${f(Math.sin(a) * 168)}`, ln(14, '#E8504A')) + Ci(0, 0, 22, ol('#151515', 4));
  if (glow > 0) o += Ci(0, 0, 260, { fill: 'none', stroke: '#FFE14D', 'stroke-width': 10, opacity: f(glow) });
  return G(o, tr(x, y, s));
}

// ---------------------------------------------------------------- the "same cactus" (a landmark you can't miss)
function landmarkCactus(x, base, s, t, c) {
  let o = FM.cactus(0, 0, 1, c, 3, true, Math.sin(t * 1.4) * 2);
  const h = 260 + hash(3 * 12.9898) * 120;   // same height formula as farm.js cactus(seed 3)
  // a hand-painted sign nailed high on the trunk
  o += G(R(-120, -44, 240, 88, 12, ol('#F4E2B8', 6)) + TF('YOU ARE', 0, -6, 30, '#7A3A2A') + TF('HERE', 0, 30, 30, '#E8453C') + Ci(-100, -26, 5, { fill: '#5A3A2A' }) + Ci(100, -26, 5, { fill: '#5A3A2A' }), `translate(0 ${f(-h * 0.86)}) rotate(-5)`);
  return G(o, tr(x, base, s));
}

module.exports = {
  G, tr, outT, outTF, R, P, Ci, LINE,
  fixMid, wash, whipX, whipFx, flash, lagHold,
  dingFx, stampX, hudTile, snacks, chatBubble, holdRing, gfxBar, caption,
  onHead, dexBlanket, nightcap, bucketHead, mopCart,
  DEXH, dexHouse, blueprint, speedo, landmarkCactus,
};
