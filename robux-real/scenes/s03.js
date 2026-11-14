// SC 03 · THE NEWS — breaking news in the living room, the AFK PC hits the jackpot upstairs, coins crash through the
// ceiling, the world reacts on TV, Ty surfs a coin wave down the stairs, Mia can't sell her hats, the family balances.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, bang } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const { D } = require('../rig/cast');
const { makeDesign, makeDraw } = require('../rig/r6');
const B = require('./s02');
const { camAt, pop, OUT, stamp, thought, actorD, castIn, miaIn, hat, HAT_KEYS } = B;

const m0 = L('03.0'), m1 = L('03.1'), m2 = L('03.2'), m3 = L('03.3'), m4 = L('03.4'), m5 = L('03.5'), m6 = L('03.6');
const m7 = L('03.7'), m8 = L('03.8'), m9 = L('03.9'), m10 = L('03.10'), m11 = L('03.11'), m12 = L('03.12'), m13 = L('03.13');
const START = K.V.scene('SC 03').start;
const END = K.V.scene('SC 04').start;

// shot starts, all from the voice
const tOn = START, tTv = m0.word('Starting').t0 - 0.12;
const tEq = m1.a - 0.06, tNow = m1.word('right').t0 - 0.12, tJolt = m1.word('now').t0;
const tPush = m2.a - 0.06, tJack = m2.b + 0.05, tCeil = m3.a - 0.45, tMil = m3.a;
const tN1 = m4.a - 0.06, tN2 = m4.word('Parents').t0 - 0.1, tN3 = m4.word('And').t0 - 0.1, tN3b = m4.word('Robux').t0 - 0.1;
const tSurf = m5.a - 0.08, tTruck = m5.word('My').t0 - 0.1, tWhole = m5.word('The', 1).t0 - 0.08;
const tMia = m6.a - 0.08, tSell = m6.word('Can').t0 - 0.08, tSys = m7.a - 0.06, tNo = m8.a - 0.1, tNoExt = m8.a + 0.75;
const tDad = m9.a - 0.1, tBal = m10.a - 0.06, tMom = m10.word('Mom').t0 - 0.1, tMom2 = m11.a - 0.06;
const tGma = m12.a - 0.06, tCmp = m13.a - 0.04, tGame = m13.word('Grandma').t0 - 0.1;
// whip-style cuts get a quick white flash; the rest are hard cuts
const CUTS = [tTv, tEq, tJack, tN1, tN2, tN3, tSurf, tTruck, tMia, tSys, tDad, tBal, tGma, tGame];

// ---------------------------------------------------------------- extra designs (non-speaking extras)
const ADULT_M = makeDraw(makeDesign({ hair: 'shortPart', eyeStyle: 'dot', top: 'shirtTie', sleeve: 'short', pantsShape: 'straight', size: 1.1, brows: { L: [-2, 4], R: [-2, 4] }, neutralMouth: 'line',
  col: { skin: '#C98D6A', skinShade: '#B0754F', hair: '#E0B04A', hairShade: '#C8962E', hairHi: '#FFE08A', brow: '#A8781E', top: '#FFE0B0', topShade: '#E8C48E', sleeve: '#FFE0B0', tie: '#2E7BFF', pants: '#4A4F66', pantsShade: '#3A3F55', sole: '#3A2A1A', soleShade: '#2A1A0A', toe: '#3A2A1A' } }));
const ADULT_F = makeDraw(makeDesign({ hair: 'wavy', eyeStyle: 'mid', lashes: true, top: 'cardigan', sleeve: 'long', pantsShape: 'straight', size: 1.06, eye: { iris: '#3E8E41', pupil: 0.9 }, brows: { L: [0, 0], R: [0, 0] }, neutralMouth: 'line',
  col: { skin: '#F2C9A0', skinShade: '#DDB083', hair: '#2A1A12', hairShade: '#1A0E08', hairHi: '#5A3A2A', brow: '#2A1A12', top: '#FF8A5B', topShade: '#E06A3A', sleeve: '#FF8A5B', cuff: '#E06A3A', inner: '#FFFFFF', trim: '#FFFFFF', pants: '#3A6A9A', pantsShade: '#2A5A8A', sole: '#FFFFFF', soleShade: '#E3E3EE', toe: '#FF8A5B' } }));
const TAB_MAN = makeDraw(makeDesign({ hair: 'cap', eyeStyle: 'dot', top: 'tee', sleeve: 'short', pantsShape: 'straight', size: 1.12, brows: { L: [-2, 4], R: [-2, 4] }, neutralMouth: 'line', acc: { mustache: '#5A3A22' },
  col: { skin: '#E0A985', skinShade: '#C98E6A', hair: '#5A3A22', hairShade: '#4A2A12', hairHi: '#7A5A44', brow: '#5A3A22', cap: '#E8243C', hat: '#E8243C', hatShade: '#B81A2C', hatHi: '#FF7A8A', top: '#6A8CBF', topShade: '#5A7AAA', sleeve: '#6A8CBF', trim: '#FFFFFF', pants: '#3A4A2A', pantsShade: '#2A3A1A', sole: '#3A2A1A', soleShade: '#2A1A0A', toe: '#3A2A1A' } }));
const ICE_MAN = makeDraw(makeDesign({ hair: 'shortPart', eyeStyle: 'dot', top: 'shirtTie', sleeve: 'short', pantsShape: 'straight', size: 1.1, brows: { L: [-2, 4], R: [-2, 4] }, neutralMouth: 'smile', acc: { mustache: '#2A1A12' },
  col: { skin: '#8D5A3B', skinShade: '#764830', hair: '#2A1A12', hairShade: '#1A0E08', hairHi: '#4A3A2A', brow: '#2A1A12', top: '#FFFFFF', topShade: '#E3E6F0', sleeve: '#FFFFFF', tie: '#FF6FB5', pants: '#FFFFFF', pantsShade: '#E3E6F0', sole: '#3A2A1A', soleShade: '#2A1A0A', toe: '#3A2A1A' } }));
const MOM_PLAIN = makeDraw(makeDesign({ ...D.mom.style, acc: {} }));

// ---------------------------------------------------------------- DEFS
const DEFS = `<defs>
<pattern id="s03diamond" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#FFF1D6"/><path d="M45 8 L82 45 L45 82 L8 45 Z" fill="none" stroke="#BFEBD8" stroke-width="3"/><circle cx="45" cy="45" r="4" fill="#BFEBD8"/></pattern>
<pattern id="s03oak" width="320" height="64" patternUnits="userSpaceOnUse"><rect width="320" height="64" fill="#E2B985"/><rect y="32" width="320" height="32" fill="#D9AE78"/><rect y="0" width="320" height="4" fill="#C08F55"/><rect y="30" width="320" height="4" fill="#C08F55"/><rect x="100" y="0" width="4" height="32" fill="#C08F55"/><rect x="230" y="32" width="4" height="32" fill="#C08F55"/><path d="M20 16 Q60 10 90 18 M150 48 Q200 42 260 50" fill="none" stroke="#CDA06A" stroke-width="3"/></pattern>
<linearGradient id="s03sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3FA4FF"/><stop offset="1" stop-color="#BFE8FF"/></linearGradient>
<linearGradient id="s03studio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1C4A"/><stop offset="1" stop-color="#2A4AA8"/></linearGradient>
<radialGradient id="s03tvglow"><stop offset="0" stop-color="#9FD8FF" stop-opacity="0.55"/><stop offset="1" stop-color="#9FD8FF" stop-opacity="0"/></radialGradient>
<radialGradient id="s03vig" cx="0.5" cy="0.45" r="0.7"><stop offset="0.35" stop-color="#140A30" stop-opacity="0"/><stop offset="1" stop-color="#140A30" stop-opacity="0.85"/></radialGradient>
<linearGradient id="s03rgb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF4DA6"/><stop offset="0.5" stop-color="#5CF2FF"/><stop offset="1" stop-color="#B06BFF"/></linearGradient>
<pattern id="s03garage" width="200" height="100" patternUnits="userSpaceOnUse"><rect width="200" height="100" fill="#B8BDC9"/><rect width="200" height="4" fill="#9AA0AE"/><rect x="0" y="50" width="200" height="4" fill="#9AA0AE"/></pattern>
</defs>`;

// ---------------------------------------------------------------- the newsroom (inside K.tv's 1600x900 screen)
function newsroom(t, o = {}) {
  let s = S.rect(-800, -450, 1600, 900, 0, { fill: 'url(#s03studio)' });
  // globe + skyline glow
  s += S.circle(-420, -60, 330, { fill: '#2E64D8', opacity: 0.5 }) + S.circle(-420, -60, 330, { fill: 'none', stroke: '#7FB8FF', 'stroke-width': 6, opacity: 0.5 });
  for (let i = -2; i <= 2; i++) s += S.ellipse(-420, -60, Math.abs(330 * Math.cos((i * 0.35 + t * 0.2) % Math.PI)), 330, { fill: 'none', stroke: '#7FB8FF', 'stroke-width': 4, opacity: 0.35 });
  for (let i = 0; i < 12; i++) s += S.rect(-800 + i * 140, 40 - hash(i) * 160, 100, 400, 6, { fill: '#18306E', opacity: 0.8 });
  s += S.g(S.rect(-130, -36, 260, 72, 14, ol('#E8243C', 5)) + T('RBX NEWS', 0, 22, 50, '#FFFFFF'), 'translate(-620 -380)') + S.circle(-470, -380, 12, { fill: Math.floor(t * 2) % 2 ? '#FF3B3B' : '#7A1A1A' }) + TF('LIVE', -420, -370, 30, '#FFFFFF');
  // anchor behind the desk
  const ax = o.ax ?? -300;
  s += actor('anchor', t, { x: ax, y: o.ay ?? 470, s: o.as ?? 0.78, armL: 30, armR: 30, ...(o.pose || {}) }, o.act || {});
  s += S.path('M-800 120 L120 120 L60 450 L-800 450 Z', ol('#E8F0FF', 7)) + S.rect(-800, 150, 900, 30, 0, { fill: '#2E7BFF' });
  // graphic panel
  if (o.graphic) s += S.g(S.rect(-300, -220, 600, 440, 30, ol('#0D1A40', 8)) + o.graphic, `translate(${o.gx ?? 360} ${o.gy ?? -110}) scale(${f(o.gs ?? 1)})`);
  return s;
}
const TICK = 'ROBUX NOW REAL MONEY  •  1 ROBUX = $1  •  PARENTS ADVISED TO SIT DOWN  •  GAMERS: GO OUTSIDE? NO  •  ';
function tvFull(t, inner, cam = { zoom: 1, x: 0, y: 0 }) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A1E3A' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s03diamond)', opacity: 0.25 });
  o += view(cam, K.tv(960, 510, 1.02, inner, TICK, t));
  return o;
}

