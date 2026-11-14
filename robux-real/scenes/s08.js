// SC 08 · INFLATION — "Until... Wednesday" → the bread price ticker → a kid-friendly inflation infographic →
// hyperinflation montage → 3,000,000 Robux buys (half) a sandwich → the giant Thirty Percent Guy takes the
// mansion to THIRTY TOWER → rain, the cardboard box from the cold open, and Pickle's umbrella.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, bang } = K;
const { L } = K.V;
const C = K.C;
const F = K.F;
const AC = require('./acting');
const { goldenSky, villa, palm, poolFront, obbyYard, headProp, tyIn } = require('./s01');

const W = 1920, H = 1080;
const FILL = (c, op) => (op === undefined ? { fill: c } : { fill: c, opacity: f(op) });
const TS = (txt, x, y, size, fill, extra = {}) => T(txt, x, y, size, fill, { stroke: '#151515', 'stroke-width': size * 0.14, 'paint-order': 'stroke', 'stroke-linejoin': 'round', ...extra });
const pop = (t, t0, d = 0.28) => ease.outBack(seg(t, t0, t0 + d));
const frac = (v) => v - Math.floor(v);
const tf = (x, y, s = 1, r = 0) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
// camera key that centres the world point (wx, wy) at the given zoom
const at = (wx, wy, zoom = 1) => ({ zoom, x: wx - 960, y: wy - 540 });
function shakeAll(cam, t, list) {
  for (const [t0, d, a] of list) { const s = K.shake(t, t0, d, a); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; }
  return cam;
}
// world point → screen point for a camera (parallax 1)
function toScreen(cam, x, y) {
  const z = cam.zoom ?? 1;
  return [960 + (cam.sx || 0) + z * (x - 960 - (cam.x || 0)), 540 + (cam.sy || 0) + z * (y - 540 - (cam.y || 0))];
}

// ---------------------------------------------------------------- timing (all from the voice)
const A = Array.from({ length: 21 }, (_, i) => L('08a.' + i));
const B = Array.from({ length: 7 }, (_, i) => L('08b.' + i));
const START = K.V.scene('SC 08').start, END = K.V.scene('SC 09').start;
const w = (i, word, n = 0) => A[i].word(word, n).t0;
const wb = (i, word, n = 0) => B[i].word(word, n).t0;

const tPerfect = w(0, 'perfect'), tUntil = w(0, 'Until'), tWed0 = w(0, 'Wednesday');
const c02 = tUntil - 0.06;
const c03 = A[1].a - 0.15, tFive = w(1, 'five'), tTue = w(1, 'Tuesday'), tFifty = w(1, 'fifty');
const c04 = w(1, 'On', 1) - 0.1;
const c05 = A[2].a - 0.05, tWed = w(2, 'Wednesday'), tThou = w(2, 'THOUSAND');
const c06 = A[3].a - 0.1, tBread = w(3, 'BREAD');
const c07 = A[4].a - 0.2;
const c08 = w(4, 'Every') - 0.1, tDay = w(4, 'day'), tEight = w(4, 'eight'), tBillion = w(4, 'billion'), tClaimed = w(4, 'claimed');
const c09 = w(4, 'And') - 0.1, tPrinted = w(4, 'printed'), tBrand = w(4, 'brand-new');
const c10 = A[5].a - 0.05, tMoney5 = w(5, 'money'), tBut5 = w(5, 'but'), tSame5 = w(5, 'same'), tBread5 = w(5, 'bread');
const c11 = A[6].a - 0.05, tMore6 = w(6, 'more'), tSame6 = w(6, 'same'), tStuff6 = w(6, 'stuff');
const c12 = w(6, 'the', 1) - 0.08, tExp = w(6, 'expensive');
const c13 = A[7].a - 0.1, tInfl = w(7, 'inflation'), tSchool = w(7, 'school');
const c14 = w(7, "You'd") - 0.1, tSkip = w(7, 'Skip');
const c15 = A[8].a - 0.12, tRight = w(8, 'right');
const c16 = A[9].a - 0.1, tThu = w(9, 'Thursday'), tGum = w(9, 'gum'), tMillion = w(9, 'MILLION');
const c17 = w(9, 'People') - 0.1;
const c18 = A[10].a - 0.05, tTie = w(10, 'tie'), tCar = w(10, 'car');
const c19 = w(10, "Dad's") - 0.1, tBought = w(10, 'bought'), tOne = w(10, 'one'), tCoffee = w(10, 'coffee');
const c20 = w(10, 'With') - 0.1, tThirty10 = w(10, 'thirty'), tMissing = w(10, 'missing');
const c21 = A[11].a - 0.3;
const c22 = A[12].a - 0.1;
const c23 = w(12, 'this') - 0.1, tExp12 = w(12, 'expensive'), tReading = w(12, 'reading');
const c24 = A[13].a - 0.15, tZero = w(13, 'ZERO');
const c25 = w(13, 'Who') - 0.05, tMoon = w(13, 'MOON');
const c26 = A[14].a - 0.05, tThree = w(14, 'three');
const c27 = w(14, 'They') - 0.05, tSand = w(14, 'one');
const c28 = A[15].a - 0.15;
const c29 = w(15, 'Nobody') - 0.05, tUsed = w(15, 'used');
const c30 = A[16].a - 0.05, tFee = w(16, 'FEE');
const c31 = tFee - 0.14;
const c32 = A[17].a - 0.12;
const c33 = A[18].a - 0.1, tFailed = w(18, 'failed');
const c34 = w(18, 'I') - 0.05, tQuit = w(19, 'quit');
const c35 = w(19, 'My', 1) - 0.1, tTaken = w(19, 'taken');
const c36 = w(19, 'And') - 0.1;
const c37 = A[20].a - 0.05, tMe = w(20, 'ME');
const c38 = tMe + 0.45, tEverything = w(20, 'EVERYTHING'), tMine = w(20, 'MINE');
const c39 = B[0].a - 0.1, c39b = wb(0, 'every') - 0.05, tEarth = wb(0, 'Earth');
const c40 = wb(0, 'Now') - 0.1, tTallest = wb(0, 'tallest'), tCity = wb(0, 'city');
const c41 = B[1].a - 2.2;
const c42 = B[2].a - 0.15;
const c43 = B[3].a - 0.1;
const c44 = B[4].a - 0.1;
const c45 = B[5].a - 0.1;
const c46 = B[6].a - 0.1, tSock = wb(6, 'sock'), tDrier = wb(6, 'drier');

