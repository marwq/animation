// Private helpers for SC 08 («ВНУТРИ»): the elevator (door POV + exterior with the gang inside), Pip's "Ding!",
// the shaft-down POV with a dolly zoom, the vine-swing physics (two real pendulums + ballistic flights + slow-mo
// time warp), Juno's chalk annotations, Dex's obby HUD, the ice-glass smack, the low-angle leap backdrop, and the
// small props (sword with a name tag, the three "visits" icons, a lone cracking bubble).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF } = K;
const FM = require('./farm');

const LINE = '#151515';
const W = 1920, H = 1080;
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const TFS = (txt, x, y, size, fill, extra = {}) => TF(txt, x, y, size, fill, { stroke: LINE, 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => (t <= t0 ? 0 : ease.outBack(seg(t, t0, t0 + d)));
const at = (wx, wy, zoom = 1, extra = {}) => ({ zoom, x: wx - 960, y: wy - 540, ...extra });
function shakeAll(cam, t, list) {
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
// rotate + slightly overscale the whole frame (dutch angle) so no corner shows
const dutch = (svg, deg, cx = 960, cy = 540) => (Math.abs(deg) < 0.01 ? svg : S.g(svg, `translate(${cx} ${cy}) rotate(${f(deg)}) scale(${f(1 + Math.abs(deg) * 0.012)}) translate(${-cx} ${-cy})`));
const glow = (x, y, r, id, op = 1) => (op > 0.003 ? S.circle(x, y, r, { fill: `url(#${id})`, opacity: f(clamp(op, 0, 1)) }) : '');
// cheap soft light: three flat translucent discs (large radial gradients are slow to rasterise)
const GLOW_COL = { s08warm: '#FFD98A', s08cyan: '#7CF0FF', s08gold: '#FFE27A', s08neon: '#FF9BE0' };
const soft = (x, y, r, id, op = 1) => (op > 0.003 ? [1, 0.68, 0.4].map((k) => S.circle(x, y, r * k, { fill: GLOW_COL[id] || id, opacity: f(clamp(op, 0, 1) * 0.13) })).join('') : '');

// ---------------------------------------------------------------- defs
const DEFS = `<defs>
<radialGradient id="s08warm"><stop offset="0" stop-color="#FFE9B0" stop-opacity="0.85"/><stop offset="0.5" stop-color="#FFC266" stop-opacity="0.28"/><stop offset="1" stop-color="#FFB040" stop-opacity="0"/></radialGradient>
<radialGradient id="s08cyan"><stop offset="0" stop-color="#C9FBFF" stop-opacity="0.85"/><stop offset="0.45" stop-color="#5CE1FF" stop-opacity="0.3"/><stop offset="1" stop-color="#2E8BFF" stop-opacity="0"/></radialGradient>
<radialGradient id="s08gold"><stop offset="0" stop-color="#FFF6C8" stop-opacity="1"/><stop offset="0.4" stop-color="#FFD34D" stop-opacity="0.45"/><stop offset="1" stop-color="#FFB000" stop-opacity="0"/></radialGradient>
<radialGradient id="s08dark"><stop offset="0" stop-color="#000000" stop-opacity="0.9"/><stop offset="0.6" stop-color="#05060C" stop-opacity="0.55"/><stop offset="1" stop-color="#05060C" stop-opacity="0"/></radialGradient>
<radialGradient id="s08greyCreep" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#7C8494" stop-opacity="0.95"/><stop offset="0.35" stop-color="#7C8494" stop-opacity="0.5"/><stop offset="1" stop-color="#7C8494" stop-opacity="0.08"/></radialGradient>
<radialGradient id="s08vigCold" cx="0.5" cy="0.45" r="0.75"><stop offset="0.5" stop-color="#0A0E1A" stop-opacity="0"/><stop offset="1" stop-color="#0A0E1A" stop-opacity="0.75"/></radialGradient>
<radialGradient id="s08neon"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.3" stop-color="#FFE14D" stop-opacity="0.5"/><stop offset="1" stop-color="#FF5AC8" stop-opacity="0"/></radialGradient>
<linearGradient id="s08spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
<linearGradient id="s08fogDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02040C" stop-opacity="0"/><stop offset="1" stop-color="#02040C" stop-opacity="0.92"/></linearGradient>
<linearGradient id="s08iceGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8FBFF" stop-opacity="0.55"/><stop offset="0.5" stop-color="#BDEBFF" stop-opacity="0.18"/><stop offset="1" stop-color="#8FD0F0" stop-opacity="0.45"/></linearGradient>
</defs>`;

// ---------------------------------------------------------------- Pip's "Ding!": a little golden elevator bell + sparkle
// k = 0..1 life of the effect (pop in, ring, fade)
function ding(x, y, k, s = 1, opts = {}) {
  if (k <= 0 || k >= 1) return '';
  const { text = 'DING!', col = '#FFD21F', tilt = -8 } = opts;
  const sc = s * ease.outBack(clamp(k / 0.25, 0, 1));
  const fade = 1 - seg(k, 0.7, 1);
  const ring = Math.sin(k * 30) * 14 * (1 - k);
  let o = K.rays(0, 0, 12, 150, '#FFF1A8', 0.25 * fade, k * 90);
  for (let i = 0; i < 3; i++) {
    const r = 70 + i * 26 + k * 60;
    o += S.path(`M${f(-r * 0.7)} ${f(-r * 0.5)} A${r} ${r} 0 0 1 ${f(r * 0.7)} ${f(-r * 0.5)}`, ln(7 - i * 1.5, '#FFF6C8', fade * (0.9 - i * 0.25)));
  }
  let bell = S.path('M-34 20 Q-36 -30 0 -34 Q36 -30 34 20 Z', ol(col, 6)) + S.rect(-42, 16, 84, 14, 7, ol('#E0A21A', 5)) + S.circle(0, -40, 8, ol(col, 4)) + S.circle(0, 34, 8, ol('#E0A21A', 4));
  bell += S.path('M-18 -16 Q-16 -26 -6 -28', ln(6, '#FFFFFF', 0.85));
  o += S.g(bell, `rotate(${f(ring)} 0 -40)`);
  o += K.F.sparkle(-70, -50, 18 * fade) + K.F.sparkle(72, -30, 14 * fade) + K.F.sparkle(40, -86, 10 * fade);
  if (text) o += K.F.markText(text, 0, -88, 64, tilt, '#FFF4B0');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(sc)})`, fade < 1 ? { opacity: f(fade) } : {});
}

// ---------------------------------------------------------------- the elevator seen from INSIDE (POV): doors part, camera pushes through
// open 0..1 (doors), push 0..1 (scale through the doorway + fade), label/prev: floor indicator (flips at flipK 0..1)
const POV = { x0: 640, x1: 1280, y0: 250, y1: 900, wall: { x0: 430, x1: 1490, y0: 140, y1: 900 } };
function liftPOV(t, o = {}) {
  const { open = 0, push = 0, label = '1', prev = null, flipK = 1, spill = '#BFEFFF', tint = null } = o;
  if (push >= 1) return '';
  const { x0, x1, y0, y1, wall } = POV;
  let g = '';
  // side walls, ceiling, floor of the car (one-point perspective onto the front wall)
  g += S.path(`M-400 -300 L${wall.x0} ${wall.y0} L${wall.x0} ${wall.y1} L-400 1400 Z`, { fill: 'url(#farmWoodPanel)', stroke: LINE, 'stroke-width': 7 });
  g += S.path(`M2320 -300 L${wall.x1} ${wall.y0} L${wall.x1} ${wall.y1} L2320 1400 Z`, { fill: 'url(#farmWoodPanel)', stroke: LINE, 'stroke-width': 7 });
  g += S.path(`M-400 -300 L${wall.x0} ${wall.y0} L${wall.x0} ${wall.y1} L-400 1400 Z M2320 -300 L${wall.x1} ${wall.y0} L${wall.x1} ${wall.y1} L2320 1400 Z`, { fill: '#2A1408', 'fill-opacity': 0.35 });
  g += S.path(`M-400 -300 L2320 -300 L${wall.x1} ${wall.y0} L${wall.x0} ${wall.y0} Z`, { fill: '#E9E2D6', stroke: LINE, 'stroke-width': 7 });
  g += S.rect(760, 30, 400, 56, 14, { fill: '#FFF8E0', stroke: '#C9C1B4', 'stroke-width': 4 });
  g += S.path(`M${wall.x0} ${wall.y1} L${wall.x1} ${wall.y1} L2320 1400 L-400 1400 Z`, { fill: 'url(#farmCheck)', stroke: LINE, 'stroke-width': 7 });
  // brass handrails on the side walls
  g += S.path(`M-400 820 L${wall.x0} 640`, ln(24)) + S.path(`M-400 820 L${wall.x0} 640`, ln(14, '#E0B84A'));
  g += S.path(`M2320 820 L${wall.x1} 640`, ln(24)) + S.path(`M2320 820 L${wall.x1} 640`, ln(14, '#E0B84A'));
  // button panel on the right wall (skewed)
  g += S.g(S.rect(0, 0, 150, 300, 10, ol('#8E9AB0', 6)) + S.g(S.rect(0, 0, 120, 250, 0, { fill: 'url(#farmBtn)' }), 'translate(15 22)'), `translate(1560 330) skewY(-26)`);
  // front wall with the door opening (evenodd hole)
  g += S.path(`M${wall.x0} ${wall.y0} H${wall.x1} V${wall.y1} H${wall.x0} Z M${x0 - 40} ${y0 - 40} V${y1} H${x1 + 40} V${y0 - 40} Z`, { fill: '#9A5E36', 'fill-rule': 'evenodd', stroke: LINE, 'stroke-width': 7 });
  g += S.path(`M${x0 - 40} ${y1} V${y0 - 40} H${x1 + 40} V${y1}`, { fill: 'none', stroke: '#C9D2E0', 'stroke-width': 30 }) + S.path(`M${x0 - 55} ${y1} V${y0 - 55} H${x1 + 55} V${y1}`, ln(6)) + S.path(`M${x0 - 25} ${y1} V${y0 - 25} H${x1 + 25} V${y1}`, ln(5));
  // light spilling in through the opening onto the car floor
  if (open > 0.02) {
    const w = (x1 - x0) * open;
    g += S.path(`M${f(960 - w / 2)} ${y1} L${f(960 + w / 2)} ${y1} L${f(960 + w * 1.5)} 1400 L${f(960 - w * 1.5)} 1400 Z`, { fill: spill, opacity: f(0.22 * open) });
  }
  // the doors (clipped to the opening)
  const cid = S.uid('s08pov');
  const dw = (x1 - x0) / 2, sl = dw * clamp(open, 0, 1);
  let d = S.rect(x0 - sl, y0 - 40, dw, y1 - y0 + 40, 0, { fill: 'url(#farmSteel)', stroke: LINE, 'stroke-width': 5 }) + S.rect(x0 + dw + sl, y0 - 40, dw, y1 - y0 + 40, 0, { fill: 'url(#farmSteel)', stroke: LINE, 'stroke-width': 5 });
  d += S.rect(x0 - sl + 26, y0, 30, y1 - y0 - 40, 6, { fill: '#FFFFFF', opacity: 0.2 }) + S.rect(x0 + dw + sl + 26, y0, 30, y1 - y0 - 40, 6, { fill: '#FFFFFF', opacity: 0.2 });
  if (tint) d += S.rect(x0 - 40, y0 - 40, x1 - x0 + 80, y1 - y0 + 80, 0, { fill: tint, opacity: 0.15 });
  g += S.clipDef(cid, S.rect(x0 - 40, y0 - 40, x1 - x0 + 80, y1 - y0 + 40)) + S.g(d, null, { 'clip-path': `url(#${cid})` });
  // floor indicator above the door (flips from prev to label)
  g += S.rect(860, 152, 200, 70, 12, ol('#22252F', 6));
  const fk = prev === null ? 1 : clamp(flipK, 0, 1);
  const showTxt = fk < 0.5 ? prev : label;
  const sy = Math.abs(Math.cos(fk * Math.PI));
  const big = String(showTxt).length > 1;
  g += S.g(T(String(showTxt), 0, 18, big ? 44 : 54, '#FF8A3D'), `translate(960 190) scale(1 ${f(Math.max(0.05, sy))})`);
  g += S.path('M880 172 L892 158 L904 172 Z', { fill: '#FF8A3D', opacity: f(0.4 + 0.6 * (Math.floor(t * 3) % 2)) });
  // the little bell lamp
  g += S.circle(1110, 186, 18, ol(open > 0.02 && open < 0.98 ? '#FFE14D' : '#E9EDF3', 5));
  const sc = 1 + 2.4 * ease.in(clamp(push, 0, 1));
  const op = 1 - seg(push, 0.55, 1);
  return S.g(g, `translate(960 575) scale(${f(sc)}) translate(-960 -575)`, op < 1 ? { opacity: f(op) } : {});
}

// ---------------------------------------------------------------- the elevator seen from OUTSIDE (floor 1): ice wall + car with the gang
// returns { back (car interior), front (doors + icy wall + floor) }; characters go in between. Car floor y = LF.floor.
const LF = { x0: 520, x1: 1400, y0: 236, floor: 880 };
function liftFront(t, o = {}) {
  const { open = 0, label = '1', snow = 1 } = o;
  const { x0, x1, y0, floor } = LF;
  // car interior
  let back = S.rect(x0, y0, x1 - x0, floor - y0 + 20, 0, { fill: 'url(#farmWoodPanel)' }) + S.rect(x0, y0, x1 - x0, 70, 0, { fill: '#FFF4C8', opacity: 0.95 });
  back += S.rect(x0 + 60, y0 + 120, x1 - x0 - 120, 210, 10, ol('#BFE3F2', 5)) + S.path(`M${x0 + 160} ${y0 + 330} L${x0 + 260} ${y0 + 120} L${x0 + 310} ${y0 + 120} L${x0 + 210} ${y0 + 330} Z`, { fill: '#FFFFFF', opacity: 0.35 });
  back += S.rect(x0, y0 + 380, x1 - x0, 16, 6, ol('#E0B84A', 4)) + S.rect(x0, floor - 40, x1 - x0, 60, 0, { fill: 'url(#farmCheck)' });
  // icy wall around the opening (evenodd hole)
  let front = '';
  const cid = S.uid('s08lf');
  const dw = (x1 - x0) / 2, sl = dw * clamp(open, 0, 1) * 0.98;
  let d = S.rect(x0 - sl, y0, dw, floor - y0 + 20, 0, { fill: 'url(#farmSteel)', stroke: LINE, 'stroke-width': 5 }) + S.rect(x0 + dw + sl, y0, dw, floor - y0 + 20, 0, { fill: 'url(#farmSteel)', stroke: LINE, 'stroke-width': 5 });
  d += S.rect(x0 - sl + 30, y0 + 40, 40, floor - y0 - 80, 6, { fill: '#FFFFFF', opacity: 0.22 }) + S.rect(x0 + dw + sl + 30, y0 + 40, 40, floor - y0 - 80, 6, { fill: '#FFFFFF', opacity: 0.22 });
  // frost on the door panels
  d += S.path(`M${f(x0 - sl)} ${floor - 120} Q${f(x0 - sl + 120)} ${floor - 190} ${f(x0 - sl + dw)} ${floor - 150} L${f(x0 - sl + dw)} ${floor + 20} L${f(x0 - sl)} ${floor + 20} Z`, { fill: '#FFFFFF', opacity: 0.6 });
  d += S.path(`M${f(x0 + dw + sl)} ${floor - 150} Q${f(x0 + dw + sl + 200)} ${floor - 210} ${f(x1 + sl)} ${floor - 110} L${f(x1 + sl)} ${floor + 20} L${f(x0 + dw + sl)} ${floor + 20} Z`, { fill: '#FFFFFF', opacity: 0.6 });
  front += S.clipDef(cid, S.rect(x0, y0, x1 - x0, floor - y0 + 20)) + S.g(d, null, { 'clip-path': `url(#${cid})` });
  front += S.path(`M-400 -300 H2320 V${floor + 20} H-400 Z M${x0} ${y0} V${floor + 20} H${x1} V${y0} Z`, { fill: 'url(#farmIceWall)', 'fill-rule': 'evenodd' });
  front += S.path(`M-400 -300 H2320 V${floor + 20} H-400 Z M${x0} ${y0} V${floor + 20} H${x1} V${y0} Z`, { fill: 'url(#farmFrost)', 'fill-rule': 'evenodd', opacity: 0.7 });
  // frosty panels on the wall
  for (const px of [-300, 120, 1580, 2000]) front += S.rect(px, 120, 300, 700, 24, { fill: '#FFFFFF', 'fill-opacity': 0.12, stroke: '#7FA8D8', 'stroke-width': 6 });
  // frame
  front += S.path(`M${x0 - 60} ${floor + 20} V${y0 - 60} H${x1 + 60} V${floor + 20} H${x1} V${y0} H${x0} V${floor + 20} Z`, { fill: '#8E9AB0', stroke: LINE, 'stroke-width': 7 });
  front += S.rect(x0 - 60, y0 - 60, 40, floor - y0 + 80, 0, { fill: 'url(#farmHazard)', opacity: 0.8 }) + S.rect(x1 + 20, y0 - 60, 40, floor - y0 + 80, 0, { fill: 'url(#farmHazard)', opacity: 0.8 });
  // snow caps + icicles on the frame
  front += S.path(`M${x0 - 80} ${y0 - 56} Q${x0 + 200} ${y0 - 110} ${960} ${y0 - 70} Q${x1 - 200} ${y0 - 112} ${x1 + 80} ${y0 - 56} Z`, { fill: '#FFFFFF', stroke: '#B9E2F5', 'stroke-width': 5 });
  let ic = '';
  for (let j = 0; j < 12; j++) { const ix = x0 - 40 + j * 84 + hash(j * 3.3) * 30, il = 26 + hash(j * 7.1) * 60; ic += `M${f(ix - 12)} ${y0 - 24} L${f(ix)} ${f(y0 - 24 + il)} L${f(ix + 12)} ${y0 - 24} Z `; }
  front += S.path(ic, { fill: '#E8FAFF', stroke: '#7FB8E0', 'stroke-width': 4, 'stroke-linejoin': 'round' });
  // indicator + bell
  front += S.rect(880, 70 + 70, 160, 72, 12, ol('#22252F', 6)) + T(label, 960, 198, 56, '#FF8A3D');
  front += S.rect(840, 128, 240, 14, 6, { fill: '#FFFFFF', opacity: 0.8 });
  front += S.circle(1150, 176, 20, ol(open > 0.02 && open < 0.98 ? '#FFE14D' : '#E9EDF3', 5));
  front += S.g(R0(-150, 0, 300, 70, 14, ol('#E8F8FF', 6)) + T('FLOOR 1', 0, 50, 40, '#2E6FA8') + S.path('M-146 4 Q-60 -14 20 2 Q90 -12 146 4 Z', { fill: '#FFFFFF' }), 'translate(300 300) rotate(-3)');
  // ice floor in front
  front += S.rect(-400, floor + 20, 2720, 600, 0, { fill: 'url(#farmIceFloor)' }) + S.rect(-400, floor + 20, 2720, 600, 0, { fill: 'url(#farmIce)' }) + S.rect(-400, floor + 14, 2720, 12, 0, { fill: '#FFFFFF', opacity: 0.85 });
  front += S.rect(x0, floor + 26, x1 - x0, 200, 0, { fill: 'url(#s08spill)', opacity: f(0.35 * open) });
  // snow blowing INTO the car when the doors open
  let sn = '';
  if (snow > 0 && open > 0.05) for (let i = 0; i < 26; i++) {
    const a = ((t * 0.7 + hash(i * 1.7)) % 1);
    const x = lerp(x0 - 300 + hash(i * 2.9) * (x1 - x0 + 600), 960 + (hash(i * 5.3) - 0.5) * 500, a);
    const y = lerp(200 + hash(i * 3.1) * 800, 300 + hash(i * 6.1) * 600, a) + Math.sin(t * 4 + i) * 20;
    sn += S.circle(x, y, 4 + hash(i) * 6, { fill: '#FFFFFF', 'fill-opacity': f(0.85 * open * (1 - a * a)) });
  }
  return { back, front, snow: sn };
}
const R0 = (x, y, w, h, r, a) => S.rect(x, y, w, h, r, a);

// ---------------------------------------------------------------- the shaft seen straight down (Dex's POV) with a dolly zoom
// fz >= 1 stretches the depth (vertigo); bolt: seconds since the bolt fell (or <0); toes: Dex's sneakers over the edge
function shaftDown(t, o = {}) {
  const { fz = 1, bolt = -1, toes = 1, tremble = 0, obby = 0 } = o;
  const vx = 960 + Math.sin(t * 1.3) * 18 * tremble, vy = 600 + Math.cos(t * 1.1) * 10 * tremble;
  const HW = 1250, HH = 900;
  const N = 11;
  const zs = Array.from({ length: N }, (_, i) => Math.pow(1.5, i));
  const ring = (z) => { const k = fz / z; return [vx - HW * k, vy - HH * k, vx + HW * k, vy + HH * k]; };
  let o2 = S.rect(-200, -200, 2320, 1480, 0, { fill: '#050816' });
  // wall quads from far to near
  for (let i = N - 2; i >= 0; i--) {
    const [a0, b0, c0, d0] = ring(zs[i]), [a1, b1, c1, d1] = ring(zs[i + 1]);
    const dep = i / (N - 1), sh = FM.mix('#22346E', '#050816', Math.min(1, dep * 1.15));
    const sh2 = FM.mix('#1A2858', '#050816', Math.min(1, dep * 1.15));
    o2 += S.path(`M${f(a0)} ${f(b0)} L${f(a1)} ${f(b1)} L${f(a1)} ${f(d1)} L${f(a0)} ${f(d0)} Z`, { fill: sh2 });
    o2 += S.path(`M${f(c0)} ${f(b0)} L${f(c1)} ${f(b1)} L${f(c1)} ${f(d1)} L${f(c0)} ${f(d0)} Z`, { fill: sh2 });
    o2 += S.path(`M${f(a0)} ${f(b0)} L${f(c0)} ${f(b0)} L${f(c1)} ${f(b1)} L${f(a1)} ${f(b1)} Z`, { fill: sh });
    o2 += S.path(`M${f(a0)} ${f(d0)} L${f(c0)} ${f(d0)} L${f(c1)} ${f(d1)} L${f(a1)} ${f(d1)} Z`, { fill: sh });
    // ring edge (a floor slab) + LED dots
    const lw = Math.max(1.5, 14 / zs[i] * fz);
    o2 += S.rect(a1, b1, c1 - a1, d1 - b1, 0, { fill: 'none', stroke: FM.mix('#3A4F96', '#050816', dep), 'stroke-width': lw });
    if (i < N - 3) {
      let dots = '';
      const n = 14;
      for (let j = 0; j < n; j++) {
        const u = (j + 0.5) / n, on = hash(i * 31 + j * 7 + Math.floor(t * 4 + j)) > 0.45;
        if (!on) continue;
        const r = Math.max(1.5, 7 / zs[i + 1] * fz);
        dots += `M${f(lerp(a1, c1, u) - r)} ${f(b1 + lw * 1.6)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
        dots += `M${f(lerp(a1, c1, u) - r)} ${f(d1 - lw * 1.6)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
      }
      o2 += S.path(dots, { fill: obby > 0 ? FM.mix('#5CE1FF', '#FF5AC8', obby) : '#5CE1FF', opacity: f(clamp(1.1 - i / N, 0.15, 1)) });
    }
  }
  // the glow far below
  o2 += S.circle(vx, vy, 260 * fz, { fill: 'url(#farmGlowBlue)', opacity: 0.8 });
  o2 += S.circle(vx, vy, 30 * fz, { fill: '#9FF3FF', opacity: 0.35 });
  // hanging cables: radial lines from the near ring toward depth
  const CC = ['#3BD16F', '#34C3FF', '#FF9F1C', '#B06BFF', '#FF5A6E', '#FFD21F', '#2EE6FF'];
  for (let i = 0; i < 9; i++) {
    const ang = hash(i * 4.1) * Math.PI * 2, rr = 0.55 + hash(i * 2.3) * 0.4;
    const px = vx + Math.cos(ang) * HW * rr, py = vy + Math.sin(ang) * HH * rr;
    const z1 = 1.2, z2 = 3 + hash(i * 9.7) * 5;
    const ax = vx + (px - vx) * fz / z1, ay = vy + (py - vy) * fz / z1, bx = vx + (px - vx) * fz / z2, by = vy + (py - vy) * fz / z2;
    const sw = Math.sin(t * 1.4 + i) * 10;
    o2 += S.path(`M${f(ax)} ${f(ay)} Q${f((ax + bx) / 2 + sw)} ${f((ay + by) / 2 + sw)} ${f(bx)} ${f(by)}`, ln(26 / z1 * 0.8, LINE));
    o2 += S.path(`M${f(ax)} ${f(ay)} Q${f((ax + bx) / 2 + sw)} ${f((ay + by) / 2 + sw)} ${f(bx)} ${f(by)}`, ln(16 / z1 * 0.8, FM.mix(CC[i % 7], '#050816', 0.25)));
    o2 += S.circle(bx, by, 12 / z2 * fz + 2, ol('#C9D2E0', 2));
  }
  // a couple of hanging platforms deep below
  for (let i = 0; i < 4; i++) {
    const z = 2.2 + i * 1.6, ang = hash(i * 13.1) * Math.PI * 2;
    const px = vx + Math.cos(ang) * 700 * fz / z, py = vy + Math.sin(ang) * 520 * fz / z, w = 300 * fz / z, h = 120 * fz / z;
    o2 += S.rect(px - w / 2, py - h / 2, w, h, 6, { fill: obby > 0 ? ['#FF5A5A', '#FFB000', '#3BD16F', '#3B8BFF'][i] : '#2A3F82', stroke: LINE, 'stroke-width': Math.max(2, 6 * fz / z), opacity: f(clamp(1.2 - z / 9, 0.3, 1)) });
  }
  // the falling bolt
  if (bolt >= 0) {
    const z = 1.15 + bolt * bolt * 7;
    const px = 960, py = 800;
    const bx = vx + (px - vx) * fz / z, by = vy + (py - vy) * fz / z, r = 30 * fz / z;
    if (r > 1.2) o2 += S.g(S.path('M-10 -17 L10 -17 L20 0 L10 17 L-10 17 L-20 0 Z', ol('#C9D2E0', 5)) + S.circle(0, 0, 7, { fill: LINE }), `translate(${f(bx)} ${f(by)}) rotate(${f(bolt * 720)}) scale(${f(r / 20)})`);
  }
  // near edge: the ledge lip with hazard stripes + Dex's toes over it
  let near = S.path('M-200 820 L2120 820 L2120 1300 L-200 1300 Z', { fill: '#5A6A9A', stroke: LINE, 'stroke-width': 8 }) + S.rect(-200, 820, 2320, 34, 0, { fill: 'url(#farmHazard)' }) + S.path('M-200 820 L2120 820', ln(8)) + S.rect(-200, 880, 2320, 420, 0, { fill: 'url(#farmRack)', opacity: 0.5 });
  if (toes > 0) {
    const tr = Math.sin(t * 38) * 4 * tremble;
    for (const [sx, rot] of [[-1, -6], [1, 6]]) {
      let sh = S.path('M-70 120 L-70 -10 Q-70 -70 0 -76 Q70 -70 70 -10 L70 120 Z', ol('#1E8BFF', 8)) + S.path('M-70 -6 Q0 -24 70 -6 L70 18 Q0 0 -70 18 Z', ol('#FFFFFF', 6));
      sh += S.path('M-30 40 L30 40 M-30 66 L30 66 M-30 92 L30 92', ln(7, '#FFFFFF')) + S.path('M-40 -50 Q0 -66 40 -50', ln(6, '#8BE0FF'));
      near += S.g(sh, `translate(${f(960 + sx * 120 + tr)} ${f(880 - toes * 50)}) rotate(${rot}) scale(1.15)`);
    }
  }
  return o2 + near;
}

// ---------------------------------------------------------------- vine swing physics
// Dex (scale DS) runs off the start ledge, leaps, grabs vine 0, swings (a real pendulum), lets go, flies (ballistic),
// grabs vine 1 wherever his arc meets its circle, swings, lets go and lands on the end ledge. Story time tau (s);
// the scene maps real time -> tau with a slow-mo window (see warp()).
const J = FM.JUNGLE;
const DS = 0.42, HANDY = 755 * DS;       // pivot (hands) height above the feet
const GRAV = 3300;                        // px/s^2
const RUN = { x0: 200, x1: J.start.x1 - 6, dur: 0.3 };
function simulate() {
  const dt = 1 / 600, A0 = J.vines[0], A1 = J.vines[1];
  const L0 = A0.len, L1 = A1.len, LE0 = L0 + 80, LE1 = L1 + 80;
  const ev = {};
  const s = [];                           // samples: [tau, hx, hy, rot(deg, screen), phase, a0, a1, vx, vy]
  // run
  const tRun = RUN.dur;
  // leap -> catch vine 0 at angle ac0
  const ac0 = -46 * Math.PI / 180;
  const C0 = { x: A0.x + Math.sin(ac0) * L0, y: A0.y + Math.cos(ac0) * L0 };
  const H0 = { x: RUN.x1, y: J.start.y - HANDY };
  const TL = 0.36;
  const lvx = (C0.x - H0.x) / TL, lvy = (C0.y - H0.y - 0.5 * GRAV * TL * TL) / TL;
  ev.run = 0; ev.leap = tRun; ev.catch0 = tRun + TL;
  // pendulum 0
  let th = ac0, om = ((lvx) * Math.cos(th) + (lvy + GRAV * TL) * -Math.sin(th)) / L0;
  const sw0 = [];
  const rel0 = 39 * Math.PI / 180;
  while (th < rel0 && sw0.length < 6000) { sw0.push([th, om]); om += -GRAV / LE0 * Math.sin(th) * dt; th += om * dt; }
  ev.release0 = ev.catch0 + sw0.length * dt;
  const R0p = { x: A0.x + Math.sin(th) * L0, y: A0.y + Math.cos(th) * L0 };
  const rv0 = [om * L0 * Math.cos(th), -om * L0 * Math.sin(th)];
  const th0r = th, om0r = om;
  // flight 1 until the arc meets vine 1's circle
  let tf1 = 0, C1 = null;
  while (tf1 < 2) {
    tf1 += dt;
    const q = { x: R0p.x + rv0[0] * tf1, y: R0p.y + rv0[1] * tf1 + 0.5 * GRAV * tf1 * tf1 };
    if (Math.hypot(q.x - A1.x, q.y - A1.y) <= L1) { C1 = q; break; }
  }
  ev.catch1 = ev.release0 + tf1;
  let th1 = Math.atan2(C1.x - A1.x, C1.y - A1.y);
  const cv1 = [rv0[0], rv0[1] + GRAV * tf1];
  let om1 = (cv1[0] * Math.cos(th1) + cv1[1] * -Math.sin(th1)) / L1;
  const ac1 = th1;
  const sw1 = [];
  const rel1 = 27 * Math.PI / 180;
  while (th1 < rel1 && sw1.length < 6000) { sw1.push([th1, om1]); om1 += -GRAV / LE1 * Math.sin(th1) * dt; th1 += om1 * dt; }
  ev.release1 = ev.catch1 + sw1.length * dt;
  const R1p = { x: A1.x + Math.sin(th1) * L1, y: A1.y + Math.cos(th1) * L1 };
  const rv1 = [om1 * L1 * Math.cos(th1), -om1 * L1 * Math.sin(th1)];
  const th1r = th1, om1r = om1;
  let tf2 = 0;
  while (tf2 < 2) { tf2 += dt; const y = R1p.y + rv1[1] * tf2 + 0.5 * GRAV * tf2 * tf2; if (y + HANDY >= J.end.y && rv1[1] + GRAV * tf2 > 0) break; }
  ev.land = ev.release1 + tf2;
  const landX = R1p.x + rv1[0] * tf2;
  // free vines after release: keep swinging with a little damping
  const freeVine = (th0, om0, Leff, dur) => { const out = []; let a = th0, w = om0; for (let i = 0; i < dur / dt; i++) { out.push(a); w += (-GRAV / Leff * Math.sin(a) - 0.6 * w) * dt; a += w * dt; } return out; };
  const fv0 = freeVine(th0r, om0r * 0.55, L0, 4), fv1 = freeVine(th1r, om1r * 0.55, L1, 4);
  return { dt, ev, C0, H0, lvx, lvy, sw0, sw1, R0p, rv0, R1p, rv1, ac0, ac1, landX, fv0, fv1, w0: Math.sqrt(GRAV / L0), w1: Math.sqrt(GRAV / L1) };
}
const SIM = simulate();
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
// state at story time tau: { phase, hx, hy (pivot = hands), rot (screen deg, body axis), a0, a1 (vine angles deg), feetX, feetY, vx, vy }
function dexAt(tau) {
  const { ev, dt } = SIM, A0 = J.vines[0], A1 = J.vines[1];
  const idx = (arr, t0) => arr[clamp(Math.floor((tau - t0) / dt), 0, arr.length - 1)];
  // vine angles: free swing before the catch (amplitude = catch angle, at its extreme at the catch), driven while held, damped after
  let a0, a1;
  if (tau < ev.catch0) a0 = SIM.ac0 * Math.cos(SIM.w0 * (tau - ev.catch0));
  else if (tau < ev.release0) a0 = idx(SIM.sw0, ev.catch0)[0];
  else a0 = idx(SIM.fv0, ev.release0);
  if (tau < ev.catch1) a1 = SIM.ac1 * Math.cos(SIM.w1 * (tau - ev.catch1));
  else if (tau < ev.release1) a1 = idx(SIM.sw1, ev.catch1)[0];
  else a1 = idx(SIM.fv1, ev.release1);
  const st = { a0: a0 * R2D, a1: a1 * R2D };
  if (tau < ev.leap) {
    const u = clamp(tau / RUN.dur, 0, 1);
    const fx = tau < 0 ? RUN.x0 : lerp(RUN.x0, RUN.x1, u * u * 0.5 + u * 0.5);
    return { ...st, phase: tau < 0 ? 'ready' : 'run', hx: fx, hy: J.start.y - HANDY, rot: 0, feetX: fx, feetY: J.start.y, u };
  }
  if (tau < ev.catch0) {
    const k = tau - ev.leap, u = k / (ev.catch0 - ev.leap);
    const hx = SIM.H0.x + SIM.lvx * k, hy = SIM.H0.y + SIM.lvy * k + 0.5 * GRAV * k * k;
    return { ...st, phase: 'leap', hx, hy, rot: lerp(0, SIM.ac0 * R2D, ease.inOut(u)), u, vx: SIM.lvx, vy: SIM.lvy + GRAV * k };
  }
  if (tau < ev.release0) {
    const [th, om] = idx(SIM.sw0, ev.catch0);
    return { ...st, phase: 'swing0', hx: A0.x + Math.sin(th) * A0.len, hy: A0.y + Math.cos(th) * A0.len, rot: th * R2D, om, u: (tau - ev.catch0) / (ev.release0 - ev.catch0) };
  }
  if (tau < ev.catch1) {
    const k = tau - ev.release0, u = k / (ev.catch1 - ev.release0);
    const hx = SIM.R0p.x + SIM.rv0[0] * k, hy = SIM.R0p.y + SIM.rv0[1] * k + 0.5 * GRAV * k * k;
    const r0 = SIM.sw0[SIM.sw0.length - 1][0] * R2D;
    return { ...st, phase: 'fly1', hx, hy, rot: lerp(r0, SIM.ac1 * R2D, ease.inOut(u)), u };
  }
  if (tau < ev.release1) {
    const [th, om] = idx(SIM.sw1, ev.catch1);
    return { ...st, phase: 'swing1', hx: A1.x + Math.sin(th) * A1.len, hy: A1.y + Math.cos(th) * A1.len, rot: th * R2D, om, u: (tau - ev.catch1) / (ev.release1 - ev.catch1) };
  }
  if (tau < ev.land) {
    const k = tau - ev.release1, u = k / (ev.land - ev.release1);
    const hx = SIM.R1p.x + SIM.rv1[0] * k, hy = SIM.R1p.y + SIM.rv1[1] * k + 0.5 * GRAV * k * k;
    const r1 = SIM.sw1[SIM.sw1.length - 1][0] * R2D;
    return { ...st, phase: 'fly2', hx, hy, rot: lerp(r1, 0, ease.out(u)), u };
  }
  const k = tau - ev.land;
  return { ...st, phase: 'land', hx: SIM.landX, hy: J.end.y - HANDY, rot: 0, feetX: SIM.landX, feetY: J.end.y, k };
}
// Dex's side-view pose (facing right) for a sim state; pivot at the hands
function dexSwingPose(st, t) {
  const base = { view: 'side', flip: true, rotY: -755, shadow: false };
  const ph = st.phase;
  if (ph === 'ready' || ph === 'run') {
    const crouch = ph === 'ready' ? 0 : 0;
    const r = require('./acting').run((st.u || 0) * 9 + t * 0, 1.1);
    return ph === 'ready' ? { ...base, rotY: -470, lean: 10, bodyY: crouch, armL: -30, armR: 40 } : { ...base, rotY: -470, ...r, lean: 14, shadow: true };
  }
  if (ph === 'leap') {
    const u = st.u;
    return { ...base, rot: st.rot, armL: lerp(120, 180, u), armR: lerp(150, 178, u), legL: lerp(40, 20, u), kneeL: lerp(70, 30, u), legR: lerp(-30, 0, u), kneeR: lerp(20, 40, u), lean: 0 };
  }
  if (ph === 'swing0' || ph === 'swing1') {
    const pump = clamp((st.om || 0) / 2.2, -1, 1);
    return { ...base, rot: st.rot, armL: 180, armR: 176, legL: 25 + 30 * pump, kneeL: 30 + 20 * Math.abs(pump), legR: 12 + 24 * pump, kneeR: 40 + 16 * Math.abs(pump), lean: -4 * pump };
  }
  if (ph === 'fly1') {
    const u = st.u;
    return { ...base, rot: st.rot, armL: lerp(180, 160, bump(u, 0, 1)), armR: lerp(176, 140, bump(u, 0, 1)), legL: 40, kneeL: 60, legR: 10, kneeR: 50 };
  }
  if (ph === 'fly2') {
    const u = st.u;
    return { ...base, rot: st.rot, armL: lerp(180, 110, u), armR: lerp(176, 70, u), legL: lerp(40, 10, u), kneeL: lerp(60, 20, u), legR: lerp(10, -10, u), kneeR: lerp(50, 20, u) };
  }
  // landing: squash then stand
  const k = st.k || 0;
  const sq = Math.exp(-k * 9) * Math.cos(k * 18);
  return { ...base, rotY: -470, rot: 0, bodyY: 120 * Math.exp(-k * 5), sx: 1 + 0.16 * sq, sy: 1 - 0.16 * sq, armL: 60, armR: 120, legL: 18, legR: -14, shadow: true };
}
// real time -> story time with a smooth slow-mo window [s0, s1] at rate `slow`
function makeWarp(s0, s1, slow, ramp, tLandReal) {
  const A = s0 - 6, B = s1 + 6, step = 1 / 500, n = Math.ceil((B - A) / step);
  const rate = (t) => { const w = Math.min(seg(t, s0, s0 + ramp), 1 - seg(t, s1 - ramp, s1)); return 1 - (1 - slow) * ease.inOut(clamp(w, 0, 1)); };
  const cum = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) cum[i + 1] = cum[i] + rate(A + (i + 0.5) * step) * step;
  const psi = (t) => { const x = (clamp(t, A, B) - A) / step, i = Math.min(n - 1, Math.floor(x)); return cum[i] + (cum[i + 1] - cum[i]) * (x - i) + (t > B ? t - B : 0) + (t < A ? t - A : 0); };
  const off = SIM.ev.land - psi(tLandReal);
  return { tau: (t) => psi(t) + off, rate };
}

// ---------------------------------------------------------------- Juno's chalk / blueprint annotations (draw-on with dashoffset)
function chalk(d, len, k, col = '#FFF6C8', w = 7) {
  if (k <= 0) return '';
  const u = clamp(k, 0, 1);
  return S.path(d, { fill: 'none', stroke: LINE, 'stroke-width': w + 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${f(len)} ${f(len)}`, 'stroke-dashoffset': f(len * (1 - u)), opacity: 0.45 }) +
    S.path(d, { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${f(len)} ${f(len)}`, 'stroke-dashoffset': f(len * (1 - u)) });
}
function chalkEllipse(cx, cy, rx, ry, k, col, w) {
  const d = `M${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 1 ${f(cx - rx)} ${f(cy + 2)} A${f(rx)} ${f(ry)} 0 1 1 ${f(cx + rx * 0.9)} ${f(cy - ry * 0.25)}`;
  return chalk(d, Math.PI * (rx + ry) * 1.1, k, col, w);
}
function chalkLabel(txt, x, y, k, col = '#FFF6C8', size = 46, rot = -4) {
  if (k <= 0) return '';
  return S.g(TF(txt, 0, 0, size, col, { stroke: LINE, 'stroke-width': 8, 'paint-order': 'stroke', 'letter-spacing': 2 }), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`);
}
function chalkArrowHead(x, y, ang, k, col = '#FFF6C8', sz = 26) {
  if (k <= 0.9) return '';
  const a1 = ang + 2.5, a2 = ang - 2.5;
  const d = `M${f(x + Math.cos(a1) * sz)} ${f(y + Math.sin(a1) * sz)} L${f(x)} ${f(y)} L${f(x + Math.cos(a2) * sz)} ${f(y + Math.sin(a2) * sz)}`;
  return S.path(d, ln(13, LINE, 0.45)) + S.path(d, ln(7, col));
}

// ---------------------------------------------------------------- Dex's imagination: the obby HUD
function obbyHud(t, k, o = {}) {
  if (k <= 0) return '';
  const { stage = 'STAGE 1', clear = 0 } = o;
  const sc = ease.outBack(clamp(k, 0, 1));
  let g = '';
  // stage pill (top-left)
  g += S.g(S.rect(0, 0, 330, 74, 37, { fill: '#10131C', opacity: 0.85, stroke: '#FFD21F', 'stroke-width': 5 }) + S.path('M34 58 L34 16 L74 26 L34 36', ol('#46F58C', 4)) + TF(stage, 196, 50, 36, '#FFFFFF'), `translate(${f(60 - (1 - sc) * 400)} 140)`);
  // health bar
  g += S.g(S.rect(0, 0, 330, 34, 17, { fill: '#10131C', opacity: 0.85, stroke: '#151515', 'stroke-width': 4 }) + S.rect(6, 6, 318, 22, 11, { fill: '#46F58C' }) + S.rect(10, 8, 300, 7, 4, { fill: '#FFFFFF', opacity: 0.45 }) + TF('100', 300, 26, 20, '#10131C', { 'text-anchor': 'end' }), `translate(${f(60 - (1 - sc) * 400)} 226)`);
  // jump button (bottom-right)
  const press = bump(t, o.jumpAt ?? -9, (o.jumpAt ?? -9) + 0.25);
  g += S.g(S.circle(0, 0, 74, { fill: '#10131C', opacity: 0.6, stroke: '#FFFFFF', 'stroke-width': 6 }) + S.path('M-30 18 L0 -22 L30 18', ln(14, '#FFFFFF')), `translate(${f(1760 + (1 - sc) * 400)} 820) scale(${f(1 - 0.15 * press)})`);
  if (clear > 0) g += S.g(K.rays(0, 0, 14, 420, '#FFF1A8', 0.18, t * 30) + S.rect(-330, -78, 660, 156, 40, ol('#10131C', 9)) + S.rect(-318, -66, 636, 132, 32, { fill: 'none', stroke: '#46F58C', 'stroke-width': 6 }) + TS('STAGE CLEAR!', 0, 30, 92, '#46F58C'), `translate(560 300) rotate(-4) scale(${f(0.82 * ease.outBack(clamp(clear, 0, 1)))})`);
  return g;
}

// ---------------------------------------------------------------- the ice "glass" Dex smacks into (cracks spread from the impact)
function iceGlass(x, y, k, t) {
  if (k <= 0) return '';
  let o = S.rect(-100, -100, 2120, 1280, 0, { fill: 'url(#s08iceGlass)', opacity: f(0.38 * clamp(k * 2, 0, 1)) });
  o += S.path('M140 -100 L-100 300 M420 -100 L-100 780 M1700 1180 L2020 700', ln(30, '#FFFFFF', 0.25 * clamp(k * 2, 0, 1)));
  const n = 9, grow = ease.out(clamp(k * 1.6, 0, 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i) * 0.5;
    let px = x, py = y;
    d += `M${f(px)} ${f(py)}`;
    for (let j = 1; j <= 4; j++) {
      const r = j * (90 + hash(i * 3 + j) * 80) * grow;
      const aa = a + (hash(i * 7 + j) - 0.5) * 0.5;
      px = x + Math.cos(aa) * r; py = y + Math.sin(aa) * r;
      d += ` L${f(px)} ${f(py)}`;
    }
  }
  for (let j = 1; j <= 2; j++) {
    const r = j * 150 * grow;
    d += ` M${f(x + r)} ${f(y)}`;
    for (let i = 1; i <= n; i++) { const a = (i / n) * Math.PI * 2 + hash(i) * 0.5; d += ` L${f(x + Math.cos(a) * r * (0.85 + hash(i + j) * 0.3))} ${f(y + Math.sin(a) * r * (0.85 + hash(i + j) * 0.3))}`; }
  }
  o += S.path(d, ln(9, '#FFFFFF', 0.9)) + S.path(d, ln(3, '#7FB8E0', 0.9));
  // frost creeping in from the corners
  for (const [cx, cy] of [[0, 0], [1920, 0], [0, 1080], [1920, 1080]]) o += S.circle(cx, cy, 240 * grow, { fill: '#FFFFFF', opacity: f(0.25 * grow) });
  return o;
}

// ---------------------------------------------------------------- the low-angle backdrop for Dex's leap (looking up from the shaft)
function lowAngleSky(t, obby, o = {}) {
  const { pan = 0 } = o;
  let g = S.rect(-300, -300, 2520, 1680, 0, { fill: obby > 0.5 ? '#1A0F3A' : '#0B1433' });
  // ceiling truss far above with lamps
  g += S.rect(-300, -300, 2520, 260, 0, { fill: '#060B1E' }) + S.g(S.rect(0, 0, 2800, 120, 0, { fill: 'url(#farmTruss)' }), `translate(${f(-400 - (pan * 0.3) % 160)} -60)`);
  for (let i = 0; i < 6; i++) {
    const x = ((i * 420 - pan * 0.3) % 2520 + 2520) % 2520 - 300;
    g += S.rect(x - 60, 40, 120, 26, 10, ol('#E8F8FF', 4)) + S.path(`M${x - 60} 66 L${x + 60} 66 L${x + 240} 900 L${x - 240} 900 Z`, { fill: obby > 0.5 ? '#FF9BE0' : '#9FF3FF', opacity: 0.07 });
  }
  // cables hanging down toward the lens (thick, converging up)
  const CC = ['#3BD16F', '#34C3FF', '#FF9F1C', '#B06BFF', '#FF5A6E', '#FFD21F', '#2EE6FF'];
  for (let i = 0; i < 9; i++) {
    const x = ((i * 290 + 80 - pan * 0.7) % 2610 + 2610) % 2610 - 340, len = 520 + hash(i * 3.3) * 500, sw = Math.sin(t * 0.9 + i) * 14;
    const col = obby > 0.5 ? CC[i % 7] : FM.mix(CC[i % 7], '#0B1433', 0.35);
    g += S.path(`M${f(x)} 40 Q${f(x + sw)} ${f(len * 0.6)} ${f(x + sw * 1.6)} ${f(len)}`, ln(34, LINE)) + S.path(`M${f(x)} 40 Q${f(x + sw)} ${f(len * 0.6)} ${f(x + sw * 1.6)} ${f(len)}`, ln(22, col));
    g += S.rect(x + sw * 1.6 - 20, len - 8, 40, 50, 8, ol('#C9D2E0', 5));
  }
  // platform undersides (obby slabs) seen from below
  const OB = ['#FF5A5A', '#FFB000', '#3BD16F', '#3B8BFF', '#B06BFF'];
  for (let i = 0; i < 4; i++) {
    const x = ((i * 640 + 200 - pan) % 2560 + 2560) % 2560 - 320, y = 760 + (i % 2) * 120;
    g += S.path(`M${x - 160} ${y} L${x + 160} ${y} L${x + 130} ${y + 60} L${x - 130} ${y + 60} Z`, { fill: obby > 0.5 ? OB[i % 5] : '#22305E', stroke: LINE, 'stroke-width': 7 });
    g += S.rect(x - 130, y + 60, 260, 22, 6, { fill: '#000', opacity: 0.25 });
  }
  return g;
}

// ---------------------------------------------------------------- props
// Dex's first sword with a little name tag, handle at (0,0) pointing up
function swordHeld(s = 1, rot = 0, tag = true) {
  let o = FM.lostItem('sword', 0, -63, 1, 0, 0);
  if (tag) o += S.path('M10 -20 Q40 -10 60 20', ln(3, '#8A5A33')) + S.g(S.rect(-46, -14, 92, 30, 6, ol('#FFF4DC', 3)) + TF('DEX · 3rd GR.', 0, 7, 13, '#3A2A20'), 'translate(74 34) rotate(18)');
  return S.g(o, `rotate(${f(rot)}) scale(${f(s)})`);
}
// the three visits of Bubble Island: Juno's hard hat, the cat, Grandpa's cap (pop in one by one with counters)
function visitIcons(x, y, t, times, s = 1) {
  let o = '';
  const icons = [
    () => S.path('M-40 10 Q-40 -38 0 -40 Q40 -38 40 10 Z', ol('#FFC928', 5)) + S.rect(-50, 6, 100, 14, 7, ol('#E9A50E', 4)) + S.circle(-12, -18, 7, { fill: '#FF6FB5' }),
    () => S.rect(-34, -30, 68, 56, 16, ol('#B9BAC2', 5)) + S.path('M-32 -22 L-24 -50 L-8 -28 Z M32 -22 L24 -50 L8 -28 Z', ol('#B9BAC2', 4)) + S.circle(-12, -4, 5, { fill: LINE }) + S.circle(12, -4, 5, { fill: LINE }) + S.path('M-4 8 L0 12 L4 8', ln(3)),
    () => S.path('M-44 6 Q-44 -34 0 -36 Q44 -34 50 0 L64 4 Q64 12 44 12 L-44 12 Z', ol('#8F7D64', 5)) + S.path('M-30 -20 Q0 -30 30 -20', ln(4, '#B8A88A')),
  ];
  times.forEach((t0, i) => {
    const k = pop(t, t0, 0.35);
    if (k <= 0) return;
    const ix = x + (i - 1) * 150 * s, iy = y - Math.sin(clamp((t - t0) * 2, 0, 1) * Math.PI) * 14;
    o += S.g(S.circle(0, 0, 56, { fill: '#FFFFFF', 'fill-opacity': 0.18, stroke: '#C9FBFF', 'stroke-width': 4 }) + icons[i]() + S.circle(40, -40, 20, ol('#FF5A6E', 4)) + TF(String(i + 1), 40, -33, 22, '#FFFFFF'), `translate(${f(ix)} ${f(iy)}) scale(${f(k * s)})`);
  });
  return o;
}
// one bubble draining to grey: colour version under a grey version with opacity k, crack growing
function drainingBubble(x, y, r, t, k, kind = 'castle', seed = 2, crack = 0) {
  let o = FM.gameBubble(x, y, r, t, { kind, glow: 0, seed, bob: false });
  if (k > 0) o += S.g(FM.gameBubble(x, y, r, t, { kind, grey: 1, crack: 0, seed, bob: false }), null, { opacity: f(clamp(k, 0, 1)) });
  if (crack > 0) {
    const g = clamp(crack, 0, 1);
    const d = `M${f(x + r * 0.15)} ${f(y - r)} L${f(x + r * 0.02)} ${f(y - r + r * 0.55 * g)} L${f(x + r * 0.32 * g)} ${f(y - r + r * 0.8 * g)} L${f(x + r * 0.1 * g)} ${f(y - r + r * 1.25 * g)} M${f(x + r * 0.02)} ${f(y - r + r * 0.55 * g)} L${f(x - r * 0.3 * g)} ${f(y - r + r * 0.7 * g)}`;
    o += S.path(d, ln(Math.max(4, r * 0.05), LINE));
  }
  return o;
}

module.exports = {
  DEFS, tf, TS, TFS, pop, at, shakeAll, dutch, glow, soft, ding, liftPOV, POV, liftFront, LF, shaftDown,
  SIM, dexAt, dexSwingPose, makeWarp, DS, HANDY, RUN, chalk, chalkEllipse, chalkLabel, chalkArrowHead, obbyHud, iceGlass, lowAngleSky,
  swordHeld, visitIcons, drainingBubble,
};