// ---------------------------------------------------------------- Ty's living room (world space; wide = cam x 0)
function stairs(t) {
  let o = '';
  // the upstairs landing + Ty's door
  o += S.rect(-2000, 40, 1150, 40, 0, ol('#C98F5E', 6));
  o += S.rect(-1400, -460, 280, 500, 8, ol('#FFFFFF', 7)) + S.rect(-1380, -440, 240, 480, 4, ol('#8C88E8', 5)) + TF('TY', -1260, -330, 44, '#FFFFFF');
  // stringer
  o += S.path('M-900 80 L180 900 L-900 900 Z', ol('#E8D2B0', 6));
  for (let i = 0; i < 11; i++) {
    const x = -900 + i * 98, y = 40 + i * 78;
    o += S.rect(x, y, 112, 30, 6, ol('#C98F5E', 5)) + S.rect(x + 4, y + 30, 104, 48, 0, ol('#FFF6E8', 4));
  }
  // rail
  o += S.path('M-920 -80 L120 730', ln(20, '#8A5A34')) + S.path('M-920 -80 L120 730', ln(8, '#B07A48'));
  for (let i = 0; i < 11; i++) o += S.path(`M${-880 + i * 98} ${f(-49 + i * 78)} L${-880 + i * 98} ${f(40 + i * 78)}`, ln(8, '#FFFFFF')) + S.path(`M${-880 + i * 98} ${f(-49 + i * 78)} L${-880 + i * 98} ${f(40 + i * 78)}`, { fill: 'none', stroke: '#151515', 'stroke-width': 2, opacity: 0.4 });
  o += S.rect(120, 690, 34, 210, 8, ol('#8A5A34', 5)) + S.circle(137, 684, 22, ol('#B07A48', 5));
  return o;
}
function couch(part) {
  if (part === 'back') {
    let o = S.rect(400, 540, 1020, 220, 50, ol('#F28A3A', 8));
    for (let i = 0; i < 4; i++) o += S.rect(450 + i * 240, 570, 225, 170, 36, ol('#FF9E52', 6));
    return o;
  }
  if (part === 'arms') return S.rect(380, 640, 90, 250, 34, ol('#E07A2A', 8)) + S.rect(1350, 640, 90, 250, 34, ol('#E07A2A', 8));
  if (part === 'seat') {
    let o = S.rect(460, 730, 900, 70, 22, ol('#FF9E52', 7)) + S.rect(460, 790, 900, 90, 14, ol('#E07A2A', 7));
    for (let i = 1; i < 4; i++) o += S.path(`M${460 + i * 225} 736 L${460 + i * 225} 796`, ln(5, '#C8641A'));
    o += S.rect(1290, 880, 40, 20, 6, ol('#6A3E1E', 4));
    o += S.rect(1180, 742, 150, 40, 18, ol('#4FC3F7', 5)) + S.path('M1215 750 L1295 774 M1215 774 L1295 750', ln(4, '#2E7BFF'));
    return o;
  }
  // the chaise (front-left leg of the L)
  return S.path('M360 800 L700 800 L720 850 L340 850 Z', ol('#FF9E52', 7)) + S.rect(340, 850, 380, 110, 18, ol('#E07A2A', 7)) + S.rect(370, 960, 40, 20, 6, ol('#6A3E1E', 4)) + S.rect(650, 960, 40, 20, 6, ol('#6A3E1E', 4));
}
const couchAll = () => couch('back') + couch('arms') + couch('seat') + couch('chaise');
function livingRoom(t, o = {}) {
  let b = S.rect(-2400, -1200, 5200, 2100, 0, { fill: 'url(#s03diamond)' });
  // ceiling + crown moulding
  b += S.rect(-2400, -1200, 5200, 1180, 0, { fill: '#FFF8EA' }) + S.rect(-2400, -40, 5200, 40, 0, ol('#FFFFFF', 5));
  b += S.path('M960 -300 L960 -150', ln(6)) + S.path('M880 -150 L1040 -150 L1000 -90 L920 -90 Z', ol('#FFD86A', 6));
  // window (left) with sky
  const id = S.uid('lw');
  b += S.rect(140, 110, 520, 520, 18, ol('#FFFFFF', 9));
  let sky = S.rect(160, 130, 480, 480, 0, { fill: 'url(#s03sky)' }) + S.circle(560, 220, 54, { fill: '#FFF6C8' });
  for (const [cx, cy, s] of [[240, 220, 0.9], [470, 330, 0.7]]) {
    const x = 120 + ((cx - 120 + t * 14) % 600);
    sky += S.g(S.ellipse(0, 0, 80, 22, { fill: '#FFFFFF' }) + S.ellipse(-26, -16, 40, 24, { fill: '#FFFFFF' }) + S.ellipse(22, -18, 46, 28, { fill: '#FFFFFF' }), `translate(${f(x)} ${cy}) scale(${s})`);
  }
  sky += S.ellipse(260, 640, 200, 110, { fill: '#5FBF6A' }) + S.ellipse(520, 650, 220, 120, { fill: '#4FAE5A' }) + S.rect(380, 470, 140, 160, 0, ol('#9BD86A', 5)) + S.path('M360 480 L450 420 L540 480 Z', ol('#E8604A', 5));
  b += S.clipDef(id, S.rect(160, 130, 480, 480, 6)) + S.g(sky, null, { 'clip-path': `url(#${id})` });
  b += S.path('M400 130 L400 610 M160 370 L640 370', ln(12, '#FFFFFF')) + S.rect(160, 130, 480, 480, 6, ln(6)) + S.rect(120, 620, 560, 30, 8, ol('#FFFFFF', 6));
  // family photo
  b += S.g(S.rect(-120, -90, 240, 180, 10, ol('#C98A5B', 8)) + S.rect(-100, -70, 200, 140, 4, { fill: '#BFE8FF' }) +
    [-66, -22, 22, 66].map((x, i) => S.rect(x - 16, -30 + (i % 2) * 10, 32, 32, 6, ol(['#E0A985', '#B9805D', '#E9B38B', '#F4D3BC'][i], 3)) + S.rect(x - 20, 4 + (i % 2) * 10, 40, 60, 6, ol(['#E6F0FF', '#3FB3A6', '#F2B53A', '#F7B9CF'][i], 3))).join(''), 'translate(900 330) rotate(-2)');
  // stairs (left of the room)
  b += stairs(t);
  // plant + TV stand + TV
  b += S.rect(1462, 720, 96, 140, 14, ol('#E8604A', 6));
  for (let i = 0; i < 6; i++) b += S.g(S.path('M0 0 Q-36 -80 0 -160 Q36 -80 0 0 Z', ol(['#3FAE5A', '#58C06A'][i % 2], 5)), `translate(1510 725) rotate(${-60 + i * 24 + Math.sin(t * 1.4 + i) * 3})`);
  b += S.rect(-2400, 880, 5200, 900, 0, { fill: 'url(#s03oak)' }) + S.rect(-2400, 866, 5200, 22, 0, ol('#FFFFFF', 5));
  b += S.rect(1580, 770, 330, 100, 16, ol('#2FB5A0', 7)) + S.rect(1604, 792, 135, 56, 10, ol('#5FD6C2', 5)) + S.rect(1752, 792, 135, 56, 10, ol('#5FD6C2', 5)) + S.rect(1596, 868, 26, 22, 4, ol('#1F8A7A', 4)) + S.rect(1866, 868, 26, 22, 4, ol('#1F8A7A', 4));
  if (o.tv !== false) {
    const on = o.tvOn ?? 1;
    let inner = '';
    if (on > 0) inner = o.tvInner || newsroom(t, { graphic: o.tvGraphic });
    if (on < 1) inner += S.rect(-800, -450, 1600, 900, 0, { fill: '#10121A' }) + (on > 0 ? S.rect(-800, -10 * (1 + on * 40), 1600, 20 * (1 + on * 40), 0, { fill: '#FFFFFF', opacity: f(1 - on) }) : '');
    b += S.ellipse(1745, 640, 260, 180, { fill: 'url(#s03tvglow)', opacity: f(on) });
    b += K.tv(1745, 650, 0.2, inner, on > 0.5 ? TICK : '', t) + S.rect(1728, 750, 34, 22, 4, ol('#1A1A22', 4));
  }
  return b;
}
// coin heap on the floor rising to topY
function coinFloor(t, topY, x0 = -2400, x1 = 2800) {
  if (topY >= 1100) return '';
  let top = `M${x0} 1500 L${x0} ${f(topY)}`;
  for (let x = x0; x <= x1; x += 60) top += ` L${x} ${f(topY + Math.sin(x * 0.021 + 1) * 12 + Math.sin(x * 0.053) * 8)}`;
  let o = S.path(`${top} L${x1} 1500 Z`, { fill: 'url(#coinPile)', stroke: '#7A4A08', 'stroke-width': 6 });
  for (let i = 0; i < 6; i++) o += K.F.sparkle(x0 + ((hash(i * 3) * (x1 - x0) + t * 40) % (x1 - x0)), topY + 20, 14 * Math.abs(Math.sin(t * 3 + i)));
  return o;
}
// coins pouring from a hole in the ceiling at hx
function coinStream(t, hx, n = 26, w = 220, y0 = -40, y1 = 900, speed = 1100) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const span = y1 - y0;
    const y = y0 + ((t * speed * (0.8 + 0.4 * hash(i * 3)) + hash(i) * span) % span);
    o += coin(hx + (hash(i * 7) - 0.5) * w * (0.5 + (y - y0) / span), y, 24 + 8 * hash(i * 5), i * 30, t * 8 + i);
  }
  return o;
}
function ceilingHole(hx, k, t) {
  // k: 0 cracks, 1 burst open
  if (k <= 0) return '';
  let o = '';
  const cr = clamp(k * 2, 0, 1);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    o += S.path(`M${hx} -30 l${f(Math.cos(a) * 200 * cr)} ${f(Math.sin(a) * 60 * cr - 10)} l${f(Math.cos(a + 0.4) * 130 * cr)} ${f(Math.sin(a + 0.4) * 30 * cr)}`, ln(9, '#5A3A1A'));
  }
  if (k < 1) o = S.ellipse(hx, -20, 200 * cr, 34 * cr, { fill: '#E8D2A8', stroke: '#5A3A1A', 'stroke-width': 5 }) + o;
  if (k >= 1) {
    o += S.path(`M${hx - 170} -40 L${hx - 120} -10 L${hx - 60} -30 L${hx} 0 L${hx + 70} -26 L${hx + 140} -6 L${hx + 180} -40 L${hx + 120} -120 L${hx - 120} -120 Z`, ol('#3A2A1A', 6));
    o += S.path(`M${hx - 170} -40 L${hx - 120} -10 L${hx - 60} -30 L${hx} 0 L${hx + 70} -26 L${hx + 140} -6 L${hx + 180} -40`, ln(8, '#FFE14D', 0.6));
  }
  return o;
}