// ---------------------------------------------------------------- static defs
const ST_COLS = [['#FF6B6B', '#F2C9A0'], ['#4ECDC4', '#8D5A3B'], ['#FFD166', '#E9B38B'], ['#9B5DE5', '#C98D6A'], ['#1982C4', '#F8D9C0'], ['#8AC926', '#B0754F']];
function station(px, py, col, skin, press, lw = 3) {
  let o = S.rect(px - 15, py - 26, 12, 26, 3, FILL('#3A3F55')) + S.rect(px + 1, py - 26, 12, 26, 3, FILL('#3A3F55'));
  o += S.rect(px - 20, py - 62, 38, 40, 8, ol(col, lw));
  const hy = press ? 2 : 0;
  o += S.rect(px - 17, py - 93 + hy, 32, 30, 8, ol(skin, lw));
  o += S.circle(px - 7, py - 80 + hy, 2.6, FILL('#151515')) + S.circle(px + 6, py - 80 + hy, 2.6, FILL('#151515'));
  o += S.path(`M${px - 6} ${py - 72 + hy} Q${px} ${py - 68 + hy} ${px + 5} ${py - 72 + hy}`, ln(2));
  o += S.rect(px + 26, py - 44, 32, 44, 4, ol('#8A93B0', lw)) + S.rect(px + 30, py - 38, 24, 6, 2, FILL('#FFFFFF', 0.4));
  o += S.ellipse(px + 42, py + (press ? -45 : -49), 13, press ? 4 : 6, ol(press ? '#3BD16F' : '#FF5A5A', lw));
  const hx = px + 38, hY = py + (press ? -50 : -70);
  o += S.path(`M${px + 12} ${py - 54} L${hx} ${hY}`, ln(12, '#151515')) + S.path(`M${px + 12} ${py - 54} L${hx} ${hY}`, ln(6, col));
  return o;
}
function stationTile(id, press, shift) {
  let o = '<rect width="400" height="120" fill="#FFF7E6"/>';
  for (let i = 0; i < 4; i++) { const [c, sk] = ST_COLS[(i + shift) % ST_COLS.length]; o += station(i * 100 + 38, 112, c, sk, press); }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="400" height="120">${o}</pattern>`;
}
function hatTile() {
  let o = '<rect width="220" height="150" fill="#D9C6FF"/><rect y="120" width="220" height="16" fill="#A27BD8" stroke="#151515" stroke-width="4"/>';
  o += S.path('M20 120 L30 70 L80 70 L90 120 Z', ol('#3A3F55', 4)) + S.rect(10, 112, 100, 10, 4, ol('#3A3F55', 4)) + S.rect(30, 98, 50, 10, 0, FILL('#FF6FB5'));
  o += S.path('M130 120 Q130 80 165 80 Q200 80 200 120 Z', ol('#FFD166', 4)) + S.path('M190 116 L215 118', ln(8, '#FFD166'));
  return `<pattern id="s08hats" patternUnits="userSpaceOnUse" width="220" height="150">${o}</pattern>`;
}
const DEFS = `<defs>
<pattern id="s08grid" patternUnits="userSpaceOnUse" width="60" height="60"><rect width="60" height="60" fill="#FFF7E6"/><path d="M60 0 L0 0 L0 60" fill="none" stroke="#F0DDB4" stroke-width="2"/></pattern>
<pattern id="s08diam" patternUnits="userSpaceOnUse" width="70" height="70"><rect width="70" height="70" fill="#FFF0D6"/><path d="M35 8 L62 35 L35 62 L8 35 Z" fill="none" stroke="#BDE8D2" stroke-width="3"/><circle cx="35" cy="35" r="4" fill="#BDE8D2"/></pattern>
<pattern id="s08twin" patternUnits="userSpaceOnUse" width="60" height="80"><rect x="12" y="14" width="34" height="48" rx="4" fill="#9FE6FF" opacity="0.28"/></pattern>
<pattern id="s08twinLit" patternUnits="userSpaceOnUse" width="60" height="80"><rect x="12" y="14" width="34" height="48" rx="4" fill="#FFE9A8" opacity="0.55"/></pattern>
<pattern id="s08bwin" patternUnits="userSpaceOnUse" width="50" height="60"><rect x="10" y="12" width="26" height="32" rx="4" fill="#FFFFFF" opacity="0.45"/></pattern>
${stationTile('s08st0a', false, 0)}${stationTile('s08st1a', true, 0)}${stationTile('s08st0b', false, 2)}${stationTile('s08st1b', true, 2)}${hatTile()}
<linearGradient id="s08day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7EC8FF"/><stop offset="0.7" stop-color="#CFE9FF"/><stop offset="1" stop-color="#FFE0EC"/></linearGradient>
<linearGradient id="s08grey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E7598"/><stop offset="0.6" stop-color="#A7A3C2"/><stop offset="1" stop-color="#D7CFDD"/></linearGradient>
<linearGradient id="s08dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B1840"/><stop offset="0.55" stop-color="#4E3672"/><stop offset="1" stop-color="#A55A7E"/></linearGradient>
<linearGradient id="s08night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090D2E"/><stop offset="1" stop-color="#2A2F6E"/></linearGradient>
<linearGradient id="s08studio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B3A8A"/><stop offset="1" stop-color="#3FA0E8"/></linearGradient>
<linearGradient id="s08rainbow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF5A5A"/><stop offset="0.25" stop-color="#FFD21F"/><stop offset="0.5" stop-color="#3BD16F"/><stop offset="0.75" stop-color="#34C3FF"/><stop offset="1" stop-color="#B06BFF"/></linearGradient>
<linearGradient id="s08alley" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151036"/><stop offset="1" stop-color="#2E2058"/></linearGradient>
<radialGradient id="s08lamp" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#FFD98A" stop-opacity="0.55"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
<radialGradient id="s08warm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFD98A" stop-opacity="0.5"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
<radialGradient id="s08neon" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#7CFF6B" stop-opacity="0.6"/><stop offset="1" stop-color="#7CFF6B" stop-opacity="0"/></radialGradient>
<linearGradient id="s08shadow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#140C2A" stop-opacity="0"/><stop offset="0.12" stop-color="#140C2A" stop-opacity="0.55"/><stop offset="1" stop-color="#140C2A" stop-opacity="0.6"/></linearGradient>
<linearGradient id="s08topShadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140C2A" stop-opacity="0.75"/><stop offset="1" stop-color="#140C2A" stop-opacity="0.15"/></linearGradient>
</defs>`;

// ---------------------------------------------------------------- props
function loaf(x, y, s = 1, rot = 0, o2 = {}) {
  let o = S.path('M-105 28 Q-118 -36 -62 -56 Q0 -74 62 -56 Q118 -36 105 28 Q0 40 -105 28 Z', ol('#D9893B', 6));
  o += S.path('M-84 4 Q-90 -30 -52 -44 Q-10 -56 30 -52', ln(12, '#F4B866', 0.9));
  for (const k of [-48, 0, 48]) o += S.path(`M${k - 20} -34 Q${k} -50 ${k + 22} -40`, ln(7, '#9A561E'));
  if (o2.face) {
    const lx = o2.look || 0;
    o += S.circle(-26 + lx * 8, -2, 7, FILL('#151515')) + S.circle(26 + lx * 8, -2, 7, FILL('#151515'));
    o += o2.face === 'worry' ? S.path('M-12 20 Q0 10 12 20', ln(5)) : S.path('M-12 12 Q0 22 12 12', ln(5));
    if (o2.sweat) o += F.sweatDrop(78, -40, 0.7);
  }
  return S.g(o, tf(x, y, s, rot));
}
function croissant(x, y, s = 1) {
  return S.g(S.path('M-60 10 Q-40 -40 0 -42 Q40 -40 60 10 Q30 -6 0 -4 Q-30 -6 -60 10 Z', ol('#E8A04A', 5)) + S.path('M-22 -36 L-14 -6 M22 -36 L14 -6', ln(4, '#A8621E')), tf(x, y, s));
}
function calendar(day, col = '#E2233B', sub = 'THIS WEEK') {
  let o = S.rect(-310, -210, 620, 440, 30, ol('#FFFFFF', 9));
  o += S.rect(-310, -210, 620, 120, 30, ol(col, 9)) + S.rect(-306, -130, 612, 36, 0, FILL(col));
  o += TF(sub, 0, -132, 44, '#FFFFFF');
  for (const x of [-180, -60, 60, 180]) o += S.rect(x - 12, -240, 24, 64, 12, ol('#C9CED8', 6));
  o += TS(day, 0, 70, day.length > 7 ? 104 : 130, '#2A1640', { 'stroke-width': 0 });
  o += S.path('M-220 140 L220 140', ln(5, '#E9E0F0')) + S.path('M-220 180 L120 180', ln(5, '#E9E0F0'));
  return o;
}
function priceTagBig(x, y, txt, s = 1, rot = 0, col = '#FFE14D', tc = '#2A1640') {
  const wd = 120 + txt.length * 34;
  let o = S.path(`M${-wd / 2} -52 L${wd / 2 - 40} -52 L${wd / 2} 0 L${wd / 2 - 40} 52 L${-wd / 2} 52 Z`, ol(col, 7)) + S.circle(wd / 2 - 40, 0, 11, ol('#FFFFFF', 4));
  o += K.robuxText(-24, 22, txt, 58, tc);
  return S.g(o, tf(x, y, s, rot));
}
// split-flap cell
function flapCell(x, y, cw, ch, txt, flip) {
  let o = S.rect(x, y, cw, ch, 8, { fill: '#1C1E28', stroke: '#0A0B10', 'stroke-width': 4 });
  if (txt) o += T(txt, x + cw / 2, y + ch * 0.8, ch * 0.78, '#FFF6D8');
  o += S.rect(x, y + ch / 2 - 2, cw, 4, 0, FILL('#0A0B10'));
  if (flip > 0 && flip < 1) {
    const sy = Math.cos(flip * Math.PI);
    o += S.g(S.rect(x, y, cw, ch / 2, 8, FILL(sy > 0 ? '#2C2F3E' : '#3A3E50')), `translate(0 ${f(y + ch / 2)}) scale(1 ${f(sy)}) translate(0 ${f(-(y + ch / 2))})`);
  }
  return o;
}
// the bakery's stock-ticker price board; st = {day, dayCol, price, flipAt, spin:[a,b], alarm, chg}
function priceBoard(t, st) {
  let o = S.path('M-250 -300 L-250 -112 M250 -300 L250 -112', ln(7, '#6A5A4A'));
  o += S.rect(-400, -115, 800, 250, 28, ol(st.alarm > 0.5 && Math.floor(t * 8) % 2 ? '#5A1020' : '#2B2F3A', 8));
  o += S.rect(-380, -98, 760, 46, 14, FILL('#3B4157'));
  o += TF('LIVE BREAD PRICE', -360, -62, 30, '#9FE6FF', { 'text-anchor': 'start' });
  const dk = seg(t, st.dayAt || 0, (st.dayAt || 0) + 0.2);
  o += S.g(S.rect(-75, -19, 150, 38, 19, FILL(st.dayCol || '#3BD16F')) + TF(st.day, 0, 11, 30, '#10131C'), `translate(290 -75) scale(1 ${f(dk < 1 ? Math.abs(Math.cos(dk * Math.PI)) : 1)})`);
  o += loaf(-300, 40, 0.62) + coin(-170, 22, 34, 0, t * 2);
  const n = 5, cw = 70, ch = 104, x0 = -120;
  const str = st.price.padStart(n, ' ').slice(-n);
  const spinning = st.spin && t > st.spin[0] && t < st.spin[1];
  for (let i = 0; i < n; i++) {
    let c = str[i] === ' ' ? '' : str[i];
    let fl = seg(t, (st.flipAt || 0) + i * 0.03, (st.flipAt || 0) + i * 0.03 + 0.16);
    if (spinning) { c = String(Math.floor(hash(Math.floor(t * 22) + i * 7) * 10)); fl = frac(t * 22 + i * 0.3); }
    o += flapCell(x0 + i * (cw + 8), -24, cw, ch, c, fl);
  }
  // change strip under the board
  const cid = S.uid('s08tk');
  const up = st.alarm > 0 ? '#E2233B' : '#1E9E4A';
  o += S.rect(-400, 142, 800, 56, 16, ol(up, 6)) + S.clipDef(cid, S.rect(-394, 146, 788, 48, 12));
  const msg = (st.chg || 'BREAD ▲ 0%') + '     ★     ';
  let tk = '';
  const sx = -((t * 160) % 520);
  for (let i = 0; i < 4; i++) tk += TF(msg, -400 + sx + i * 520, 182, 32, '#FFFFFF', { 'text-anchor': 'start' });
  o += S.g(tk, null, { 'clip-path': `url(#${cid})` });
  return o;
}
function gumPack(x, y, s = 1) {
  let o = S.rect(-70, -34, 140, 68, 12, ol('#FF6FB5', 6)) + S.rect(-70, -10, 140, 20, 0, FILL('#FFFFFF', 0.7)) + TF('GUM', 0, 8, 26, '#C2185B');
  o += S.rect(-62, -28, 40, 10, 5, FILL('#FFFFFF', 0.5));
  return S.g(o, tf(x, y, s));
}
function coinMound(cx, base, wid, h) {
  if (h < 2) return '';
  const d = `M${f(cx - wid / 2)} ${f(base)} Q${f(cx - wid * 0.28)} ${f(base - h * 1.1)} ${f(cx)} ${f(base - h)} Q${f(cx + wid * 0.28)} ${f(base - h * 1.1)} ${f(cx + wid / 2)} ${f(base)} Z`;
  return S.path(d, { fill: 'url(#coinPile)', stroke: '#7A4A08', 'stroke-width': 6, 'stroke-linejoin': 'round' });
}
function wheelbarrow(hx, hy, col = '#E2453C', heap = 1) {
  let o = S.path(`M${hx} ${hy} L${hx - 300} ${hy + 70}`, ln(16, '#151515')) + S.path(`M${hx} ${hy} L${hx - 300} ${hy + 70}`, ln(9, '#B07A48'));
  o += S.path(`M${hx - 250} ${hy + 90} L${hx - 250} ${-6}`, ln(10, '#5A6070'));
  o += S.circle(hx - 480, -60, 58, ol('#2B2F3A', 7)) + S.circle(hx - 480, -60, 22, ol('#C9CED8', 5));
  if (heap) o += coinMound(hx - 400, hy + 30, 360, 120 * heap) + coin(hx - 450, hy - 60 * heap, 30, 20, 0.4) + coin(hx - 340, hy - 70 * heap, 28, -10, 1.2);
  o += S.path(`M${hx - 200} ${hy + 20} L${hx - 590} ${hy + 20} L${hx - 540} ${hy + 140} L${hx - 270} ${hy + 150} Z`, ol(col, 7));
  o += S.path(`M${hx - 560} ${hy + 40} L${hx - 230} ${hy + 40}`, ln(6, '#FFFFFF', 0.35));
  return o;
}
function coinSack(x, y, s = 1, squash = 1) {
  let o = S.path('M-90 0 Q-110 -120 -40 -150 L-30 -170 L30 -170 L40 -150 Q110 -120 90 0 Z', ol('#B98A52', 7));
  o += S.path('M-36 -160 L36 -160', ln(10, '#7A5428')) + S.path('M-50 -40 Q0 -20 50 -40', ln(6, '#9A6E3A', 0.6));
  o += coin(0, -70, 38, 0, 0);
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)} ${f(s * squash)})`);
}
function sandwich(x, y, s = 1, rot = 0, bite = 0) {
  let o = S.rect(-180, 10, 360, 46, 22, ol('#E0A15A', 6));
  let wav = 'M-188 8';
  for (let i = 0; i <= 12; i++) wav += ` Q${-188 + i * 31 + 15} ${i % 2 ? 26 : -6} ${-188 + (i + 1) * 31} 8`;
  o += S.path(wav + ' L190 22 L-188 22 Z', ol('#5CCB4A', 5));
  for (const tx of [-120, -40, 40, 120]) o += S.ellipse(tx, 6, 34, 12, ol('#FF5A5A', 4));
  o += S.path('M-170 4 L-110 4 L-140 30 Z M60 4 L130 4 L95 30 Z', ol('#FFD21F', 4));
  o += S.path('M-180 4 Q-182 -86 0 -92 Q182 -86 180 4 Z', ol('#EBB46C', 6));
  o += S.path('M-140 -40 Q-120 -74 -40 -80', ln(10, '#FFE0A8', 0.8));
  for (let i = 0; i < 6; i++) o += S.ellipse(-110 + i * 44, -50 - (i % 2) * 14, 7, 4, FILL('#FFF6D8'));
  if (bite) {
    const xb = lerp(200, 10, bite);
    const id = S.uid('s08bite');
    let d = `M-240 -140 L${f(xb)} -140 L${f(xb)} -96`;
    for (let i = 0; i < 3; i++) d += ` A30 30 0 0 0 ${f(xb)} ${-96 + (i + 1) * 54}`;
    d += ` L${f(xb)} 120 L-240 120 Z`;
    let edge = `M${f(xb)} -96`;
    for (let i = 0; i < 3; i++) edge += ` A30 30 0 0 0 ${f(xb)} ${-96 + (i + 1) * 54}`;
    o = S.clipDef(id, S.path(d)) + S.g(o, null, { 'clip-path': `url(#${id})` }) + S.g(S.path(edge, ln(6)), null, { 'clip-path': `url(#${id})` });
  }
  return S.g(o, tf(x, y, s, rot));
}
function toothbrush(x, y, s = 1, rot = 0, t = 0) {
  let o = S.rect(-14, -40, 28, 220, 12, ol('#FFC93C', 6)) + S.rect(-8, -30, 8, 190, 4, FILL('#FFF1B0', 0.8));
  o += S.rect(-18, -110, 36, 76, 10, ol('#FFC93C', 6)) + S.rect(-26, -104, 22, 64, 6, ol('#FFFFFF', 4));
  for (let i = 0; i < 4; i++) o += S.path(`M-24 ${-96 + i * 15} L-8 ${-96 + i * 15}`, ln(3, '#9FD8FF'));
  o += F.sparkle(26, -100, 18 * Math.abs(Math.sin(t * 5))) + F.sparkle(-30, 60, 12 * Math.abs(Math.sin(t * 5 + 2)));
  return S.g(o, tf(x, y, s, rot));
}
function fedora(x, y, s = 1, rot = 0, grey = 0, t = 0) {
  const g = grey > 0.5;
  let o = S.ellipse(0, 0, 160, 38, ol(g ? '#8A8F9C' : '#4A3B6E', 7));
  o += S.path('M-96 -4 L-84 -120 Q-40 -150 0 -124 Q40 -150 84 -120 L96 -4 Z', ol(g ? '#9AA0AE' : '#5E4A8E', 7));
  o += S.path('M-30 -128 Q0 -100 30 -128', ln(6, g ? '#7A7F8C' : '#3E2E66'));
  o += S.rect(-94, -46, 188, 34, 6, { fill: g ? '#B9BDC8' : 'url(#s08rainbow)', stroke: '#151515', 'stroke-width': 6 });
  if (!g) o += F.sparkle(-120, -120, 26 * Math.abs(Math.sin(t * 4))) + F.sparkle(130, -70, 20 * Math.abs(Math.sin(t * 4 + 1.5))) + F.sparkle(40, -170, 16 * Math.abs(Math.sin(t * 4 + 3)));
  return S.g(o, tf(x, y, s, rot));
}
// umbrella held at the hand (hx, hy), canopy centred over (px, py); world space
function umbrellaGeo(hx, hy, px, py) {
  const dx = px - hx, dy = py - hy;
  return { Lh: Math.hypot(dx, dy), ang: (Math.atan2(dx, -dy) * 180) / Math.PI };
}
function umbrella(hx, hy, px, py, wd, open, col = '#FFD21F', col2 = '#FFFFFF') {
  const { Lh, ang } = umbrellaGeo(hx, hy, px, py);
  const k = clamp(open, 0, 1.2);
  const w = lerp(24, wd, k), h = lerp(Lh * 0.75, wd * 0.46, clamp(open, 0, 1));
  const rim = -Lh, top = rim - h;
  const shaft = `M0 ${f(top + 6)} L0 0 Q0 34 -26 34 Q-46 34 -46 14`;
  let o = S.path(shaft, ln(16, '#151515')) + S.path(shaft, ln(8, '#7A4A2A'));
  let d = `M${f(-w)} ${f(rim)} C${f(-w)} ${f(top - h * 0.28)} ${f(w)} ${f(top - h * 0.28)} ${f(w)} ${f(rim)}`;
  const n = 6;
  for (let i = n - 1; i >= 0; i--) d += ` Q${f(-w + (i + 0.5) * ((2 * w) / n))} ${f(rim - 34 * k)} ${f(-w + i * ((2 * w) / n))} ${f(rim)}`;
  o += S.path(d + ' Z', ol(col, 7));
  for (let i = 1; i < n; i++) if (i % 2) { const rx = -w + i * ((2 * w) / n); o += S.path(`M0 ${f(top + 4)} Q${f(rx * 0.55)} ${f(top + h * 0.2)} ${f(rx)} ${f(rim)}`, ln(5, '#151515', 0.45)); }
  o += S.path(`M${f(-w * 0.72)} ${f(rim - h * 0.5)} Q${f(-w * 0.45)} ${f(top + h * 0.08)} ${f(-w * 0.05)} ${f(top + h * 0.04)}`, ln(10, col2, 0.45));
  o += S.circle(0, top - 10, 10, ol('#151515', 3));
  return S.g(o, `translate(${f(hx)} ${f(hy)}) rotate(${f(ang)})`);
}
// one giant arm of the Thirty Percent Guy, reaching down; (x, y) = bottom of the hand
function giantArm(x, y, wd = 260, rot = 0) {
  const h = wd * 0.82;
  let o = S.rect(-wd / 2 - 12, -h - 60 - 2600, wd + 24, 2600, 0, ol('#2B2F3A', 12)) + S.rect(wd / 2 - 50, -h - 60 - 2600, 50, 2600, 0, FILL('#1F222B'));
  o += S.rect(-wd / 2 - 14, -h - 64, wd + 28, 64, 12, ol('#FFFFFF', 12));
  o += S.rect(-wd / 2, -h, wd, h, wd * 0.2, ol('#8DCB54', 12)) + S.rect(wd * 0.15, -h + 10, wd * 0.3, h - 20, wd * 0.12, FILL('#6FAE3C', 0.6));
  o += S.path(`M${-wd * 0.3} ${-h * 0.15} L${wd * 0.1} ${-h * 0.15}`, ln(10, '#151515', 0.35));
  return S.g(o, tf(x, y, 1, rot));
}
function tumbleweed(x, y, r, rot) {
  let o = S.circle(0, 0, r, { fill: 'none', stroke: '#B08850', 'stroke-width': 7 });
  for (let i = 0; i < 6; i++) o += S.path(`M${f(-r * Math.cos(i))} ${f(-r * Math.sin(i))} Q${f(r * 0.3 * Math.sin(i * 3))} ${f(r * 0.3 * Math.cos(i * 2))} ${f(r * Math.cos(i + 2))} ${f(r * Math.sin(i + 2))}`, ln(5, '#9A7440'));
  return S.g(o, tf(x, y, 1, rot));
}
function junkCar(x, base, t, s = 1, bumper = 0) {
  let o = S.ellipse(0, 4, 170, 14, FILL('#000', 0.2));
  o += S.path('M-96 -112 L-62 -170 L60 -176 L110 -112 Z', ol('#B9A88A', 7)) + S.path('M-76 -118 L-54 -158 L-4 -160 L-4 -118 Z', ol('#C8E0E8', 5)) + S.path('M8 -118 L8 -162 L54 -164 L88 -118 Z', ol('#C8E0E8', 5));
  o += S.path('M10 -150 L40 -128 M30 -160 L22 -136', ln(3, '#151515', 0.6));
  o += S.rect(-160, -120, 320, 86, 24, ol('#C9B48E', 7));
  o += S.circle(-110, -90, 16, FILL('#A0522D', 0.7)) + S.circle(60, -70, 22, FILL('#A0522D', 0.6)) + S.circle(100, -100, 10, FILL('#A0522D', 0.6));
  o += S.g(S.rect(118, -60, 60, 22, 8, ol('#8A8F9C', 5)), `rotate(${f(bumper * 35)} 120 -50)`);
  for (const wx of [-92, 92]) o += S.circle(wx, -30, 36, ol('#23262F', 7)) + (wx < 0 ? S.circle(wx, -30, 15, FILL('#C9CED8')) : '');
  // exhaust puffs
  for (let i = 0; i < 3; i++) { const a = frac(t * 0.8 + i / 3); o += S.circle(-180 - a * 80, -50 - a * 40, 14 + a * 22, { fill: '#8A8A99', opacity: f(0.6 * (1 - a)) }); }
  return S.g(o, tf(x, base, s));
}
function limo(x, base, s = 1, t = 0) {
  let o = S.ellipse(0, 6, 560, 18, FILL('#000', 0.2));
  o += S.path('M-470 -120 L-400 -190 L380 -190 L450 -120 Z', ol('#E8B83A', 8));
  for (let i = 0; i < 6; i++) {
    const wx = -380 + i * 128;
    o += S.rect(wx, -178, 110, 52, 10, ol('#2A2440', 5));
    for (let j = 0; j < 3; j++) o += S.circle(wx + 22 + j * 32, -142 + (j % 2) * 8, 13, FILL(['#FF5A5A', '#34C3FF', '#FFD21F', '#3BD16F'][(i + j) % 4]));
  }
  o += S.rect(-560, -126, 1120, 96, 28, ol('#FFC93C', 8)) + S.rect(-540, -116, 1080, 14, 7, FILL('#FFF1B0', 0.6));
  o += coin(560, -112, 26, 0, t * 4);
  for (const wx of [-400, 400]) o += S.circle(wx, -30, 40, ol('#23262F', 7)) + S.circle(wx, -30, 18, ol('#FFE14D', 4));
  return S.g(o, tf(x, base, s));
}
function towTruck(x, base, s = 1, t = 0) {
  let o = S.ellipse(0, 6, 260, 16, FILL('#000', 0.2));
  o += S.rect(-240, -150, 300, 120, 18, ol('#D7263D', 8)) + S.path('M-240 -150 L-240 -260 L-120 -260 L-80 -150 Z', ol('#D7263D', 8)) + S.path('M-220 -164 L-220 -240 L-134 -240 L-104 -164 Z', ol('#BDEBFF', 5));
  o += S.rect(60, -110, 200, 80, 10, ol('#3A3F55', 7)) + S.path('M120 -110 L260 -290', ln(22, '#151515')) + S.path('M120 -110 L260 -290', ln(14, '#FFD21F'));
  o += S.rect(-252, -280, 70, 22, 8, ol(Math.floor(t * 6) % 2 ? '#FFB000' : '#FF6A00', 4));
  for (const wx of [-170, 170]) o += S.circle(wx, -30, 40, ol('#23262F', 7)) + S.circle(wx, -30, 16, FILL('#C9CED8'));
  return S.g(o, tf(x, base, s));
}
function glassMug(x, y, s, level, t, heart = 1) {
  // y = bottom; inner height 300
  const id = S.uid('s08mug');
  const shape = 'M-130 -320 L130 -320 L110 0 L-110 0 Z';
  let o = S.path(shape, FILL('#E8F6FF', 0.55)) + S.clipDef(id, S.path(shape));
  const ly = -300 * level;
  let inner = S.rect(-140, ly, 280, 400, 0, FILL('#7A4A26'));
  inner += S.rect(-140, ly - 4, 280, 30, 0, FILL('#E9C9A0'));
  if (heart > 0) inner += S.path(F.heartPath(0, ly + 8, 26), FILL(heart > 0.5 ? '#FFF1DD' : '#D9B48A'));
  if (heart < 0.5 && heart > 0) inner += S.path(`M-6 ${f(ly - 10)} L6 ${f(ly + 4)} L-4 ${f(ly + 14)} L4 ${f(ly + 30)}`, ln(5, '#7A4A26'));
  o += S.g(inner, null, { 'clip-path': `url(#${id})` });
  o += S.path(shape, { fill: 'none', stroke: '#151515', 'stroke-width': 8, 'stroke-linejoin': 'round' });
  o += S.path('M130 -260 Q210 -250 200 -160 Q192 -90 118 -80', ln(26, '#151515')) + S.path('M130 -260 Q210 -250 200 -160 Q192 -90 118 -80', ln(14, '#E8F6FF'));
  o += S.path('M-96 -290 L-80 -40', ln(12, '#FFFFFF', 0.6));
  for (let i = 0; i < 3; i++) { const a = frac(t * 0.7 + i / 3); o += S.path(`M${-40 + i * 40} ${f(-340 - a * 120)} q16 -20 0 -40`, ln(8, '#FFFFFF', 0.6 * (1 - a))); }
  return S.g(o, tf(x, y, s));
}
function toGoCup(x, y, s = 1) {
  return S.g(S.path('M-40 -100 L40 -100 L32 0 L-32 0 Z', ol('#FFFFFF', 6)) + S.rect(-38, -66, 76, 34, 4, ol('#B07A48', 5)) + S.rect(-46, -116, 92, 20, 8, ol('#5A3A22', 5)), tf(x, y, s));
}
function paycheck(x, y, s = 1, rot = 0) {
  let o = S.rect(-240, -110, 480, 220, 16, ol('#DFF7E4', 7)) + S.rect(-240, -110, 480, 44, 16, FILL('#3BD16F')) + S.rect(-240, -80, 480, 14, 0, FILL('#3BD16F'));
  o += TF('PAYCHECK', -150, -76, 30, '#FFFFFF') + TF('PAY TO: DAD', -110, -16, 30, '#1E5A2E');
  o += S.rect(30, -44, 190, 50, 10, ol('#FFFFFF', 4)) + K.robuxText(125, -6, '50,000', 32, '#1E5A2E');
  o += S.path('M-210 70 Q-170 40 -130 70 T-50 70', ln(5, '#1E5A2E')) + S.path('M40 74 L220 74', ln(4, '#1E5A2E', 0.6));
  return S.g(o, tf(x, y, s, rot));
}
function moon(x, y, r, t) {
  const id = S.uid('s08moon'), id2 = S.uid('s08moonc');
  const cut = r * 0.32;
  let jag = `M${-r - 20} ${-r - 20} L${f(cut)} ${-r - 20}`;
  const pts = [[cut + 20, -r * 0.7], [cut - 30, -r * 0.4], [cut + 16, -r * 0.1], [cut - 24, r * 0.25], [cut + 10, r * 0.55], [cut - 12, r + 20]];
  for (const [px, py] of pts) jag += ` L${f(px)} ${f(py)}`;
  jag += ` L${-r - 20} ${r + 20} Z`;
  let edge = `M${f(cut)} ${-r - 20}`;
  for (const [px, py] of pts) edge += ` L${f(px)} ${f(py)}`;
  let o = S.clipDef(id, S.path(jag)) + S.clipDef(id2, S.circle(0, 0, r));
  let body = S.circle(0, 0, r, FILL('#FFF1C4')) + S.circle(-r * 0.4, -r * 0.3, r * 0.18, FILL('#EADBA4')) + S.circle(-r * 0.1, r * 0.4, r * 0.12, FILL('#EADBA4')) + S.circle(-r * 0.6, r * 0.25, r * 0.1, FILL('#EADBA4'));
  body += S.circle(0, 0, r, { fill: 'none', stroke: '#151515', 'stroke-width': 9 });
  o += S.circle(0, 0, r * 1.5, FILL('#FFF1C4', 0.12));
  o += S.g(body, null, { 'clip-path': `url(#${id})` });
  o += S.g(S.path(edge, { fill: 'none', stroke: '#151515', 'stroke-width': 9, 'stroke-linejoin': 'round' }), null, { 'clip-path': `url(#${id2})` });
  return S.g(o, tf(x, y));
}
function priceSign(label, amount, x, y, s = 1, rot = 0) {
  let o = S.path('M0 60 L0 320', ln(18, '#151515')) + S.path('M0 60 L0 320', ln(10, '#8A5A34'));
  o += S.rect(-230, -100, 460, 170, 14, ol('#E9C08A', 7)) + T(label, 0, -38, 52, '#2A1640') + K.robuxText(0, 40, amount, 50, '#E2233B');
  return S.g(o, tf(x, y, s, rot));
}
function woodSign(txt, x, y, s = 1, rot = 0, size = 64, col = '#E2233B') {
  const wd = txt.length * size * 0.56 + 60;
  let o = S.path(`M0 0 L0 260`, ln(18, '#151515')) + S.path(`M0 0 L0 260`, ln(10, '#8A5A34'));
  o += S.rect(-wd / 2, -size * 1.3, wd, size * 1.5, 12, ol('#E9C08A', 7)) + T(txt, 0, -size * 0.12, size, col);
  return S.g(o, tf(x, y, s, rot));
}
function handCursor(x, y, s = 1, press = 0) {
  const o = S.path('M0 0 L0 -70 Q0 -84 14 -84 Q28 -84 28 -70 L28 -40 L60 -36 Q76 -34 76 -18 L72 30 Q68 50 48 50 L12 50 Q-4 50 -12 36 L-36 0 Q-44 -14 -30 -20 Q-18 -24 -8 -12 Z', ol('#FFFFFF', 6));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s * (1 - 0.15 * press))}) rotate(-20)`);
}
const roundGlasses = (dy = 0) => S.circle(-64, -716 + dy, 50, { fill: '#BDE8FF', 'fill-opacity': 0.25, stroke: '#151515', 'stroke-width': 9 }) + S.circle(64, -716 + dy, 50, { fill: '#BDE8FF', 'fill-opacity': 0.25, stroke: '#151515', 'stroke-width': 9 }) + S.path(`M-14 ${-716 + dy} L14 ${-716 + dy}`, ln(8));
const chefHat = () => S.rect(-110, -1010, 220, 70, 12, ol('#FFFFFF', 7)) + S.circle(-70, -1040, 56, ol('#FFFFFF', 7)) + S.circle(0, -1070, 66, ol('#FFFFFF', 7)) + S.circle(70, -1040, 56, ol('#FFFFFF', 7)) + S.rect(-104, -1010, 208, 40, 8, FILL('#FFFFFF'));
const capHat = (col) => S.path('M-150 -930 Q-150 -1040 0 -1040 Q150 -1040 150 -930 Z', ol(col, 7)) + S.path('M60 -936 L230 -930 Q240 -912 220 -906 L60 -910 Z', ol(col, 7));
const apronProp = (col = '#FFFFFF') => S.path('M-70 -470 L70 -470 L84 -250 L-84 -250 Z', ol(col, 6)) + S.rect(-36, -420, 72, 40, 8, ol('#FF8FB8', 4));

// ---------------------------------------------------------------- environments
const SHOPCOL = [['#FFB4C8', '#E8506E', '#7A3B52'], ['#FFE38A', '#F28A2E', '#7A4B2A'], ['#B9F0D2', '#2FA37A', '#2F6B5A'], ['#C9D6FF', '#4A63E8', '#33407A'], ['#FFD1A6', '#C8553D', '#6B3A2A'], ['#E8C8FF', '#8A4FD8', '#4E2E7A']];
const SHOPS = [
  [-1500, 560, 520, 0, 'BOOKS'], [-920, 620, 580, 3, 'MINI MART'], [-280, 500, 500, 1, 'TOYS'], [240, 600, 620, 2, 'SUB HUB'],
  [860, 520, 540, 4, 'COFFEE'], [1400, 600, 580, 5, 'HATS'], [2020, 540, 520, 0, 'NEWS 7'], [2580, 580, 600, 3, 'BANK'], [3180, 520, 540, 1, 'PETS'],
];
function shop(x, base, wd, h, ci, sign, grey = 0) {
  const [wall, trim, dark] = SHOPCOL[ci];
  let o = S.rect(x, base - h, wd, h, 8, ol(wall, 6)) + S.rect(x, base - h, wd, h, 8, FILL('url(#s08bwin)', 0));
  o += S.rect(x - 14, base - h - 12, wd + 28, 36, 8, ol(trim, 6));
  for (let y = base - h + 56; y < base - 330; y += 120) for (let i = 0; i < 3; i++) {
    const wx = x + 40 + i * ((wd - 80) / 3) + 10;
    o += S.rect(wx, y, (wd - 80) / 3 - 30, 80, 10, ol('#CDEBFF', 5)) + S.path(`M${f(wx + 10)} ${y + 14} L${f(wx + 34)} ${y + 14} L${f(wx + 10)} ${y + 50} Z`, FILL('#FFFFFF', 0.55));
  }
  o += S.rect(x + 30, base - 318, wd - 60, 68, 14, ol(dark, 6)) + TF(sign, x + wd / 2, base - 270, 46, '#FFFFFF');
  const n = Math.round(wd / 70), sw = (wd - 20) / n;
  for (let i = 0; i < n; i++) {
    const sx = x + 10 + i * sw;
    o += S.path(`M${f(sx)} ${base - 236} L${f(sx + sw)} ${base - 236} L${f(sx + sw)} ${base - 196} Q${f(sx + sw / 2)} ${base - 168} ${f(sx)} ${base - 196} Z`, { fill: i % 2 ? '#FFFFFF' : trim, stroke: '#151515', 'stroke-width': 5, 'stroke-linejoin': 'round' });
  }
  o += S.rect(x + 30, base - 180, wd - 170, 160, 10, ol('#CDEFFF', 6)) + S.path(`M${x + 50} ${base - 160} L${x + 110} ${base - 160} L${x + 50} ${base - 70} Z`, FILL('#FFFFFF', 0.6));
  o += S.rect(x + wd - 120, base - 196, 90, 196, 10, ol(dark, 6)) + S.circle(x + wd - 46, base - 96, 6, FILL('#FFD21F'));
  if (grey > 0) o += S.rect(x - 16, base - h - 14, wd + 32, h + 14, 0, FILL('#4A4560', grey * 0.35));
  return o;
}
function backTowers(seed, base, grey = 0) {
  let o = '';
  let x = -900;
  let i = 0;
  while (x < 4200) {
    const wd = 200 + hash(seed + i) * 220, h = 380 + hash(seed + i * 3) * 420;
    const c = ['#F7C6D9', '#CFE0FF', '#D8F5E6', '#FFE7B8', '#E6D6FF'][i % 5];
    o += S.rect(x, base - h, wd, h + 40, 10, { fill: c, stroke: '#151515', 'stroke-width': 5, opacity: 0.95 }) + S.rect(x + 14, base - h + 20, wd - 28, h - 40, 0, FILL('url(#s08bwin)'));
    if (hash(seed + i * 7) > 0.5) o += S.rect(x + wd / 2 - 6, base - h - 60, 12, 60, 4, ol('#9A9AB0', 4));
    x += wd + 30 + hash(seed + i * 5) * 60; i++;
  }
  if (grey) o += S.rect(-1000, -400, 5400, base + 500, 0, FILL('#5A5578', 0.3 * grey));
  return o;
}
// city street; cam = camera; opts.sky: 'day'|'grey'
function street(t, cam, opts = {}) {
  const grey = opts.grey || 0;
  let o = S.rect(-800, -800, 3520, 2680, 0, FILL(grey > 0.5 ? 'url(#s08grey)' : 'url(#s08day)'));
  if (grey > 0 && grey <= 0.5) o += S.rect(-800, -800, 3520, 2680, 0, FILL('#6E7598', grey));
  let clouds = '';
  for (const [cx, cy, s] of [[200, 140, 1.2], [900, 90, 0.9], [1500, 170, 1.1], [2300, 110, 1]]) {
    const x = ((cx + t * 12) % 2800) - 400;
    const col = grey > 0.4 ? '#9A97B4' : '#FFFFFF';
    clouds += S.g(S.ellipse(0, 0, 130, 36, FILL(col, 0.9)) + S.ellipse(-55, -20, 70, 36, FILL(col)) + S.ellipse(50, -26, 80, 42, FILL(col)), tf(x, cy, s));
  }
  o += view(cam, clouds, 0.2);
  o += view(cam, backTowers(3, 520, grey), 0.5);
  let fr = '';
  for (const [x, wd, h, ci, sg] of SHOPS) fr += shop(x, 760, wd, h, ci, sg, grey);
  fr += S.rect(-2000, 760, 6000, 100, 0, ol('#E9DDEA', 0)) + S.rect(-2000, 760, 6000, 10, 0, FILL('#CFC2D6'));
  for (let x = -2000; x < 4000; x += 160) fr += S.path(`M${x} 762 L${x - 30} 858`, ln(4, '#CFC2D6'));
  fr += S.rect(-2000, 852, 6000, 18, 0, ol('#BFB3C8', 5)) + S.rect(-2000, 870, 6000, 400, 0, FILL('#5E5A6E'));
  for (let x = -2000; x < 4000; x += 260) fr += S.rect(x, 990, 140, 16, 8, FILL('#FFFFFF', 0.7));
  o += view(cam, fr, 1);
  return o;
}
function infoBg() { return S.rect(-1200, -1200, 4320, 3480, 0, FILL('url(#s08grid)')); }
function infoHeader(txt, k = 1) {
  if (k <= 0) return '';
  return S.g(S.path('M0 0 L560 0 L520 40 L560 80 L0 80 Z', ol('#2E7BFF', 6)) + TS(txt, 30, 58, 50, '#FFFFFF', { 'text-anchor': 'start', 'stroke-width': 0 }) + S.rect(470, 18, 34, 44, 6, ol('#FFD21F', 4)), `translate(${f(-600 + 640 * ease.out(k))} 36)`);
}
function overcastYard(t, grey = 1) {
  let o = S.rect(-800, -800, 3520, 2680, 0, FILL('url(#s08grey)'));
  for (const [cx, cy, s] of [[150, 120, 1.4], [800, 70, 1.2], [1400, 140, 1.5], [1900, 60, 1.1]]) {
    const x = ((cx + t * 30) % 2600) - 300;
    o += S.g(S.ellipse(0, 0, 170, 44, FILL('#8C88A8')) + S.ellipse(-70, -26, 90, 44, FILL('#9894B2')) + S.ellipse(64, -34, 100, 52, FILL('#A29EBC')), tf(x, cy, s));
  }
  return o;
}
function villaGrounds(t, opts = {}) {
  let o = villa(t) + palm(220, 760, 1, t * 2.4) + palm(1720, 770, 0.9, t * 2.4);
  o += S.rect(-600, 740, 3200, 500, 0, FILL('#7FA86A')) + S.rect(-600, 740, 3200, 12, 0, FILL('#97BF7E'));
  o += S.path('M700 1240 L860 760 L1060 760 L1220 1240 Z', FILL('#C9C2B8')) + S.path('M860 760 L700 1240 M1060 760 L1220 1240', ln(6, '#A9A29A'));
  return o;
}
function livingRoom(t, tvInner, ticker, tvS = 0.42) {
  let o = S.rect(-400, -400, 2720, 1300, 0, FILL('url(#s08diam)'));
  o += S.rect(-400, 640, 2720, 200, 0, FILL('#F4DDBA')) + S.rect(-400, 630, 2720, 18, 4, ol('#E2C18E', 5));
  o += S.rect(-400, 830, 2720, 600, 0, FILL('url(#wood)')) + S.rect(-400, 826, 2720, 16, 0, FILL('#B5703A'));
  o += S.rect(260, 140, 200, 150, 10, ol('#FFFFFF', 8)) + S.rect(276, 156, 168, 118, 4, FILL('#9FE6FF')) + coin(360, 215, 36, 0, 0);
  o += S.rect(1500, 120, 160, 200, 10, ol('#FFFFFF', 8)) + S.rect(1516, 136, 128, 168, 4, FILL('#FFB4C8')) + S.circle(1580, 210, 40, FILL('#F2B53A'));
  // floor lamp + plant
  o += S.path('M150 830 L150 380', ln(10)) + S.path('M90 380 L210 380 L180 300 L120 300 Z', ol('#FFE9A8', 6)) + S.circle(150, 360, 120, FILL('url(#s08warm)'));
  o += S.rect(1720, 700, 110, 130, 14, ol('#E2453C', 6)) + S.path('M1775 700 Q1700 600 1730 540 M1775 700 Q1790 580 1780 520 M1775 700 Q1850 610 1830 560', ln(14, '#3FAE5A'));
  // TV cabinet + TV
  o += S.rect(640, 700, 640, 120, 14, ol('#B07A48', 7)) + S.rect(660, 720, 290, 80, 8, ol('#C98A5A', 5)) + S.rect(970, 720, 290, 80, 8, ol('#C98A5A', 5));
  o += K.tv(960, 400, tvS, tvInner, ticker, t);
  return o;
}
function couchBack() {
  // the orange L-shaped couch from behind
  let o = S.rect(180, 760, 1400, 260, 60, ol('#F08A3C', 9)) + S.rect(200, 772, 1360, 40, 20, FILL('#FFB070', 0.7));
  o += S.rect(1460, 830, 520, 300, 60, ol('#E2782A', 9)) + S.rect(1480, 842, 480, 36, 18, FILL('#FFB070', 0.6));
  o += S.rect(120, 800, 130, 260, 50, ol('#E2782A', 9));
  return o;
}
function newsStudio(t, chip) {
  // TV inner content: -800..800 x -450..450
  let o = S.rect(-800, -450, 1600, 900, 0, FILL('url(#s08studio)'));
  for (let i = 0; i < 9; i++) o += S.rect(-800 + i * 190, 120 - (i % 3) * 90 - 120, 150, 500, 6, FILL('#FFFFFF', 0.12));
  o += S.rect(160, -380, 560, 300, 26, ol('#10162A', 6)) + chip.inset;
  o += chip.actor;
  o += S.rect(-800, 170, 1600, 300, 0, ol('#22305A', 8)) + S.rect(-800, 170, 1600, 30, 0, FILL('#3B5BB5'));
  o += S.rect(-700, 210, 300, 60, 10, FILL('#FFFFFF', 0.15)) + TF('NEWS 7', -550, 254, 44, '#FFFFFF');
  return o;
}

// ---------------------------------------------------------------- characters
const ty = (t, x, y, s, pose = {}, act = {}) => actor('ty', t, { x, y, s, ...pose }, act);
function handAt(a, side, s, x, y) { const [hx, hy] = AC.hand(a, side); return [x + hx * s, y + hy * s]; }
const kidWalk = (i, t, x, y, s, flip = false, ph = 0, extra = {}) => K.draw.kid(i, { x, y, s, view: 'side', flip, ...AC.walk(t * 7 + ph), ...extra });

// ================================================================ SHOTS
// ---------------------------------------------------------------- 1 · everything was perfect
function ring(front) {
  return S.path(front ? 'M-170 0 A170 56 0 0 0 170 0 L130 0 A130 36 0 0 1 -130 0 Z' : 'M-170 0 A170 56 0 0 1 170 0 L130 0 A130 36 0 0 0 -130 0 Z', ol('#FFC93C', 7)) + (front ? S.path('M-120 22 Q0 44 120 22', ln(10, '#FFF1B0')) : '');
}
function juice(x, y, s = 1) {
  let o = S.path('M-34 -90 L34 -90 L24 20 L-24 20 Z', FILL('#FFF6E0', 0.8)) + S.path('M-30 -60 L30 -60 L24 20 L-24 20 Z', FILL('#FFB13B'));
  o += S.path('M-34 -90 L34 -90 L24 20 L-24 20 Z', { fill: 'none', stroke: '#151515', 'stroke-width': 6, 'stroke-linejoin': 'round' });
  o += S.path('M8 -88 L36 -150', ln(8, '#FF5A8A')) + S.path('M-50 -96 Q-14 -146 26 -104 Z', ol('#3BD16F', 4)) + S.circle(30, -84, 14, ol('#FF8A2B', 4));
  return S.g(o, tf(x, y, s));
}
function shotPerfect(t) {
  const cam = camKeys(t, [[START, { zoom: 1.1, x: 0, y: 110 }], [c02, { zoom: 1.34, x: 30, y: 175 }]]);
  let o = goldenSky(t) + view(cam, villa(t) + palm(220, 760, 1, t) + palm(1720, 770, 0.9, t) + obbyYard(t) + S.rect(-400, 740, 2800, 60, 0, FILL('#6FBF5A')) + S.rect(-400, 740, 2800, 12, 0, FILL('#8FD96E')), 0.85);
  const bob = Math.sin(t * 2.2) * 8;
  const armR = 70 + 8 * Math.sin(t * 3);
  const [hx, hy] = AC.hand(armR, 1);
  let mid = S.g(ring(false), `translate(960 ${f(830 + bob)})`);
  mid += tyIn(t, 960, 1010 + bob, 0.5, { armL: 165, armR, face: { name: 'smug' }, props: [{ svg: juice(hx, hy - 10, 1), layer: 'front' }] }, { arms: false });
  mid += poolFront(t, 820) + S.g(ring(true), `translate(960 ${f(830 + bob)})`);
  o += view(cam, mid, 1);
  let st = '';
  for (let i = 0; i < 5; i++) {
    const k = pop(t, tPerfect - 0.15 + i * 0.09, 0.25);
    if (k > 0) st += S.g(S.path(F.starPath(0, 0, 50), ol('#FFD21F', 6)), `translate(${760 + i * 100} 150) scale(${f(k)}) rotate(${f(Math.sin(t * 3 + i) * 8)})`);
  }
  o += st + K.sparkles([[700, 120, 20], [1230, 110, 24]], t);
  if (t < START + 0.32) o += C.pixelWipe(seg(t, START, START + 0.32), 'reveal');
  return o;
}
// ---------------------------------------------------------------- 2 · until... WEDNESDAY (freeze frame + calendar)
function shotUntil(t) {
  const k = ease.out(seg(t, c02, c02 + 0.16));
  let o = S.g(shotPerfect(c02 - 0.001), `translate(960 540) rotate(${f(-3 * k)}) scale(${f(1 + 0.12 * k)}) translate(-960 -540)`);
  o += S.rect(0, 0, W, H, 0, FILL('#2A2340', 0.42 * k));
  o += S.rect(0, 0, W, H, 0, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 30, opacity: f(0.8 * k) });
  o += bang('SCRRRTCH!', 1460, 250, seg(t, c02, c02 + 0.12) * (1 - seg(t, tWed0 - 0.35, tWed0 - 0.2)), 84, 8, '#FFFFFF');
  const kc = seg(t, tWed0 - 0.25, tWed0 + 0.08);
  if (kc > 0) {
    o += S.rect(0, 0, W, H, 0, FILL('#120A26', 0.5 * kc));
    const bolt = (x, y, s) => S.g(S.path('M0 0 L-40 120 L10 120 L-30 260 L80 90 L20 90 L60 0 Z', ol('#FFE14D', 6)), tf(x, y, s));
    if (t > tWed0 + 0.02) o += bolt(330, 120, 1.2 + 0.1 * Math.sin(t * 40)) + bolt(1600, 80, 1 + 0.1 * Math.sin(t * 37));
    const y = lerp(-420, 540, ease.outBack(kc));
    o += K.shaken(t, tWed0 + 0.05, S.g(calendar('WEDNESDAY'), `translate(960 ${f(y)}) rotate(${f(-4 + 2 * Math.sin(t * 2))}) scale(1.1)`), 0.4, 20);
  }
  o += C.whiteFlash(0.7 * bump(t, tWed0 + 0.02, tWed0 + 0.14));
  return o;
}
// ---------------------------------------------------------------- 3–6 · the bakery
function bakeryState(t) {
  if (t < tTue) return { day: 'MON', dayCol: '#3BD16F', price: '5', flipAt: tFive - 0.1, dayAt: 0, chg: 'BREAD  ▲ 0%   ·   MILK ▲ 0%', alarm: 0 };
  if (t < tWed) return { day: 'TUE', dayCol: '#FFD21F', price: '50', flipAt: tFifty - 0.08, dayAt: tTue, chg: 'BREAD  ▲ +900%   ·   MILK ▲ +850%', alarm: 0 };
  return { day: 'WED', dayCol: '#FF5A5A', price: '5,000', flipAt: tThou - 0.05, dayAt: tWed, spin: [tWed + 0.35, tThou - 0.05], chg: 'BREAD  ▲ +99,900%  !!!   ·   PANIC ▲', alarm: t > tThou ? 1 : 0 };
}
function bakeryWorld(t, st, noBaker = false) {
  let o = S.rect(-500, -500, 2920, 2080, 0, FILL('#FFE3C4')) + S.rect(-500, -500, 2920, 2080, 0, FILL('url(#wallStripes)', 0.8));
  o += S.rect(-500, -10, 2920, 30, 0, FILL('#E8B98A'));
  // window to the street
  o += S.rect(40, 150, 460, 430, 20, ol('#9FD8FF', 10)) + S.rect(56, 420, 428, 144, 0, FILL('#FFC9DA')) + S.rect(80, 330, 120, 234, 6, FILL('#FFE38A')) + S.rect(300, 290, 160, 274, 6, FILL('#C9D6FF'));
  o += S.path('M270 150 L270 580 M40 360 L500 360', ln(10)) + S.rect(40, 150, 460, 430, 20, { fill: 'none', stroke: '#151515', 'stroke-width': 10 });
  o += TF('BAKERY', 270, 130, 54, '#B9542A');
  // shelves
  for (const [sy, kind] of [[400, 0], [560, 1]]) {
    o += S.rect(600, sy, 1240, 26, 6, ol('#B07A48', 6));
    for (let i = 0; i < 7; i++) o += kind ? croissant(680 + i * 170, sy - 10, 0.9) : loaf(680 + i * 170, sy - 24, 0.6);
  }
  // baker behind the counter
  const sur = t > tThou ? 1 : 0;
  if (!noBaker) o += K.draw.kid(4, { x: 1420, y: 930, s: 0.52, turn: -0.3, face: sur ? { name: 'scared' } : { name: 'happy' }, armR: sur ? 150 : 20, armL: sur ? 150 : 10, props: [{ svg: chefHat(), layer: 'front' }, { svg: apronProp(), layer: 'mid' }], shadow: false });
  o += S.g(priceBoard(t, st), 'translate(1180 190) scale(0.92)');
  // counter + display case
  o += S.rect(-200, 720, 2320, 500, 0, ol('#F7C8D8', 8)) + S.rect(-200, 700, 2320, 40, 10, ol('#FFFFFF', 8));
  o += S.rect(80, 770, 1760, 200, 18, ol('#DDF4FF', 6));
  for (let i = 0; i < 9; i++) o += i % 2 ? croissant(170 + i * 190, 930, 0.8) : S.g(S.ellipse(0, 0, 50, 30, ol('#FF9EC4', 5)) + S.ellipse(0, -12, 34, 12, FILL('#FFFFFF')), tf(170 + i * 190, 930));
  o += S.path('M120 790 L220 790 L120 900 Z', FILL('#FFFFFF', 0.5));
  // the loaf for sale on the counter
  const pr = st.price;
  o += loaf(1100, 676, 1.3, -4) + K.shaken(t, st.flipAt, priceTagBig(1330, 590, pr, 0.85, 12), 0.3, 8);
  return o;
}
function shotBakery(t) {
  const st = bakeryState(t);
  let cam;
  if (t < c04) cam = camKeys(t, [[c03, { zoom: 1.0, x: 0, y: 0 }], [c04, { zoom: 1.1, x: 60, y: -40 }]]);
  else if (t < c05) cam = camKeys(t, [[c04, { zoom: 1.9, x: 210, y: -330 }], [c05, { zoom: 2.05, x: 230, y: -330 }]]);
  else cam = camKeys(t, [[c05, { zoom: 1.35, x: 200, y: -200 }], [tThou - 0.04, { zoom: 1.45, x: 210, y: -230 }], [tThou + 0.08, { zoom: 2.0, x: 220, y: -330 }], [c06, { zoom: 2.1, x: 220, y: -330 }]]);
  shakeAll(cam, t, [[tThou, 0.6, 22]]);
  let o = view(cam, bakeryWorld(t, st), 1);
  if (t < c04) {
    // Mom in the foreground, happy shopper
    o += view(cam, actor('mom', t, { x: 360, y: 1240, s: 0.72, turn: 0.5, armR: 60 + 10 * Math.sin(t * 2), armL: 12, face: { name: 'happy' }, shadow: false }), 1);
  }
  if (t > tThou - 0.05 && t < c06) {
    const k = t - tThou;
    for (let i = 0; i < 14; i++) {
      const a = hash(i) * Math.PI * 2, v = 600 + 500 * hash(i * 3);
      const [sx, sy] = toScreen(cam, 1180, 190);
      o += S.circle(sx + Math.cos(a) * v * k, sy + Math.sin(a) * v * k + 900 * k * k, 8 * (1 - seg(k, 0, 0.8)), FILL('#FFE14D'));
    }
    o += bang('5,000?!', 1520, 190, seg(t, tThou + 0.05, tThou + 0.2), 110, -8, '#FF5A5A');
  }
  if (t > tFifty && t < c05) o += bang('▲ +900%', 1560, 190, pop(t, tFifty + 0.1), 80, 6, '#3BD16F');
  return o;
}
function shotMom(t) {
  const cam = camKeys(t, [[c06, at(660, 650, 1.6)], [tBread - 0.05, at(650, 640, 1.72)], [tBread + 0.08, at(620, 620, 2.2)], [c07, at(620, 620, 2.25)]]);
  shakeAll(cam, t, [[tBread, 0.5, 18]]);
  const st = bakeryState(t);
  let o = view(cam, bakeryWorld(t, st, true), 1);
  const sh = bump(t, tBread, tBread + 0.6);
  const armR = 120 + 25 * Math.sin(t * 30) * sh;
  const [hx, hy] = AC.hand(armR, 1);
  const coupon = S.g(S.rect(-60, -34, 120, 68, 6, { fill: '#FFF6C8', stroke: '#151515', 'stroke-width': 5, 'stroke-dasharray': '10 6' }) + TF('5% OFF', 0, 10, 26, '#E2233B'), '');
  const cy = seg(t, tBread + 0.1, c07);
  const props = [{ svg: loaf(hx + 20, hy - 30, 1.1, -30 + 10 * Math.sin(t * 30) * sh) + priceTagBig(hx + 120, hy - 150, '5,000', 0.7, 14), layer: 'front' }];
  o += view(cam, actor('mom', t, { x: 520, y: 1220, s: 0.72, turn: 0.3, armR, armL: 20 + 30 * (1 - cy), face: { name: t < tBread ? 'shocked' : 'scream' }, props, shadow: false }), 1);
  // coupon flutters away
  const [cx, cy0] = toScreen(cam, 520 - 270 * 0.72, 1220 - 330 * 0.72);
  o += S.g(coupon, `translate(${f(cx - 60 * cy)} ${f(cy0 + 500 * cy)}) rotate(${f(-20 + 200 * cy)}) scale(${f(1.6)})`);
  o += bang('FOR BREAD?!', 1330, 220, seg(t, tBread, tBread + 0.15), 120, -6, '#FFE14D');
  if (t > c07 - 0.4) o += C.pixelWipe(seg(t, c07 - 0.4, c07), 'cover');
  return o;
}
// ---------------------------------------------------------------- 7 · explainer title: Professor Ty
function shotWhy(t) {
  const cam = camKeys(t, [[c07, { zoom: 1.0, x: 0, y: 0 }], [c08, { zoom: 1.08, x: 40, y: 10 }]]);
  let o = view(cam, infoBg(), 1);
  const k = pop(t, c07 + 0.2, 0.35);
  let card = S.rect(-420, -270, 840, 540, 36, ol('#FFFFFF', 9)) + S.rect(-420, -270, 840, 110, 36, ol('#FF5A5A', 9)) + S.rect(-414, -190, 828, 34, 0, FILL('#FF5A5A'));
  card += TS('WHY IS BREAD', 0, -186, 76, '#FFFFFF', { 'stroke-width': 0 });
  card += loaf(-170, 80, 1.5, -6) + priceTagBig(160, 30, '5,000', 1.05, 8);
  for (let i = 0; i < 3; i++) card += TS('?', 230 + i * 60, -60 + Math.sin(t * 6 + i) * 14, 90, '#2E7BFF');
  let mid = S.g(card, `translate(1260 470) scale(${f(k)}) rotate(${f(-2 + Math.sin(t * 2) * 1)})`);
  // Ty with a pointer and round glasses
  const armR = 118 + 6 * Math.sin(t * 5);
  const [hx, hy] = AC.hand(armR, 1);
  const dir = [Math.sin(armR * Math.PI / 180), Math.cos(armR * Math.PI / 180)];
  const pointer = S.path(`M${f(hx)} ${f(hy)} L${f(hx + dir[0] * 420)} ${f(hy - dir[1] * -420)}`, ln(16, '#151515')) + S.path(`M${f(hx)} ${f(hy)} L${f(hx + dir[0] * 420)} ${f(hy - dir[1] * -420)}`, ln(8, '#B07A48')) + S.circle(hx + dir[0] * 420, hy + dir[1] * 420, 12, ol('#FF5A5A', 4));
  const ent = ease.outBack(seg(t, c07 + 0.05, c07 + 0.4));
  const auto = K.V.perform('TY', t, { seed: 7 });
  mid += ty(t, lerp(-200, 560, ent), 1080, 0.66, { armR, armL: 14, face: { name: 'determined' }, props: [{ svg: pointer, layer: 'front' }, headProp(roundGlasses(), auto)] }, { arms: false });
  o += view(cam, mid, 1);
  o += infoHeader('INFLATION 101', seg(t, c07 + 0.1, c07 + 0.45));
  if (t < c07 + 0.4) o += C.pixelWipe(seg(t, c07, c07 + 0.4), 'reveal');
  return o;
}
// ---------------------------------------------------------------- 8 · eight billion people press "claim daily reward"
const ROW0 = 240, CELL = 100, ROWH = 120;
function pressPhase(r, sgi, t) { return frac((t - tEight) * 1.6 - r * 0.21 - sgi * 0.13); }
function crowdRows(t, rows = 8, live = true) {
  let o = '';
  for (let r = 0; r < rows; r++) {
    const y = ROW0 + r * ROWH;
    for (let sgi = 0; sgi < 7; sgi++) {
      const pressed = live && t > tEight + 0.2 && pressPhase(r, sgi, t) < 0.3;
      o += S.rect(-400 + sgi * 400, y, 400, ROWH, 0, FILL(`url(#s08st${pressed ? 1 : 0}${r % 2 ? 'b' : 'a'})`));
    }
  }
  return o;
}
function crowdCoins(t, n = 36) {
  if (t < tEight + 0.2) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const col = Math.floor(hash(i * 1.7) * 26) - 4, r = Math.floor(hash(i * 3.3) * 7);
    const cx = col * CELL, sgi = Math.floor((cx + 400) / 400);
    const u = pressPhase(r, sgi, t) / 0.5;
    if (u > 1) continue;
    o += coin(cx + 79, ROW0 + r * ROWH + 50 - u * 110, 15 * (1 - 0.3 * u), 0, u * 8 + i);
  }
  return o;
}
function shotCrowd(t) {
  const cam = camKeys(t, [[c08, { zoom: 4.3, x: 0, y: 120 }], [tEight - 0.05, { zoom: 4.0, x: 0, y: 120 }], [tBillion + 0.35, { zoom: 1.0, x: 0, y: 50 }], [c09, { zoom: 1.06, x: 0, y: 40 }]], ease.inOut);
  let wld = infoBg() + crowdRows(t);
  // the hero station in the middle
  const hp = (t > tDay - 0.05 && t < tDay + 0.3) || (t > tClaimed - 0.05 && t < tClaimed + 0.3) || (t > tEight + 0.2 && pressPhase(3, 3, t) < 0.3);
  wld += S.rect(900, ROW0 + 3 * ROWH, 100, ROWH, 0, FILL('#FFF7E6')) + station(938, ROW0 + 3 * ROWH + 112, '#FF6B6B', '#E9B38B', hp);
  const zk = clamp((cam.zoom - 1.6) / 1.6, 0, 1);
  if (zk > 0) {
    let ui = S.rect(-80, -18, 160, 36, 12, ol('#3BD16F', 2.5)) + TF('CLAIM DAILY REWARD', 0, 6, 13, '#FFFFFF');
    ui += S.path('M0 18 L0 34', ln(2.5)) + S.path('M-5 28 L0 36 L5 28', ln(2.5));
    wld += S.g(ui, 'translate(979 588)', { opacity: f(zk) });
    for (const tc of [tDay, tClaimed]) {
      const u = seg(t, tc, tc + 0.8);
      if (u > 0 && u < 1) wld += S.g(coin(0, 0, 13, 0, u * 10) + TF('+100', 28, 5, 14, '#3BD16F', { stroke: '#151515', 'stroke-width': 3, 'paint-order': 'stroke', 'text-anchor': 'start' }), `translate(979 ${f(660 - u * 70)})`, { opacity: f(1 - u * u) });
    }
  }
  wld += crowdCoins(t);
  let o = view(cam, wld, 1);
  const kb = pop(t, tBillion - 0.05, 0.35);
  if (kb > 0) {
    let bn = S.rect(-520, -70, 1040, 140, 30, ol('#2A1640', 9)) + TS('× 8,000,000,000', 0, 30, 92, '#FFD21F', { 'stroke-width': 0 });
    o += S.g(bn, `translate(1180 ${f(lerp(-120, 112, kb))}) rotate(-2)`);
  }
  o += infoHeader('INFLATION 101');
  return o;
}
// ---------------------------------------------------------------- 9 · the reward printer prints brand-new Robux
function gear(cx, cy, r, rot) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * Math.PI * 2 + rot, a1 = a0 + Math.PI / 10;
    d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a0) * r)} ${f(cy + Math.sin(a0) * r)} L${f(cx + Math.cos(a1) * r)} ${f(cy + Math.sin(a1) * r)} L${f(cx + Math.cos(a1) * r * 0.8)} ${f(cy + Math.sin(a1) * r * 0.8)} L${f(cx + Math.cos(a1 + Math.PI / 10) * r * 0.8)} ${f(cy + Math.sin(a1 + Math.PI / 10) * r * 0.8)} `;
  }
  return S.path(d + 'Z', ol('#C9CED8', 5)) + S.circle(cx, cy, r * 0.28, ol('#8A93B0', 5));
}
function printerMachine(t, on) {
  const jit = on ? Math.sin(t * 60) * 4 : 0;
  let o = '';
  o += S.rect(1080, 90, 90, 140, 10, ol('#7A6AD8', 7));
  for (let i = 0; i < 4; i++) { const a = frac(t * 1.2 + i / 4); if (on || i < 1) o += coin(1125 + Math.sin(a * 6 + i) * 30, 80 - a * 260, 18 + a * 20, 0, a * 6, '#FFE38A'); }
  o += S.path('M700 260 L1220 260 L1180 200 L740 200 Z', ol('#8E7CF0', 7));
  o += S.rect(680, 250, 560, 400, 40, ol('#A08CFF', 8)) + S.rect(700, 270, 60, 360, 20, FILL('#FFFFFF', 0.25));
  o += S.rect(760, 290, 400, 70, 16, ol('#2A1640', 6)) + TF('ROBUX PRINTER', 960, 340, 44, '#FFD21F');
  o += S.circle(960, 480, 92, ol('#2A2440', 7)) + gear(960, 480, 72, on ? t * 6 : 0);
  o += S.circle(800, 470, 54, ol('#FFFFFF', 6)) + S.path(`M800 470 L${f(800 + Math.cos(-Math.PI + (on ? 2.8 + 0.2 * Math.sin(t * 30) : 0.5)) * 44)} ${f(470 + Math.sin(-Math.PI + (on ? 2.8 + 0.2 * Math.sin(t * 30) : 0.5)) * 44)}`, ln(7, '#E2233B')) + TF('SPEED', 800, 545, 24, '#2A1640');
  for (let i = 0; i < 3; i++) o += S.circle(1100 + i * 0, 420 + i * 60, 18, ol(on && Math.floor(t * 6 + i) % 2 ? ['#FF5A5A', '#FFD21F', '#3BD16F'][i] : '#5A5470', 5));
  o += S.path('M1230 430 L1400 470 L1400 560 L1230 540 Z', ol('#8E7CF0', 7));
  return S.g(o, `translate(${f(jit)} 0)`);
}
function printerCoins(t, t0, x0, y0, n = 34, landY = 860) {
  if (t < t0) return '';
  let o = '';
  for (let i = 0; i < n; i++) {
    const te = t0 + i * 0.045 + Math.floor((t - t0) / (n * 0.045)) * n * 0.045;
    const age = t - te;
    if (age < 0 || age > 1.3) continue;
    const vx = 520 + hash(i) * 520, vy = -380 - hash(i * 3) * 360;
    const x = x0 + vx * age, y = y0 + vy * age + 0.5 * 2000 * age * age;
    if (y > landY) continue;
    o += coin(x, y, 22 + hash(i * 5) * 10, i * 30, age * 12 + i);
  }
  return o;
}
function shotPrinter(t) {
  const cam = camKeys(t, [[c09, { zoom: 1.2, x: -60, y: 260 }], [c09 + 0.7, { zoom: 1.0, x: 0, y: 40 }], [c10, { zoom: 1.08, x: 120, y: 30 }]]);
  shakeAll(cam, t, [[tPrinted, 0.5, 10]]);
  const on = t > tPrinted - 0.15;
  let wld = infoBg();
  wld += S.g(crowdRows(t, 4), 'translate(-200 790) scale(0.8) translate(0 -240)');
  for (let i = 0; i < 6; i++) {
    const x0 = 160 + i * 320, p1 = [x0 * 0.5 + 480, 760], p2 = [800 + i * 64, 650];
    const d = `M${x0} 800 Q${f(p1[0])} ${p1[1]} ${f(p2[0])} ${p2[1]}`;
    wld += S.path(d, ln(36, '#151515')) + S.path(d, ln(22, '#9FE6FF'));
    for (let j = 0; j < 3; j++) {
      const u = frac(t * 1.4 + j / 3 + i * 0.17);
      const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * p1[0] + u * u * p2[0], by = (1 - u) * (1 - u) * 800 + 2 * (1 - u) * u * p1[1] + u * u * p2[1];
      wld += S.circle(bx, by, 8, ol('#FFD21F', 3));
    }
  }
  wld += printerMachine(t, on);
  const ph = seg(t, tPrinted, c10);
  wld += coinMound(1680, 880, 560, 30 + 260 * ease.out(ph));
  wld += printerCoins(t, tPrinted - 0.1, 1400, 500, 34, 860 - 260 * ease.out(ph));
  let o = view(cam, wld, 1);
  const kn = pop(t, tBrand, 0.3);
  if (kn > 0) {
    const [sx, sy] = toScreen(cam, 1660, 520);
    o += S.g(S.path(F.starPath(0, 0, 130, 92, 12), ol('#FF5A8A', 8)) + TS('NEW!', 0, 22, 70, '#FFFFFF', { 'stroke-width': 0 }), `translate(${f(sx)} ${f(sy)}) scale(${f(kn)}) rotate(${f(t * 40)})`);
  }
  o += bang('PRINT! PRINT! PRINT!', 640, 190, seg(t, tPrinted, tPrinted + 0.15), 72, -5, '#FFD21F');
  o += infoHeader('INFLATION 101');
  return o;
}
// ---------------------------------------------------------------- 10 · way more money, same bread
function shelf10(t, worry) {
  let o = S.rect(1140, 620, 620, 26, 6, ol('#B07A48', 6)) + S.rect(1140, 820, 620, 26, 6, ol('#B07A48', 6));
  o += S.rect(1150, 640, 20, 220, 4, ol('#8A5A34', 5)) + S.rect(1730, 640, 20, 220, 4, ol('#8A5A34', 5));
  for (let i = 0; i < 10; i++) {
    const r = Math.floor(i / 5), c = i % 5;
    const x = 1220 + c * 118, y = (r ? 800 : 600) - 4 * Math.abs(Math.sin(t * 6 + i)) * worry;
    o += loaf(x, y, 0.5, 0, { face: worry > 0.3 ? 'worry' : 'smile', look: -1, sweat: worry > 0.6 && i % 3 === 0 });
    const kc = pop(t, tSame5 + i * 0.08, 0.2);
    if (kc > 0) o += S.g(S.circle(0, 0, 24, ol('#2E7BFF', 4)) + TF(String(i + 1), 0, 10, 26, '#FFFFFF'), `translate(${x} ${y - 70}) scale(${f(kc)})`);
  }
  return o;
}
function shotMoneyBread(t) {
  const cam = camKeys(t, [[c10, at(960, 570, 1.0)], [tMoney5 - 0.1, at(560, 610, 1.25)], [tBut5, at(560, 610, 1.25)], [tSame5, at(1390, 610, 1.27)], [tBread5 + 0.25, at(1390, 610, 1.27)], [c11, at(960, 570, 1.0)]]);
  const g = ease.inOut(seg(t, c10 + 0.2, tBut5));
  let wld = infoBg();
  wld += S.path('M960 160 L960 1000', { stroke: '#2A1640', 'stroke-width': 6, 'stroke-dasharray': '24 18', opacity: 0.5 });
  const hdr = (x, txt, col) => S.g(S.rect(-200, -50, 400, 100, 26, ol(col, 7)) + TS(txt, 0, 26, 64, '#FFFFFF', { 'stroke-width': 0 }), tf(x, 300));
  wld += hdr(480, 'MONEY', '#3BD16F') + hdr(1440, 'BREAD', '#D9893B');
  const val = Math.round(Math.pow(10, 3 + 9 * g));
  wld += K.robuxText(480, 420, val.toLocaleString('en-US'), 54, '#FFFFFF');
  wld += coinMound(480, 900, 760, 60 + 420 * g);
  for (let i = 0; i < 6; i++) { const a = frac(t * 1.5 + i / 6); wld += coin(300 + i * 70, lerp(-60, 900 - (60 + 420 * g) * 0.95, a * a), 24, i * 40, t * 6 + i); }
  wld += TS('▲', 820, 520 - 30 * Math.abs(Math.sin(t * 6)), 90, '#3BD16F') + TS('▲', 140, 600 - 30 * Math.abs(Math.sin(t * 6 + 1)), 70, '#3BD16F');
  wld += TS('10 LOAVES', 1440, 420, 54, '#FFFFFF');
  wld += shelf10(t, g);
  const ks = pop(t, tSame5 + 0.1, 0.3);
  if (ks > 0) wld += S.g(S.rect(-170, -54, 340, 108, 20, { fill: 'none', stroke: '#E2233B', 'stroke-width': 12 }) + T('STILL 10', 0, 26, 64, '#E2233B'), `translate(1600 470) rotate(-10) scale(${f(lerp(2, 1, ks))})`, { opacity: f(seg(t, tSame5 + 0.1, tSame5 + 0.2)) });
  let o = view(cam, wld, 1);
  o += infoHeader('INFLATION 101');
  return o;
}
// ---------------------------------------------------------------- 11–12 · the balance scale
function scaleTilt(t) {
  const u = ease.inOut(seg(t, tMore6 - 0.3, tStuff6 + 0.4));
  return -17 * u + 3 * Math.sin(t * 9) * bump(t, tStuff6 + 0.2, tStuff6 + 1.2);
}
function priceFor(t) {
  const u = seg(t, tMore6 - 0.3, tExp + 0.1);
  return ['5', '50', '500', '5,000'][Math.min(3, Math.floor(u * 4))];
}
function balanceWorld(t, rocket = 0) {
  let o = infoBg();
  const th = scaleTilt(t) * Math.PI / 180;
  const px = 960, py = 400, R = 440;
  const L0 = [px - Math.cos(th) * R, py - Math.sin(th) * R], R0 = [px + Math.cos(th) * R, py + Math.sin(th) * R];
  o += S.path('M760 1000 L1160 1000 L1080 940 L840 940 Z', ol('#8A93B0', 7)) + S.rect(935, 410, 50, 550, 12, ol('#C9CED8', 7));
  o += S.g(S.rect(-R - 20, -16, 2 * R + 40, 32, 14, ol('#FFD21F', 7)), `translate(${px} ${py}) rotate(${f(scaleTilt(t))})`);
  o += S.circle(px, py, 34, ol('#E2233B', 7));
  const pan = (cx, cy, inner) => S.path(`M${f(cx)} ${f(cy)} L${f(cx - 150)} ${f(cy + 240)} M${f(cx)} ${f(cy)} L${f(cx + 150)} ${f(cy + 240)}`, ln(5, '#5A6070')) + inner + S.path(`M${f(cx - 170)} ${f(cy + 240)} Q${f(cx)} ${f(cy + 330)} ${f(cx + 170)} ${f(cy + 240)} Z`, ol('#C9CED8', 7)) + S.circle(cx, cy, 12, ol('#8A93B0', 4));
  // left pan: coins pour in
  const fill = seg(t, c11, tStuff6 + 0.3);
  let coins = coinMound(L0[0], L0[1] + 244, 300, 20 + 160 * fill);
  if (t < tStuff6 + 0.4) for (let i = 0; i < 10; i++) { const a = frac(t * 1.8 + i / 10); coins += coin(L0[0] - 90 + hash(i) * 180, lerp(-80, L0[1] + 200 - 140 * fill, a * a), 26, i * 30, t * 8 + i); }
  o += pan(L0[0], L0[1], coins);
  // right pan: one loaf with its price
  const lift = rocket > 0 ? -1600 * ease.in(rocket) : 0;
  let br = loaf(R0[0], R0[1] + 200 + lift, 1.1, 0, { face: 'worry', look: -0.5 });
  if (rocket > 0) {
    for (let i = 0; i < 10; i++) br += S.circle(R0[0] + Math.sin(i * 2.1 + t * 9) * 26, R0[1] + 280 + lift + i * 90 * Math.min(1, rocket * 3), 40 + i * 10, FILL('#FFFFFF', 0.7 * (1 - i / 10)));
    for (let i = 0; i < 5; i++) br += S.circle(R0[0] - 40 + i * 20, R0[1] + 260 + lift + 40 + hash(i + Math.floor(t * 30)) * 80, 26 - i * 3, FILL(i % 2 ? '#FFD21F' : '#FF8A2B', 0.9));
  }
  o += pan(R0[0], R0[1], rocket > 0 ? '' : br) + (rocket > 0 ? br : '');
  o += K.shaken(t, tMore6, priceTagBig(R0[0] + 210, R0[1] + 60 + lift, priceFor(t), 0.9, 10), 0.2, 6);
  const tag = (x, y, txt, col, k) => (k > 0 ? S.g(S.rect(-190, -40, 380, 80, 20, ol(col, 6)) + TS(txt, 0, 20, 50, '#FFFFFF', { 'stroke-width': 0 }), `translate(${f(x)} ${f(y)}) scale(${f(k)})`) : '');
  o += tag(L0[0], L0[1] + 380, 'MORE MONEY', '#3BD16F', pop(t, tMore6 - 0.1));
  o += tag(R0[0], R0[1] + 380, 'SAME STUFF', '#D9893B', pop(t, tSame6 - 0.1));
  return { o, R0 };
}
function shotScale(t) {
  const cam = camKeys(t, [[c11, { zoom: 1.0, x: 0, y: 40 }], [c12, { zoom: 1.1, x: 120, y: 0 }]]);
  let o = view(cam, balanceWorld(t).o, 1);
  const k = seg(t, tStuff6, tStuff6 + 0.3);
  if (k > 0) {
    let ar = S.path('M-60 120 L-60 -20 L-120 -20 L0 -150 L120 -20 L60 -20 L60 120 Z', ol('#3BD16F', 8)) + TS('PRICE', 0, 190, 60, '#3BD16F');
    o += S.g(ar, `translate(1750 ${f(420 - 30 * Math.sin(t * 6))}) scale(${f(ease.outBack(k))})`);
  }
  o += infoHeader('INFLATION 101');
  return o;
}
function shotRocket(t) {
  const rk = seg(t, tExp - 0.05, tExp + 0.9);
  const lift = -1600 * ease.in(rk);
  const cam = at(1395, 440 + lift * 0.9, rk > 0 ? lerp(1.95, 1.6, ease.out(rk)) : lerp(1.8, 1.95, seg(t, c12, tExp)));
  shakeAll(cam, t, [[tExp, 0.7, 16]]);
  const bw = balanceWorld(t, rk);
  let o = view(cam, bw.o, 1);
  if (rk > 0) o += C.speedLines(0, 1920, 540, 20, 5, '#FFFFFF', 1000);
  const ks = seg(t, tExp + 0.05, tExp + 0.2);
  if (ks > 0) o += S.g(S.rect(-380, -110, 760, 220, 30, { fill: '#FFFFFF', stroke: '#E2233B', 'stroke-width': 16 }) + T('PRICES UP!', 0, 40, 120, '#E2233B'), `translate(470 720) rotate(-8) scale(${f(lerp(2.4, 1, ease.out(ks)))})`, { opacity: f(ks) });
  o += infoHeader('INFLATION 101');
  return o;
}
// ---------------------------------------------------------------- 13 · Mia: "That's called inflation."
function inflationCard(t) {
  let o = S.rect(-460, -300, 920, 600, 36, ol('#FFFFFF', 9)) + S.rect(-460, -300, 920, 130, 36, ol('#B06BFF', 9)) + S.rect(-454, -206, 908, 36, 0, FILL('#B06BFF'));
  o += TS('INFLATION', 0, -205, 104, '#FFFFFF', { 'stroke-width': 0 });
  o += coinMound(-300, 60, 200, 110) + TS('+', -150, 30, 90, '#2A1640') + loaf(0, 20, 0.9) + TS('=', 150, 30, 90, '#2A1640') + priceTagBig(310, 0, '▲', 0.8, 10, '#FF5A5A', '#FFFFFF');
  o += TF('MORE MONEY', -300, 140, 34, '#1E9E4A') + TF('SAME STUFF', 0, 140, 34, '#B9542A') + TF('HIGHER PRICES', 310, 140, 34, '#E2233B');
  const ka = pop(t, tSchool - 0.05, 0.3);
  if (ka > 0) o += S.g(S.circle(0, 0, 80, { fill: '#FFFFFF', stroke: '#E2233B', 'stroke-width': 10 }) + T('A+', 0, 30, 84, '#E2233B'), `translate(380 230) rotate(-14) scale(${f(lerp(2, 1, ka))})`, { opacity: f(seg(t, tSchool - 0.05, tSchool + 0.05)) });
  return o;
}
function miaPhone(t, armR) {
  const [hx, hy] = AC.hand(armR, 1);
  const scr = S.rect(-150, -280, 300, 560, 0, FILL('#2E7BFF')) + S.rect(-120, -200, 240, 80, 20, FILL('#FFFFFF')) + S.rect(-120, -90, 180, 70, 20, FILL('#FFD21F')) + S.rect(-60, 10, 180, 70, 20, FILL('#FFFFFF'));
  return K.phone(hx - 10, hy - 50, 0.32, -10, scr);
}
function shotMia(t) {
  const cam = camKeys(t, [[c13, at(990, 570, 1.02)], [c14, at(1050, 580, 1.1)]]);
  let o = view(cam, infoBg(), 1);
  const ent = ease.out(seg(t, c13, c13 + 0.35));
  let mid = actor('mia', t, { x: lerp(2200, 1440, ent), y: 1120, s: 0.68, turn: -0.25, armR: 55, armL: 10, face: { name: 'smug' }, props: [{ svg: miaPhone(t, 55), layer: 'front' }], shadow: false }, { arms: false });
  const kc = seg(t, tInfl - 0.08, tInfl + 0.12);
  if (kc > 0) mid += S.g(inflationCard(t), `translate(700 540) rotate(${f(-3 + Math.sin(t * 2))}) scale(${f(lerp(1.7, 0.95, ease.out(kc)))})`, { opacity: f(clamp(kc * 2, 0, 1)) });
  o += view(cam, mid, 1);
  o += infoHeader('INFLATION 101');
  return o;
}
// ---------------------------------------------------------------- 14 · the "Skip Math" pass
function lanyard() {
  let o = S.path('M-60 -520 L-20 -400 M60 -520 L20 -400', ln(9, '#2E7BFF'));
  o += S.rect(-70, -410, 140, 110, 14, ol('#232A3D', 6)) + S.rect(-70, -410, 140, 34, 14, FILL('#2E7BFF')) + TF('SKIP MATH', 0, -384, 22, '#FFFFFF') + TF('÷ ×', 0, -324, 40, '#FFD21F');
  return o;
}
function shotSkipMath(t) {
  const cam = camKeys(t, [[c14, { zoom: 1.0, x: 0, y: 0 }], [tSkip - 0.05, { zoom: 1.05, x: 0, y: 0 }], [tSkip + 0.1, { zoom: 1.22, x: 80, y: -20 }], [c15, { zoom: 1.26, x: 90, y: -20 }]]);
  let o = view(cam, infoBg(), 1);
  const scratch = 150 + 14 * Math.sin(t * 14);
  let mid = ty(t, 640, 1120, 0.7, { armL: scratch, armR: 12, face: { name: 'nervous', mouth: 'teeth' }, props: [{ svg: lanyard(), layer: 'front' }] }, { arms: false });
  o += view(cam, mid, 1);
  const icon = TS('÷', -30, 30, 90, '#FFD21F') + TS('×', 34, 10, 60, '#FFFFFF') + S.path('M-60 -60 L60 40', ln(12, '#E2233B'));
  o += K.gamePass(1340, 470, 'SKIP MATH', '999', 1.3, seg(t, tSkip - 0.1, tSkip + 0.3), icon);
  const ko = seg(t, tSkip + 0.45, tSkip + 0.6);
  if (ko > 0) o += S.g(S.rect(-170, -50, 340, 100, 18, { fill: 'none', stroke: '#3BD16F', 'stroke-width': 12 }) + T('OWNED ✓', 0, 26, 64, '#3BD16F'), `translate(1420 700) rotate(-10) scale(${f(lerp(2, 1, ease.out(ko)))})`, { opacity: f(ko) });
  o += infoHeader('INFLATION 101');
  return o;
}
// ---------------------------------------------------------------- 15 · "Ugh. She's right."
function shotUgh(t) {
  const cam = camKeys(t, [[c15, { zoom: 1.0, x: 0, y: 0 }], [c16, { zoom: 1.08, x: 0, y: 20 }]]);
  let o = view(cam, infoBg(), 1);
  const slump = ease.out(seg(t, A[8].a, A[8].a + 0.4)) - 0.4 * seg(t, tRight - 0.3, tRight);
  let mid = ty(t, 900, 1700 + 60 * slump, 1.4, { armL: 6, armR: 6, headRot: -6 * slump, face: { name: t < A[8].word("She's").t0 ? 'deadpan' : 'sad', ...(t < A[8].a + 0.5 ? { eyes: { type: 'closed' } } : {}) }, props: [{ svg: lanyard(), layer: 'front' }] }, { arms: false, energy: 0.4 });
  const pk = ease.out(seg(t, tRight - 0.4, tRight));
  mid += actor('mia', t, { x: lerp(2400, 1700, pk), y: 1650, s: 1.25, turn: -0.4, armR: 60, face: { name: 'smug' }, props: [{ svg: miaPhone(t, 60), layer: 'front' }], shadow: false }, { arms: false });
  o += view(cam, mid, 1);
  o += bang('UGH.', 520, 300, pop(t, A[8].a, 0.2) * (1 - seg(t, tRight - 0.4, tRight - 0.2)), 130, -8, '#B06BFF');
  return o;
}
// ---------------------------------------------------------------- 16 · Thursday: gum costs a MILLION
function shotGum(t) {
  if (t < tThu + 0.55) {
    let o = S.rect(0, 0, W, H, 0, FILL('#2A1640')) + K.rays(960, 540, 18, 1400, '#FF5A5A', 0.2, t * 30);
    const tear = seg(t, tThu - 0.1, tThu + 0.25);
    o += S.g(calendar('THURSDAY', '#B06BFF'), 'translate(960 560) rotate(2)');
    if (tear < 1) o += S.g(calendar('WEDNESDAY'), `translate(${f(960 + 700 * tear * tear)} ${f(560 + 300 * tear)}) rotate(${f(2 + 70 * tear)})`);
    o += C.whiteFlash(0.5 * bump(t, c16, c16 + 0.1));
    return o;
  }
  const t0 = tThu + 0.55;
  const cam = camKeys(t, [[t0, at(1000, 560, 1.1)], [tMillion - 0.05, at(980, 570, 1.18)], [tMillion + 0.08, at(960, 570, 1.6)], [c17, at(960, 570, 1.65)]]);
  shakeAll(cam, t, [[tMillion, 0.5, 20]]);
  let wld = S.rect(-400, -400, 2720, 1880, 0, FILL('#D8F5E6'));
  for (const sy of [200, 380, 560]) {
    wld += S.rect(100, sy, 1720, 22, 6, ol('#2FA37A', 5));
    for (let i = 0; i < 12; i++) wld += S.rect(140 + i * 140, sy - 90, 90, 90, 14, ol(['#FF6FB5', '#FFD166', '#34C3FF', '#FF8A2B'][i % 4], 5)) + S.rect(150 + i * 140, sy - 80, 30, 20, 6, FILL('#FFFFFF', 0.5));
  }
  wld += S.rect(-400, 700, 2720, 500, 0, ol('#F2E2C8', 8)) + S.rect(-400, 690, 2720, 30, 8, ol('#FFFFFF', 7));
  wld += S.rect(1480, 470, 360, 230, 24, ol('#3A3F55', 8)) + S.rect(1510, 500, 300, 90, 10, FILL('#9FFFA8'));
  wld += TF(t > tMillion ? '1,000,000' : '...', 1660, 562, 52, '#1E5A2E');
  wld += gumPack(640, 630, 1.6);
  const tagK = seg(t, tGum, tMillion);
  wld += S.path('M740 600 L900 560', ln(5)) + priceTagBig(lerp(900, 1120, ease.out(tagK)), 540, '1,000,000', lerp(0.3, 1.25, ease.out(tagK)), 8);
  let o = view(cam, wld, 1);
  o += bang('KA-CHING!', 1500, 230, seg(t, tMillion, tMillion + 0.12), 110, -6, '#FFD21F');
  o += C.whiteFlash(0.5 * bump(t, t0 - 0.03, t0 + 0.08));
  return o;
}
// ---------------------------------------------------------------- 17 · wheelbarrows of coins to the store
function shotBarrows(t) {
  const u = seg(t, c17, c18);
  const cam = { zoom: 1.05, x: lerp(-760, -1060, u), y: 40 };
  let o = street(t, cam);
  let mid = '';
  // someone heads home with one tiny pack of gum in an empty barrow
  mid += K.draw.kid(15, { x: -900 + (t - c17) * 230, y: 850, s: 0.4, view: 'side', flip: true, ...AC.walk(t * 7 + 2), armL: 42, armR: 46, lean: 6, volume: false, face: { name: 'sad' }, props: [{ svg: wheelbarrow(-150, -330, '#B06BFF', 0) + gumPack(-400, -300, 0.7), layer: 'top' }] });
  const walkers = [[4, 0.5, 0], [6, 0.48, 1], [9, 0.52, 2], [12, 0.47, 3]];
  walkers.forEach(([kid, s, i]) => {
    const x = -260 + i * 560 - (t - c17) * 200;
    const ph = t * 7 + i;
    const wb = wheelbarrow(-150, -330, ['#E2453C', '#2E7BFF', '#3BD16F', '#FF8A2B'][i], 1);
    mid += K.draw.kid(kid, { x, y: 905, s, view: 'side', ...AC.walk(ph), armL: 42, armR: 46, lean: 8, props: [{ svg: wb, layer: 'top' }] });
    // a coin hops off now and then
    const a = frac((t - c17) * 0.9 + i * 0.3);
    if (a < 0.6) mid += coin(x - 420 * s + a * 60, 905 - 330 * s - 300 * a + 900 * a * a, 16, a * 300, a * 10);
  });
  mid += priceSign('GUM', '1,000,000', -560, 560, 0.8, -3);
  o += view(cam, mid, 1);
  return o;
}
// ---------------------------------------------------------------- 18 · the anchor's tie vs his car
function tieGlow(t) {
  const o = S.path('M-16 -500 L16 -500 L26 -372 L0 -336 L-26 -372 Z', ol('#FFD21F', 5)) + S.path('M-6 -490 L-12 -380', ln(5, '#FFF6C8'));
  return o + F.sparkle(40, -470, 18 * Math.abs(Math.sin(t * 6))) + F.sparkle(-46, -380, 14 * Math.abs(Math.sin(t * 6 + 2)));
}
function shotAnchorCar(t) {
  const whip = tCar - 0.35;
  const cam = t < whip ? camKeys(t, [[c18, at(960, 580, 1.0)], [tTie - 0.1, at(900, 600, 1.05)], [tTie + 0.25, at(790, 640, 1.65)], [whip, at(790, 640, 1.7)]])
    : camKeys(t, [[whip, at(1500, 850, 1.6)], [tCar + 0.1, at(1480, 860, 1.45)], [c19, at(1480, 860, 1.42)]]);
  shakeAll(cam, t, [[tCar + 0.2, 0.4, 12]]);
  let w = S.rect(-800, -800, 3520, 2680, 0, FILL('url(#s08day)'));
  w += view(cam, backTowers(11, 560), 0.6);
  let fr = S.rect(80, 120, 960, 680, 14, ol('#C9D6FF', 7)) + S.rect(80, 120, 960, 680, 14, FILL('url(#s08bwin)', 0.6)) + S.rect(240, 60, 640, 120, 20, ol('#2E7BFF', 7)) + TS('NEWS 7', 560, 145, 80, '#FFFFFF', { 'stroke-width': 0 });
  fr += S.circle(960, 70, 70, ol('#FFFFFF', 7)) + S.path('M960 70 L1010 20', ln(8));
  fr += S.rect(-800, 800, 3520, 600, 0, FILL('#8A8A9C')) + S.rect(-800, 800, 3520, 14, 0, FILL('#A9A9BB'));
  for (let x = -400; x < 2800; x += 300) fr += S.rect(x, 900, 20, 160, 4, FILL('#FFFFFF', 0.6));
  const tieK = seg(t, tTie - 0.05, tTie + 0.1);
  const props = [];
  if (tieK > 0) props.push({ svg: tieGlow(t) + (t > tTie ? S.g(priceTagBig(0, 0, '9,000,000', 0.85, 0), `translate(150 -330) rotate(${f(20 + 6 * Math.sin(t * 4))})`) + S.path('M0 -360 L60 -340', ln(4)) : ''), layer: 'front' });
  fr += actor('anchor', t, { x: 700, y: 1010, s: 0.62, turn: 0.2, armL: 20, armR: t > tTie - 0.1 ? 150 + 8 * Math.sin(t * 5) : 25, face: { name: t > tTie ? 'joy' : 'smug' }, props });
  const bmp = seg(t, tCar + 0.15, tCar + 0.4);
  fr += junkCar(1480, 1010, t, 1.2, ease.outBack(bmp));
  // the hubcap rolls away
  if (t > tCar + 0.2) { const k = t - tCar - 0.2; fr += S.g(S.circle(0, 0, 22, ol('#C9CED8', 5)) + S.path('M-10 0 L10 0', ln(4)), `translate(${f(1590 + 400 * k)} 976) rotate(${f(k * 700)})`); }
  if (t > tCar) fr += priceTagBig(1480, 760, '3', 0.9 * pop(t, tCar, 0.25), -8, '#C9CED8');
  w += view(cam, fr, 1);
  w += C.whiteFlash(0.5 * bump(t, whip - 0.05, whip + 0.08));
  if (Math.abs(t - whip) < 0.12) w += C.speedLines(0, 1920, 540, 20, 4, '#FFFFFF', 1000);
  return w;
}
// ---------------------------------------------------------------- 19–21 · Dad: paycheck → one coffee → 30% missing → crying
function cafeWorld(t) {
  let o = S.rect(-500, -500, 2920, 2080, 0, FILL('#3E8E8A')) + S.rect(-500, -500, 2920, 2080, 0, FILL('url(#wallStripes)', 0.5));
  o += S.rect(-500, 0, 2920, 30, 0, FILL('#2E6B68'));
  o += S.rect(1100, 100, 640, 330, 20, ol('#2A2A33', 8)) + TF('MENU', 1420, 160, 46, '#FFD21F');
  [['COFFEE', '50,000'], ['LATTE', '80,000'], ['MUFFIN', '120,000']].forEach(([n, p], i) => {
    o += TF(n, 1140, 230 + i * 70, 38, '#FFFFFF', { 'text-anchor': 'start' }) + K.robuxText(1610, 230 + i * 70, p, 36, '#FFE14D');
  });
  for (let i = 0; i < 5; i++) o += S.path(`M${200 + i * 160} 0 L${200 + i * 160} 130`, ln(4)) + S.path(`M${170 + i * 160} 130 L${230 + i * 160} 130 L${215 + i * 160} 100 L${185 + i * 160} 100 Z`, ol('#FFE9A8', 4));
  o += S.rect(160, 350, 260, 280, 20, ol('#C9CED8', 7)) + S.rect(190, 380, 200, 90, 10, ol('#3A3F55', 5)) + S.rect(250, 520, 20, 50, 4, FILL('#3A3F55'));
  return o;
}
function cafeCounter() { return S.rect(-500, 760, 2920, 600, 0, ol('#8A5A34', 8)) + S.rect(-500, 740, 2920, 40, 10, ol('#C98A5A', 7)); }
function shotPaycheck(t) {
  const cam = camKeys(t, [[c19, { zoom: 1.0, x: 0, y: 0 }], [tOne, { zoom: 1.08, x: 60, y: 30 }], [tCoffee + 0.1, { zoom: 1.3, x: 120, y: 120 }], [c20, { zoom: 1.32, x: 120, y: 120 }]]);
  let wld = cafeWorld(t);
  wld += K.draw.kid(8, { x: 1450, y: 1080, s: 0.6, turn: -0.4, armL: t > tBought + 0.3 ? 60 : 15, armR: 10, face: { name: 'happy' }, props: [{ svg: capHat('#3E8E8A'), layer: 'front' }, { svg: apronProp('#8A5A34'), layer: 'mid' }], shadow: false });
  wld += cafeCounter();
  // the paycheck slides over; one coffee slides back
  const ck = ease.inOut(seg(t, tBought - 0.1, tBought + 0.35));
  const armR = ck < 0.3 ? 80 + 4 * Math.sin(t * 8) : lerp(80, 25, seg(ck, 0.3, 1));
  const [hx, hy] = handAt(armR, 1, 0.792, 540, 1180);
  const cu = ease.out(seg(t, tOne - 0.1, tOne + 0.25));
  if (cu > 0) wld += glassMug(lerp(1300, 900, cu), 752, 0.36, 1, t, 1);
  wld += actor('dad', t, { x: 540, y: 1180, s: 0.72, turn: 0.45, armR, armL: 12, face: { name: t < tCoffee ? 'nervous' : 'sad', mouth: t < tCoffee ? 'teeth' : 'frown' }, shadow: false });
  if (ck < 1) wld += paycheck(lerp(hx + 110, 1350, ck), lerp(hy - 100, 700, ck), lerp(0.8, 0.5, ck), lerp(-6, 8, ck));
  let o = view(cam, wld, 1);
  if (cu > 0.95) o += K.sparkles([[toScreen(cam, 930, 640)[0], toScreen(cam, 930, 640)[1], 30]], t) + bang('ONE COFFEE.', 1360, 260, pop(t, tCoffee, 0.2), 80, -5, '#FFFFFF');
  return o;
}
function shotStraw(t) {
  const cam = camKeys(t, [[c20, { zoom: 1.0, x: 0, y: 0 }], [c21, { zoom: 1.1, x: 40, y: 20 }]]);
  let wld = cafeWorld(t) + cafeCounter();
  const level = 1 - 0.3 * ease.inOut(seg(t, tThirty10, tMissing + 0.3));
  const broke = t > tMissing + 0.6 ? 0.3 : 1;
  wld += actor('dad', t, { x: 380, y: 1750, s: 1.25, turn: 0.55, armL: 10, armR: 10, face: { name: t < tMissing + 0.6 ? 'shocked' : 'sad', eyes: { look: [0.8, 0.2] }, fx: t > tMissing + 0.9 ? ['sweat'] : [] }, shadow: false });
  wld += glassMug(1060, 770, 1.15, level, t, broke);
  // the 70% line
  if (t > tMissing) wld += S.path(`M880 ${f(770 - 300 * 1.15)} L1240 ${f(770 - 300 * 1.15)}`, { stroke: '#E2233B', 'stroke-width': 6, 'stroke-dasharray': '18 12' }) + TS('-30%', 1330, 770 - 300 * 1.15 + 20, 64, '#E2233B');
  // giant hand + straw
  const down = ease.out(seg(t, c20, c20 + 0.5)) * (1 - ease.in(seg(t, tMissing + 0.5, tMissing + 1.0)));
  const hy = lerp(-420, 240, down);
  if (down > 0) {
    const sx = 1090;
    let straw = S.rect(sx - 16, hy - 60, 32, 520 + 40, 12, ol('#FFFFFF', 6));
    for (let i = 0; i < 6; i++) straw += S.rect(sx - 14, hy - 40 + i * 90, 28, 40, 0, FILL('#E2233B'));
    if (t > tThirty10 && t < tMissing + 0.4) for (let i = 0; i < 6; i++) { const a = frac(t * 3 + i / 6); straw += S.ellipse(sx, hy + 480 - a * 520, 9, 14, FILL('#7A4A26')); }
    wld += straw + giantArm(sx + 20, hy + 40, 280, -6);
  }
  let o = view(cam, wld, 1);
  if (down > 0) o += S.rect(0, 0, W, H, 0, FILL('#140C2A', 0.25 * down));
  o += bang('SLUUURP!', 1500, 220, seg(t, tThirty10, tThirty10 + 0.15) * (1 - seg(t, tMissing + 0.4, tMissing + 0.6)), 100, 8, '#7CFF6B');
  return o;
}
function shotBestCoffee(t) {
  const cam = camKeys(t, [[c21, { zoom: 1.0, x: 0, y: 0 }], [c22, { zoom: 1.12, x: 0, y: -20 }]]);
  let wld = cafeWorld(t);
  // sip before and after the line; the mug drops so his mouth shows while he talks
  const sip = 1 - ease.inOut(seg(t, A[11].a - 0.25, A[11].a + 0.05)) + ease.inOut(seg(t, A[11].b + 0.05, A[11].b + 0.35));
  const mb = lerp(-390, -530, clamp(sip, 0, 1));
  const mug = glassMug(0, mb, 0.5, 0.62, t, 0.3) + S.rect(-128, mb - 120, 64, 96, 22, ol('#E0A985', 6)) + S.rect(64, mb - 120, 64, 96, 22, ol('#E0A985', 6));
  let tears = '';
  for (let i = 0; i < 6; i++) { const a = frac(t * 1.6 + i / 6); const sx = i % 2 ? 70 : -70; tears += S.ellipse(sx * (1 + a * 1.4), -620 + a * 200, 12, 18, ol('#7CCBFF', 3)); }
  wld += actor('dad', t, { x: 960, y: 1900, s: 1.65, turn: 0.1, armL: 6, armR: 6, face: { name: 'crying', mouth: sip > 0.5 ? 'line' : undefined }, props: [{ svg: tears + mug, layer: 'front' }], shadow: false }, { arms: false, energy: 0.5 });
  let o = view(cam, wld, 1);
  o += K.sparkles([[420, 260, 30], [1500, 300, 26], [1380, 160, 20]], t);
  o += C.musicNotes(t, 1460, 520);
  return o;
}
// ---------------------------------------------------------------- 22–23 · Breaking news in Ty's living room
function chipCost(t) {
  const u = seg(t, c22 + 0.2, tReading + 0.3);
  return Math.round(12 * Math.pow(10, 6.9 * u * u));
}
function chipStudio(t, close) {
  const alarm = t > tExp12;
  let inset = TF('THIS NEWS COSTS', 440, -320, 38, '#FFFFFF');
  const v = chipCost(t).toLocaleString('en-US');
  inset += K.shaken(t, tExp12, K.robuxText(440, -180, v, alarm ? 74 : 64, alarm && Math.floor(t * 8) % 2 ? '#FF5A5A' : '#FFE14D'), 0.4, 10);
  inset += TS(alarm ? '▲▲▲' : '▲', 440, -110, 40, '#FF5A5A');
  const papers = close ? Array.from({ length: 6 }, (_, i) => { const a = frac(t * 0.6 + i / 6); return S.g(S.rect(-40, -54, 80, 108, 4, ol('#FFFFFF', 4)) + S.path('M-24 -30 L24 -30 M-24 -10 L24 -10 M-24 10 L10 10', ln(3, '#9AA0AE')), `translate(${f(-600 + i * 230 + Math.sin(t * 2 + i) * 60)} ${f(-500 + a * 1000)}) rotate(${f(a * 400 + i * 50)})`); }).join('') : '';
  const chip = actor('anchor', t, { x: -230, y: 770, s: 1.0, armL: 150 + 20 * Math.sin(t * 9), armR: 140 + 20 * Math.sin(t * 9 + 1), face: { name: alarm ? 'scream' : 'scared' } }, { arms: false });
  return newsStudio(t, { inset, actor: chip }) + papers;
}
function paywall(t) {
  const k = ease.out(seg(t, tReading + 0.15, tReading + 0.45));
  if (k <= 0) return '';
  let o = S.rect(-800, -450 - 900 * (1 - k), 1600, 900, 0, FILL('#151124', 0.94));
  const y = -900 * (1 - k);
  o += S.rect(-140, y - 260, 280, 220, 40, ol('#FFD21F', 9)) + S.path(`M-80 ${y - 260} L-80 ${y - 320} Q0 ${y - 420} 80 ${y - 320} L80 ${y - 260}`, ln(26, '#151515')) + S.path(`M-80 ${y - 260} L-80 ${y - 320} Q0 ${y - 420} 80 ${y - 320} L80 ${y - 260}`, ln(14, '#C9CED8'));
  o += TS('PAY TO KEEP WATCHING', 0, y + 50, 74, '#FFFFFF', { 'stroke-width': 0 }) + K.robuxText(0, y + 160, '99,999,999', 80, '#FFE14D');
  return o;
}
function shotLivingRoom(t) {
  const cam = camKeys(t, [[c22, at(960, 580, 1.0)], [c23, at(960, 470, 1.35)]]);
  let wld = livingRoom(t, chipStudio(t, false), 'PRICES UP 1000% EVERY HOUR · BREAD NOW 5,000 ROBUX · GUM 1,000,000 ROBUX · ', 0.42);
  wld += ty(t, 760, 1150, 0.62, { view: 'back', armL: 10, armR: 10, headRot: 4 * Math.sin(t * 1.5), shadow: false }, { arms: false });
  wld += actor('mom', t, { x: 1150, y: 1150, s: 0.64, view: 'back', armL: 30, armR: 10, headRot: -3, shadow: false });
  wld += couchBack();
  return view(cam, wld, 1);
}
function shotTV(t) {
  const cam = camKeys(t, [[c23, { zoom: 1.0, x: 0, y: 0 }], [tExp12 - 0.05, { zoom: 1.04, x: 0, y: 0 }], [tExp12 + 0.1, { zoom: 1.2, x: 120, y: -60 }], [c24, { zoom: 1.24, x: 130, y: -60 }]]);
  shakeAll(cam, t, [[tExp12, 0.5, 14]]);
  let wld = S.rect(-400, -400, 2720, 1880, 0, FILL('url(#s08diam)'));
  wld += K.tv(960, 500, 0.95, chipStudio(t, true) + paywall(t), 'BREAKING: PRICES UP · THIS TICKER NOW COSTS 40,000 ROBUX · STAY CALM · ', t);
  let o = view(cam, wld, 1);
  if (t > A[12].b) o += C.staticNoise(t, 0.85 * seg(t, A[12].b + 0.2, c24));
  return o;
}
// ---------------------------------------------------------------- 24–25 · Mia: fedora worth ZERO, a moon for sale
function shotFedora(t) {
  const cam = camKeys(t, [[c24, at(960, 560, 1.0)], [tZero - 0.05, at(950, 570, 1.06)], [tZero + 0.1, at(920, 600, 1.6)], [c25, at(920, 600, 1.65)]]);
  shakeAll(cam, t, [[tZero, 0.5, 20]]);
  let wld = S.rect(-400, -400, 2720, 1880, 0, FILL('url(#s08hats)')) + S.rect(-400, 860, 2720, 600, 0, FILL('#B79BE8'));
  const grey = seg(t, tZero - 0.1, tZero + 0.3);
  const armR = 135 + 6 * Math.sin(t * 20) * grey;
  const [hx, hy] = AC.hand(armR, 1);
  wld += actor('mia', t, { x: 840, y: 1180, s: 0.72, turn: 0.15, armR, armL: 30, face: { name: 'scream' }, props: [{ svg: fedora(hx + 30, hy - 70, 1.5, 10, grey, t), layer: 'front' }] }, { arms: false });
  // crash chart + price
  const pts = Array.from({ length: 30 }, (_, i) => { const u = i / 29; return [u, u < 0.3 ? 0.85 + 0.05 * Math.sin(u * 40) : Math.max(0.02, 0.85 - (u - 0.3) * 1.5)]; });
  wld += K.chart(1180, 140, 560, 300, pts, seg(t, c24 + 0.1, tZero), '#FF3B5C', '');
  wld += K.shaken(t, tZero, priceTagBig(1460, 560, t < tZero ? '2,000,000' : '0', 1.0, -6, t < tZero ? '#FFE14D' : '#C9CED8'), 0.4, 12);
  let o = view(cam, wld, 1);
  o += bang('ZERO!', 1480, 300, seg(t, tZero + 0.02, tZero + 0.16), 140, -8, '#FF5A5A');
  return o;
}
function shotMoon(t) {
  const cam = camKeys(t, [[c25, { zoom: 1.0, x: 0, y: 0 }], [tMoon - 0.05, { zoom: 1.04, x: 0, y: 0 }], [tMoon + 0.1, { zoom: 1.4, x: 160, y: -80 }], [c26, { zoom: 1.44, x: 160, y: -80 }]]);
  let wld = S.rect(-400, -400, 2720, 1880, 0, FILL('url(#s08night)'));
  for (let i = 0; i < 40; i++) wld += S.circle(hash(i) * 2400 - 200, hash(i * 3) * 900, 2 + 3 * hash(i * 7), FILL('#FFFFFF', 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i))));
  wld += moon(1140, 430, 270, t);
  wld += woodSign('FOR SALE', 1060, 120, 1.0, -8, 60);
  const tw = seg(t, c25, c26);
  wld += tumbleweed(lerp(700, 1700, tw), 560 + Math.abs(Math.sin(tw * 12)) * -60, 50, tw * 900);
  // rooftop with Mia
  wld += S.rect(-400, 900, 1100, 400, 0, ol('#3A2E5A', 6)) + S.rect(-400, 890, 1100, 24, 6, ol('#5A4A8A', 5));
  wld += actor('mia', t, { x: 330, y: 1000, s: 0.42, turn: 0.4, armR: 150 + 10 * Math.sin(t * 8), armL: 20, face: { name: 'scream' }, props: [{ svg: S.g(woodSign('MOON 4 SALE', 0, 0, 1, 0, 48, '#2E7BFF'), 'translate(250 -1000) scale(0.9)'), layer: 'front' }] }, { arms: false });
  let o = view(cam, wld, 1);
  o += TF('chirp', 1650, 900, 40, '#BFE8FF', { opacity: f(0.6 * Math.abs(Math.sin(t * 5))) }) + TF('chirp', 1760, 840, 34, '#BFE8FF', { opacity: f(0.6 * Math.abs(Math.sin(t * 5 + 1))) });
  return o;
}
// ---------------------------------------------------------------- 26–27 · 3,000,000 Robux buys ONE sandwich
function subWorld(t) {
  let o = S.rect(-500, -500, 2920, 2080, 0, FILL('#FFE38A')) + S.rect(-500, -500, 2920, 2080, 0, FILL('url(#quilt)', 0.5));
  o += S.rect(100, 170, 620, 110, 24, ol('#3BD16F', 8)) + TS('SUB HUB', 410, 252, 80, '#FFFFFF', { 'stroke-width': 0 });
  o += S.rect(250, 320, 320, 170, 16, ol('#FFFFFF', 7));
  o += S.rect(1220, 240, 560, 220, 20, ol('#2A2A33', 8)) + TF('SANDWICH', 1500, 310, 46, '#FFFFFF') + K.robuxText(1500, 400, '3,000,000', 54, '#FFE14D');
  o += sandwich(410, 420, 0.7, -6);
  return o;
}
function shotSandwich(t) {
  const close = t >= tSand - 0.05;
  const cam = close ? camKeys(t, [[tSand - 0.05, at(580, 720, 1.75)], [c28, at(580, 715, 1.85)]])
    : camKeys(t, [[c26, at(960, 560, 1.0)], [c27, at(940, 580, 1.06)], [tSand - 0.06, at(900, 600, 1.12)]]);
  let wld = subWorld(t);
  const drain = seg(t, w(14, 'bought') - 0.05, w(14, 'me') + 0.3);
  wld += K.draw.kid(11, { x: 1380, y: 1080, s: 0.6, turn: -0.4, armL: t > tSand - 0.4 ? 70 : 15, armR: 10, face: { name: 'happy' }, props: [{ svg: capHat('#3BD16F'), layer: 'front' }], shadow: false });
  wld += S.rect(-500, 760, 2920, 600, 0, ol('#3BD16F', 8)) + S.rect(-500, 740, 2920, 40, 10, ol('#FFFFFF', 7));
  wld += S.rect(1100, 600, 260, 160, 20, ol('#3A3F55', 7)) + S.rect(1130, 620, 200, 60, 8, FILL('#9FFFA8'));
  // the sacks on a hand truck
  const sq = 1 - 0.7 * drain;
  let sacks = S.path('M-160 40 L-160 -420 M-160 40 L160 40', ln(14, '#5A6070')) + S.circle(-120, 60, 30, ol('#2B2F3A', 6));
  sacks += coinSack(-60, 30, 1.1, sq) + coinSack(90, 30, 1.0, sq) + coinSack(20, 30 - 190 * sq, 0.95, sq);
  const push = ease.out(seg(t, c26, c26 + 0.6));
  wld += S.g(sacks, tf(lerp(620, 800, push), 1000, 1));
  // coins vacuum into the register
  if (drain > 0 && drain < 1) for (let i = 0; i < 14; i++) { const a = frac(t * 2.2 + i / 14); wld += coin(lerp(820, 1230, a), lerp(820, 640, a) - Math.sin(a * Math.PI) * 160, 22, i * 30, t * 10 + i); }
  const armR = close ? 105 : 20;
  const [hx, hy] = AC.hand(armR, 1);
  const handed = t > tSand - 0.05;
  if (!handed && t > tSand - 0.45) wld += sandwich(lerp(1280, 1050, seg(t, tSand - 0.45, tSand - 0.1)), 700, 0.5);
  wld += ty(t, 430, 1240, 0.72, { turn: 0.35, armR, armL: close ? 20 : 30, face: { name: close ? 'deadpan' : 'determined' }, props: handed ? [{ svg: sandwich(hx + 60, hy - 30, 0.55, -8), layer: 'front' }] : [] }, { arms: false });
  let o = view(cam, wld, 1);
  o += K.counter(960, 90, 3000000 * (1 - drain), 1.1, drain > 0.9 ? '#FF5A5A' : '#3BD16F');
  if (close) o += K.sparkles([[toScreen(cam, 760, 760)[0], toScreen(cam, 760, 760)[1], 40]], t) + bang('ONE.', 1450, 300, pop(t, tSand, 0.2), 140, -6, '#FFFFFF');
  o += C.whiteFlash(0.4 * bump(t, tSand - 0.1, tSand + 0.05));
  return o;
}
// ---------------------------------------------------------------- 28–29 · the gold toothbrush nobody wants
function stand() {
  let o = S.path('M-300 0 L-280 -200 L280 -200 L300 0 Z', ol('#C9945A', 8)) + S.rect(-320, -228, 640, 40, 10, ol('#B07A42', 7));
  o += TF('THIS SIDE UP ↑', 0, -90, 34, '#7A4A1E') + S.path('M-240 -30 L240 -30', ln(6, '#A87442'));
  return o;
}
function saleSign(signTxt, crossed, k) {
  let sg = S.path('M0 90 L0 330', ln(18, '#151515')) + S.path('M0 90 L0 330', ln(10, '#8A5A34'));
  sg += S.rect(-230, -110, 460, 210, 16, ol('#FFFFFF', 7)) + TS('SALE!', 0, -40, 72, '#E2233B', { 'stroke-width': 0 });
  sg += TF('GOLD TOOTHBRUSH', 0, 10, 34, '#2A1640');
  sg += K.robuxText(0, 74, signTxt, 50, signTxt === 'FREE' ? '#E2233B' : '#2A1640');
  if (crossed) sg += S.path(`M-150 ${50} L${-150 + 300 * k} 58`, ln(9, '#E2233B'));
  return sg;
}
function signText(t) { return t < tUsed - 0.1 ? (t < c29 + 0.55 ? '1,000,000' : '1,000') : 'FREE'; }
function signCross(t) { return t < c29 + 0.55 ? seg(t, c29 + 0.3, c29 + 0.48) : t < tUsed - 0.1 ? seg(t, c29 + 0.75, c29 + 0.9) : 0; }
function shotToothbrush(t) {
  const near = t >= c29;
  const cam = near ? camKeys(t, [[c29, at(1060, 640, 1.35)], [c30, at(1060, 630, 1.45)]]) : camKeys(t, [[c28, at(980, 560, 1.0)], [c29, at(990, 570, 1.06)]]);
  let o = street(t, cam, { grey: 0.35 });
  let mid = '';
  // passers-by behind the stand, nobody stops
  for (let i = 0; i < 3; i++) {
    const x = 2300 - (((t - c28) * 260 + i * 760) % 2900);
    mid += kidWalk(i * 3 + 2, t, x, 880, 0.42, false, i, { volume: false, face: { name: 'neutral' } });
  }
  const sad = seg(t, tUsed, tUsed + 0.6);
  const armR = 150 - 60 * sad + 6 * Math.sin(t * 6) * (1 - sad);
  const [hx, hy] = AC.hand(armR, 1);
  const [lx, ly] = AC.hand(68, -1);
  mid += ty(t, 1040, 1060, 0.62, { armR, armL: 68, bodyY: 16 * sad, face: { name: sad > 0.5 ? 'sad' : 'happy' }, props: [{ svg: toothbrush(hx + 10, hy - 50, 1.9, armR - 160, t), layer: 'front' }, { svg: sandwich(lx - 10, ly - 30, 0.5, 8), layer: 'front' }] }, { arms: false });
  mid += S.g(stand(), 'translate(1040 1080)');
  mid += S.g(saleSign(signText(t), signCross(t) > 0, signCross(t)), `translate(640 610) rotate(${f(-4 + Math.sin(t * 1.5))})`);
  // one kid stops, peeks, makes a face, walks off the way he came
  if (near) {
    const u = seg(t, c29, c30);
    const inS = clamp(u / 0.22, 0, 1), outS = clamp((u - 0.62) / 0.38, 0, 1);
    const x = lerp(2200, 1480, ease.out(inS)) + 900 * ease.in(outS);
    const stopped = inS >= 1 && outS <= 0;
    mid += K.draw.kid(7, { x, y: 1070, s: 0.6, view: stopped ? 'front' : 'side', flip: outS > 0, turn: -0.5, ...(stopped ? {} : AC.walk(t * 7)), face: { name: u > 0.3 ? 'yuck' : 'neutral', eyes: { look: [-0.8, 0] } } });
  }
  if (t > tUsed - 0.2) mid += tumbleweed(lerp(2100, -200, seg(t, tUsed - 0.2, c30 + 0.6)), 1010 - Math.abs(Math.sin(t * 8)) * 60, 48, -t * 500);
  o += view(cam, mid, 1);
  return o;
}
// ---------------------------------------------------------------- 30–32 · MARKETPLACE FEE: the giant bites the sandwich
function lowCity(t, base, grey = 1, h0 = 260, h1 = 500) {
  let o = '';
  for (let i = 0; i < 9; i++) {
    const x = -200 + i * 270, h = h0 + hash(i * 3.3) * (h1 - h0), wd = 230;
    const [wall, trim] = SHOPCOL[i % 6];
    o += S.rect(x, base - h, wd, h + 400, 8, ol(wall, 6)) + S.rect(x + 14, base - h + 20, wd - 28, h - 20, 0, FILL('url(#s08bwin)')) + S.rect(x - 10, base - h - 10, wd + 20, 28, 8, ol(trim, 6));
    if (grey) o += S.rect(x - 13, base - h - 13, wd + 26, h + 420, 8, FILL('#2A2244', 0.28 * grey));
  }
  return o;
}
function shotLoom(t) {
  const cam = camKeys(t, [[c30, { zoom: 1.0, x: 0, y: 0 }], [c31, { zoom: 1.1, x: 0, y: -30 }]]);
  shakeAll(cam, t, [[A[16].a, 0.35, 14], [A[16].a + 0.45, 0.35, 14]]);
  const u = seg(t, c30, c31);
  let o = S.rect(-400, -400, 2720, 1880, 0, FILL('url(#s08dusk)'));
  const gs = lerp(2.5, 2.95, ease.out(u));
  let wld = actor('thirty', t, { x: 1000, y: 1784 * (gs / 2.6) - lerp(170, 120, u), s: gs, turn: -0.1, armL: 30, armR: 40, headRot: -6 * Math.sin(t * 2), face: { name: 'joy' } });
  wld += lowCity(t, 980, 1, 180, 360);
  wld += S.rect(-400, 980, 2720, 400, 0, FILL('#4A4560'));
  const [hx, hy] = AC.hand(120, 1);
  wld += ty(t, 900, 1040, 0.38, { armR: 120, armL: 10, headRot: -8, face: { name: 'scared', eyes: { look: [0.2, -1] } }, props: [{ svg: sandwich(hx + 30, hy - 30, 0.55, -10), layer: 'front' }] }, { arms: false });
  o += view(cam, wld, 1);
  // the shadow sweeps over
  o += S.rect(0, -1200 + 1700 * ease.out(seg(t, c30 - 0.1, c30 + 0.6)), W, 1200, 0, FILL('url(#s08topShadow)'));
  o += bang('MARKETPLACE...', 1420, 300, seg(t, A[16].a, A[16].a + 0.15), 96, -6, '#7CFF6B');
  return o;
}
function tyArmFromBottom(x, y, rot, holding) {
  let o = S.rect(-80, 0, 160, 900, 20, ol('#F2B53A', 9)) + S.rect(-80, 0, 160, 40, 10, ol('#D9962A', 7)) + S.rect(-70, -120, 140, 130, 30, ol('#E9B38B', 9));
  return S.g(o + holding, tf(x, y, 1, rot));
}
function shotChomp(t) {
  const bite = t > tFee + 0.02;
  const cam = { zoom: 1.0, x: 0, y: 0 };
  shakeAll(cam, t, [[tFee, 0.6, 26]]);
  let o = S.rect(0, 0, W, H, 0, FILL('url(#s08dusk)'));
  const dip = bump(t, tFee - 0.12, tFee + 0.14);
  const fy = 2950 + 260 * dip - 120 * seg(t, tFee + 0.2, c32);
  const chew = bite && Math.floor(t * 8) % 2;
  const giant = actor('thirty', t, { x: 1150, y: fy, s: 5.4, turn: 0, armL: 10, armR: 10, face: { name: 'joy', mouth: t < tFee - 0.02 ? 'scream' : dip > 0.3 ? 'teeth' : chew ? 'O' : 'bigGrin' }, shadow: false });
  const sand = tyArmFromBottom(780, 760, 18, sandwich(60, -170, 1.4, -18, bite ? 1 : 0));
  let wld = '';
  const front = t > tFee - 0.04 && t < tFee + 0.12;
  wld += front ? sand + giant : giant + sand;
  if (bite) {
    const k = t - tFee;
    for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (hash(i) - 0.5) * 2.4, v = 600 + 500 * hash(i * 3); wld += S.rect(1000 + Math.cos(a) * v * k, 560 + Math.sin(a) * v * k + 1600 * k * k, 18, 14, 4, FILL(['#EBB46C', '#5CCB4A', '#FF5A5A'][i % 3])); }
  }
  o += view(cam, wld, 1);
  o += bang('CHOMP!', 1450, 820, seg(t, tFee, tFee + 0.12), 150, -10, '#FFD21F');
  o += C.whiteFlash(0.5 * bump(t, tFee - 0.02, tFee + 0.1));
  return o;
}
function shotHalf(t) {
  const cam = camKeys(t, [[c32, at(960, 620, 1.0)], [A[17].a - 0.02, at(960, 620, 1.0)], [A[17].a + 0.1, at(930, 610, 1.3)], [c33, at(930, 610, 1.34)]]);
  shakeAll(cam, t, [[A[17].a, 0.5, 16], [A[17].a + 0.85, 0.4, 18]]);
  let wld = S.rect(-400, -400, 2720, 1880, 0, FILL('url(#s08dusk)')) + lowCity(t, 980);
  // giant shoe stomping off in the background
  const sx = lerp(1700, 2300, seg(t, c32, c33));
  wld += S.rect(sx - 260, 700 - 300 * bump(t, A[17].a + 0.4, A[17].a + 0.85), 520, 300, 60, ol('#1A1A1E', 10)) + S.rect(sx - 200, -400, 400, 1100 - 300 * bump(t, A[17].a + 0.4, A[17].a + 0.85), 0, ol('#2B2F3A', 10));
  const armR = 145;
  const [hx, hy] = AC.hand(armR, 1);
  wld += ty(t, 800, 1700, 1.35, { armR: armR + 4 * Math.sin(t * 25), armL: 10, face: { name: 'scream', fx: ['tears'] }, props: [{ svg: sandwich(hx - 20, hy - 60, 0.8, 0, 1), layer: 'front' }] }, { arms: false });
  let o = view(cam, wld, 1);
  o += bang('HALF?!', 1460, 260, seg(t, A[17].a, A[17].a + 0.14), 150, 8, '#FF5A5A');
  return o;
}
// ---------------------------------------------------------------- 33–35 · the butler quits, the limo is towed
function errorDialog(k) {
  if (k <= 0) return '';
  let o = S.rect(-360, -150, 720, 300, 28, ol('#FFFFFF', 9)) + S.rect(-360, -150, 720, 80, 28, ol('#E2233B', 9)) + S.rect(-354, -90, 708, 20, 0, FILL('#E2233B'));
  o += TS('✕  PAYMENT FAILED', 0, -92, 52, '#FFFFFF', { 'stroke-width': 0 }) + TF('Insufficient Robux value.', 0, 10, 40, '#2A1640') + S.rect(-110, 50, 220, 70, 20, ol('#C9CED8', 6)) + TF('OK', 0, 98, 40, '#2A1640');
  return S.g(o, `translate(1480 230) scale(${f(0.78 * ease.outBack(clamp(k, 0, 1)))}) rotate(3)`);
}
const butlerError = (t) => S.rect(-118, -850, 236, 228, 36, ol('#3A0612', 7)) + TS('✕', -50, -705, 80, '#FF3B5C', { 'stroke-width': 0 }) + TS('✕', 50, -705, 80, '#FF3B5C', { 'stroke-width': 0 }) + S.rect(-50, -680, 100, 12, 6, FILL('#FF3B5C', Math.floor(t * 6) % 2 ? 1 : 0.5));
const suitcase = () => S.rect(-70, -40, 140, 110, 14, ol('#8A5A34', 7)) + S.path('M-30 -40 L-30 -70 L30 -70 L30 -40', ln(9)) + S.rect(-70, 0, 140, 12, 0, FILL('#5A3A22'));
function neighborHouse(x, base) {
  let o = S.rect(x, base - 330, 520, 330, 10, ol('#FFD1E0', 7)) + S.path(`M${x - 40} ${base - 320} L${x + 260} ${base - 520} L${x + 560} ${base - 320} Z`, ol('#C8553D', 7));
  o += S.rect(x + 200, base - 190, 110, 190, 10, ol('#7A3B52', 6)) + S.rect(x + 50, base - 260, 110, 90, 10, ol('#CDEBFF', 5)) + S.rect(x + 360, base - 260, 110, 90, 10, ol('#CDEBFF', 5));
  return o;
}
function shotButler(t) {
  const leave = t >= c34;
  const cam = leave ? camKeys(t, [[c34, at(1000, 680, 1.0)], [c35, at(1220, 680, 1.0)]]) : camKeys(t, [[c33, at(950, 690, 1.3)], [tFailed - 0.05, at(980, 680, 1.35)], [tFailed + 0.1, at(1100, 650, 1.6)], [c34, at(1100, 650, 1.62)]]);
  shakeAll(cam, t, [[tFailed, 0.4, 10]]);
  let o = overcastYard(t);
  let bg = villaGrounds(t);
  bg += neighborHouse(1960, 760);
  o += view(cam, bg, 0.9);
  let mid = '';
  const err = t > tFailed - 0.1;
  if (!leave) {
    mid += actor('butler', t, { x: 1180, y: 1000, s: 0.6, turn: -0.3, armL: 20, armR: 10, props: err ? [{ svg: butlerError(t), layer: 'front' }] : [] });
    mid += ty(t, 720, 1010, 0.58, { turn: 0.4, armR: 30, armL: 10, face: { name: err ? 'shocked' : 'nervous' } });
  } else {
    const u = seg(t, c34, c35 + 0.6);
    const bx = lerp(1200, 2000, u);
    mid += actor('butler', t, { x: bx, y: 1000, s: 0.6, view: 'side', flip: true, ...AC.walk(t * 6, 0.8), armR: 0, props: [{ svg: S.g(suitcase(), 'translate(0 -230)'), layer: 'front' }] });
    const reach = seg(t, tQuit - 0.3, tQuit);
    mid += ty(t, 780, 1010, 0.58, { turn: 0.5, armR: 90 * (1 - reach) + 20, armL: 10, bodyY: 14 * reach, face: { name: 'sad' } });
  }
  o += view(cam, mid, 1);
  o += errorDialog(seg(t, tFailed - 0.05, tFailed + 0.3) * (leave ? 1 - seg(t, c34, c34 + 0.25) : 1));
  return o;
}
function shotLimo(t) {
  const u = seg(t, c35, c36);
  const cam = { zoom: 1.0, x: lerp(200, -300, u), y: 120 };
  let o = overcastYard(t) + view(cam, villaGrounds(t), 0.8);
  const x = lerp(2200, -1700, u);
  let mid = S.rect(-1200, 980, 4400, 400, 0, FILL('#B9B2AA', 0));
  // ball-pit balls spill out the back
  for (let i = 0; i < 10; i++) {
    const age = u * 2.0 - i * 0.12;
    if (age < 0) continue;
    const bx = x + 1100 + age * 260 + i * 10, by = 940 - Math.abs(Math.sin(age * 6 + i)) * 160 / (1 + age * 2);
    mid += S.circle(bx, by, 22, ol(['#FF5A5A', '#34C3FF', '#FFD21F', '#3BD16F'][i % 4], 5));
  }
  mid += S.g(limo(0, 0, 0.75, t), `translate(${f(x + 830)} 1000) rotate(5)`);
  mid += S.path(`M${f(x + 234)} 742 L${f(x + 418)} 880`, { stroke: '#3A3F55', 'stroke-width': 9, 'stroke-dasharray': '16 8' });
  mid += towTruck(x, 1000, 0.9, t);
  // Ty chases
  const run = seg(t, c35 + 0.6, tTaken + 0.5);
  const tx = lerp(2300, 1250, ease.out(run));
  mid += ty(t, tx, 1010, 0.5, { view: 'side', ...(run < 1 ? AC.run(t * 13) : {}), armL: run < 1 ? 70 : 80, lean: run < 1 ? 10 : 0, face: { name: 'scared' } }, { arms: false });
  o += view(cam, mid, 1);
  o += bang('TOWED!', 960, 260, pop(t, tTaken, 0.2), 110, -6, '#FFD21F');
  return o;
}
// ---------------------------------------------------------------- 36–38 · the shadow; the giant lifts the mansion
function shotShadow(t) {
  const cam = camKeys(t, [[c36, { zoom: 1.0, x: 0, y: 60 }], [c37, { zoom: 1.12, x: 0, y: 100 }]]);
  let o = overcastYard(t) + view(cam, villaGrounds(t), 0.9);
  const look = ease.inOut(seg(t, c36 + 0.6, c37));
  o += view(cam, ty(t, 960, 1010, 0.4, { view: look > 0.5 ? 'front' : 'back', headRot: 0, face: { name: 'scared', eyes: { look: [0, -1] } } }), 1);
  const sw = ease.inOut(seg(t, c36 + 0.2, c37 + 0.05));
  const sx = lerp(2100, -300, sw);
  let sh = S.rect(sx, -100, 3000, 1400, 0, FILL('url(#s08shadow)'));
  sh += S.path(`M${f(sx)} 1300 L${f(sx)} 300 Q${f(sx + 60)} 120 ${f(sx + 260)} 100 L${f(sx + 300)} -40 L${f(sx + 360)} 100 L${f(sx + 640)} 100 L${f(sx + 700)} -40 L${f(sx + 740)} 100 Q${f(sx + 900)} 120 ${f(sx + 960)} 300 L${f(sx + 960)} 1300 Z`, FILL('#140C2A', 0.35));
  o += sh;
  return o;
}
function shotLift(t) {
  const lift = ease.in(seg(t, tMe - 0.2, tMe + 0.35));
  const cam = camKeys(t, [[c37, { zoom: 1.0, x: 0, y: 40 }], [c38, { zoom: 1.0, x: 0, y: -40 }]]);
  shakeAll(cam, t, [[tMe - 0.1, 0.8, 20]]);
  let o = overcastYard(t) + S.rect(0, 0, W, H, 0, FILL('#140C2A', 0.35));
  let wld = palm(220, 760, 1, t * 3) + palm(1720, 770, 0.9, t * 3) + S.rect(-600, 740, 3200, 500, 0, FILL('#6E8E60')) + S.rect(380, 740, 1160, 30, 6, ol('#9A948A', 5));
  wld += S.g(villa(t), `translate(0 ${f(-1500 * lift)}) rotate(${f(-4 * lift)} 960 400)`);
  const hy = lerp(-200, 180, ease.out(seg(t, c37, c37 + 0.35))) - 1500 * lift;
  wld += giantArm(960, hy, 300, 0);
  // dust where the house stood
  if (lift > 0.1) wld += C.dust(400, 760, tMe, t) + C.dust(1300, 760, tMe + 0.05, t) + C.dust(800, 760, tMe + 0.1, t);
  wld += ty(t, 960, 1000, 0.42, { armL: 160, armR: 160, face: { name: 'scream' }, lift: 30 * bump(t, tMe, tMe + 0.5) }, { arms: false });
  o += view(cam, wld, 1);
  o += bang('MINE!', 1420, 300, pop(t, tMe, 0.2), 120, 8, '#7CFF6B');
  return o;
}
function giantWithVilla(t, x, y, s, opts = {}) {
  const raise = opts.raise ?? 1;
  const aR = lerp(30, 122, raise);
  const [hx, hy] = AC.hand(aR, 1);
  const vill = S.g(villa(t), `translate(${f(hx + 70)} ${f(hy + 10)}) rotate(${f(-3 + 3 * Math.sin(t * 2))}) scale(0.3) translate(-960 -760)`);
  const aL = opts.armL ?? 150 + 18 * Math.sin(t * 6);
  return actor('thirty', t, { x, y, s, armL: aL, armR: aR, face: opts.face || { name: 'joy' }, props: [{ svg: vill, layer: 'front' }], ...(opts.pose || {}) }, { arms: false });
}
function shotGiant(t) {
  const cam = camKeys(t, [[c38, { zoom: 1.0, x: 0, y: 60 }], [tEverything - 0.1, { zoom: 1.05, x: 0, y: 30 }], [tEverything + 0.2, { zoom: 1.2, x: 0, y: -60 }], [c39, { zoom: 1.24, x: 0, y: -70 }]]);
  const stomp1 = tEverything - 0.15, stomp2 = tMine - 0.1;
  shakeAll(cam, t, [[stomp1 + 0.15, 0.5, 24], [stomp2 + 0.15, 0.5, 24], [c38, 0.4, 12]]);
  let o = S.rect(0, 0, W, H, 0, FILL('url(#s08dusk)'));
  const neon = seg(t, tEverything - 0.05, tEverything + 0.1) * (0.85 + 0.15 * Math.sin(t * 30));
  let wld = '';
  if (neon > 0) wld += S.circle(960, 330, 420, FILL('url(#s08neon)', neon)) + S.g(TS('30%', 0, 90, 300, '#7CFF6B', { stroke: '#0E3A12', 'stroke-width': 24 }), 'translate(960 300) rotate(-6)', { opacity: f(neon) });
  const legUp = bump(t, stomp1 - 0.25, stomp1 + 0.15), legUp2 = bump(t, stomp2 - 0.25, stomp2 + 0.15);
  wld += giantWithVilla(t, 960, 1040, 1.3, { face: { name: t < tEverything ? 'joy' : 'angry' }, pose: { legL: 30 * legUp, kneeL: 40 * legUp, legR: -30 * legUp2, kneeR: 40 * legUp2 } });
  wld += lowCity(t, 1060, 0.6);
  for (let i = 0; i < 4; i++) wld += K.E.car(-200 + frac((t - c38) * 0.3 + i / 4) * 2400, 1060, ['#FF5A5A', '#34C3FF', '#FFD21F', '#3BD16F'][i], t, 0.35);
  wld += S.rect(-600, 1050, 3200, 300, 0, FILL('#3A3550'));
  o += view(cam, wld, 1);
  return o;
}
// ---------------------------------------------------------------- 39–40 · 30% of every purchase on Earth → THIRTY TOWER
function thirtyTower(x, base, top, lit, t) {
  let o = S.rect(x - 200, top + 160, 400, base - top - 160, 10, ol('#2E4A52', 8)) + S.rect(x - 186, top + 170, 372, base - top - 170, 0, FILL(lit > 0 ? 'url(#s08twinLit)' : 'url(#s08twin)'));
  o += S.rect(x - 150, top + 40, 300, 140, 10, ol('#355A64', 8)) + S.rect(x - 230, top, 460, 50, 12, ol('#7CFF6B', 8));
  const word = 'THIRTY TOWER';
  for (let i = 0; i < word.length; i++) {
    if (word[i] === ' ') continue;
    const on = lit * (word.length + 2) > i;
    o += S.rect(x + 210, top + 230 + i * 90, 80, 80, 10, ol('#1B2A30', 5)) + T(word[i], x + 250, top + 296 + i * 90, 64, on ? '#7CFF6B' : '#3A4A50');
  }
  if (lit > 0.4) o += S.circle(x, top + 110, 90, FILL('url(#s08neon)')) + TS('30%', x, top + 132, 70, '#7CFF6B', { stroke: '#0E3A12' });
  else o += T('30%', x, top + 132, 70, '#4A6A50');
  return o;
}
function shotEveryPurchase(t) {
  const u = seg(t, c39, c39b);
  const cam = at(lerp(760, 1160, u), 560, 1.0);
  const ph = t * 4.5;
  const steps = [0, 1, 2, 3].map((i) => c39 + (i * Math.PI) / 4.5 - ((c39 * 4.5) % Math.PI) / 4.5 + Math.PI / 9);
  shakeAll(cam, t, steps.map((ts) => [ts, 0.3, 12]));
  let o = S.rect(0, 0, W, H, 0, FILL('url(#s08dusk)'));
  let wld = '';
  const gx = lerp(560, 1500, u);
  wld += actor('thirty', t, { x: gx, y: 1080, s: 1.3, view: 'side', flip: true, ...AC.walk(ph, 0.8), armL: 64, armR: -10, face: { name: 'smug' }, props: [{ svg: S.g(villa(t), 'translate(-250 -360) scale(0.26) translate(-960 -760)'), layer: 'front' }] }, { arms: false });
  wld += lowCity(t, 1080, 0.45, 150, 300);
  // every purchase coughs up a 30% coin that flies into his pocket
  const pk = [gx + 10, 1080 - 1.3 * 0.7 * 360];
  for (let i = 0; i < 10; i++) {
    const bx = -80 + i * 270 + 115, by = 1080 - 150 - hash(i * 3.3) * 150;
    const a = frac(t * 0.8 + i * 0.37);
    const px = lerp(bx, pk[0], a * a), py = lerp(by, pk[1], a) - Math.sin(a * Math.PI) * 260;
    wld += coin(px, py, 24, 0, t * 8 + i);
    if (a < 0.35) wld += S.g(TS('-30%', 0, 0, 56, '#7CFF6B'), `translate(${f(bx)} ${f(by - 40 - a * 140)})`, { opacity: f(1 - a / 0.35) });
  }
  wld += S.rect(-600, 1076, 3200, 300, 0, FILL('#3A3550'));
  o += view(cam, wld, 1);
  return o;
}
function shotPlace(t) {
  const cam = camKeys(t, [[c39b, { zoom: 0.8, x: 0, y: 900 }], [tEarth - 0.25, { zoom: 0.8, x: 0, y: -120 }], [c40, { zoom: 0.85, x: 0, y: -160 }]], ease.inOut);
  shakeAll(cam, t, [[tEarth, 0.5, 18]]);
  let o = S.rect(0, 0, W, H, 0, FILL('url(#s08dusk)'));
  let wld = '';
  for (let i = 0; i < 8; i++) { const x = -500 + i * 400; const h = 700 + hash(i * 7) * 600; if (Math.abs(x - 960) > 300) wld += S.rect(x, 2000 - h, 300, h + 400, 10, ol(['#5A4E86', '#4A5E8A', '#6A4E7E'][i % 3], 6)) + S.rect(x + 14, 2000 - h + 20, 272, h - 20, 0, FILL('url(#s08bwin)')); }
  wld += thirtyTower(960, 2000, 300, 0, t);
  const place = ease.inOut(seg(t, c39b + 0.1, tEarth));
  const vy = lerp(-700, 300, place);
  wld += S.g(villa(t), `translate(960 ${f(vy)}) scale(0.3) translate(-960 -760)`);
  if (t < tEarth + 0.6) wld += giantArm(960, vy - 160 * 0.3 * 2 - 20 - 300 * seg(t, tEarth + 0.1, tEarth + 0.6), 160, 0);
  if (t > tEarth) wld += C.dust(820, 300, tEarth, t) + C.dust(1040, 300, tEarth + 0.05, t);
  o += view(cam, wld, 1);
  o += bang('THUNK!', 1400, 360, pop(t, tEarth, 0.2) * (1 - seg(t, tEarth + 0.6, tEarth + 0.8)), 100, 6, '#7CFF6B');
  return o;
}
function shotSkyline(t) {
  const cam = camKeys(t, [[c40, { zoom: 1.0, x: 0, y: 0 }], [c41, { zoom: 1.08, x: 40, y: -20 }]]);
  let o = S.rect(0, 0, W, H, 0, FILL('url(#s08dusk)'));
  let wld = '';
  for (let i = 0; i < 4; i++) { const x = ((i * 600 + t * 40) % 2600) - 400; wld += S.g(S.ellipse(0, 0, 260, 60, FILL('#2A2048')) + S.ellipse(-100, -40, 140, 60, FILL('#2E2450')) + S.ellipse(120, -50, 160, 70, FILL('#34295A')), tf(x, 120 + (i % 2) * 70, 1.2)); }
  for (let i = 0; i < 14; i++) { const x = -200 + i * 170, h = 180 + hash(i * 3.1) * 260; if (Math.abs(x + 60 - 1240) > 230) wld += S.rect(x, 900 - h, 150, h + 300, 6, ol('#3A2E5A', 5)) + S.rect(x + 12, 900 - h + 14, 126, h - 14, 0, FILL('url(#s08twinLit)')); }
  const lit = seg(t, tTallest - 0.1, tTallest + 0.8);
  wld += S.g(thirtyTower(960, 2000, 300, lit, t) + S.g(villa(t), 'translate(960 300) scale(0.3) translate(-960 -760)'), 'translate(1240 -20) scale(0.6) translate(-960 0)');
  wld += S.rect(-400, 900, 2720, 400, 0, FILL('#1E1838'));
  wld += ty(t, 380, 1010, 0.22, { view: 'back', shadow: false });
  o += view(cam, wld, 1);
  o += K.rain(t, Math.floor(60 * seg(t, tCity - 0.6, c41)), { op: 0.35 });
  const flash = bump(t, tCity + 0.15, tCity + 0.35);
  if (flash > 0) o += S.path('M1500 0 L1440 160 L1500 160 L1420 360 L1560 130 L1490 130 L1560 0 Z', ol('#FFFFFF', 4)) + C.whiteFlash(0.6 * flash);
  o += S.rect(0, 0, W, H, 0, FILL('#000', seg(t, c41 - 0.5, c41)));
  return o;
}
// ---------------------------------------------------------------- 41–46 · rain: the box (matches the cold open) and Pickle's umbrella
function alley() {
  let w = S.rect(-400, -400, 2800, 1900, 0, FILL('url(#s08alley)'));
  for (let y = 80; y < 760; y += 70) for (let x = (y / 70) % 2 ? -60 : 0; x < 2000; x += 160) w += S.rect(x, y, 150, 62, 6, { fill: '#3A2A66', stroke: '#241848', 'stroke-width': 5 });
  w += S.path('M1500 760 L1500 120 Q1500 80 1540 80 L1640 80', ln(20, '#2A2240')) + S.ellipse(1640, 100, 60, 26, ol('#FFE9A8', 6));
  w += S.path('M1640 120 L1380 760 L1900 760 Z', FILL('url(#s08lamp)'));
  w += S.rect(-400, 760, 2800, 600, 0, FILL('#1C1638'));
  for (let i = 0; i < 6; i++) w += S.ellipse(200 + i * 330, 900 + (i % 2) * 60, 120, 18, { fill: '#5A4A9A', opacity: 0.45 });
  return w;
}
const box = (front) => (front
  ? S.path('M760 1000 L1160 1000 L1160 760 L760 760 Z', ol('#C9945A', 8)) + S.path('M760 760 L700 690 M1160 760 L1220 690', ln(10, '#B07A42')) + TF('THIS SIDE UP ↑', 960, 880, 40, '#7A4A1E') + S.path('M800 960 L1120 960', ln(6, '#A87442'))
  : S.path('M760 760 L700 690 L1220 690 L1160 760 Z', ol('#A87442', 8)));
function rainAvoid(t, n, op, shelter) {
  const speed = 1900, len = 46, angle = 12;
  const dx = Math.tan((angle * Math.PI) / 180) * len;
  let o = '';
  for (let i = 0; i < n; i++) {
    const x = hash(i * 1.3) * 2200 - 140 + ((t * speed * Math.tan((angle * Math.PI) / 180)) % 200);
    const y = ((t * speed + hash(i * 7.7) * 1300) % 1300) - 120;
    if (shelter && x > shelter.x0 && x < shelter.x1 && y + len > shelter.y) continue;
    o += S.path(`M${f(x)} ${f(y)} l${f(-dx)} ${len}`, ln(4, '#A9C7FF', op));
  }
  return o;
}
function pickleIn(t, x, y, s, pose = {}, act = {}) {
  return actor('pickle', t, { x, y, s, shadow: false, ...pose }, act);
}
function rainWorld(t, o2 = {}) {
  // o2: {umb: 0..1 umbrella open, pickleX, tyFace, pickleFace, sock}
  let wld = alley() + box(false);
  const sigh = bump(t, B[1].word('box').t0 - 0.1, B[1].word('box').t0 + 0.6);
  const tyFace = o2.tyFace || { name: 'deadpan', ...(sigh > 0.3 ? { eyes: { type: 'closed' } } : {}), ...(t < B[1].a ? { mouth: 'line' } : {}) };
  wld += ty(t, 960, 1010, 0.6, { face: tyFace, armL: 6, armR: 6, bodyY: 10 * sigh, shadow: false, headRot: o2.tyHead || 0 }, { arms: false, energy: 0.3 });
  for (const td of [c41 + 1.0, B[1].word('ended').t0]) {
    const d = seg(t, td, td + 0.45);
    if (d > 0 && d < 1 && !(o2.umb > 0.5)) wld += S.path(`M${960 + 50} ${f(410 + d * 120)} q-10 18 0 26 q10 -8 0 -26 Z`, ol('#9FD8FF', 3));
  }
  wld += box(true);
  if (o2.pickleX !== undefined) {
    const sock = o2.sock || 0;
    const U = umbPts(t, o2);
    wld += pickleIn(t, o2.pickleX, 1030, 0.62, { turn: 0.35, armR: o2.armR, armL: 14 + 10 * sock, legL: 55 * sock, kneeL: 45 * sock, bodyY: -6 * sock, face: o2.pickleFace || { name: 'happy' } });
    if (sock > 0.2) {
      const fx = o2.pickleX - 150, fy = 1030 - 80;
      for (let i = 0; i < 5; i++) { const a = frac(t * 2.2 + i / 5); wld += S.ellipse(fx + (i - 2) * 8, fy + 20 + a * 110, 7, 11, FILL('#9FD8FF', 1 - a)); }
    }
    wld += umbrella(U.hx, U.hy, U.px, U.py, U.wd, o2.umb, '#FFD21F');
    // drips off the canopy edge
    if (o2.umb > 0.8) for (let i = 0; i < 6; i++) { const a = frac(t * 1.7 + i / 6); const ex = i % 2 ? U.r1 : U.r0; wld += S.ellipse(ex[0] + (i % 3 - 1) * 10, ex[1] + 10 + a * 260, 6, 12, FILL('#9FD8FF', 0.8 * (1 - a))); }
  }
  return wld;
}
function umbPts(t, o2) {
  const [hx, hy] = handAt(o2.armR, 1, 0.62 * 0.95, o2.pickleX, 1030);
  const px = 905 + 4 * Math.sin(t * 1.3), py = 392, wd = 300;
  const { Lh, ang } = umbrellaGeo(hx, hy, px, py);
  const a = (ang * Math.PI) / 180;
  const rot = (x, y) => [hx + x * Math.cos(a) - y * Math.sin(a), hy + x * Math.sin(a) + y * Math.cos(a)];
  const w = lerp(24, wd, clamp(o2.umb, 0, 1.2));
  return { hx, hy, px, py, wd, r0: rot(-w, -Lh), r1: rot(w, -Lh) };
}
function shelterFor(cam, o2, t) {
  if (!(o2.umb > 0.6)) return null;
  const U = umbPts(t, o2);
  const [ax, ay] = toScreen(cam, U.r0[0], U.r0[1]);
  const [bx, by] = toScreen(cam, U.r1[0], U.r1[1]);
  return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y: (ay + by) / 2 - 10 };
}
function shotBoxRain(t) {
  const cam = camKeys(t, [[c41, { zoom: 1.0, x: 0, y: 0 }], [c42, { zoom: 1.14, x: 0, y: 50 }]]);
  let o = view(cam, rainWorld(t), 1);
  o += K.rain(t, 160, { op: 0.5 });
  o += S.rect(0, 0, W, H, 0, FILL('#000', 1 - seg(t, c41, c41 + 0.6)));
  return o;
}
function umbState(t) {
  const open = ease.outBack(seg(t, c42 + 0.05, c42 + 0.4));
  return { umb: open, pickleX: 690, armR: 140 };
}
function shotUmbrella(t) {
  const st = umbState(t);
  const cam = camKeys(t, [[c42, at(960, 590, 1.15)], [c42 + 0.55, at(960, 585, 1.15)], [c43, at(860, 580, 1.04)]]);
  const look = ease.inOut(seg(t, c42 + 0.3, c42 + 0.9));
  let o = view(cam, rainWorld(t, { ...st, tyFace: { name: look > 0.5 ? 'amazed' : 'deadpan', eyes: { look: [-0.6 * look, -0.6 * look] }, mouth: 'line' }, tyHead: -4 * look }), 1);
  o += rainAvoid(t, 160, 0.5, shelterFor(cam, st, t));
  if (st.umb > 0.2 && st.umb < 1.3) o += bang('FWUMP!', 700, 220, pop(t, c42 + 0.1, 0.2) * (1 - seg(t, c42 + 0.9, c42 + 1.1)), 70, -6, '#FFD21F');
  return o;
}
function shotTyAshamed(t) {
  const st = umbState(t);
  const cam = camKeys(t, [[c43, at(975, 540, 2.0)], [c44, at(975, 535, 2.12)]]);
  let o = view(cam, rainWorld(t, { ...st, tyFace: { name: 'sad', eyes: { look: [-0.3, 0.6] } }, tyHead: 4 }), 1);
  o += rainAvoid(t, 120, 0.4, shelterFor(cam, st, t));
  return o;
}
function shotPickleClose(t) {
  const st = umbState(t);
  const cam = camKeys(t, [[c44, at(720, 560, 2.0)], [c45, at(720, 555, 2.12)]]);
  const warm = seg(t, wb(4, 'best') - 0.2, wb(4, 'best') + 0.6);
  let o = view(cam, rainWorld(t, { ...st, pickleFace: { name: 'happy', fx: warm > 0.5 ? ['blush'] : [] } }), 1);
  o += rainAvoid(t, 120, 0.4, shelterFor(cam, st, t));
  if (warm > 0) o += S.circle(820, 460, 420, FILL('url(#s08warm)', 0.55 * warm));
  return o;
}
function shotSorry(t) {
  const st = umbState(t);
  const cam = camKeys(t, [[c45, at(965, 545, 2.2)], [c46, at(965, 540, 2.32)]]);
  let o = view(cam, rainWorld(t, { ...st, tyFace: { name: 'sad', eyes: { look: [-0.5, 0.2] }, fx: ['tears'] }, tyHead: 3 }), 1);
  o += rainAvoid(t, 100, 0.35, shelterFor(cam, st, t));
  return o;
}
function shotSock(t) {
  const st = umbState(t);
  const sock = ease.inOut(seg(t, tSock - 0.3, tSock + 0.1)) * (1 - ease.inOut(seg(t, tDrier - 0.6, tDrier - 0.2)));
  const cam = camKeys(t, [[c46, at(850, 640, 1.12)], [tSock - 0.3, at(850, 645, 1.12)], [tSock + 0.2, at(700, 820, 1.5)], [tDrier - 0.6, at(700, 820, 1.5)], [tDrier, at(850, 640, 1.1)], [END, at(850, 630, 1.06)]]);
  const smile = seg(t, tDrier - 0.3, tDrier + 0.3);
  let o = view(cam, rainWorld(t, { ...st, sock, pickleFace: { name: t < tSock ? 'happy' : t < tDrier - 0.6 ? 'sad' : 'happy' }, tyFace: { name: smile > 0.5 ? 'happy' : 'sad', eyes: { look: [-0.7, 0] }, ...(smile > 0.5 ? { mouth: 'smallSmile' } : {}) } }), 1);
  o += rainAvoid(t, 140, 0.45, shelterFor(cam, st, t));
  if (sock > 0.5) o += bang('squish', 560, 760, pop(t, tSock + 0.1, 0.2), 64, -8, '#9FD8FF');
  return o;
}

// ================================================================ router
const SHOTS = [
  [START, shotPerfect], [c02, shotUntil], [c03, shotBakery], [c06, shotMom], [c07, shotWhy], [c08, shotCrowd], [c09, shotPrinter], [c10, shotMoneyBread],
  [c11, shotScale], [c12, shotRocket], [c13, shotMia], [c14, shotSkipMath], [c15, shotUgh], [c16, shotGum], [c17, shotBarrows], [c18, shotAnchorCar],
  [c19, shotPaycheck], [c20, shotStraw], [c21, shotBestCoffee], [c22, shotLivingRoom], [c23, shotTV], [c24, shotFedora], [c25, shotMoon], [c26, shotSandwich],
  [c28, shotToothbrush], [c30, shotLoom], [c31, shotChomp], [c32, shotHalf], [c33, shotButler], [c35, shotLimo], [c36, shotShadow], [c37, shotLift],
  [c38, shotGiant], [c39, shotEveryPurchase], [c39b, shotPlace], [c40, shotSkyline], [c41, shotBoxRain], [c42, shotUmbrella], [c43, shotTyAshamed],
  [c44, shotPickleClose], [c45, shotSorry], [c46, shotSock],
];
// hard cuts that get a quick white whip-flash
const WHIPS = [c03, c09, c10, c11, c13, c14, c17, c18, c19, c20, c22, c24, c25, c26, c28, c30, c32, c33, c35, c38, c39, c39b, c40];
function scene(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  let o = SHOTS[i][1](t);
  for (const tc of WHIPS) if (Math.abs(t - tc) < 0.12) o += S.rect(0, 0, W, H, 0, FILL('#FFFFFF', 0.45 * bump(t, tc - 0.06, tc + 0.1)));
  return o;
}
function look(t) {
  if (t >= c41) return { grade: 'night', vignette: 1 };
  if (t >= c30) return { grade: 'cool', vignette: 1 };
  if (t >= c28) return { grade: 'cool', vignette: 0.85 };
  if (t >= c25 && t < c26) return { grade: 'night', vignette: 0.9 };
  if (t >= c07 && t < c16) return { grade: 'warm', vignette: 0.45 };
  if (t >= c02 && t < c03) return { grade: 'cool', vignette: 1 };
  return { grade: 'warm' };
}
module.exports = { scene, look, DEFS };
