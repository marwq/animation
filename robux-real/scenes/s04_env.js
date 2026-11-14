// Private helpers for SC 04 / SC 05: the Robux city, vehicles, the Thirty Percent Guy's gags, FX and extra cast designs.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, actor, coin } = K;
const A = require('./acting');
const { makeDesign, makeDraw } = require('../rig/r6');
const C = K.C;
const E = K.E;

// ---------------------------------------------------------------- defs (ids prefixed s04)
const DEFS = `<defs>
<linearGradient id="s04sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A9BFF"/><stop offset="0.55" stop-color="#8FD3FF"/><stop offset="1" stop-color="#E6F7FF"/></linearGradient>
<linearGradient id="s04glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E4F6FF"/><stop offset="0.55" stop-color="#9ED6F5"/><stop offset="1" stop-color="#6FA8D8"/></linearGradient>
<linearGradient id="s04gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1A8"/><stop offset="0.45" stop-color="#FFC93C"/><stop offset="1" stop-color="#D98E12"/></linearGradient>
<linearGradient id="s04chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F7FB"/><stop offset="0.5" stop-color="#C3CBD8"/><stop offset="1" stop-color="#8E98AA"/></linearGradient>
<radialGradient id="s04spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF4C8" stop-opacity="0.45"/><stop offset="0.7" stop-color="#FFF4C8" stop-opacity="0.18"/><stop offset="1" stop-color="#FFF4C8" stop-opacity="0"/></radialGradient>
<linearGradient id="s04cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6D0" stop-opacity="0.55"/><stop offset="1" stop-color="#FFF6D0" stop-opacity="0.08"/></linearGradient>
<pattern id="s04tileMint" patternUnits="userSpaceOnUse" width="80" height="80"><rect width="80" height="80" fill="#BFEBDD"/><rect x="2" y="2" width="76" height="76" rx="6" fill="#CDF3E6"/></pattern>
<pattern id="s04check" patternUnits="userSpaceOnUse" width="160" height="160"><rect width="160" height="160" fill="#F2F0EA"/><rect width="80" height="80" fill="#DAD6CC"/><rect x="80" y="80" width="80" height="80" fill="#DAD6CC"/></pattern>
<pattern id="s04carpet" patternUnits="userSpaceOnUse" width="60" height="60"><rect width="60" height="60" fill="#7E8DA8"/><circle cx="15" cy="15" r="4" fill="#71809B"/><circle cx="45" cy="45" r="4" fill="#71809B"/></pattern>
<pattern id="s04fabric" patternUnits="userSpaceOnUse" width="24" height="24"><rect width="24" height="24" fill="#8FA3C2"/><path d="M0 12 L24 12 M12 0 L12 24" stroke="#839AB9" stroke-width="3"/></pattern>
<pattern id="s04brick" patternUnits="userSpaceOnUse" width="120" height="60"><rect width="120" height="60" fill="none"/><path d="M0 30 L120 30 M0 60 L120 60 M60 0 L60 30 M0 30 L0 60 M120 30 L120 60" stroke="#000" stroke-opacity="0.07" stroke-width="5"/></pattern>
<pattern id="s04tileBath" patternUnits="userSpaceOnUse" width="100" height="100"><rect width="100" height="100" fill="#9FE3F0"/><rect x="3" y="3" width="94" height="94" rx="10" fill="#B8EEF7"/></pattern>
<pattern id="s04marble" patternUnits="userSpaceOnUse" width="240" height="120"><rect width="240" height="120" fill="#F6EFE3"/><rect width="120" height="60" fill="#E9DCC6"/><rect x="120" y="60" width="120" height="60" fill="#E9DCC6"/><path d="M10 40 Q60 20 110 50 M140 90 Q190 70 230 100" stroke="#D8C8AE" stroke-width="3" fill="none"/></pattern>
</defs>`;