// the family on the couch (looking toward the TV on the right)
let SKIP = null, FLAT = false; // render-cost controls for extreme close-ups
function sitter(name, t, x, seatY, s, pose = {}, act = {}, head = '') {
  if (SKIP && SKIP.includes(name)) return '';
  if (FLAT && name !== 'ty') pose = { ...pose, volume: false };
  const Z = { dad: 1.1, mom: 1.06, grandma: 0.98, mia: 1.04, pickle: 0.95, ty: 1 }[name] || 1;
  const y = seatY + 306 * s * Z;
  if (name === 'mia') return miaIn(t, x, y, s, { shadow: false, ...pose }, act, pose.hats ?? 5, 0.6);
  return castIn(name, t, { x, y, s, shadow: false, ...pose }, act, head);
}
function family(t, o = {}) {
  // o.jolt: 0..1 jump, o.look: face override per name, o.lift (Ty leaving)
  const j = o.jolt || 0;
  const lift = (k) => j * 70 * k;
  const fc = o.face || {};
  const turn = o.turn ?? 0.45;
  let b = '';
  const dadProp = o.remote
    ? S.g(S.rect(-22, -60, 44, 120, 12, ol('#2B2F3A', 6)) + S.circle(0, -34, 9, { fill: '#FF3B3B' }) + S.rect(-12, -10, 24, 10, 3, { fill: '#5A6078' }), `translate(${f(A.hand(60, 1)[0])} ${f(A.hand(60, 1)[1] - 50)}) rotate(-20)`)
    : S.g(S.rect(-40, -60, 80, 110, 14, ol('#FFFFFF', 6)) + S.path('M40 -40 Q80 -20 40 20', ln(10)) + S.rect(-30, -50, 60, 18, 6, { fill: '#6A3E1E' }), `translate(${f(A.hand(40, 1)[0])} ${f(A.hand(40, 1)[1] - 40)})`);
  b += sitter('dad', t, 620, 730, 0.42, { turn, lift: lift(1), armR: o.remote ? 60 : 40, armL: 10, face: fc.dad || { name: 'neutral', eyes: { look: [0.6, 0] } }, props: [{ svg: dadProp, layer: 'front' }] });
  b += sitter('mom', t, 800, 730, 0.42, { turn, lift: lift(0.8), armR: 15, armL: 15, face: fc.mom || { name: 'neutral', eyes: { look: [0.6, 0] } } });
  if (!o.noTy) b += sitter('ty', t, 980, 730, 0.42, { turn, lift: lift(1.2), armR: 12, armL: 12, face: fc.ty || { name: 'neutral', eyes: { look: [0.6, 0] } } });
  b += sitter('mia', t, 1160, 730, 0.42, { turn, lift: lift(0.9), armR: 40, face: fc.mia || { name: 'deadpan', eyes: { look: [0.6, 0] } } });
  b += sitter('pickle', t, 1395, 640, 0.4, { turn, lift: lift(1.4), armR: 20, armL: 20, legL: 6, legR: -6, face: fc.pickle || { name: 'happy', eyes: { look: [0.6, 0] } } });
  return b;
}
function grandmaChaise(t, o = {}) {
  return sitter('grandma', t, 530, 806, 0.42, { turn: o.turn ?? 0.5, lift: (o.jolt || 0) * 60, armL: 30, armR: 30, face: o.face || { name: 'happy', eyes: { look: [0.6, 0] } } });
}
function roomShot(t, cam, o = {}) {
  let w = livingRoom(t, o);
  w += ceilingHole(1000, o.hole || 0, t);
  w += couch('back') + couch('arms');
  w += family(t, o);
  w += couch('seat');
  w += grandmaChaise(t, { jolt: o.jolt, face: (o.face || {}).grandma, turn: o.turn });
  w += couch('chaise');
  if (o.extra) w += o.extra;
  if (o.stream) w += coinStream(t, 1000, o.stream, 260, -60, 900);
  if (o.pile !== undefined) w += coinFloor(t, o.pile);
  return view(cam, w);
}

// ---------------------------------------------------------------- shots
function shotOn(t) {
  // wide: the TV switches itself on; Dad stares at the remote he never pressed
  const on = seg(t, tOn + 0.02, tOn + 0.22);
  const cam = camKeys(t, [[tOn, camAt(1080, 560, 1.0)], [tTv, camAt(1240, 560, 1.12)]]);
  let o = roomShot(t, cam, { tvOn: on, remote: true, face: { dad: t > tOn + 0.5 ? { name: 'confused', fx: ['question'], eyes: { look: [0.4, 0.4] } } : { name: 'shocked', eyes: { look: [0.6, 0] } } } });
  o += C.whiteFlash(1 - seg(t, START, START + 0.25));
  o += bang('BZZT!', 1500, 300, bump(t, tOn + 0.05, tOn + 0.7), 80, 8, '#5CF2FF');
  return o;
}

function realGraphic(t, kReal) {
  let g = TF('FROM TODAY', 0, -140, 44, '#9FC4FF') + coin(-150, -20, 80, 0, Math.sin(t * 3) * 0.5) + T('=', 0, 10, 110, '#FFFFFF');
  g += S.g(S.rect(-90, -50, 180, 100, 12, ol('#7FD86A', 6)) + T('$', 0, 30, 80, '#1E6A2A'), 'translate(150 -20)');
  if (kReal <= 0) g += T('REAL MONEY', 0, 160, 80, '#FFE14D', OUT);
  else g += S.g(S.rect(-260, -70, 520, 140, 20, { fill: '#FFF8EC', stroke: '#E8243C', 'stroke-width': 14 }) + T('REAL!', 0, 40, 110, '#E8243C'), `translate(0 140) rotate(-8) scale(${f(lerp(2, 1, ease.out(clamp(kReal, 0, 1))))})`, { opacity: f(clamp(kReal * 3, 0, 1)) });
  return g;
}
function shotTv(t) {
  // full TV: Chip + the REAL MONEY graphic, smash-zoom on "REAL"
  const tr = m0.word('REAL').t0;
  const cam = t < tr ? camKeys(t, [[tTv, { zoom: 1.0, x: 0, y: 0 }], [tr, { zoom: 1.06, x: 0, y: 0 }]]) : camKeys(t, [[tr, { zoom: 1.5, x: 330, y: -60 }], [tEq, { zoom: 1.55, x: 330, y: -60 }]]);
  const sh = K.shake(t, tr, 0.4, 18);
  cam.sx = sh.sx; cam.sy = sh.sy;
  const inner = newsroom(t, { graphic: realGraphic(t, seg(t, tr, tr + 0.2)), act: { energy: 1.4 } });
  return tvFull(t, inner, cam) + C.whiteFlash(0.4 * bump(t, tr - 0.02, tr + 0.12));
}

function shotEq(t) {
  // 1 R$ = $1, item by item on the words; then Chip leans in for "Effective..."
  const w1 = m1.word('One').t0, we = m1.word('equals').t0, wd = m1.word('dollar').t0, wf = m1.word('Effective').t0;
  const k1 = seg(t, w1, w1 + 0.25), k2 = seg(t, we, we + 0.25), k3 = seg(t, wd, wd + 0.25);
  let g = '';
  g += S.g(coin(0, 0, 120, 0, Math.sin(t * 3) * 0.5) + T('1 R$', 0, 210, 80, '#FFFFFF', OUT), `translate(-420 -190) scale(${f(pop(k1))})`);
  g += S.g(T('=', 0, 40, 220, '#FFE14D', OUT), `translate(0 -190) scale(${f(pop(k2))})`);
  g += S.g(S.rect(-200, -100, 400, 200, 20, ol('#7FD86A', 8)) + S.circle(0, 0, 70, ol('#A8F08A', 6)) + T('$1', 0, 34, 100, '#1E6A2A') + T('1', -160, -50, 40, '#1E6A2A') + T('1', 160, 70, 40, '#1E6A2A'), `translate(420 -190) rotate(-4) scale(${f(pop(k3))})`);
  const lean = ease.inOut(seg(t, wf, wf + 0.4));
  let inner = S.rect(-800, -450, 1600, 900, 0, { fill: 'url(#s03studio)' }) + K.rays(0, -60, 16, 1200, '#FFFFFF', 0.06, t * 20) + g;
  // Chip in a picture-in-picture box that grows when he leans in
  const id = S.uid('pip');
  inner += S.g(S.clipDef(id, S.rect(-200, -150, 400, 300, 24)) + S.g(S.g(newsroom(t, { ax: 0, as: 1.3, ay: 1010, pose: { lean: 4 * lean, armR: 30 + 60 * lean, headRot: 6 * lean } }), 'scale(0.25)'), null, { 'clip-path': `url(#${id})` }) + S.rect(-200, -150, 400, 300, 24, ln(8, '#FFFFFF')), `translate(${f(lerp(540, 200, lean))} ${f(lerp(100, 20, lean))}) scale(${f(lerp(1, 1.7, lean))})`);
  const cam = camKeys(t, [[tEq, { zoom: 1.0, x: 0, y: 0 }], [tNow, { zoom: 1.08, x: 0, y: 0 }]]);
  return tvFull(t, inner, cam);
}

function shotNow(t) {
  // Chip, extreme close, pointing at the viewer: "right now!"
  const cam = camKeys(t, [[tNow, { zoom: 1.0, x: 0, y: 0 }], [tJolt, { zoom: 1.15, x: 0, y: 0 }]]);
  let inner = S.rect(-800, -450, 1600, 900, 0, { fill: 'url(#s03studio)' }) + K.rays(0, -100, 16, 1200, '#E8243C', 0.18, t * 60);
  inner += actor('anchor', t, { x: 0, y: 1150, s: 1.6, armR: 95, armL: 20, face: { name: 'excited' }, lean: 4 }, { arms: false });
  return tvFull(t, inner, cam) + C.speedLines(0, 1920, 540, 20, 4, '#FFFFFF', 1000);
}

function shotJolt(t) {
  // the whole family jumps off the couch
  const cam = camKeys(t, [[tJolt, camAt(980, 600, 1.15)], [tPush, camAt(980, 610, 1.2)]]);
  const sh = K.shake(t, tJolt, 0.4, 14);
  cam.sx = sh.sx; cam.sy = sh.sy;
  const j = bump(t, tJolt, tJolt + 0.55);
  const shocked = { name: 'shocked', fx: ['exclaim'] };
  let o = roomShot(t, cam, { jolt: j, face: { dad: shocked, mom: shocked, ty: shocked, mia: { name: 'shocked' }, pickle: shocked, grandma: shocked } });
  o += bang('!!!', 980, 220, seg(t, tJolt, tJolt + 0.15), 140, -6, '#FFE14D');
  return o;
}

function shotPush(t) {
  // slow push on Ty's face; on "Three" his pupils turn into Robux; heartbeat pulses
  const t3 = m2.word('Three').t0, tm = m2.word('million').t0, tr = m2.word('Robux', 1).t0;
  const u = ease.inOut(seg(t, tPush, tJack));
  const beat = 0.06 * (bump(t, tm, tm + 0.18) + bump(t, tr, tr + 0.18));
  const z = lerp(2.1, 4.2, u) * (1 + beat);
  const cam = { zoom: z, x: 980 - 960, y: lerp(560, 535, u) - 540 };
  const rich = t >= t3;
  const face = rich ? { name: 'rich', mouth: t > tr ? 'O' : undefined } : { name: 'shocked', eyes: { look: [0.3, 0] } };
  SKIP = z > 2.4 ? ['dad', 'pickle', 'grandma'] : ['grandma']; FLAT = true;
  let o = roomShot(t, cam, { tvOn: z > 2.6 ? 0 : 1, face: { ty: face, dad: { name: 'neutral', eyes: { look: [0.6, 0] } } } });
  SKIP = null; FLAT = false;
  o += S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s03vig)', opacity: f(0.4 + 0.5 * u) });
  if (rich) {
    o += S.circle(960, 540, 900, { fill: '#FFE14D', opacity: f(0.12 * bump(t, t3, t3 + 0.4)) });
    o += K.sparkles([[520, 300, 30], [1420, 260, 40], [1500, 740, 26]], t);
  }
  return o;
}

function jackpotScreen(t, k) {
  let o = S.rect(-160, -120, 320, 240, 0, { fill: Math.floor(t * 12) % 2 ? '#E8243C' : '#FFD21F' });
  o += T('JACKPOT', 0, -60, 54, '#FFFFFF', { stroke: '#151515', 'stroke-width': 6, 'paint-order': 'stroke' });
  for (let i = 0; i < 3; i++) o += S.rect(-120 + i * 84, -30, 72, 90, 10, ol('#FFFFFF', 4)) + T('7', -84 + i * 84, 44, 70, '#E8243C');
  void k;
  return o;
}
function shotJack(t) {
  // upstairs: the AFK PC hits the jackpot; coins geyser out of the screen
  const cam = camKeys(t, [[tJack, camAt(470, 420, 1.55)], [tCeil, camAt(470, 360, 1.3)]]);
  const sh = K.shake(t, tJack, 0.7, 16);
  cam.sx = sh.sx; cam.sy = sh.sy;
  let w = B.bedroom(t, { heat: 1, screen: jackpotScreen(t, 1) });
  w += K.rays(470, 420, 16, 900, '#FFE14D', 0.3, t * 60);
  w += K.coinBurst(470, 418, t - tJack - 0.05, 40, 1700, 26, 5);
  w += K.coinBurst(470, 418, t - tJack - 0.25, 30, 1600, 30, 9);
  let o = view(cam, w);
  o += bang('JACKPOT!!', 960, 200, seg(t, tJack, tJack + 0.15), 130, -5, '#FFE14D');
  return o;
}

function shotCeil(t) {
  // the living-room ceiling cracks, bulges, bursts: coins pour down; Ty leaps up yelling MILLIONAIRE
  const tw = m3.word('MILLIONAIRE').t0;
  const burst = t >= tMil;
  const cam = camKeys(t, [[tCeil, camAt(1000, 380, 0.82)], [tMil, camAt(1000, 400, 0.85)], [tMil + 0.3, camAt(1000, 470, 0.95)], [tN1, camAt(1000, 470, 1.0)]]);
  const sh = K.shake(t, burst ? tMil : tCeil, burst ? 1.4 : 0.45, burst ? 22 : 8);
  cam.sx = sh.sx; cam.sy = sh.sy;
  const age = t - tMil;
  const pile = burst ? lerp(1080, 905, ease.out(clamp(age / 1.6, 0, 1))) : undefined;
  const leap = burst ? ease.out(seg(t, tMil, tMil + 0.35)) * (1 - 0.15 * ease.inOut(seg(t, tMil + 0.8, tN1))) : 0;
  const shocked = { name: 'shocked' };
  let extra = '';
  if (burst) {
    // Ty jumps up on the couch in front of the waterfall
    extra += actor('ty', t, { x: 980, y: lerp(860, 760, leap), lift: 160 * leap, s: 0.46, armL: 165, armR: 165, face: { name: 'excited', mouth: 'scream' }, sy: 1 + 0.1 * leap, sx: 1 - 0.06 * leap });
    extra += K.coinBurst(1000, -20, age, 34, 900, 30, 13);
  }
  let o = roomShot(t, cam, { hole: burst ? 1 : seg(t, tCeil + 0.1, tMil), stream: burst ? 30 : 0, pile, noTy: burst, extra, face: { dad: shocked, mom: shocked, ty: { name: 'shocked', eyes: { look: [0, -1] } }, mia: shocked, pickle: { name: 'excited' }, grandma: shocked } });
  if (!burst) o += bang('CRACK!', 1320, 130, seg(t, tCeil + 0.1, tCeil + 0.25), 110, 8, '#FFFFFF') + bang('creak...', 600, 160, seg(t, tCeil + 0.25, tCeil + 0.35), 60, -6, '#FFFFFF');
  if (burst) {
    o += C.whiteFlash(0.6 * (1 - seg(t, tMil, tMil + 0.18)));
    o += S.g(T("I'M A", 0, -110, 80, '#FFFFFF', OUT) + T('MILLIONAIRE!', 0, 20, 150, '#FFD21F', { ...OUT, 'stroke-width': 18 }), `translate(960 180) rotate(-4) scale(${f(pop(seg(t, tw, tw + 0.3)))})`);
    o += K.confetti(t, tw, 60, 4);
  }
  return o;
}

// ---- world news montage (on the TV)
function newsFrame(t, inner, cam, label) {
  let o = tvFull(t, inner + S.g(S.rect(-170, -34, 340, 68, 12, { fill: '#000', opacity: 0.55 }) + TF(label, 0, 14, 36, '#FFFFFF'), 'translate(560 -380)'), cam);
  return o;
}
function shotN1(t) {
  // gamers celebrating: kids bouncing on a couch in a coin storm
  const cam = camKeys(t, [[tN1, { zoom: 1.0, x: -20, y: 0 }], [tN2, { zoom: 1.08, x: 20, y: 0 }]]);
  let inner = S.rect(-800, -450, 1600, 900, 0, { fill: '#B5E3FF' }) + S.rect(-800, -450, 1600, 900, 0, { fill: 'url(#wallStripes)', opacity: 0.5 });
  inner += S.rect(-800, 200, 1600, 250, 0, { fill: '#C99262' });
  inner += S.rect(-600, -40, 1200, 200, 40, ol('#7C4DD8', 7)) + S.rect(-640, 80, 1280, 160, 30, ol('#9B6BF0', 7));
  for (let i = 0; i < 4; i++) {
    const ph = t * 7 + i * 1.7;
    const jump = Math.abs(Math.sin(ph)) * 160;
    inner += K.draw.kid(i * 3 + 2, { x: -450 + i * 300, y: 160, s: 0.5, lift: jump, armL: 150 + 20 * Math.sin(ph), armR: 150 - 20 * Math.sin(ph), face: { name: i % 2 ? 'excited' : 'joy' }, legL: 10 * Math.sin(ph), legR: -10 * Math.sin(ph), shadow: false });
  }
  inner += K.coinRain(t, 30, { x0: -800, x1: 800, y0: -500, y1: 450, r: 26, speed: 380 });
  return newsFrame(t, inner, cam, 'WORLDWIDE');
}
function shotN2(t) {
  // parents are confused: a controller held upside down, question marks everywhere
  const cam = camKeys(t, [[tN2, { zoom: 1.02, x: 0, y: 0 }], [tN3, { zoom: 1.12, x: -40, y: 0 }]]);
  let inner = S.rect(-800, -450, 1600, 900, 0, { fill: '#FFE3C4' }) + S.rect(-800, -450, 1600, 900, 0, { fill: 'url(#wallStripes)', opacity: 0.5 }) + S.rect(-800, 220, 1600, 230, 0, { fill: '#B98A6A' });
  const pad = S.g(S.rect(-70, -34, 140, 68, 30, ol('#2B2F3A', 6)) + S.circle(-36, 0, 10, { fill: '#5A6078' }) + S.circle(36, 0, 8, { fill: '#FF5A5A' }), `translate(${f(A.hand(60, 1)[0])} ${f(A.hand(60, 1)[1] - 20)}) rotate(180)`);
  inner += ADULT_M({ x: -230, y: 420, s: 0.58, turn: 0.3, armR: 60, armL: 10, headRot: 10 * Math.sin(t * 2), face: { name: 'confused', fx: ['question'] }, props: [{ svg: pad, layer: 'front' }] });
  inner += ADULT_F({ x: 250, y: 420, s: 0.58, turn: -0.3, armR: 20, armL: 70, headRot: -8, face: { name: 'confused' }, props: [{ svg: S.g(K.phone(0, 0, 0.3, 90, S.rect(-150, -280, 300, 560, 0, { fill: '#5CF2FF' })), `translate(${f(A.hand(70, -1)[0])} ${f(A.hand(70, -1)[1] - 30)})`), layer: 'front' }] });
  for (let i = 0; i < 5; i++) inner += K.F.markText('?', -500 + i * 250, -280 + Math.sin(t * 3 + i) * 30, 110, (i - 2) * 10, '#FFFFFF');
  return newsFrame(t, inner, cam, 'MEANWHILE');
}
function shotN3(t) {
  // garage: a man digs out his son's dusty old tablet... 40,000 Robux
  const tf = m4.word('found').t0, tfo = m4.word('forty').t0;
  const cam = camKeys(t, [[tN3, { zoom: 1.0, x: 0, y: 0 }], [tN3b, { zoom: 1.12, x: -60, y: -20 }]]);
  let inner = S.rect(-800, -450, 1600, 900, 0, { fill: 'url(#s03garage)' }) + S.rect(-800, 260, 1600, 200, 0, { fill: '#7A7F8C' });
  for (let i = 0; i < 5; i++) inner += S.rect(260 + (i % 3) * 170, 60 - Math.floor(i / 3) * 140, 160, 130, 6, ol('#C98A5B', 5)) + S.path(`M${270 + (i % 3) * 170} ${120 - Math.floor(i / 3) * 140} L${410 + (i % 3) * 170} ${120 - Math.floor(i / 3) * 140}`, ln(5, '#A0683A'));
  inner += S.rect(-760, -300, 300, 50, 6, ol('#8A5A34', 5)) + S.circle(-700, -330, 30, ol('#FF5A5A', 4)) + S.rect(-640, -380, 60, 80, 6, ol('#3BD16F', 4));
  const found = t >= tf;
  const lit = seg(t, tfo, tfo + 0.2);
  const tab = S.g(S.rect(-90, -64, 180, 128, 14, ol('#2B2F3A', 6)) + S.rect(-76, -52, 152, 104, 8, { fill: lit > 0 ? '#2E7BFF' : '#555B6A' }) + (lit > 0 ? coin(-40, 0, 26, 0, t * 4) + TF('40,000', 26, 12, 30, '#FFFFFF') : S.rect(-76, -52, 152, 104, 8, { fill: '#C9C4B8', opacity: 0.6 })), `translate(${f(A.hand(found ? 110 : 30, 1)[0])} ${f(A.hand(found ? 110 : 30, 1)[1] - 40)}) rotate(-10) scale(1.3)`);
  inner += TAB_MAN({ x: -120, y: 440, s: 0.66, turn: 0.3, armR: found ? 110 : 30 + 30 * Math.sin(t * 12), armL: found ? 40 : 30 - 30 * Math.sin(t * 12), face: lit > 0 ? { name: 'rich', mouth: 'O' } : found ? { name: 'amazed' } : { name: 'determined' }, props: [{ svg: tab, layer: 'front' }] });
  // dug-up junk flying out of the box
  if (!found) for (let i = 0; i < 5; i++) { const a = ((t - tN3) * 2 + i / 5) % 1; inner += S.g(S.rect(-30, -20, 60, 40, 8, ol(['#FF5A5A', '#FFD21F', '#34C3FF', '#3BD16F', '#B06BFF'][i], 4)), `translate(${f(140 + a * 400)} ${f(200 - Math.sin(a * Math.PI) * 400)}) rotate(${f(a * 400)})`); }
  if (found && !lit) inner += S.circle(60, -160, 60 * bump(t, tf, tf + 0.5) + 10, { fill: '#D9CFB8', opacity: 0.6 });
  inner += S.rect(-80, 160, 300, 220, 10, ol('#C98A5B', 6)) + TF('OLD STUFF', 70, 280, 34, '#7A4A2A');
  let o = newsFrame(t, inner, cam, 'BREAKING');
  if (lit > 0) o += K.sparkles([[760, 380, 30], [960, 300, 24]], t);
  return o;
}
function shotN3b(t) {
  // close two-shot: Dad of the year hugs the tablet; his son in the doorway: HEY!
  const tt = m4.word('tablet').t0;
  const cam = camKeys(t, [[tN3b, { zoom: 1.04, x: 0, y: 0 }], [tSurf, { zoom: 1.12, x: 0, y: 0 }]]);
  let inner = S.rect(-800, -450, 1600, 900, 0, { fill: 'url(#s03garage)' }) + K.rays(-200, -60, 16, 1200, '#FFE14D', 0.15, t * 30);
  const tab = S.g(S.rect(-90, -64, 180, 128, 14, ol('#2B2F3A', 6)) + S.rect(-76, -52, 152, 104, 8, { fill: '#2E7BFF' }) + coin(-40, 0, 26, 0, t * 4) + TF('40,000', 26, 12, 30, '#FFFFFF'), 'translate(0 -560) scale(1.5)');
  inner += TAB_MAN({ x: -260, y: 620, s: 0.9, armL: -40, armR: -40, face: { name: 'love', fx: ['hearts'] }, headRot: 6 * Math.sin(t * 3), props: [{ svg: tab, layer: 'front' }] });
  inner += S.rect(300, -380, 380, 760, 10, ol('#5A4A3A', 8)) + S.rect(320, -360, 340, 740, 6, { fill: '#2A2230' });
  inner += K.draw.kid(5, { x: 480, y: 380, s: 0.62, armL: 60, armR: 60, face: { name: 'angry', fx: ['anger'] } });
  let o = newsFrame(t, inner, cam, '40,000 R$ FOUND');
  o += bang('HEY! MINE!', 1480, 320, seg(t, tt - 0.1, tt + 0.1), 80, 8, '#FF5A5A');
  return o;
}