// ---------------------------------------------------------------- extra cast (built on the shared rig)
const skinA = { skin: '#E9B896', skinShade: '#D29E7A' }, skinB = { skin: '#9C6644', skinShade: '#86553A' }, skinC = { skin: '#F4D3BC', skinShade: '#E2B9A0' };
const D = {};
D.teacher = makeDesign({
  hair: 'grayBun', eyeStyle: 'dot', top: 'cardigan', sleeve: 'long', pantsShape: 'straight', size: 1.08,
  brows: { L: [-4, 6], R: [-4, 6] }, neutralMouth: 'line', acc: { roundGlasses: '#B5462F' },
  col: { ...skinB, hair: '#5A3A28', hairShade: '#45291B', hairHi: '#8A6248', brow: '#3A2418', top: '#C9A227', topShade: '#A8861C', sleeve: '#C9A227', cuff: '#A8861C', inner: '#FFFFFF', trim: '#FFFFFF', pants: '#6B4A3A', pantsShade: '#573A2D', sole: '#3A2A22', soleShade: '#2A1E18', toe: '#3A2A22' },
});
D.boss = makeDesign({
  hair: 'none', eyeStyle: 'dot', top: 'suit', sleeve: 'long', pantsShape: 'straight', size: 1.12,
  brows: { L: [10, -6], R: [10, -6] }, neutralMouth: 'smirk', acc: { roundGlasses: '#1A1A22' },
  col: { ...skinA, hair: '#E9B896', brow: '#3A2A22', top: '#5B2E82', topShade: '#47226A', sleeve: '#5B2E82', cuff: '#FFFFFF', shirt: '#FFFFFF', tie: '#FFC93C', pants: '#47226A', pantsShade: '#381A55', sole: '#1A1A1E', soleShade: '#101013', toe: '#1A1A1E' },
});
D.manager = makeDesign({
  hair: 'slick', eyeStyle: 'dot', top: 'suit', sleeve: 'long', pantsShape: 'straight', size: 1.06,
  brows: { L: [-4, 2], R: [-4, 2] }, neutralMouth: 'smirk',
  col: { ...skinC, hair: '#E0A23A', hairShade: '#C0821F', hairHi: '#FFE08A', brow: '#B07A1E', top: '#8A93A6', topShade: '#717A8D', sleeve: '#8A93A6', cuff: '#FFFFFF', shirt: '#FFFFFF', tie: '#2E7BFF', pants: '#717A8D', pantsShade: '#5C6476', sole: '#1A1A1E', soleShade: '#101013', toe: '#1A1A1E' },
});
D.dentist = makeDesign({
  hair: 'shortPart', eyeStyle: 'dot', top: 'shirtTie', sleeve: 'long', pantsShape: 'straight', size: 1.06,
  brows: { L: [-4, 4], R: [-4, 4] }, neutralMouth: 'smile',
  col: { ...skinA, hair: '#2A2A30', hairShade: '#1C1C22', hairHi: '#55555E', brow: '#2A2A30', top: '#FFFFFF', topShade: '#DDE6F0', sleeve: '#FFFFFF', cuff: '#DDE6F0', tie: '#34C3FF', pants: '#5BB8D6', pantsShade: '#4A9CB8', sole: '#FFFFFF', soleShade: '#DDE3EA', toe: '#FFFFFF' },
});
D.richKid = makeDesign({
  hair: 'quiff', eyeStyle: 'mid', top: 'tee', sleeve: 'short', pantsShape: 'straight', size: 0.94, acc: { chain: '#FFC93C' },
  eye: { iris: '#2E7DD1' }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smirk',
  col: { ...skinC, hair: '#F2C94C', hairShade: '#D9A92A', hairHi: '#FFF0B0', brow: '#C9962A', top: '#FF6FB5', topShade: '#E0559A', sleeve: '#FF6FB5', trim: '#FFFFFF', pants: '#FFFFFF', pantsShade: '#E3E6EE', sole: '#FFC93C', soleShade: '#D9962A', toe: '#FFFFFF' },
});
// solid-gold Ty (the statue in SC 05)
const G1 = '#FFC93C', G2 = '#E0A21A', G3 = '#FFF1A8';
D.goldTy = makeDesign({
  hair: 'beanie', eyeStyle: 'mid', top: 'hoodie', sleeve: 'long', pantsShape: 'straight', badge: 'coin',
  eye: { iris: '#B97A0E', pupil: 0.9 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'smallSmile',
  col: {
    skin: G1, skinShade: G2, hair: '#C98A12', hairShade: '#B07A0E', hairHi: G3, brow: '#B07A0E', hat: G1, hatShade: G2, hatHi: G3,
    top: G1, topShade: G2, sleeve: G1, cuff: G2, trim: G3, pants: '#F0B630', pantsShade: G2, sole: G3, soleShade: G2, toe: G1, soleBand: G2,
  },
});
const drawX = Object.fromEntries(Object.entries(D).map(([k, d]) => [k, makeDraw(d)]));
// extra characters (no voice): same pose contract as actor()
function extra(name, t, pose = {}) {
  const seed = name.length * 2.3 + (pose.seed || 0);
  return drawX[name]({ shade: true, shadow: true, bodyY: 3 + 3 * Math.sin(t * 4.2 + seed), headY: 2 * Math.sin(t * 4.2 + seed), ...pose });
}
// background kid with idle breathing; pose may override
function kidIn(i, t, pose = {}) {
  return K.draw.kid(i, { shade: true, shadow: true, bodyY: 3 + 3 * Math.sin(t * 4.2 + i), face: 'neutral', ...pose });
}

// ---------------------------------------------------------------- small props
// sunglasses for any R6 head (head space)
function shades(dy = 0, col = '#14141A') {
  const g = (x0) => S.path(S.roundedPath([[x0, -748 + dy], [x0 + 118, -748 + dy], [x0 + 112, -672 + dy], [x0 + 6, -672 + dy]], 22), ol(col, 7)) + S.path(`M${x0 + 18} ${-734 + dy} L${x0 + 56} ${-734 + dy}`, ln(7, '#FFFFFF', 0.55));
  return g(-130) + g(12) + S.path(`M-12 ${-726 + dy} L12 ${-726 + dy}`, ln(8));
}
const headProp = (svg, pose) => ({ svg: S.g(svg, `translate(0 ${f(pose.headY || 0)}) rotate(${f(pose.headRot || 0)} 0 -560)`), layer: 'front' });
function calculator(x, y, s = 1, rot = 0, txt = '30%', t = 0) {
  let o = S.rect(-55, -80, 110, 160, 14, ol('#3A3F55', 6)) + S.rect(-42, -66, 84, 38, 6, ol('#BFF5B0', 4)) + TF(txt, 0, -36, 26, '#1A5A1A');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o += S.rect(-40 + c * 28, -18 + r * 30, 22, 22, 5, { fill: r === 2 && c === 2 ? '#FF5A5A' : '#E6E8F0' });
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// a handful of coins (centred)
function coinPile(x, y, n = 6, r = 26, t = 0, seed = 1) {
  let o = '';
  for (let i = 0; i < n; i++) o += coin(x + (i % 3 - 1) * r * 1.1 + (hash(i + seed) - 0.5) * 10, y - Math.floor(i / 3) * r * 0.9, r, i * 37, t * 4 + i);
  return o;
}
// cartoon smoke poof; age in seconds
function poof(x, y, age, s = 1, col = '#FFFFFF') {
  if (age < 0 || age > 0.6) return '';
  const k = age / 0.6;
  let o = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    const d = 30 + 120 * ease.out(k);
    const r = (46 + 18 * hash(i * 3)) * (1 - k * 0.7);
    o += S.circle(x + Math.cos(a) * d * s, y + Math.sin(a) * d * 0.7 * s, r * s, { fill: col, stroke: '#151515', 'stroke-width': 5, opacity: f(1 - k * k) });
  }
  o += S.circle(x, y, 70 * s * (1 - k), { fill: col, opacity: f(1 - k) });
  o += K.F.sparkle(x + 120 * s * k, y - 90 * s * k, 26 * s * (1 - k)) + K.F.sparkle(x - 130 * s * k, y - 50 * s * k, 20 * s * (1 - k));
  return o;
}
// red rubber "-30%" stamp; k = 0..1 slam-in
function stamp30(x, y, k, s = 1, rot = -12, txt = '-30%') {
  if (k <= 0) return '';
  const sc = s * lerp(2.4, 1, ease.out(clamp(k * 1.4, 0, 1)));
  const o = S.rect(-180, -78, 360, 156, 22, { fill: '#FFF4F4', opacity: 0.85, stroke: '#E2233B', 'stroke-width': 16 }) + T(txt, 0, 42, 118, '#E2233B');
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sc)})`, { opacity: f(clamp(k * 3, 0, 1)) });
}
// ka-ching: starburst + lettering; age seconds since the hit
function kaching(x, y, age, s = 1, txt = 'KA-CHING!') {
  if (age < 0 || age > 0.9) return '';
  const k = clamp(age / 0.18, 0, 1), out = seg(age, 0.65, 0.9);
  let o = S.g(K.rays(0, 0, 14, 260, '#FFF1B0', 0.55 * (1 - out), age * 90) + starBurst(0, 0, 150, 110, 14, '#FFD21F'), `scale(${f(s * ease.outBack(k) * (1 - out))})`);
  o += S.g(C.sfx(txt, 0, 10, k * (1 - out), 92, -8, '#FFFFFF'), `scale(${f(s)})`);
  return S.g(o, `translate(${f(x)} ${f(y)})`);
}
function starBurst(x, y, R, r, n, col) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : R;
    d += (i ? ' L' : 'M') + `${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr)}`;
  }
  return S.path(d + ' Z', ol(col, 7));
}
// screen-wide spotlight: everything dark except a circle (evenodd hole) + a light cone from above
function spotlight(cx, cy, r, k, coneTop = -80) {
  if (k <= 0) return '';
  const hole = `M-50 -50 H1970 V1130 H-50 Z M${f(cx - r)} ${f(cy)} A${f(r)} ${f(r * 0.92)} 0 1 0 ${f(cx + r)} ${f(cy)} A${f(r)} ${f(r * 0.92)} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;
  let o = S.path(hole, { fill: '#07040F', opacity: f(0.9 * k), 'fill-rule': 'evenodd' });
  o += S.path(`M${f(cx - 60)} ${coneTop} L${f(cx + 60)} ${coneTop} L${f(cx + r)} ${f(cy)} L${f(cx - r)} ${f(cy)} Z`, { fill: 'url(#s04cone)', opacity: f(k) });
  o += S.ellipse(cx, cy, r, r * 0.92, { fill: 'url(#s04spot)', opacity: f(k) });
  return o;
}
// card flip helper: scale Y by |cos| and switch content halfway
function flip(x, y, k, before, after, s = 1) {
  const sy = Math.max(0.04, Math.abs(Math.cos(Math.PI * clamp(k, 0, 1))));
  return S.g(k < 0.5 ? before : after, `translate(${f(x)} ${f(y)}) scale(${f(s)} ${f(s * sy)})`);
}
// a hand-lettered "PURCHASED" toast
function purchased(x, y, k, s = 1, txt = 'PURCHASED!') {
  if (k <= 0) return '';
  const o = S.rect(-250, -50, 500, 100, 30, ol('#3BD16F', 7)) + TF('✔ ' + txt, 0, 18, 52, '#FFFFFF', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s * ease.outBack(clamp(k, 0, 1)))}) rotate(-3)`);
}

// ---------------------------------------------------------------- the Thirty Percent Guy
// thirty(t, x, y, s, pose, {calc, coins, act}) — calculator in his screen-right hand, optional coins in the other
function thirty(t, x, y, s, pose = {}, opts = {}) {
  const p = { armR: 50, armL: 20, ...pose };
  const props = [...(pose.props || [])];
  if (opts.calc !== false) {
    const [hx, hy] = A.hand(p.armR, 1);
    props.push({ svg: calculator(hx, hy - 30, 1.15, -8 + Math.sin(t * 14) * (opts.clack ? 6 : 0), opts.calcTxt || '30%'), layer: 'front' });
  }
  if (opts.coins) {
    const [hx, hy] = A.hand(p.armL, -1);
    props.push({ svg: coinPile(hx, hy + 10, opts.coins, 34, t, 3), layer: 'front' });
  }
  return actor('thirty', t, { x, y, s, ...p, props }, opts.act || {});
}
// pop-up from below a line (counter edge / floor): rise with poof at t0, optional sink at t1
function thirtyPop(t, t0, t1, x, y, s, pose = {}, opts = {}) {
  if (t < t0 - 0.05) return '';
  const up = ease.outBack(seg(t, t0, t0 + 0.28));
  const down = t1 ? ease.in(seg(t, t1, t1 + 0.22)) : 0;
  const h = 0.7 * 980 * s;
  const dy = (1 - up) * h * 0.9 + down * h * 1.1;
  const sq = 1 + 0.18 * bump(t, t0 + 0.12, t0 + 0.4);
  let o = '';
  if (up > 0.01 && down < 0.99) o += thirty(t, x, y + dy, s, { sy: sq, sx: 2 - sq, shadow: false, ...pose }, opts);
  o += poof(x, y - h * 0.35, t - t0, s * 1.6);
  if (t1) o += poof(x, y - h * 0.35, t - t1 - 0.1, s * 1.4);
  return o;
}

// ---------------------------------------------------------------- city
const GY = 800; // sidewalk back edge (building base)
const SHOPS = [
  { x: -760, w: 380, h: 520, col: '#FFB4C8', trim: '#E8506E', awn: '#E8506E', name: 'TOYS', usd: '$9.99', rbx: '10' },
  { x: -360, w: 340, h: 430, col: '#FFE38A', trim: '#F28A2E', awn: '#F28A2E', name: 'PIZZA', usd: '$2.50', rbx: '3' },
  { x: 0, w: 400, h: 600, col: '#B9F0D2', trim: '#2FA37A', awn: '#2FA37A', name: 'SHOES', usd: '$49', rbx: '49' },
  { x: 420, w: 360, h: 470, col: '#C9D6FF', trim: '#4A63E8', awn: '#4A63E8', name: 'GAMES', usd: '$19', rbx: '19' },
  { x: 800, w: 420, h: 560, col: '#FFD1A6', trim: '#C8553D', awn: '#C8553D', name: 'BURGERS', usd: '$5.99', rbx: '6' },
  { x: 1240, w: 360, h: 440, col: '#E8C8FF', trim: '#8A4FD8', awn: '#8A4FD8', name: 'BOOKS', usd: '$12', rbx: '12' },
  { x: 1620, w: 400, h: 620, col: '#FFF0C8', trim: '#D9A21A', awn: '#3BA7E0', name: 'BANK', usd: '$$$', rbx: 'ONLY' },
  { x: 2040, w: 360, h: 480, col: '#FFC8B4', trim: '#E06A4A', awn: '#E06A4A', name: 'CANDY', usd: '$1', rbx: '1' },
  { x: 2420, w: 400, h: 540, col: '#C8F0FF', trim: '#2A9AC8', awn: '#2A9AC8', name: 'MALL', usd: '$99', rbx: '99' },
];
function dollarCard(txt) {
  return S.rect(-80, -46, 160, 92, 14, ol('#FFFFFF', 5)) + T(txt, 0, 22, txt.length > 4 ? 48 : 60, '#2F9E44');
}
function robuxCard(txt) {
  return S.rect(-80, -46, 160, 92, 14, ol('#FFF6C8', 5)) + K.robuxText(0, 24, txt, txt.length > 3 ? 40 : 56, '#2A1640');
}
// flipK(i) -> 0..1 for shop i (0 = dollars, 1 = Robux); signFn(i) can override the price card
function shop(b, i, t, k) {
  const { x, w, h, col, trim, awn, name } = b;
  const top = GY - h;
  let o = S.rect(x, top, w, h + 6, 0, ol(col, 6)) + S.rect(x, top, w, h + 6, 0, { fill: 'url(#s04brick)' });
  o += S.rect(x + w - 34, top, 34, h, 0, { fill: '#000', opacity: 0.06 });
  o += S.rect(x - 14, top - 14, w + 28, 38, 10, ol(trim, 6));
  // upper windows
  const rows = Math.max(1, Math.floor((h - 330) / 120));
  for (let r = 0; r < rows; r++) for (let c = 0; c < 3; c++) {
    const wx = x + 40 + c * ((w - 80) / 3) + 8, wy = top + 60 + r * 120, ww = (w - 80) / 3 - 16;
    o += S.rect(wx, wy, ww, 78, 10, ol('url(#s04glass)', 5)) + S.path(`M${f(wx + 12)} ${wy + 60} L${f(wx + ww * 0.5)} ${wy + 14}`, ln(8, '#FFFFFF', 0.5));
  }
  // sign board
  o += S.rect(x + 30, GY - 320, w - 60, 64, 14, ol('#FFFFFF', 6)) + T(name, x + w / 2, GY - 270, 50, trim);
  // awning stripes + scallops
  const n = Math.round((w - 20) / 50), sw = (w - 20) / n;
  let stripes = '', scal = '';
  for (let j = 0; j < n; j++) {
    stripes += `<path d="M${f(x + 10 + j * sw)} ${GY - 250} L${f(x + 10 + (j + 1) * sw)} ${GY - 250} L${f(x + 4 + (j + 1) * sw)} ${GY - 196} L${f(x + 4 + j * sw)} ${GY - 196} Z" fill="${j % 2 ? '#FFFFFF' : awn}"/>`;
    scal += S.path(`M${f(x + 4 + j * sw)} ${GY - 196} Q${f(x + 4 + (j + 0.5) * sw)} ${GY - 170} ${f(x + 4 + (j + 1) * sw)} ${GY - 196} Z`, ol(j % 2 ? '#FFFFFF' : awn, 4));
  }
  o += stripes + S.path(`M${x + 10} ${GY - 250} L${x + w - 10} ${GY - 250} L${x + w - 16} ${GY - 196} L${x + 4} ${GY - 196} Z`, ln(6)) + scal;
  // storefront window + door
  const dw = w * 0.6;
  o += S.rect(x + 26, GY - 170, dw, 150, 10, ol('url(#s04glass)', 6)) + S.path(`M${x + 50} ${GY - 40} L${x + 110} ${GY - 150}`, ln(10, '#FFFFFF', 0.5));
  o += S.rect(x + 40 + dw, GY - 190, w - dw - 66, 190, 8, ol(trim, 6)) + S.rect(x + 54 + dw, GY - 176, w - dw - 94, 90, 6, ol('url(#s04glass)', 4)) + S.circle(x + w - 46, GY - 90, 7, { fill: '#151515' });
  o += S.rect(x, GY - 14, w, 14, 0, { fill: '#0002' });
  // price card in the window
  o += flip(x + 26 + dw / 2, GY - 95, k, dollarCard(b.usd), robuxCard(b.rbx), 0.95);
  return o;
}
function lampPost(x, y, s = 1) {
  return S.g(S.rect(-10, -420, 20, 420, 6, ol('#2F6F7A', 5)) + S.path('M0 -410 Q0 -460 60 -460', ln(14, '#2F6F7A')) + S.ellipse(70, -452, 44, 20, ol('#FFF4C8', 5)) + S.rect(-26, -20, 52, 24, 6, ol('#2F6F7A', 5)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function treePot(x, y, s = 1, t = 0) {
  const sw = Math.sin(t * 1.2 + x) * 3;
  return S.g(S.rect(-8, -180, 16, 170, 6, ol('#8A5A34', 4)) + S.circle(sw, -230, 90, ol('#4CC35E', 6)) + S.circle(-50 + sw, -190, 56, ol('#3FAE5A', 6)) + S.circle(56 + sw, -196, 60, ol('#3FAE5A', 6)) + S.circle(-20 + sw, -270, 40, { fill: '#7FE08E' }) + S.rect(-50, -20, 100, 26, 8, ol('#B07A48', 5)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function hydrant(x, y, s = 1) {
  return S.g(S.rect(-26, -90, 52, 90, 10, ol('#FF5A5A', 5)) + S.ellipse(0, -94, 34, 18, ol('#E04040', 5)) + S.rect(-44, -66, 88, 22, 8, ol('#E04040', 5)) + S.rect(-36, -6, 72, 12, 4, ol('#C93A3A', 4)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function trashCan(x, y, s = 1) {
  return S.g(S.path('M-50 -150 L50 -150 L42 0 L-42 0 Z', ol('#5BAE7A', 5)) + S.rect(-58, -168, 116, 24, 8, ol('#4A956A', 5)) + S.path('M-20 -130 L-16 -20 M20 -130 L16 -20', ln(5, '#3A7A55')), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function busStop(x, y, s = 1) {
  return S.g(S.rect(-8, -400, 16, 400, 5, ol('#9AA0AE', 4)) + S.rect(-70, -470, 140, 90, 18, ol('#2E7BFF', 6)) + TF('BUS', 0, -410, 44, '#FFFFFF'), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function cloudsLayer(t, n = 5, y0 = 120) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = ((hash(i * 4.1) * 2600 + t * (10 + i * 4)) % 2800) - 400;
    o += E.cloud(x, y0 + hash(i * 2.2) * 200, 0.7 + hash(i) * 0.6);
  }
  return o;
}
function skylineFar() {
  let o = '';
  for (let i = 0; i < 16; i++) {
    const x = -900 + i * 260 + hash(i) * 60, h = 260 + hash(i * 3.3) * 360, w = 160 + hash(i * 7) * 120;
    o += S.rect(x, GY - 120 - h, w, h + 140, 8, { fill: '#9CC4EE' });
    for (let r = 0; r < Math.floor(h / 70); r++) o += S.rect(x + 24, GY - 90 - h + r * 70, w - 48, 16, 6, { fill: '#B8D8F7' });
  }
  return o;
}
// cityStreet: background world layers for the street; returns { far, street } so callers can interleave actors.
// opts.flip(i) -> 0..1 sign flip per shop, opts.road (default true)
function cityStreet(t, cam, opts = {}) {
  const fl = opts.flip || (() => 1);
  let sky = S.rect(-800, -1400, 3520, 3600, 0, { fill: 'url(#s04sky)' });
  sky += E.sun(1580, 170, 90, t);
  let o = sky + K.view(cam, cloudsLayer(t, 6), 0.15) + K.view(cam, skylineFar(), 0.45);
  let st = '';
  SHOPS.forEach((b, i) => { st += shop(b, i, t, fl(i)); });
  if (opts.billboard !== undefined) st += billboard(1010, GY - 560, opts.billboard, t);
  // sidewalk, curb, road
  st += S.rect(-1200, GY, 4400, 80, 0, { fill: '#D9DBE6' }) + S.path(Array.from({ length: 44 }, (_, i) => `M${-1200 + i * 110} ${GY} L${-1230 + i * 110} ${GY + 80}`).join(' '), ln(3, '#BFC2D0'));
  st += S.rect(-1200, GY + 80, 4400, 20, 0, ol('#B5B8C6', 4));
  st += S.rect(-1200, GY + 100, 4400, 900, 0, { fill: '#4A4E62' });
  for (let x = -1200; x < 3200; x += 260) st += S.rect(x, GY + 222, 140, 14, 7, { fill: '#FFE14D', opacity: 0.9 });
  if (opts.crosswalk !== false) for (let i = 0; i < 7; i++) st += S.path(`M${1360 + i * 70} ${GY + 110} L${1400 + i * 70} ${GY + 110} L${1380 + i * 90} ${GY + 330} L${1330 + i * 90} ${GY + 330} Z`, { fill: '#F4F6FA', opacity: 0.92 });
  // street furniture on the sidewalk
  for (const lx of [-480, 360, 1180, 2000]) st += lampPost(lx, GY + 40);
  st += treePot(-160, GY + 40, 0.9, t) + treePot(780, GY + 40, 0.85, t) + treePot(1620, GY + 40, 0.9, t) + treePot(2380, GY + 40, 0.85, t);
  if (!opts.noFurniture) st += hydrant(560, GY + 64) + trashCan(1460, GY + 56);
  return { bg: o, street: st };
}
function billboard(x, y, k, t) {
  const before = S.rect(-330, -150, 660, 300, 24, ol('#FFFFFF', 8)) + T('MEGA SALE', 0, -20, 96, '#E8506E') + T('$ $ $', 0, 90, 90, '#2F9E44');
  const after = S.rect(-330, -150, 660, 300, 24, ol('#2A1640', 8)) + K.coin(-170, 0, 105, -10, t * 3) + T('ROBUX', 90, -10, 100, '#FFD21F', { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' }) + TF('ONLY!', 90, 80, 72, '#FFFFFF');
  let o = S.rect(-220, 140, 26, 260, 6, ol('#7A7F90', 5)) + S.rect(194, 140, 26, 260, 6, ol('#7A7F90', 5));
  o += flip(0, 0, k, before, after);
  if (k > 0.5) o += K.sparkles([[-300, -150, 26], [310, -120, 34], [250, 150, 20]], t);
  return S.g(o, `translate(${f(x)} ${f(y)})`);
}

// ---------------------------------------------------------------- vehicles
// city bus, side view facing screen-left; (x, y) = front bumper on the ground
function bus(x, y, s, t, opts = {}) {
  const { col = '#2E7BFF', dark = '#1F5ACC', door = 0, label = 'DOWNTOWN', ad = '', wheelSpin = 0, bob = 0 } = opts;
  let o = '';
  const wheel = (wx) => S.g(S.circle(0, 0, 66, ol('#2A2A33', 7)) + S.circle(0, 0, 30, ol('#C9CED8', 5)) + S.path('M-22 0 L22 0 M0 -22 L0 22', ln(5, '#8A92A6')), `translate(${wx} -66) rotate(${f(wheelSpin)})`);
  o += wheel(220) + wheel(800);
  let b = S.path(S.roundedPath([[0, -110], [10, -430], [980, -430], [980, -90], [0, -90]], 34), ol(col, 8));
  b += S.rect(0, -230, 980, 30, 0, { fill: '#FFFFFF' }) + S.rect(0, -200, 980, 12, 0, { fill: dark });
  // windshield + destination sign
  b += S.path(S.roundedPath([[16, -380], [120, -380], [120, -250], [12, -250]], 14), ol('url(#s04glass)', 6));
  b += S.rect(26, -420, 300, 34, 8, ol('#14141A', 5)) + TF(label, 176, -394, 26, '#FFB000');
  // door (two panels slide apart)
  const dw = 50 * (1 - door);
  b += S.rect(140, -380, 104, 290, 8, ol('#14141A', 6));
  b += S.rect(140, -380, dw, 290, 6, ol('url(#s04glass)', 5)) + S.rect(244 - dw, -380, dw, 290, 6, ol('url(#s04glass)', 5));
  // side windows
  for (let i = 0; i < 6; i++) b += S.rect(280 + i * 116, -380, 100, 130, 12, ol('url(#s04glass)', 5)) + S.path(`M${292 + i * 116} -270 L${330 + i * 116} -370`, ln(7, '#FFFFFF', 0.5));
  if (ad) b += S.g(ad, 'translate(560 -140)');
  b += S.rect(-10, -130, 30, 40, 8, ol('#C9CED8', 5)) + S.circle(16, -160, 16, ol('#FFF4C8', 5)) + S.rect(960, -150, 30, 50, 8, ol('#FF5A5A', 5));
  o += S.g(b, `translate(0 ${f(bob)})`);
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
// ice-cream truck, side view facing screen-left; (x, y) = front bumper on the ground; driver(svg) drawn in the cab window
function iceTruck(x, y, s, t, opts = {}) {
  const { price = '4', priceK = 1, driver = '', bob = 0 } = opts;
  let o = '';
  const wheel = (wx) => S.g(S.circle(0, 0, 58, ol('#2A2A33', 7)) + S.circle(0, 0, 24, ol('#F4F6FA', 5)), `translate(${wx} -58)`);
  o += wheel(170) + wheel(660);
  let b = '';
  // cab
  b += S.path(S.roundedPath([[0, -90], [0, -260], [40, -380], [250, -380], [250, -90]], 26), ol('#FFFFFF', 8));
  b += S.path(S.roundedPath([[40, -260], [70, -350], [230, -350], [230, -260]], 12), ol('url(#s04glass)', 6));
  b += driver;
  b += S.path(S.roundedPath([[0, -262], [250, -262], [250, -90], [0, -90]], 18), ol('#FFFFFF', 8)) + S.rect(150, -230, 60, 14, 7, { fill: '#9AA0AE' });
  // box
  b += S.rect(240, -500, 600, 410, 30, ol('#FFF4FA', 8));
  b += S.rect(240, -170, 600, 40, 0, { fill: '#FF8FC8' }) + S.rect(240, -130, 600, 20, 0, { fill: '#7FE0D2' });
  b += S.rect(330, -420, 380, 170, 16, ol('#3A2A4A', 7));
  for (let j = 0; j < 8; j++) b += S.path(`M${330 + j * 47.5} -440 L${377.5 + j * 47.5} -440 L${377.5 + j * 47.5} -405 L${330 + j * 47.5} -405 Z`, { fill: j % 2 ? '#FFFFFF' : '#FF6FB5' });
  b += S.path('M326 -440 L714 -440 L714 -405 L326 -405 Z', ln(6));
  // cones on the side
  for (let j = 0; j < 3; j++) b += S.g(S.path('M-24 0 L24 0 L0 70 Z', ol('#E8B26A', 5)) + S.circle(0, -12, 30, ol(['#FF8FC8', '#7FE0D2', '#FFE38A'][j], 5)), `translate(${400 + j * 120} -340)`);
  // roof cone
  b += S.g(S.path('M-50 0 L50 0 L0 150 Z', ol('#E8B26A', 6)) + S.circle(0, -30, 62, ol('#FF8FC8', 6)) + S.circle(-20, -78, 40, ol('#FFFFFF', 6)) + S.circle(24, -100, 10, ol('#FF4D6D', 4)), 'translate(560 -650)');
  b += S.rect(250, -230, 580, 50, 10, ol('#FFE14D', 5)) + TF('ICE CREAM', 540, -192, 40, '#E8506E');
  o += S.g(b, `translate(0 ${f(bob)})`);
  // the price tag swinging from the awning
  if (priceK > 0) {
    const sw = Math.sin((t * 6)) * 10 * (1 - clamp(priceK, 0, 1) * 0.5);
    o += S.g(S.path('M0 -40 L0 20', ln(5)) + K.priceTag(0, 80, price, 1.15, 0), `translate(700 ${f(-400 + bob)}) rotate(${f(sw)}) scale(${f(ease.outBack(clamp(priceK, 0, 1)))})`);
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
// delivery drone with an optional hanging cargo (svg drawn with its top at 0,0)
function drone(x, y, s, t, cargo = '', rope = 90) {
  let o = '';
  if (cargo) o += S.path(`M0 10 L0 ${rope}`, ln(4)) + S.g(cargo, `translate(0 ${rope})`);
  o += S.rect(-60, -20, 120, 40, 14, ol('#F4F6FA', 6)) + S.rect(-26, -10, 52, 18, 6, { fill: '#34C3FF' });
  for (const sx of [-1, 1]) {
    o += S.path(`M${sx * 50} -10 L${sx * 110} -40`, ln(8));
    const w = 60 * Math.abs(Math.sin(t * 40 + sx));
    o += S.ellipse(sx * 110, -46, 10 + w, 8, { fill: '#9AA0AE', opacity: 0.7 }) + S.circle(sx * 110, -40, 8, { fill: '#151515' });
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)}) rotate(${f(Math.sin(t * 3 + x) * 4)})`);
}
function parcel(w = 90, h = 70, col = '#C9945A') {
  return S.rect(-w / 2, 0, w, h, 6, ol(col, 5)) + S.path(`M${-w / 2} ${h * 0.35} L${w / 2} ${h * 0.35} M0 0 L0 ${h}`, ln(6, '#E8C08A'));
}

// ---------------------------------------------------------------- transitions
const whip = (t, tc, k = 0.6) => S.rect(0, 0, 1920, 1080, 0, { fill: '#FFFFFF', opacity: f(k * bump(t, tc - 0.06, tc + 0.09)) });
// horizontal whip-pan blur streaks for a cut at tc
function whipStreaks(t, tc, dir = 1) {
  const k = bump(t, tc - 0.1, tc + 0.1);
  if (k <= 0) return '';
  let o = '';
  for (let i = 0; i < 16; i++) o += S.rect(-200 + dir * k * 300 * hash(i), 60 + i * 64, 2400, 20 + 20 * hash(i * 3), 10, { fill: '#FFFFFF', opacity: f(0.5 * k) });
  return o;
}

module.exports = {
  DEFS, GY, D, drawX, extra, kidIn, shades, headProp, calculator, coinPile, poof, stamp30, kaching, starBurst, spotlight, flip, purchased,
  thirty, thirtyPop, SHOPS, shop, cityStreet, billboard, lampPost, treePot, hydrant, trashCan, busStop, cloudsLayer, robuxCard, dollarCard,
  bus, iceTruck, drone, parcel, whip, whipStreaks,
};