// ---- coin wave down the stairs
function coinWave(fx, fy, t) {
  // filled body behind/above the front point (fx, fy), with a curling crest
  const wob = Math.sin(t * 8) * 10;
  let d = `M-2600 1600 L-2600 ${f(fy - 520)} L${f(fx - 420)} ${f(fy - 470 + wob)} Q${f(fx - 60)} ${f(fy - 560)} ${f(fx + 150)} ${f(fy - 380)} Q${f(fx + 230)} ${f(fy - 290)} ${f(fx + 160)} ${f(fy - 240)} Q${f(fx + 90)} ${f(fy - 330)} ${f(fx + 20)} ${f(fy - 280)} L${f(fx + 140)} ${f(fy + 40)} L${f(fx + 260)} 1600 Z`;
  let o = S.path(d, { fill: 'url(#coinPile)', stroke: '#7A4A08', 'stroke-width': 10, 'stroke-linejoin': 'round' });
  for (let i = 0; i < 18; i++) {
    const a = (t * 2.2 + i / 18) % 1;
    o += coin(fx + 120 + a * 280 * (hash(i) - 0.2), fy - 380 - Math.sin(a * Math.PI) * 220 + a * 300, 22 + 10 * hash(i * 3), i * 30, t * 9 + i);
  }
  return o;
}
function shotSurf(t) {
  // Ty surfs a coin wave down the stairs on his old taped keyboard; Mom & Dad flatten against the wall
  const u = seg(t, tSurf, tTruck);
  const fx = lerp(-1000, 700, ease.inOut(u)), fy = lerp(-40, 880, ease.inOut(u));
  const cam = { zoom: 0.95, x: fx - 120 - 960, y: fy - 560 - 540 };
  let w = livingRoom(t, { tvOn: 1 });
  w += couchAll();
  // the parents have fled onto the couch, clutching each other, gawking at their rich kid
  const gawk = { name: 'shocked', eyes: { look: [-0.8, -0.3] } };
  const shiver = Math.sin(t * 40) * 3;
  w += actor('dad', t, { x: 1010 + shiver, y: 770, s: 0.5, turn: -0.4, armL: 150, armR: 170, face: gawk, shadow: false, props: [{ svg: S.g(S.rect(-40, -60, 80, 110, 14, ol('#FFFFFF', 6)) + S.path('M40 -40 Q80 -20 40 20', ln(10)), `translate(${f(A.hand(170, 1)[0])} ${f(A.hand(170, 1)[1] - 60)})`), layer: 'front' }] });
  w += actor('mom', t, { x: 1200 - shiver, y: 770, s: 0.5, turn: -0.5, armL: -30, armR: 120, face: gawk, shadow: false });
  w += coinWave(fx, fy, t);
  const board = S.g(B.keyboard(0, 0, 1.6, 1), 'translate(0 26)');
  const bob = Math.sin(t * 9) * 8;
  w += S.g(board, `translate(${f(fx - 90)} ${f(fy - 470 + bob)}) rotate(-28)`);
  w += actor('ty', t, { x: fx - 90, y: fy - 478 + bob, s: 0.42, view: 'side', flip: true, rot: -18, rotY: 0, legL: 26, kneeL: 34, legR: -30, kneeR: 40, armL: 110, armR: -80, lean: 10, face: { name: 'excited' }, shadow: false }, { arms: false });
  let o = view(cam, w);
  o += C.speedLines(0, 1920, 400, 14, 6, '#FFFFFF', 700);
  o += bang('COWABUNGA!', 1400, 220, bump(t, tSurf + 0.2, tSurf + 1.4), 80, -8, '#5CF2FF');
  return o;
}

// ---- the ice cream truck
function truck(x, y, s, t, opts = {}) {
  let o = S.rect(-420, -330, 840, 330, 36, ol('#FFB8D9', 8)) + S.rect(-420, -80, 840, 70, 0, { fill: '#FF6FB5' }) + S.rect(-420, -330, 840, 330, 36, ln(8));
  o += S.rect(-380, -290, 380, 160, 18, ol('#BFF0FF', 6)) + S.rect(-380, -140, 380, 30, 6, ol('#FFE14D', 5));
  o += S.rect(120, -290, 260, 190, 20, ol('#BFF0FF', 6));
  o += S.circle(-260, 0, 70, ol('#2B2F3A', 8)) + S.circle(-260, 0, 30, ol('#B9C2D0', 5)) + S.circle(260, 0, 70, ol('#2B2F3A', 8)) + S.circle(260, 0, 30, ol('#B9C2D0', 5));
  // the giant cone on the roof
  const cone = S.path('M-50 0 L0 160 L50 0 Z', ol('#E8A858', 6)) + S.path('M-30 30 L30 30 M-20 70 L20 70', ln(4, '#B97A30')) + S.circle(-28, -24, 50, ol('#FFF4F8', 6)) + S.circle(28, -30, 54, ol('#FFB8D9', 6)) + S.circle(0, -74, 46, ol('#7FD86A', 6)) + S.circle(0, -128, 18, ol('#E8243C', 5));
  o += S.g(cone, 'translate(-60 -510)');
  if (opts.sold) o += S.g(S.rect(-140, -46, 280, 92, 14, ol('#FFE14D', 7)) + T('SOLD!', 0, 28, 70, '#E8243C'), 'translate(250 -200) rotate(-8)');
  o += S.g(S.rect(-140, -26, 280, 52, 12, ol('#FFFFFF', 5)) + TF('ICE CREAM', 0, 14, 32, '#FF6FB5'), 'translate(250 -60)');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function street(t) {
  let o = S.rect(-2000, -800, 5000, 2400, 0, { fill: 'url(#s03sky)' }) + S.circle(1650, 200, 80, { fill: '#FFF6C8' });
  for (let i = 0; i < 6; i++) o += B.house(-200 + i * 520, 720, 0.75, ['#8C88E8', 'url(#s02brick)', '#FFB86B', '#7FD0FF', '#FF9EC4', '#BFF5B0'][i], ['#4846A8', '#E8604A', '#C8641A', '#2E7BFF', '#C9467A', '#3FAE5A'][i], '#FFE9A8');
  o += S.rect(-2000, 720, 5000, 80, 0, { fill: '#6FCB5A' }) + S.rect(-2000, 790, 5000, 50, 0, ol('#D9DEE8', 5)) + S.rect(-2000, 840, 5000, 700, 0, { fill: '#5A6070' });
  for (let x = -2000; x < 3000; x += 240) o += S.rect(x + ((t * 0) % 240), 990, 120, 16, 6, { fill: '#FFFFFF', opacity: 0.8 });
  return o;
}
function shotTruck(t) {
  // the neighbour's six-year-old at the wheel of HIS ice cream truck; the ice cream man waves a money bag
  const cam = camKeys(t, [[tTruck, camAt(900, 600, 1.0)], [tWhole, camAt(980, 580, 1.12)]]);
  let w = street(t);
  const tx = lerp(700, 1000, ease.out(seg(t, tTruck, tTruck + 0.8)));
  w += S.g(truck(0, 0, 1, t, { sold: true }), `translate(${f(tx)} 960)`);
  // tiny driver: just a beanie and a pair of eyes over the steering wheel
  const id = S.uid('drv');
  const kid = K.draw.kid(11, { x: 0, y: 0, s: 0.24, armL: 150, armR: 150, face: { name: 'joy' }, shadow: false });
  w += S.clipDef(id, S.rect(tx - 380, 670, 380, 160, 18)) + S.g(S.g(kid, `translate(${f(tx - 200)} ${f(960 - 40 + Math.abs(Math.sin(t * 8)) * 6)})`) + S.ellipse(tx - 200, 800, 70, 24, { fill: 'none', stroke: '#2B2F3A', 'stroke-width': 14 }), null, { 'clip-path': `url(#${id})` });
  w += S.rect(tx - 380, 670, 380, 160, 18, { fill: '#BFF0FF', opacity: 0.25 });
  const bag = S.g(S.path('M-60 0 Q-80 -110 0 -110 Q80 -110 60 0 Z', ol('#C9A06A', 6)) + S.path('M-30 -110 L-20 -140 L20 -140 L30 -110', ol('#C9A06A', 5)) + T('R$', 0, -40, 60, '#7A4A2A'), `translate(${f(A.hand(160, 1)[0])} ${f(A.hand(160, 1)[1] - 70)})`);
  const paperHat = S.g(S.path('M-110 0 L110 0 L80 -70 L-80 -70 Z', ol('#FFFFFF', 6)) + S.rect(-110, -16, 220, 16, 4, { fill: '#FF6FB5' }), 'translate(0 -940)');
  w += ICE_MAN({ x: 1620, y: 860, s: 0.5, armR: 160, armL: 20, face: { name: 'joy' }, props: [{ svg: bag, layer: 'front' }, { svg: paperHat, layer: 'front' }] });
  w += C.musicNotes(t, tx - 60, 380);
  let o = view(cam, w);
  o += S.g(S.rect(-150, -40, 300, 80, 16, ol('#14182A', 6)) + TF('DRIVER: AGE 6', 0, 14, 34, '#FFE14D'), `translate(520 230) rotate(-4) scale(${f(pop(seg(t, m5.word('six-year-old').t0, m5.word('six-year-old').t0 + 0.25)))})`);
  return o;
}
function shotWhole(t) {
  // smash-zoom: the kid on the roof hugging the giant cone
  const cam = camKeys(t, [[tWhole, camAt(960, 440, 1.9)], [tMia, camAt(960, 460, 1.7)]]);
  const sh = K.shake(t, tWhole, 0.3, 14);
  cam.sx = sh.sx; cam.sy = sh.sy;
  let w = street(t) + truck(1000, 960, 1, t, { sold: true });
  w += K.draw.kid(11, { x: 1010, y: 520, s: 0.36, armL: -50, armR: -50, face: { name: 'love', mouth: 'tongue', fx: ['hearts'] }, shadow: false });
  w += C.musicNotes(t, 1160, 380) + C.musicNotes(t + 0.4, 780, 420);
  let o = view(cam, w);
  o += S.g(T('THE WHOLE', 0, -70, 80, '#FFFFFF', OUT) + T('TRUCK.', 0, 40, 130, '#FF6FB5', { ...OUT, 'stroke-width': 16 }), `translate(1480 330) rotate(6) scale(${f(pop(seg(t, m5.word('whole').t0, m5.word('whole').t0 + 0.25)))})`);
  return o;
}

// ---- Mia and the hats
function hatPhone(t, sellK, final, tap) {
  // Mia's inventory app (phone screen space -150..150 x -280..280)
  let o = S.rect(-150, -280, 300, 560, 0, { fill: '#2A1640' }) + S.rect(-150, -280, 300, 70, 0, { fill: '#7C4DD8' }) + TF('MY HATS (412)', 0, -236, 26, '#FFFFFF');
  for (let i = 0; i < 9; i++) {
    const cx = -95 + (i % 3) * 95, cy = -150 + Math.floor(i / 3) * 100;
    o += S.rect(cx - 42, cy - 42, 84, 84, 14, ol(i === 4 ? '#FFE14D' : '#3A2460', 4)) + hat(HAT_KEYS[i % HAT_KEYS.length], cx, cy + 28, 0.42);
  }
  const g = final > 0;
  const press = tap ? 6 : 0;
  o += S.g(S.rect(-110, -38, 220, 76, 24, ol(g ? '#8A8F9C' : '#3BD16F', 6)) + T('SELL', 0, 22, 54, '#FFFFFF'), `translate(0 ${f(200 + press)}) scale(${f(1 + 0.08 * sellK * Math.sin(t * 20))})`);
  if (g) o += S.path('M-60 170 L-30 200 L-50 220 L-10 240', ln(4, '#151515'));
  return o;
}
function shotMia(t) {
  // living room ankle-deep in coins: Mia freezes... the hats
  const th = m6.word('hats').t0;
  const cam = camKeys(t, [[tMia, camAt(1185, 520, 1.6)], [th, camAt(1185, 480, 1.9)], [tSell, camAt(1185, 470, 2.0)]]);
  let w = livingRoom(t, { tvOn: 1 }) + ceilingHole(1000, 1, t) + couchAll();
  const real = t >= th;
  w += miaIn(t, 1185, 1010, 0.55, { face: real ? { name: 'shocked', fx: ['exclaim'] } : { name: 'confused' }, armR: 40, headRot: real ? 0 : -8 }, {}, 5, 0.4);
  w += coinStream(t, 1000, 16, 240, -60, 900, 900) + coinFloor(t, 905);
  let o = view(cam, w);
  if (real) o += S.g(S.circle(0, -40, 60, ol('#FFF27A', 7)) + S.rect(-26, 16, 52, 40, 8, ol('#B9C2D0', 5)) + K.rays(0, -40, 10, 120, '#FFF27A', 0.4, t * 60), `translate(1500 260) scale(${f(pop(seg(t, th, th + 0.25)))})`);
  return o;
}
function shotSell(t) {
  // Mia stabs her phone; smash into the screen on "SELL"
  const ts = m6.word('SELL').t0;
  const inScreen = t >= ts;
  if (!inScreen) {
    const cam = camKeys(t, [[tSell, camAt(1185, 540, 2.0)], [ts, camAt(1230, 560, 2.4)]]);
    let w = livingRoom(t, { tvOn: 1 }) + couchAll();
    w += miaIn(t, 1185, 1010, 0.55, { face: { name: 'scared', fx: ['sweat'] }, armR: 70 + 10 * Math.sin(t * 30), armL: 60 + 10 * Math.sin(t * 30 + 1) }, { arms: false }, 5, 1);
    w += coinFloor(t, 905);
    return view(cam, w);
  }
  const tap = Math.floor(t * 8) % 2 === 0;
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FF9EC4' }) + K.rays(960, 540, 16, 1400, '#FFFFFF', 0.18, t * 40);
  o += K.phone(960, 520, 1.55, -4, hatPhone(t, 1, 0, tap));
  // Mia's blocky finger jabbing SELL
  o += S.g(S.rect(-50, 0, 100, 300, 40, ol('#F4D3BC', 7)), `translate(${f(1130 + (tap ? 0 : 30))} ${f(tap ? 840 : 900)}) rotate(-30)`);
  o += bang('TAP TAP TAP', 1560, 260, seg(t, ts + 0.2, ts + 0.35), 60, 10, '#FFFFFF');
  return S.g(o, `translate(960 540) scale(${f(lerp(1.4, 1, ease.out(seg(t, ts, ts + 0.2))))}) translate(-960 -540)`);
}
function shotSys(t) {
  // SYSTEM popup: Sorry! ALL SALES FINAL. NO REFUNDS.
  const tf = m7.word('final').t0, tr = m7.word('refunds').t0;
  const cam = camKeys(t, [[tSys, { zoom: 1.0, x: 0, y: 0 }], [tNo, { zoom: 1.1, x: 0, y: 30 }]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#7C4DD8' }) + K.rays(960, 540, 16, 1400, '#FFFFFF', 0.08, t * 20);
  let scr = hatPhone(t, 0, seg(t, tf, tf + 0.1), false) + S.rect(-150, -280, 300, 560, 0, { fill: '#000', opacity: 0.45 });
  const kp = seg(t, tSys, tSys + 0.25);
  let pop1 = S.rect(-130, -150, 260, 300, 26, ol('#FFFFFF', 6)) + S.circle(0, -80, 40, ol('#FFE14D', 5)) + S.circle(-14, -88, 5, { fill: '#151515' }) + S.circle(14, -88, 5, { fill: '#151515' }) + S.path('M-18 -68 Q0 -52 18 -68', ln(5));
  pop1 += T('Sorry!', 0, 0, 46, '#151515') + TF('All sales are', 0, 44, 26, '#151515') + T('FINAL.', 0, 90, 44, t > tf ? '#E8243C' : '#151515');
  scr += S.g(pop1, `scale(${f(pop(kp))})`);
  w += K.phone(960, 520, 1.55, 3, scr);
  let o = view(cam, w);
  o += stamp('NO REFUNDS', 960, 620, seg(t, tr, tr + 0.2), -14, '#E8243C', 120);
  return o;
}
function shotNo(t) {
  // Mia on her knees: NOOOO — the camera rockets back
  const cam = camKeys(t, [[tNo, camAt(1185, 600, 2.4)], [tNo + 0.25, camAt(1185, 600, 1.5)], [tNoExt, camAt(1000, 300, 0.7)]], ease.out);
  let w = livingRoom(t, { tvOn: 1 }) + ceilingHole(1000, 1, t) + couchAll();
  w += family(t, { noTy: true, face: { dad: { name: 'shocked' }, mom: { name: 'shocked' } } }) + couch('seat') + couch('chaise');
  w += miaIn(t, 1185, 1040, 0.55, { bodyY: 160, armL: 150 + 10 * Math.sin(t * 30), armR: 150 - 10 * Math.sin(t * 30), face: { name: 'crying', mouth: 'wail' }, headRot: Math.sin(t * 40) * 3, phone: false }, { arms: false }, 5, 2);
  w += coinStream(t, 1000, 20, 240, -60, 900, 900) + coinFloor(t, 905);
  let o = view(cam, w);
  o += C.speedLines(0, 1920, 540, 22, 3, '#FFFFFF', 1000).repeat(t < tNo + 0.4 ? 1 : 0);
  return o;
}
function shotNoExt(t) {
  // exterior: the NOOOO shakes the house, birds scatter, coins geyser out of a hole in the roof
  const cam = camKeys(t, [[tNoExt, camAt(960, 600, 1.1)], [tDad, camAt(960, 580, 0.92)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: 'url(#s03sky)' }) + S.circle(1600, 260, 80, { fill: '#FFF6C8' });
  w += S.rect(-800, 880, 3520, 600, 0, { fill: '#6FCB5A' }) + S.rect(-800, 880, 3520, 14, 0, { fill: '#8FE07A' });
  for (let x = -200; x < 2200; x += 60) w += S.rect(x, 800, 26, 100, 6, ol('#FFFFFF', 4));
  w += S.rect(-200, 820, 2400, 16, 0, { fill: '#FFFFFF' });
  for (const [x, s] of [[300, 1.1], [1650, 0.9]]) w += S.g(S.rect(-20, -200, 40, 200, 8, ol('#8A5A34', 5)) + S.circle(0, -260, 110, ol('#3FAE5A', 6)) + S.circle(-60, -200, 70, ol('#58C06A', 6)), `translate(${x} 890) scale(${s})`);
  const sh = Math.sin(t * 60) * 6;
  w += S.g(B.house(960, 890, 1.0, '#8C88E8', '#4846A8', '#FFE9A8') + S.path('M1040 320 L1080 300 L1130 330 L1110 360 L1060 356 Z', ol('#2A1E3A', 5)), `translate(${f(sh)} 0)`);
  w += K.coinBurst(1085, 320, (t - tNoExt) % 0.9, 18, 1000, 26, 3) + K.coinBurst(1085, 320, (t - tNoExt + 0.45) % 0.9, 14, 900, 24, 8);
  for (let i = 0; i < 6; i++) {
    const a = (t - tNoExt) * (1 + hash(i));
    w += S.path(`M${f(700 + i * 100 + a * 500 * (hash(i * 3) - 0.3))} ${f(320 - a * 360 - i * 20)} q20 -20 40 0 q20 -20 40 0`, ln(7));
  }
  let o = view(cam, w);
  o += S.g(T('NOOOOOO!', 0, 0, 170, '#C49BFF', { ...OUT, 'stroke-width': 18 }), `translate(960 150) rotate(${f(Math.sin(t * 30) * 2)}) scale(${f(1 + 0.04 * Math.sin(t * 40))})`);
  return o;
}
function shotDad(t) {
  // Dad wanders in with his coffee; a coin plops into the mug, another bonks his head
  const tr = m9.word('raining').t0, tm = m9.word('money').t0;
  const cam = camKeys(t, [[tDad, camAt(1180, 520, 1.45)], [tBal, camAt(1100, 520, 1.6)]]);
  let w = livingRoom(t, { tvOn: 1 }) + ceilingHole(1000, 1, t) + couchAll();
  const walkU = seg(t, tDad, tDad + 1.2);
  const x = lerp(1500, 1120, ease.out(walkU));
  const bonk = bump(t, tm, tm + 0.35);
  const splash = seg(t, tr, tr + 0.4);
  const mugX = A.hand(70, -1)[0], mugY = A.hand(70, -1)[1] - 40;
  let mug = S.rect(-44, -60, 88, 110, 14, ol('#FFFFFF', 6)) + S.path('M-44 -40 Q-84 -20 -44 20', ln(10)) + S.rect(-34, -50, 68, 18, 6, { fill: '#6A3E1E' });
  if (splash > 0 && splash < 1) for (let i = 0; i < 5; i++) mug += S.circle(-30 + i * 15, -60 - Math.sin(splash * Math.PI) * (40 + i * 10), 9, { fill: '#8A5A34', stroke: '#151515', 'stroke-width': 3 });
  if (t > tr) mug += coin(0, -62, 22, 70, 1.4);
  w += actor('dad', t, { x, y: 1000, s: 0.58, turn: walkU < 1 ? -0.6 : -0.2, ...(walkU < 1 ? A.walkFront(t * 10, 0.8) : {}), armL: 70, armR: 15, headRot: -10 * bonk, sy: 1 - 0.08 * bonk, face: t > tm ? { name: 'dizzy', fx: ['question'] } : { name: 'confused', eyes: { look: [-0.3, -0.8] } }, props: [{ svg: S.g(mug, `translate(${f(mugX)} ${f(mugY)})`), layer: 'front' }] });
  // the specific coins: one into the mug, one onto his head
  const dropC = (t0, tx, ty) => { const k = seg(t, t0 - 0.5, t0); return k > 0 && k < 1 ? coin(tx, lerp(-60, ty, k * k), 26, 0, t * 10) : ''; };
  w += dropC(tr, x + mugX * 0.58, 1000 + mugY * 0.58 - 40);
  w += dropC(tm, x, 1000 - 1000 * 0.58 * 1.1);
  w += coinStream(t, 1000, 16, 220, -60, 900, 900) + coinFloor(t, 915);
  let o = view(cam, w);
  o += bang('PLOP', 700, 520, bump(t, tr, tr + 0.5), 60, -8, '#8A5A34');
  o += bang('BONK!', 1200, 200, bump(t, tm, tm + 0.6), 90, 8, '#FFE14D');
  return o;
}

// ---- family balances
function panelBg(col, x, y, w, h) {
  return S.rect(x, y, w, h, 0, { fill: col }) + S.rect(x, y, w, h, 0, { fill: 'url(#s02grid)' });
}
function dadPanel(t, k0) {
  // Dad + an upside-down controller; zero Robux; tumbleweed
  let o = panelBg('#5A6A8A', -800, -600, 3520, 2280);
  const pad = S.g(S.rect(-70, -34, 140, 68, 30, ol('#2B2F3A', 6)) + S.circle(-36, 0, 10, { fill: '#5A6078' }) + S.circle(36, 0, 8, { fill: '#FF5A5A' }) + S.circle(46, -16, 7, { fill: '#3BD16F' }), `translate(${f(A.hand(70, 1)[0])} ${f(A.hand(70, 1)[1] - 30)}) rotate(${f(180 + Math.sin(t * 3) * 20)}) scale(1.7)`);
  o += actor('dad', t, { x: 760, y: 1060, s: 0.66, turn: 0.2, armR: 70, armL: 20, face: { name: 'confused' }, props: [{ svg: pad, layer: 'front' }] });
  o += thought(1380, 330, 380, 220, TF('Ro-blocks?', 0, 14, 50, '#151515'), 1, -240, 160);
  if (k0 > 0) {
    o += S.g(K.counter(0, 0, 0, 2.0, '#9AA0AE'), `translate(1380 640) scale(${f(pop(k0))})`);
    const tw = (t - tBal) * 0;
    void tw;
  }
  return o;
}
function shotDadBal(t) {
  const tz = m10.word('Zero').t0;
  const cam = camKeys(t, [[tBal, camAt(960, 560, 1.0)], [tMom, camAt(960, 560, 1.08)]]);
  let w = dadPanel(t, seg(t, tz, tz + 0.25));
  if (t > tz) {
    const a = seg(t, tz + 0.1, tMom);
    let tw = S.circle(0, 0, 80, { fill: 'none', stroke: '#151515', 'stroke-width': 18 }) + S.circle(0, 0, 80, { fill: 'none', stroke: '#C9A06A', 'stroke-width': 10 });
    for (let i = 0; i < 5; i++) tw += S.path(`M${-70 + i * 10} ${-30 + i * 14} Q0 ${40 - i * 20} ${70 - i * 8} ${-20 + i * 10}`, ln(7, '#B08850'));
    w += S.g(tw, `translate(${f(lerp(-100, 2000, a))} ${f(940 - Math.abs(Math.sin(a * 12)) * 80)}) rotate(${f(a * 900)})`);
  }
  let o = view(cam, w);
  if (t > tz) o += bang('*cricket*', 1600, 900, seg(t, tz + 0.5, tz + 0.65), 44, 4, '#FFFFFF');
  return o;
}
function momPanel(t, kCard, k5) {
  let o = panelBg('#2FA89A', -800, -600, 3520, 2280);
  const binder = S.g(S.rect(-90, -110, 180, 220, 14, ol('#FFD86A', 6)) + S.rect(-70, -80, 140, 40, 6, ol('#FFFFFF', 4)) + S.rect(-70, -20, 140, 40, 6, ol('#FFFFFF', 4)) + TF('COUPONS', 0, 70, 26, '#7A4A2A'), `translate(${f(A.hand(50, -1)[0])} ${f(A.hand(50, -1)[1] - 40)})`);
  const card = kCard > 0 ? S.g(S.rect(-110, -70, 220, 140, 14, ol('#FF6FB5', 6)) + TF('GIFT CARD', 0, -20, 30, '#FFFFFF') + T('2019', 0, 40, 54, '#FFE14D', { stroke: '#151515', 'stroke-width': 6, 'paint-order': 'stroke' }) + S.path('M60 -70 Q90 -40 110 -70', ln(3, '#FFFFFF', 0.8)), `translate(${f(A.hand(130, 1)[0])} ${f(A.hand(130, 1)[1] - 70)}) rotate(-8) scale(${f(pop(kCard) * 1.3)})`) : '';
  o += actor('mom', t, { x: 960, y: 1060, s: 0.66, armL: 50, armR: kCard > 0 ? 130 : 30, face: { name: 'happy' }, props: [{ svg: binder, layer: 'front' }, { svg: card, layer: 'front' }] });
  if (k5 > 0) o += S.g(K.counter(0, 0, 5, 2.0, '#3BFF6A'), `translate(1500 360) rotate(4) scale(${f(pop(k5))})`);
  return o;
}
function shotMomBal(t) {
  // split: Dad's zero shrinks to a grey strip on the left; Mom pulls a 2019 gift card from her coupon binder
  const kc = seg(t, m10.word('gift').t0, m10.word('gift').t0 + 0.25), k5 = seg(t, m10.word('five').t0, m10.word('five').t0 + 0.25);
  const sl = ease.out(seg(t, tMom, tMom + 0.3));
  let o = S.g(momPanel(t, kc, k5), `translate(${f(lerp(1920, 0, sl))} 0)`);
  // Dad's panel squeezed into the left third
  const id = S.uid('dp');
  const wDad = lerp(1920, 560, sl);
  o += S.clipDef(id, S.rect(0, 0, wDad, 1080)) + S.g(S.g(dadPanel(tMom, 1), `translate(${f(-680 * sl)} 0)`) + S.rect(0, 0, 1920, 1080, 0, { fill: '#202030', opacity: f(0.45 * sl) }), null, { 'clip-path': `url(#${id})` });
  o += S.rect(wDad - 8, 0, 16, 1080, 0, { fill: '#151515' });
  if (t > m10.word('2019').t0) o += S.g(S.circle(0, 0, 50, { fill: '#D9CFB8', opacity: 0.7 }), `translate(${1150 + A.hand(130, 1)[0] * 0.66} ${1060 + (A.hand(130, 1)[1] - 70) * 0.66}) scale(${f(1 + seg(t, m10.word('2019').t0, m10.word('2019').t0 + 0.5) * 2)})`, { opacity: f(1 - seg(t, m10.word('2019').t0, m10.word('2019').t0 + 0.5)) });
  return o;
}
function shotMom2(t) {
  // Mom close-up: "I'll take it." — the sunglasses slide down from her head
  const tt = m11.word("I'll").t0;
  const cam = camKeys(t, [[tMom2, camAt(960, 520, 1.6)], [tGma, camAt(960, 500, 1.85)]]);
  let w = S.rect(-800, -600, 3520, 2280, 0, { fill: '#2FA89A' }) + K.rays(960, 400, 14, 1400, '#FFFFFF', 0.08, t * 10);
  const down = ease.outBack(seg(t, tt + 0.1, tt + 0.45));
  const shades = S.g(S.path(S.roundedPath([[-150, -40], [-14, -40], [-20, 40], [-140, 40]], 22), ol('#2A2A33', 7)) + S.path(S.roundedPath([[14, -40], [150, -40], [140, 40], [20, 40]], 22), ol('#2A2A33', 7)) + S.path('M-14 -24 L14 -24', ln(8)) + S.path('M-120 -20 L-80 -20', ln(6, '#FFFFFF', 0.6)), `translate(0 ${f(lerp(-900, -712, down))})`);
  const cardSvg = S.g(S.rect(-90, -56, 180, 112, 12, ol('#FF6FB5', 6)) + T('$5', 0, 24, 64, '#FFFFFF', OUT), `translate(${f(A.hand(100, 1)[0])} ${f(A.hand(100, 1)[1] - 50)}) rotate(-10)`);
  w += actorD(MOM_PLAIN, 'MOM', t, { x: 960, y: 1080, s: 0.62, armR: 100, armL: 10, face: down > 0.5 ? { name: 'smug' } : { name: 'happy' }, props: [{ svg: S.g(shades, ''), layer: 'front' }, { svg: cardSvg, layer: 'front' }] }, { arms: false, seed: 3 });
  let o = view(cam, w);
  if (down > 0.9) o += K.sparkles([[1180, 330, 34], [760, 300, 24]], t);
  o += S.g(K.counter(0, 0, 5, 1.4, '#3BFF6A'), 'translate(1560 220) rotate(5)');
  return o;
}
function gmaRoom(t) {
  let o = S.rect(-800, -600, 3520, 2280, 0, { fill: '#5A3E9A' }) + S.rect(-800, 80, 3520, 18, 0, { fill: 'url(#s03rgb)' });
  // trophy shelf
  o += S.rect(1060, 420, 640, 24, 6, ol('#8A5A34', 5));
  for (let i = 0; i < 4; i++) {
    const x = 1130 + i * 160, gl = Math.abs(Math.sin(t * 3 + i));
    o += S.path(`M${x - 40} 330 Q${x} 420 ${x + 40} 330 Z`, ol('#FFD21F', 5)) + S.rect(x - 10, 370, 20, 30, 0, ol('#FFD21F', 4)) + S.rect(x - 30, 398, 60, 22, 4, ol('#8A5A34', 4)) + K.F.sparkle(x + 30, 320, 16 * gl);
  }
  o += S.g(S.rect(-170, -50, 340, 100, 14, ol('#FF4DA6', 6)) + T('OBBY QUEEN', 0, 20, 50, '#FFFFFF'), 'translate(1380 270) rotate(3)');
  o += S.g(S.rect(-130, -360, 260, 330, 60, ol('#2B2F3A', 7)) + S.rect(-90, -320, 180, 120, 30, ol('#FF4DA6', 5)) + S.rect(-150, -40, 300, 60, 24, ol('#2B2F3A', 7)) + S.path('M0 20 L0 120 M-80 140 L80 140', ln(14)), 'translate(760 900)');
  o += S.rect(-800, 860, 3520, 900, 0, { fill: '#3A2A6A' });
  // desk + laptop with RGB glow
  o += S.rect(300, 700, 1300, 40, 10, ol('#2B2F3A', 6)) + S.rect(360, 740, 30, 160, 0, ol('#2B2F3A', 5)) + S.rect(1510, 740, 30, 160, 0, ol('#2B2F3A', 5));
  return o;
}
function laptop(x, y, s, t, scr) {
  let o = S.path('M-220 0 L220 0 L250 30 L-250 30 Z', ol('#C9D1DC', 6)) + S.rect(-200, -280, 400, 280, 18, ol('#2B2F3A', 7)) + S.rect(-180, -262, 360, 244, 8, { fill: '#0E1220' }) + S.g(scr, 'translate(0 -140)');
  o += S.rect(-200, 26, 400, 8, 4, { fill: 'url(#s03rgb)' });
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function obbyScreen(t, win = 0) {
  let o = S.rect(-180, -122, 360, 244, 0, { fill: '#7FD0FF' });
  for (let i = 0; i < 6; i++) o += S.rect(-170 + ((i * 70 - t * 160) % 420 + 420) % 420, 40 - (i % 3) * 40, 60, 16, 4, ol(['#FF5A5A', '#FFD21F', '#3BD16F'][i % 3], 3));
  o += S.rect(-10, -10 - Math.abs(Math.sin(t * 9)) * 50, 20, 30, 4, ol('#FFC83D', 3));
  if (win > 0) o += S.rect(-180, -122, 360, 244, 0, { fill: '#000', opacity: 0.4 }) + T('WORLD RECORD!', 0, 10, 40, '#FFE14D', { stroke: '#151515', 'stroke-width': 5, 'paint-order': 'stroke' });
  return o;
}
function shotGma(t) {
  // Grandma's gaming den: 800 Robux from obby tournaments
  const t8 = m12.word('eight').t0, tt = m12.word('tournaments').t0;
  const cam = camKeys(t, [[tGma, camAt(980, 640, 1.35)], [tt, camAt(940, 620, 1.5)], [tCmp, camAt(940, 620, 1.55)]]);
  let w = gmaRoom(t);
  w += actor('grandma', t, { x: 760, y: 1050, s: 0.62, turn: 0.2, armR: 150 * bump(t, tt, tt + 0.8) + 20, armL: 30, face: t > tt ? { name: 'joy' } : undefined });
  w += laptop(1180, 700, 0.9, t, obbyScreen(t));
  let o = view(cam, w);
  const roll = Math.round(800 * ease.out(seg(t, t8, t8 + 0.8)));
  if (t > t8) o += S.g(K.counter(0, 0, roll, 1.9, '#FFE14D') + (roll >= 800 ? K.F.sparkle(200, -60, 30) : ''), `translate(1420 820) rotate(-4) scale(${f(pop(seg(t, t8, t8 + 0.25)))})`);
  if (t > tt) o += bang('GG!', 1700, 520, seg(t, tt, tt + 0.15), 100, 10, '#5CF2FF');
  return o;
}
function shotCmp(t) {
  // three panels: 0 · 5 · 800
  const cols = ['#5A6A8A', '#2FA89A', '#5A3E9A'];
  const who = ['dad', 'mom', 'grandma'], val = [0, 5, 800];
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#1A1430' });
  for (let i = 0; i < 3; i++) {
    const k = ease.outBack(seg(t, tCmp + i * 0.12, tCmp + i * 0.12 + 0.3));
    const x0 = i * 640;
    const id = S.uid('cp');
    let p = S.rect(x0, 0, 640, 1080, 0, { fill: cols[i] }) + S.rect(x0, 0, 640, 1080, 0, { fill: 'url(#s02grid)' });
    if (i === 2) p += K.rays(x0 + 320, 500, 14, 900, '#FFE14D', 0.2, t * 30);
    p += actor(who[i], t, { x: x0 + 320, y: 1100, s: 0.62, face: { name: ['sad', 'happy', 'joy'][i] }, armR: i === 2 ? 160 : 15, armL: i === 2 ? 30 : 15 });
    p += K.counter(x0 + 320, 200, val[i], 1.5, ['#9AA0AE', '#3BFF6A', '#FFE14D'][i]);
    o += S.clipDef(id, S.rect(x0, 0, 640, 1080)) + S.g(S.g(p, `translate(0 ${f(lerp(1080, 0, k))})`), null, { 'clip-path': `url(#${id})` });
  }
  o += S.rect(632, 0, 16, 1080, 0, { fill: '#151515' }) + S.rect(1272, 0, 16, 1080, 0, { fill: '#151515' });
  return o;
}
function shotGame(t) {
  // Grandma speed-runs an obby; the whole family peers over her shoulder in awe
  const tr = m13.word('Roblox').t0;
  const cam = camKeys(t, [[tGame, camAt(960, 560, 1.0)], [tr, camAt(1000, 540, 1.12)], [END, camAt(1020, 530, 1.2)]]);
  let w = gmaRoom(t);
  const awe = { name: 'amazed', eyes: { look: [0.5, 0.3] } };
  w += actor('dad', t, { x: 300, y: 960, s: 0.5, turn: 0.4, face: awe });
  w += actor('mom', t, { x: 480, y: 980, s: 0.5, turn: 0.4, face: awe });
  w += miaIn(t, 1560, 980, 0.48, { turn: -0.4, face: { name: 'amazed', eyes: { look: [-0.5, 0.3] } }, armR: 40 }, {}, 5, 0.4);
  w += actor('pickle', t, { x: 1740, y: 990, s: 0.48, turn: -0.4, face: { name: 'excited' }, armL: 120, armR: 120 });
  w += actor('ty', t, { x: 1390, y: 1000, s: 0.52, turn: -0.3, face: { name: 'shocked', eyes: { look: [-0.5, 0.3] } } });
  const win = t >= tr;
  w += laptop(1080, 760, 0.9, t, obbyScreen(t, win ? 1 : 0));
  const typ = Math.sin(t * 40);
  w += actor('grandma', t, { x: 760, y: 1080, s: 0.56, view: 'back', armL: win ? 160 : 40 + 8 * typ, armR: win ? 160 : 40 - 8 * typ, lift: win ? 40 * Math.abs(Math.sin(t * 8)) : 0 });
  let o = view(cam, w);
  if (!win) o += bang('clack clack clack', 1080, 470, 1, 44, -6, '#FFFFFF');
  if (win) o += K.confetti(t, tr, 50, 3) + bang('WORLD RECORD!', 960, 180, seg(t, tr, tr + 0.2), 110, -4, '#FFE14D');
  return o;
}

// ---------------------------------------------------------------- router
function scene(t) {
  let o;
  if (t < tTv) o = shotOn(t);
  else if (t < tEq) o = shotTv(t);
  else if (t < tNow) o = shotEq(t);
  else if (t < tJolt) o = shotNow(t);
  else if (t < tPush) o = shotJolt(t);
  else if (t < tJack) o = shotPush(t);
  else if (t < tCeil) o = shotJack(t);
  else if (t < tN1) o = shotCeil(t);
  else if (t < tN2) o = shotN1(t);
  else if (t < tN3) o = shotN2(t);
  else if (t < tN3b) o = shotN3(t);
  else if (t < tSurf) o = shotN3b(t);
  else if (t < tTruck) o = shotSurf(t);
  else if (t < tWhole) o = shotTruck(t);
  else if (t < tMia) o = shotWhole(t);
  else if (t < tSell) o = shotMia(t);
  else if (t < tSys) o = shotSell(t);
  else if (t < tNo) o = shotSys(t);
  else if (t < tNoExt) o = shotNo(t);
  else if (t < tDad) o = shotNoExt(t);
  else if (t < tBal) o = shotDad(t);
  else if (t < tMom) o = shotDadBal(t);
  else if (t < tMom2) o = shotMomBal(t);
  else if (t < tGma) o = shotMom2(t);
  else if (t < tCmp) o = shotGma(t);
  else if (t < tGame) o = shotCmp(t);
  else o = shotGame(t);
  for (const tc of CUTS) if (Math.abs(t - tc) < 0.08) o += C.whiteFlash(0.35 * (1 - Math.abs(t - tc) / 0.08));
  return o;
}
const look = (t) => (t >= tPush && t < tJack ? { grade: 'warm', vignette: 1 } : { grade: 'warm' });
// TV-full and phone shots: keep the captions under the ticker / phone
const captionY = (t) => ((t >= tTv && t < tJolt) || (t >= tN1 && t < tSurf) ? 1046 : 1010);

module.exports = { scene, look, DEFS, captionY, livingRoom, couch, stairs, newsroom, tvFull, coinFloor, coinStream, ceilingHole, family, roomShot, truck, street };
