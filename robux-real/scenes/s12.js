// SC 12 · FINALE — the morning after the reset: the house, the good news on TV, Dad's paycheck + free coffee, Mom's coupons,
// Grandma's new password and her charity stream, Mia's worthless hats, Ty broke, Pickle's one Robux, the shoe,
// the "pretty okay millionaire", and the TV that turns itself on: EVERY game coin becomes real money... "...Oh no."
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, rays, bang } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const S11 = require('./s11');
const { D } = require('../rig/cast');

const S12 = K.V.scene('SC 12').start, S13 = K.V.scene('SC 13').start;
const l = (i) => L('12.' + i);
const l0 = l(0), l1 = l(1), l2 = l(2), l3 = l(3), l4 = l(4), l5 = l(5), l6 = l(6), l7 = l(7), l8 = l(8);
const l9 = l(9), l10 = l(10), l11 = l(11), l12 = l(12), l13 = l(13), l14 = l(14), l15 = l(15), l16 = l(16);

// ---------------------------------------------------------------- beats (all from the voice)
const tWipe = l0.word('morning').t0 - 0.4;          // pixel wipe from the reset wave into the morning
const tMorning = tWipe + 0.38;
const tNormal = l0.word('normal').t0;
const tLiving = l1.a - 0.14;                        // living room: "Good news, everyone!"
const tTV1 = l1.word('Robux').t0 - 0.12;            // TV close: just a game currency
const tBread = l1.word('And').t0 - 0.1;             // TV close: bread
const tTwoD = l1.word('two').t0;
const tDad = l2.a - 0.1;                            // Dad's paycheck
const tDollars = l2.word('dollars').t0;
const tMom = l2.word('Mom').t0 - 0.12;              // Mom's coupons
const tCoupons = l2.word('coupons').t0;
const tGma = l2.word('And').t0 - 0.1;               // Grandma changes her password
const tPwd = l2.word('password').t0;
const tReal = l2.word('For').t0 - 0.1;              // "For real this time."
const tCoffee = l3.a - 0.15;                        // Dad + the free coffee machine
const tFree = l3.word('FREE').t0;
const tStream = l4.a - 0.1;                         // the stream: two million viewers
const tViewers = l4.word('viewers').t0;
const tCharity = l4.word('She').t0 - 0.1;           // charity stream
const tPw3 = l5.a - 0.12;                           // "It's password three!"
const tPwW = l5.word('password').t0;
const tWork = l6.a - 0.15;                          // Ty: "...We're working on it."
const tMiaRoom = l7.a - 0.12;                       // Mia in the hats
const tNothing = l7.word('nothing').t0;
const tHappier = l7.word("I've").t0 - 0.2;
const tMe = l8.a - 0.1;                             // Ty: "And me?"
const tBroke = l8.word("I'm").t0 - 0.1;
const tLaugh = l8.word('Totally').t0 - 0.45;
const tHere = l9.a - 0.1;                           // Pickle: "Here."
const tCoin = l9.word('One').t0 - 0.12;
const tNext = l9.word('For').t0 - 0.1;
const tThanks = l10.a - 0.08;
const tSpend = l10.word("I'm").t0 - 0.1;
const tShoeW = l10.word('shoe').t0, tForYou = l10.word('For').t0;
const tShoe = l11.a - 0.12;                         // "A SHOE?!"
const tRecord = l12.a - 0.08;                       // Mia: "For the record..."
const tOkay = l12.word('pretty').t0;
const tDay = l12.word('For', 1).t0 - 0.1;
const tThxMia = l13.a - 0.12;
const tOn = l14.a - 0.12;                           // the TV turns itself on
const tNews = l14.word('Starting').t0 - 0.15;
const tEvery = l14.word('EVERY').t0, tMoneyW = l14.word('real').t0;
const tBeat = l14.b + 0.08;                         // the 1 s silence
const tTurnPk = tBeat + 0.25;                       // Pickle slowly turns to camera
const tTyNo = l16.a - 0.1;                          // Ty, deadpan, to camera (his eyes slide over)
const tOhNo = l16.a;

// ---------------------------------------------------------------- defs
const DEFS = `<defs>
<pattern id="s12diam" patternUnits="userSpaceOnUse" width="90" height="90"><rect width="90" height="90" fill="#FFF1D6"/><path d="M45 14 L60 45 L45 76 L30 45 Z" fill="none" stroke="#BFE8D2" stroke-width="4"/><circle cx="0" cy="0" r="4" fill="#BFE8D2"/><circle cx="90" cy="0" r="4" fill="#BFE8D2"/><circle cx="0" cy="90" r="4" fill="#BFE8D2"/><circle cx="90" cy="90" r="4" fill="#BFE8D2"/></pattern>
<pattern id="s12oak" patternUnits="userSpaceOnUse" width="320" height="56"><rect width="320" height="56" fill="#E6BE87"/><rect y="28" width="320" height="28" fill="#DDB27A"/><path d="M0 0 L320 0 M0 28 L320 28 M110 0 L110 28 M250 28 L250 56" stroke="#C4945A" stroke-width="3"/><path d="M20 12 Q60 8 90 14 M150 42 Q190 38 230 44" stroke="#D3A56B" stroke-width="3" fill="none"/></pattern>
<pattern id="s12lavP" patternUnits="userSpaceOnUse" width="120" height="120"><rect width="120" height="120" fill="#C9B6F2"/><path d="M60 40 l6 14 l14 2 l-10 10 l3 14 l-13 -7 l-13 7 l3 -14 l-10 -10 l14 -2 Z" fill="#D9CAF8"/></pattern>
<pattern id="s12dots" patternUnits="userSpaceOnUse" width="60" height="60"><rect width="60" height="60" fill="#6A3FB8"/><circle cx="15" cy="15" r="5" fill="#7E52CC"/><circle cx="45" cy="45" r="5" fill="#7E52CC"/></pattern>
<linearGradient id="s12sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CC8FF"/><stop offset="0.6" stop-color="#BDE6FF"/><stop offset="1" stop-color="#FFE3BC"/></linearGradient>
<linearGradient id="s12studio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2E7A"/><stop offset="1" stop-color="#3A5BD8"/></linearGradient>
<linearGradient id="s12studioR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A1030"/><stop offset="1" stop-color="#C8243F"/></linearGradient>
<linearGradient id="s12side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EAD3AE"/><stop offset="1" stop-color="#F7E4C4"/></linearGradient>
<linearGradient id="s12office" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE6F7"/><stop offset="1" stop-color="#E8F4FC"/></linearGradient>
<linearGradient id="s12game" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FB2FF"/><stop offset="1" stop-color="#B8ECFF"/></linearGradient>
<radialGradient id="s12tvGlow"><stop offset="0" stop-color="#8FD8FF" stop-opacity="0.55"/><stop offset="1" stop-color="#8FD8FF" stop-opacity="0"/></radialGradient>
<radialGradient id="s12sun"><stop offset="0" stop-color="#FFF4C4" stop-opacity="0.9"/><stop offset="1" stop-color="#FFE7A0" stop-opacity="0"/></radialGradient>
<radialGradient id="s12led"><stop offset="0" stop-color="#FF6FD8" stop-opacity="0.45"/><stop offset="1" stop-color="#FF6FD8" stop-opacity="0"/></radialGradient>
</defs>`;

const at = (px, py, zoom) => ({ zoom, x: px - 960, y: py - 540 });
const ob = (u) => (u <= 0 ? 0 : ease.outBack(u)); // outBack that is exactly 0 before it starts
const W = (cam, svg) => view(cam, svg, 1);
const soft = (x, y, r, id, op = 1) => S.circle(x, y, r, { fill: `url(#${id})`, opacity: f(op) });
const flashCut = (t, tc) => C.whiteFlash(0.5 * bump(t, tc - 0.05, tc + 0.09));


// small copies of the old env pieces that env.js does not export
function nHouse(x, base, w, h, wall, roof) {
  const top = base - h;
  let o = S.rect(x, top, w, h, 8, ol(wall, 6)) + S.path(`M${x - 24} ${top + 8} L${x + w / 2} ${top - h * 0.55} L${x + w + 24} ${top + 8} Z`, ol(roof, 6));
  for (const fx of [0.12, 0.62]) o += S.rect(x + w * fx, top + h * 0.2, w * 0.26, h * 0.26, 6, ol('#BDEBFF', 5)) + S.path(`M${f(x + w * fx + w * 0.13)} ${f(top + h * 0.2)} l0 ${f(h * 0.26)}`, ln(4));
  o += S.rect(x + w * 0.4, base - h * 0.42, w * 0.2, h * 0.42, 6, ol('#7A3B52', 5));
  return o;
}
function tree(x, base, s) {
  return S.g(S.rect(-18, -170, 36, 172, 6, ol('#8A5A33', 5)) + S.circle(0, -230, 110, ol('#3FBF5A', 6)) + S.circle(-70, -170, 70, ol('#3FBF5A', 6)) + S.circle(70, -175, 74, ol('#3FBF5A', 6)) + S.circle(-30, -270, 40, { fill: '#8BE88A', opacity: 0.6 }), `translate(${x} ${base}) scale(${s})`);
}
function miniObby(x, y, t) {
  let o = '';
  for (let i = 0; i < 4; i++) o += S.rect(x + i * 56, y - i * 40 + Math.sin(t * 1.6 + i) * 4, 44, 18, 5, ol(['#FF5A5A', '#FFB000', '#3BD16F', '#3B8BFF'][i], 3));
  return o;
}

// ---------------------------------------------------------------- props
function mug(x, y, s = 1, steam = 0, t = 0, col = '#FF6F61') {
  let o = S.rect(-40, -50, 80, 96, 14, ol(col, 6)) + S.path('M40 -24 Q80 -24 80 6 Q80 32 40 30', ln(14, '#151515')) + S.path('M40 -24 Q80 -24 80 6 Q80 32 40 30', ln(7, col));
  o += S.ellipse(0, -48, 36, 10, { fill: '#6B3E1E' }) + S.path('M-26 -30 L-26 20', ln(8, '#FFFFFF', 0.4));
  if (steam > 0) for (let i = 0; i < 3; i++) { const ph = (t * 0.8 + i / 3) % 1; o += S.path(`M${-18 + i * 18} ${f(-60 - ph * 80)} q12 -16 0 -32`, ln(7, '#FFFFFF', f(steam * (1 - ph)))); }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function bill(x, y, s = 1, rot = 0) {
  return S.g(S.rect(-90, -46, 180, 92, 10, ol('#7BD88F', 5)) + S.rect(-74, -32, 148, 64, 8, { fill: 'none', stroke: '#3E9A57', 'stroke-width': 4 }) + S.circle(0, 0, 24, ol('#BFF5C8', 4)) + T('$', 0, 14, 38, '#1E6B33'), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function shoeIcon(x, y, s = 1, rot = 0) {
  return S.g(S.path('M-90 10 L-90 -40 Q-90 -60 -60 -60 L-20 -60 Q0 -30 40 -24 Q90 -16 92 10 Z', ol('#FF4D4D', 7)) + S.rect(-96, 6, 194, 30, 12, ol('#FFFFFF', 7)) + S.path('M-50 -50 L-30 -30 M-34 -56 L-14 -36', ln(6, '#FFFFFF')), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// generic video-game currencies (not Robux): star coin, gem, ring, token, diamond
function gameCoin(kind, x, y, s = 1, rot = 0) {
  let o = '';
  if (kind === 0) o = S.circle(0, 0, 40, ol('#FFD84A', 6)) + S.path(K.F.starPath(0, 0, 24), ol('#FFF4B0', 4));
  else if (kind === 1) o = S.path('M0 -46 L36 -18 L24 40 L-24 40 L-36 -18 Z', ol('#B06BFF', 6)) + S.path('M0 -46 L0 40 M-36 -18 L36 -18', ln(4, '#E2C8FF'));
  else if (kind === 2) o = S.circle(0, 0, 38, { fill: 'none', stroke: '#151515', 'stroke-width': 22 }) + S.circle(0, 0, 38, { fill: 'none', stroke: '#FFC93C', 'stroke-width': 12 });
  else if (kind === 3) o = S.rect(-44, -28, 88, 56, 10, ol('#FF6FB5', 6)) + S.circle(-44, 0, 10, { fill: '#FFFFFF' }) + S.circle(44, 0, 10, { fill: '#FFFFFF' }) + TF('★', 0, 12, 34, '#FFFFFF');
  else o = S.path('M0 -44 L40 0 L0 44 L-40 0 Z', ol('#4FD3FF', 6)) + S.path('M-14 -20 L0 -30', ln(6, '#FFFFFF'));
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}

// ---------------------------------------------------------------- sitting (front view): torso from the rig, legs drawn end-on
function sitLegs(name, x, seatY, footY, s) {
  const st = D[name].style, c = st.col, k = s * (st.size || 1), w = 7 * k;
  let o = '';
  for (const side of [-1, 1]) {
    const lx = x + side * 50 * k;
    const sock = st.sock && st.sock.side === side;
    const top = seatY + 30 * k, bot = footY - 26 * k;
    o += S.rect(lx - 37 * k, top, 74 * k, bot - top, 10 * k, ol(c.pantsShade || c.pants, w));
    if (sock) o += S.rect(lx - 44 * k, footY - 40 * k, 88 * k, 44 * k, 18 * k, ol(st.sock.col || '#FFFFFF', w));
    else {
      o += S.rect(lx - 50 * k, footY - 42 * k, 100 * k, 46 * k, 14 * k, ol(c.sole, w));
      o += S.path(`M${f(lx - 40 * k)} ${f(footY - 30 * k)} A${f(40 * k)} ${f(30 * k)} 0 0 1 ${f(lx + 40 * k)} ${f(footY - 30 * k)} Z`, ol(c.toe, w));
    }
    // the thigh seen end-on: a lighter top face (lap) above the knee front
    o += S.rect(lx - 47 * k, seatY - 44 * k, 94 * k, 104 * k, 22 * k, ol(c.pants, w));
    o += S.rect(lx - 40 * k, seatY - 38 * k, 80 * k, 44 * k, 16 * k, { fill: '#FFFFFF', opacity: 0.28 });
    o += S.path(`M${f(lx - 40 * k)} ${f(seatY + 12 * k)} L${f(lx + 40 * k)} ${f(seatY + 12 * k)}`, ln(4 * k, '#000', 0.18));
  }
  return o;
}
const sitY = (name, seatY, s) => seatY - 4 + 306 * s * (D[name].style.size || 1);

// ---------------------------------------------------------------- Ty's living room (shared spec with SC 03)
const SEAT = 742, FEET = 912, CS = 0.5;               // seat line, feet line, couch cast scale
const SX = { left: 790, mid: 1000, right: 1200 };      // the three seats
const rw = (x) => 862 + (x - 1480) * 0.2;              // right-wall floor line
function windowLeft(t) {
  let o = S.rect(60, 110, 470, 520, 18, ol('#FFFFFF', 10));
  o += S.rect(84, 134, 422, 472, 8, { fill: 'url(#s12sky)' });
  o += S.circle(400, 250, 70, { fill: '#FFF1A8' }) + S.circle(400, 250, 140, { fill: 'url(#s12sun)' });
  for (const [x, y, s] of [[180, 200, 0.5], [330, 330, 0.4]]) o += K.E.cloud(x + Math.sin(t * 0.2 + x) * 10, y, s);
  o += S.path('M84 520 Q200 470 300 500 Q400 530 506 480 L506 606 L84 606 Z', { fill: '#7FD08A' }) + S.path('M150 606 L150 470 M150 470 q-50 -20 -40 -70 q30 -10 40 70 q40 -60 70 -40 q-10 50 -70 40', ol('#5CB85C', 5));
  o += S.path('M295 134 L295 606 M84 370 L506 370', ln(12, '#FFFFFF')) + S.path('M295 134 L295 606 M84 370 L506 370', ln(4, '#E0E0E0'));
  o += S.rect(40, 616, 510, 30, 8, ol('#FFFFFF', 7));
  // curtains
  o += S.path('M30 90 Q60 360 20 660 L110 660 Q130 360 100 90 Z', ol('#FF8A65', 6)) + S.path('M560 90 Q530 360 570 660 L480 660 Q460 360 490 90 Z', ol('#FF8A65', 6));
  o += S.rect(10, 80, 580, 22, 10, ol('#C98A3C', 5));
  return o;
}
function familyPhoto(x, y) {
  let o = S.rect(x - 140, y - 96, 280, 192, 10, ol('#B07A42', 8)) + S.rect(x - 116, y - 72, 232, 144, 4, { fill: '#BDE6FF' });
  const heads = [['#4A3426', '#E0A985', -80, 0], ['#8B3A2E', '#B9805D', -30, 4], ['#C9CBD4', '#F2D7C6', 18, 8], ['#B79BE8', '#F4D3BC', 60, 2], ['#1FB5A8', '#E9B38B', 96, 12]];
  for (const [hc, sk, dx, dy] of heads) o += S.rect(x + dx - 18, y + dy + 4, 36, 60, 6, { fill: '#7A8294' }) + S.rect(x + dx - 20, y + dy - 34, 40, 40, 8, ol(sk, 3)) + S.rect(x + dx - 22, y + dy - 40, 44, 16, 6, { fill: hc });
  o += S.rect(x - 116, y + 50, 232, 22, 0, { fill: '#7FD08A' });
  return o;
}
function plant(x, base, t) {
  let o = '';
  for (let i = 0; i < 6; i++) {
    const a = -150 + i * 24 + Math.sin(t * 1.2 + i) * 3;
    o += S.g(S.path('M0 0 Q60 -50 150 -10 Q70 30 0 0 Z', ol(i % 2 ? '#3FAE5A' : '#4CC46A', 5)) + S.path('M10 0 L130 -10', ln(3, '#2E8A45')), `translate(${x} ${base - 150}) rotate(${a})`);
  }
  o += S.path(`M${x} ${base - 150} L${x} ${base - 90}`, ln(8, '#2E8A45'));
  o += S.path(`M${x - 60} ${base - 100} L${x + 60} ${base - 100} L${x + 46} ${base} L${x - 46} ${base} Z`, ol('#E07A4F', 6)) + S.rect(x - 66, base - 112, 132, 22, 6, ol('#C9653E', 5));
  return o;
}
// the TV on its low teal stand against the right wall (in perspective); inner = screen svg in the -800..800 x -450..450 box
function tvSet(t, inner, ticker = '', glow = 0) {
  let o = '';
  // stand: front face along the wall
  const x0 = 1560, x1 = 1880;
  const b0 = rw(x0) + 54, b1 = rw(x1) + 54;
  o += S.path(`M${x0} ${b0 - 120} L${x1} ${b1 - 120} L${x1} ${b1} L${x0} ${b0} Z`, ol('#2FA8A0', 7));
  o += S.path(`M${x0 - 20} ${b0 - 126} L${x1} ${b1 - 132} L${x1} ${b1 - 112} L${x0} ${b0 - 112} Z`, ol('#5FD0C6', 6));
  o += S.path(`M${x0 + 30} ${b0 - 90} L${(x0 + x1) / 2 - 10} ${(b0 + b1) / 2 - 90} L${(x0 + x1) / 2 - 10} ${(b0 + b1) / 2 - 20} L${x0 + 30} ${b0 - 20} Z`, ol('#249089', 5));
  o += S.path(`M${(x0 + x1) / 2 + 10} ${(b0 + b1) / 2 - 90} L${x1 - 30} ${b1 - 90} L${x1 - 30} ${b1 - 20} L${(x0 + x1) / 2 + 10} ${(b0 + b1) / 2 - 20} Z`, ol('#249089', 5));
  if (glow > 0) o += S.circle(1600, 600, 520, { fill: 'url(#s12tvGlow)', opacity: f(glow) });
  // TV in perspective: squashed in x, sheared down to the right
  const cx = 1715, cy = (b0 + b1) / 2 - 300;
  o += S.g(K.tv(0, 0, 0.27, inner, ticker, t), `translate(${cx} ${f(cy)}) matrix(0.74 0.12 0 1 0 0)`);
  return o;
}
function livingBg(t, opts = {}) {
  let o = S.rect(-600, -600, 2100, 1470, 0, { fill: 'url(#s12diam)' });
  o += S.rect(-600, 820, 2100, 44, 0, ol('#FFFFFF', 6));
  // right wall in perspective
  o += S.path(`M1480 -600 L2600 -900 L2600 ${rw(2600)} L1480 ${rw(1480)} Z`, { fill: 'url(#s12side)' });
  o += S.path(`M1480 -600 L1480 ${rw(1480)}`, ln(6, '#D9BE93'));
  o += S.path(`M1480 ${rw(1480) - 40} L2600 ${rw(2600) - 40}`, ln(16, '#FFFFFF')) + S.path(`M1480 ${rw(1480) - 50} L2600 ${rw(2600) - 50}`, ln(3, '#D9BE93'));
  // floor
  o += S.path(`M-600 862 L1480 862 L2600 ${rw(2600)} L2600 1700 L-600 1700 Z`, { fill: 'url(#s12oak)' });
  o += S.rect(-600, 862, 3200, 10, 0, { fill: '#000', opacity: 0.08 });
  o += windowLeft(t) + familyPhoto(960, 300);
  // a sunbeam from the window
  o += S.path('M500 140 L560 660 L1100 1200 L640 1200 L120 640 Z', { fill: '#FFF4C4', opacity: 0.18 });
  o += plant(1395, 870, t);
  // rug
  o += S.ellipse(1000, 1010, 560, 90, ol('#7FD8C2', 6)) + S.ellipse(1000, 1010, 470, 66, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 6, 'stroke-dasharray': '18 14' });
  o += tvSet(t, opts.tvInner || tvOff(), opts.ticker || '', opts.tvGlow || 0);
  return o;
}
// couch in two halves so the sitters slot in between
function couchBack() {
  let o = S.rect(600, 520, 800, 260, 44, ol('#F28B3A', 8));
  for (let i = 0; i < 3; i++) o += S.rect(632 + i * 248, 548, 238, 190, 36, ol('#FF9F4F', 6)) + S.path(`M${662 + i * 248} 580 Q${750 + i * 248} 566 ${840 + i * 248} 580`, ln(6, '#FFC08A'));
  o += S.rect(600, 716, 800, 60, 24, ol('#FFA95E', 7));
  return o;
}
function couchFront() {
  let o = S.rect(596, 752, 808, 96, 26, ol('#E57A2C', 8));
  for (let i = 0; i < 3; i++) o += S.path(`M${612 + i * 262} 770 L${650 + i * 262 + 210} 770`, ln(5, '#FFB073', 0.6));
  o += S.rect(520, 610, 110, 236, 36, ol('#F28B3A', 8)) + S.rect(1372, 610, 110, 236, 36, ol('#F28B3A', 8));
  o += S.rect(530, 618, 90, 36, 18, { fill: '#FFB073', opacity: 0.6 }) + S.rect(1382, 618, 90, 36, 18, { fill: '#FFB073', opacity: 0.6 });
  // the L: chaise reaching toward us on the left
  o += S.rect(300, 780, 420, 120, 34, ol('#F28B3A', 8)) + S.rect(316, 770, 390, 50, 24, ol('#FFA95E', 7));
  for (const x of [560, 1440, 330, 690]) o += S.rect(x - 14, 840, 28, 30, 6, ol('#7A4A1E', 5));
  return o;
}
// draw the room with a seated cast. cast: [{ name, x, pose, act }]; extra: world svg on top
function livingRoom(t, cast, opts = {}) {
  let o = livingBg(t, opts) + couchBack();
  for (const c of cast) {
    const s = c.s || CS;
    if (c.stand) o += actor(c.name, t, { x: c.x, y: c.y || 980, s, ...c.pose }, c.act || {});
    else o += actor(c.name, t, { x: c.x, y: sitY(c.name, SEAT, s), s, shadow: false, ...c.pose }, c.act || {});
  }
  o += couchFront();
  for (const c of cast) if (!c.stand) o += sitLegs(c.name, c.x, SEAT, FEET, c.s || CS);
  return o + (opts.extra || '');
}

// ---------------------------------------------------------------- the news (screen svg in the -800..800 x -450..450 box)
function tvOff() {
  return S.rect(-800, -450, 1600, 900, 0, { fill: '#1A2030' }) + S.path('M-700 -400 L-300 -400 L-700 0 Z', { fill: '#FFFFFF', opacity: 0.08 }) + S.path('M-200 -400 L0 -400 L-600 200 L-700 200 Z', { fill: '#FFFFFF', opacity: 0.05 });
}
function tvStatic(t) {
  let o = S.rect(-800, -450, 1600, 900, 0, { fill: '#6A6A78' });
  for (let i = 0; i < 40; i++) o += S.rect(-800 + hash(i * 3 + Math.floor(t * 40)) * 1600, -450 + hash(i * 7 + Math.floor(t * 40)) * 900, 200 + hash(i) * 400, 10 + hash(i * 5) * 16, 0, { fill: hash(i * 11 + Math.floor(t * 30)) > 0.5 ? '#FFFFFF' : '#2A2A33', opacity: 0.8 });
  return o;
}
function bread(x, y, s = 1) {
  let o = S.path('M-170 40 Q-180 -70 -60 -90 Q0 -110 60 -90 Q180 -70 170 40 Z', ol('#E8A452', 7)) + S.rect(-172, 20, 344, 60, 20, ol('#D18A3C', 7));
  o += S.path('M-90 -60 Q-70 -20 -80 10 M-20 -74 Q0 -30 -10 4 M50 -66 Q70 -24 60 8', ln(7, '#B86E2A'));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function newsScreen(t, mode, small = false) {
  const red = mode === 'every';
  let o = S.rect(-800, -450, 1600, 900, 0, { fill: `url(#${red ? 's12studioR' : 's12studio'})` });
  o += rays(-380, -40, 18, 1100, '#FFFFFF', 0.05, t * 8);
  for (let i = 0; i < 14; i++) o += S.rect(-800 + i * 120, 60 - hash(i * 3) * 240, 100, 500, 4, { fill: red ? '#3A0A1E' : '#152466', opacity: 0.7 });
  // Chip
  const face = mode === 'every' ? { name: 'excited' } : { name: 'talkHappy' };
  o += actor('anchor', t, { x: -400, y: 600, s: 0.82, turn: 0.2, face, armL: 20, armR: mode === 'bread' ? 120 : 20, volume: !small }, { energy: 1.2, arms: mode !== 'bread' });
  o += S.path('M-800 230 Q-400 180 20 230 L20 450 L-800 450 Z', ol('#E8EEF8', 8)) + T('CHIP NEWS', -400, 330, 70, red ? '#C8243F' : '#2E5BD8');
  // graphic panel
  let p = S.rect(-340, -280, 680, 500, 34, ol('#FFFFFF', 8));
  if (mode === 'good') {
    p += S.circle(0, -60, 150, { fill: '#FFF4B0' }) + coin(0, -60, 110, 0, 0.2 + 0.2 * Math.sin(t * 2));
    p += S.path('M-50 -40 Q0 10 50 -40', ln(12)) + S.circle(-38, -96, 12, { fill: '#151515' }) + S.circle(38, -96, 12, { fill: '#151515' });
    p += T('GOOD NEWS!', 0, 170, 84, '#3BD16F', { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' });
  } else if (mode === 'game') {
    const u = seg(t, tTV1 + 0.4, tTV1 + 1.4);
    p += S.g(S.path('M-150 -60 Q-180 -60 -192 -10 L-210 70 Q-218 110 -176 110 Q-150 110 -120 66 L120 66 Q150 110 176 110 Q218 110 210 70 L192 -10 Q180 -60 150 -60 Z', ol('#B06BFF', 8)) +
      S.path('M-130 0 L-70 0 M-100 -30 L-100 30', ln(14, '#FFFFFF')) + S.circle(90, -10, 16, { fill: '#FFD21F' }) + S.circle(130, 20, 16, { fill: '#3BD16F' }), 'translate(0 20)');
    p += coin(0, lerp(-240, 0, ease.in(u)), lerp(70, 30, u), 0, t * 6);
    if (u >= 1) p += K.sparkles([[-180, -120, 30], [170, -150, 36], [200, 60, 22]], t);
    p += T('JUST A GAME!', 0, 190, 70, '#B06BFF', { stroke: '#151515', 'stroke-width': 9, 'paint-order': 'stroke' });
  } else if (mode === 'bread') {
    const pop = ob(seg(t, tTwoD - 0.05, tTwoD + 0.2));
    p += bread(0, 0, 1.1);
    p += S.g(S.path('M-120 -48 L90 -48 L130 0 L90 48 L-120 48 Z', ol('#FFE14D', 6)) + S.circle(96, 0, 10, ol('#FFFFFF', 4)) + T('$2', -14, 30, 84, '#2A1640'), `translate(150 ${f(-150 + 10 * Math.sin(t * 3))}) rotate(-10) scale(${f(0.9 + 0.5 * pop)})`);
    if (pop > 0) p += K.sparkles([[-220, -180, 34], [240, 80, 30], [-200, 150, 24]], t);
    p += T('BREAD: BACK TO NORMAL', 0, 200, 50, '#E8A452', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' });
  } else if (mode === 'every') {
    for (let i = 0; i < 14; i++) {
      const y = ((t - tNews) * 300 + hash(i * 3.3) * 600) % 600 - 300, x = -280 + hash(i * 7.1) * 560;
      if (t > tEvery - 0.1) p += gameCoin(i % 5, x, y, 0.9, t * 90 + i * 40);
    }
    const st = ob(seg(t, tMoneyW, tMoneyW + 0.2));
    p += S.g(S.rect(-250, -80, 500, 160, 24, { fill: 'none', stroke: '#3BD16F', 'stroke-width': 16 }) + T('= REAL $$$', 0, 34, 96, '#3BD16F', { stroke: '#151515', 'stroke-width': 10, 'paint-order': 'stroke' }), `translate(0 120) rotate(-8) scale(${f(lerp(2, 1, st) * (st > 0 ? 1 : 0))})`, { opacity: f(st) });
    if (t < tEvery - 0.1) p += T('THIS JUST IN', 0, 0, 92, '#C8243F', { opacity: f(0.6 + 0.4 * Math.sin(t * 12)) });
  }
  o += S.g(p, 'translate(400 -40)');
  if (mode !== 'every') {
    o += S.rect(-800, 260, 1600, 110, 0, { fill: '#2FBF6A' }) + T('GOOD NEWS', -560, 336, 64, '#FFFFFF');
    o += S.rect(-800, 370, 1600, 80, 0, { fill: '#10162A' });
    o += TF('ROBUX: JUST FOR FUN AGAIN  •  BREAD: $2  •  COFFEE: FREE  •  HATS: PRICELESS (AND WORTHLESS)  •  ', -800 + 1600 - ((t * 260) % 3200), 425, 44, '#FFE14D', { 'text-anchor': 'start' });
  }
  return o;
}

// ---------------------------------------------------------------- 1. the reset wave → morning at Ty's house
function houseExterior(t) {
  let o = S.rect(-400, -400, 2720, 1900, 0, { fill: 'url(#s12sky)' });
  const sunY = lerp(520, 330, seg(t, tMorning - 0.2, tLiving));
  o += K.E.sun(1600, sunY, 130, t);
  for (const [x, y, s] of [[100, 120, 0.8], [700, 70, 0.6], [1250, 160, 0.7], [1800, 90, 0.5]]) o += K.E.cloud(((x + t * 16) % 2300) - 200, y, s);
  // street, sidewalk, lawn
  o += S.rect(-400, 780, 2720, 400, 0, { fill: '#7FD08A' }) + S.rect(-400, 780, 2720, 14, 0, { fill: '#9BE0A0' });
  o += S.rect(-400, 930, 2720, 60, 0, { fill: '#E8E2D6' }) + S.rect(-400, 990, 2720, 200, 0, { fill: '#5A5E70' });
  for (let x = -380; x < 2300; x += 240) o += S.rect(x, 1060, 120, 14, 6, { fill: '#FFFFFF', opacity: 0.8 });
  // neighbours
  o += nHouse(-260, 800, 420, 360, '#C9D6FF', '#4A63E8') + tree(1880, 800, 1.1) + tree(260, 800, 0.8);
  // Ty's house: mint-green, two storeys, coral roof, white trim
  const hx = 560, hw = 760, base = 800;
  let h = S.rect(hx, base - 520, hw, 520, 10, ol('#9EE6C4', 8));
  h += S.rect(hx, base - 270, hw, 20, 0, ol('#FFFFFF', 6));
  for (let y = base - 500; y < base; y += 40) h += S.path(`M${hx + 10} ${y} L${hx + hw - 10} ${y}`, ln(3, '#86D4B0'));
  h += S.path(`M${hx - 50} ${base - 510} L${hx + hw / 2} ${base - 760} L${hx + hw + 50} ${base - 510} Z`, ol('#FF7A6B', 8)) + S.path(`M${hx - 50} ${base - 510} L${hx + hw + 50} ${base - 510}`, ln(16, '#FFFFFF'));
  h += S.circle(hx + hw / 2, base - 610, 46, ol('#BDEBFF', 6)) + S.path(`M${hx + hw / 2} ${base - 656} L${hx + hw / 2} ${base - 564} M${hx + hw / 2 - 46} ${base - 610} L${hx + hw / 2 + 46} ${base - 610}`, ln(6, '#FFFFFF'));
  const win = (x, y, w, hh, curtain) => {
    let q = S.rect(x - 10, y - 10, w + 20, hh + 20, 8, ol('#FFFFFF', 6)) + S.rect(x, y, w, hh, 4, { fill: '#BDEBFF' }) + S.path(`M${x + w * 0.2} ${y + hh * 0.8} L${x + w * 0.55} ${y + hh * 0.15}`, ln(14, '#FFFFFF', 0.6));
    if (curtain) q += S.path(`M${x} ${y} Q${x + 30} ${y + hh / 2} ${x} ${y + hh} L${x} ${y} Z M${x + w} ${y} Q${x + w - 30} ${y + hh / 2} ${x + w} ${y + hh} Z`, { fill: curtain });
    return q + S.path(`M${x + w / 2} ${y} L${x + w / 2} ${y + hh} M${x} ${y + hh / 2} L${x + w} ${y + hh / 2}`, ln(5, '#FFFFFF'));
  };
  h += win(hx + 70, base - 480, 170, 150, '#C9B6F2') + win(hx + hw - 240, base - 480, 170, 150, '#1FB5A8') + win(hx + 70, base - 220, 190, 150, '#FF8A65') + win(hx + hw - 260, base - 220, 190, 150, '#FF8A65');
  h += S.rect(hx + hw / 2 - 70, base - 230, 140, 230, 10, ol('#FFFFFF', 7)) + S.rect(hx + hw / 2 - 56, base - 216, 112, 216, 6, ol('#2FA8A0', 5)) + S.circle(hx + hw / 2 + 36, base - 110, 8, { fill: '#FFD34D', stroke: '#151515', 'stroke-width': 3 });
  h += S.path(`M${hx + hw / 2 - 110} ${base - 250} L${hx + hw / 2 + 110} ${base - 250} L${hx + hw / 2 + 90} ${base - 290} L${hx + hw / 2 - 90} ${base - 290} Z`, ol('#FF7A6B', 6));
  h += S.rect(hx + hw / 2 - 100, base - 6, 200, 20, 4, ol('#E0E0E8', 5)) + S.rect(hx + hw / 2 - 120, base + 14, 240, 20, 4, ol('#D0D0DA', 5));
  h += K.E.bush(hx + 40, base + 6, 1.1) + K.E.bush(hx + hw - 60, base + 6, 1.1);
  h += S.rect(hx + hw / 2 - 40, base + 34, 80, 100, 0, { fill: '#E8E2D6' });
  o += h;
  // the corner shop's price sign flips back to normal
  const flip = seg(t, tNormal - 0.1, tNormal + 0.3);
  const sx = Math.abs(Math.cos(flip * Math.PI));
  o += S.rect(1480, 520, 300, 300, 10, ol('#FFD1A6', 7)) + S.rect(1460, 490, 340, 50, 10, ol('#C8553D', 6)) + TF('CORNER SHOP', 1630, 528, 34, '#FFFFFF');
  o += S.rect(1540, 600, 180, 220, 6, ol('#BDEBFF', 6));
  o += S.rect(1640, 830, 12, 100, 0, ol('#7A4A1E', 4));
  o += S.g(S.rect(-110, -60, 220, 120, 14, ol('#FFFFFF', 6)) + S.circle(-60, -6, 0, {}) + (flip < 0.5 ? TF('BREAD', 0, -16, 34, '#7A4A1E') + T('R$1,000,000', 0, 34, 34, '#E2233B') : TF('BREAD', 0, -16, 34, '#7A4A1E') + T('$2', 0, 44, 62, '#2FA35A')), `translate(1646 790) scale(1 ${f(Math.max(0.05, sx))})`);
  // mailbox + a bird landing on it
  o += S.rect(380, 820, 16, 120, 0, ol('#7A4A1E', 4)) + S.path('M330 760 L430 760 L430 830 L330 830 Z', ol('#2E7DD1', 6)) + S.path('M330 760 Q380 720 430 760', ol('#2E7DD1', 6));
  const flag = seg(t, tNormal, tNormal + 0.3);
  o += S.g(S.rect(0, -60, 10, 60, 2, ol('#E2233B', 3)) + S.rect(0, -60, 34, 20, 3, ol('#E2233B', 3)), `translate(432 800) rotate(${f(lerp(90, 0, ease.outBack(flag)))})`);
  const land = ease.out(seg(t, tMorning + 0.3, tMorning + 1.2));
  o += K.E.bird(lerp(-100, 380, land), lerp(300, 712, land) - 10 * Math.sin(land * Math.PI), 1.6, land < 1 ? t : 0);
  for (let i = 0; i < 3; i++) o += K.E.bird(((t * 120 + i * 400) % 2400) - 200, 200 + i * 40, 1, t, i);
  return o;
}
function shotMorning(t) {
  const cam = camKeys(t, [[tMorning, { ...at(980, 470, 1.04) }], [tLiving, { ...at(1000, 520, 0.98) }]]);
  let o = W(cam, houseExterior(t));
  o += C.pixelWipe(seg(t, tMorning - 0.02, tMorning + 0.5), 'reveal');
  return o;
}
function shotReset(t) {
  let o = S11.coinReturn(t, S11.tWorld);
  o += C.pixelWipe(seg(t, tWipe, tMorning), 'cover');
  return o;
}

// ---------------------------------------------------------------- 2. the good news
function shotFamilyTV(t) {
  // living room wide: Dad (mug), Mom, Ty (normal cereal) on the couch; Chip on TV; they cheer on "Good news"
  const cam = camKeys(t, [[tLiving, { ...at(1100, 600, 1.12) }], [tTV1, { ...at(1260, 590, 1.3) }]]);
  const cheer = ob(seg(t, l1.word('news').t0, l1.word('news').t0 + 0.3)) * (1 - 0.6 * seg(t, l1.word('everyone').t0 + 0.6, tTV1));
  const look = [0.8, -0.1];
  const bowl = S.g(S.path('M-60 0 Q0 70 60 0 Z', ol('#FFFFFF', 6)) + S.ellipse(0, 0, 60, 14, { fill: '#F5D88A' }) + S.circle(-20, -4, 8, { fill: '#C98A3C' }) + S.circle(14, -2, 8, { fill: '#C98A3C' }), 'translate(-120 -470)');
  const cast = [
    { name: 'dad', x: SX.left, pose: { turn: 0.6, armR: lerp(30, 150, cheer), armL: 20, face: { name: cheer > 0.3 ? 'joy' : 'happy', eyes: { look } }, props: [{ svg: mug(250 + 60 * cheer, -560 - 160 * cheer, 0.9, 1, t), layer: 'top' }] }, act: { arms: false } },
    { name: 'mom', x: SX.mid, pose: { turn: 0.6, armL: lerp(20, 60, cheer), armR: lerp(20, 60, cheer), face: { name: 'happy', eyes: { look } } }, act: { arms: false } },
    { name: 'ty', x: SX.right, pose: { turn: 0.55, armL: 50, armR: lerp(14, 160, cheer), face: { name: cheer > 0.3 ? 'joy' : 'happy', eyes: { look } }, props: [{ svg: bowl, layer: 'front' }] }, act: { arms: false } },
  ];
  return W(cam, livingRoom(t, cast, { tvInner: newsScreen(t, 'good', true), tvGlow: 0.5 }));
}
function tvClose(t, inner, ticker = '', push = 0) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s12diam)' }) + S.rect(0, 960, 1920, 120, 0, { fill: '#2FA8A0' });
  o += S.g(K.tv(0, 0, 1.0, inner, ticker, t), `translate(960 478) scale(${f(1.02 + push)})`);
  return o;
}
function shotTVGame(t) { return tvClose(t, newsScreen(t, 'game'), '', 0.04 * seg(t, tTV1, tBread)); }
function shotTVBread(t) {
  const pop = ease.out(seg(t, tTwoD - 0.05, tTwoD + 0.12));
  let o = S.g(tvClose(t, newsScreen(t, 'bread'), '', 0), `translate(1350 330) scale(${f(1 + 0.55 * pop)}) translate(-1350 -330)`);
  const sh = K.shake(t, tTwoD, 0.3, 12);
  o = S.g(o, `translate(${f(sh.sx)} ${f(sh.sy)})`);
  if (t > tTwoD) o += K.confetti(t, tTwoD, 50, 4);
  return o;
}

// ---------------------------------------------------------------- 3. Dad, Mom, Grandma montage
function office(t) {
  let o = S.rect(-400, -400, 2720, 1900, 0, { fill: 'url(#s12office)' });
  o += S.rect(120, 120, 760, 460, 14, ol('#FFFFFF', 10)) + S.rect(136, 136, 728, 428, 6, { fill: '#9FD8FF' });
  for (let i = 0; i < 9; i++) { const bh = 120 + hash(i * 2.2) * 220; o += S.rect(140 + i * 80, 564 - bh, 70, bh, 4, { fill: '#7AA8D8' }) + S.rect(150 + i * 80, 574 - bh, 50, bh - 20, 0, { fill: 'url(#s11win)', opacity: 0.5 }); }
  o += S.path('M500 136 L500 564 M136 350 L864 350', ln(8, '#FFFFFF'));
  o += S.circle(1180, 220, 70, ol('#FFFFFF', 7)) + S.path(`M1180 220 L1180 170 M1180 220 L${f(1180 + Math.cos(t) * 40)} ${f(220 + Math.sin(t) * 40)}`, ln(7));
  o += S.rect(1360, 140, 260, 330, 10, ol('#FFE3A3', 7)) + TF('HANG IN', 1490, 380, 40, '#7A4A1E') + TF('THERE', 1490, 424, 40, '#7A4A1E') + S.path('M1440 180 L1440 240', ln(5)) + S.circle(1440, 290, 50, ol('#FFB060', 5));
  o += S.rect(-400, 780, 2720, 600, 0, { fill: '#9AA7C0' }) + S.rect(-400, 780, 2720, 14, 0, { fill: '#B8C3D8' });
  // cubicle walls
  o += S.rect(-100, 560, 700, 300, 12, ol('#6C7FA8', 7)) + S.rect(1300, 560, 900, 300, 12, ol('#6C7FA8', 7));
  return o;
}
function shotDadPay(t) {
  const cam = camKeys(t, [[tDad, { ...at(960, 560, 1.15) }], [tMom, { ...at(960, 520, 1.3) }]]);
  const open = ob(seg(t, tDollars - 0.35, tDollars));
  let w = office(t);
  const env = S.g(S.rect(-110, -70, 220, 140, 10, ol('#FFFFFF', 6)) + S.path('M-110 -70 L0 10 L110 -70', ln(6)) + TF('PAYCHECK', 0, 50, 30, '#2E5BD8'), 'translate(-230 -520)');
  let fan = '';
  const armL = lerp(70, 150, open);
  const [fx, fy] = A.hand(armL, -1);
  if (open > 0) for (let i = 0; i < 5; i++) fan += bill(fx - 40 + (i - 2) * 46 * open, fy - 70 - 30 * open, 0.9, -20 + (i - 2) * 16 * open);
  w += actor('dad', t, { x: 960, y: 1000, s: 0.62, armL, armR: 70, face: { name: open > 0.5 ? 'joy' : 'excited' }, props: [{ svg: open > 0.5 ? fan : env, layer: 'top' }], bodyY: -10 * bump(t, tDollars, tDollars + 0.4) }, { arms: false });
  let o = W(cam, w);
  if (open > 0) o += bang('PAYDAY!', 1450, 300, seg(t, tDollars, tDollars + 0.12), 100, -8, '#3BD16F');
  for (let i = 0; i < 8; i++) { const age = t - tDollars - i * 0.08; if (age > 0) o += bill(300 + hash(i) * 1300, -100 + age * 600, 0.7, age * 200 + i * 40); }
  return o + flashCut(t, tDad);
}
function store(t) {
  let o = S.rect(-400, -400, 2720, 1900, 0, { fill: '#FFF6E8' });
  for (let r = 0; r < 3; r++) {
    o += S.rect(-200, 140 + r * 170, 2400, 22, 4, ol('#C9CED8', 5));
    for (let i = 0; i < 18; i++) { const c = ['#FF6B6B', '#4ECDC4', '#FFD166', '#9B5DE5', '#00BBF9', '#8AC926'][(i + r) % 6]; o += S.rect(-180 + i * 130, 40 + r * 170, 100, 100, 8, ol(c, 5)); }
    for (let i = 0; i < 6; i++) o += S.rect(-120 + i * 400, 166 + r * 170, 110, 40, 6, ol('#FFE14D', 4)) + TF(['$2', '$3.49', '$0.99', '$4', '$1.50', '$2.25'][(i + r) % 6], -65 + i * 400, 196 + r * 170, 30, '#2A1640');
  }
  o += S.rect(-400, 700, 2720, 700, 0, { fill: '#E4E9F2' });
  // checkout counter + register
  o += S.rect(900, 640, 1200, 300, 16, ol('#5A6078', 8)) + S.rect(900, 640, 1200, 60, 12, ol('#2A2E3A', 7));
  for (let x = 930; x < 2080; x += 70) o += S.path(`M${f(x - ((t * 120) % 70))} 650 L${f(x - ((t * 120) % 70))} 690`, ln(4, '#4A4F60'));
  o += S.rect(1440, 400, 300, 220, 16, ol('#3A3F55', 8)) + S.rect(1460, 420, 260, 110, 8, { fill: '#BFF5B0' });
  return o;
}
function shotMom(t) {
  const cam = camKeys(t, [[tMom, { ...at(1000, 520, 1.12) }], [tGma, { ...at(1040, 520, 1.24) }]]);
  const u = ease.out(seg(t, tMom + 0.15, tCoupons + 0.3));
  let w = store(t);
  const saved = seg(t, tCoupons, tCoupons + 0.3);
  w += TF(saved > 0.5 ? 'TOTAL: $12' : 'TOTAL: $84', 1590, 492, 50, saved > 0.5 ? '#1E6B33' : '#2A1640');
  if (saved > 0) w += S.g(S.rect(-170, -40, 340, 80, 20, ol('#3BD16F', 6)) + T('SAVED $72!', 0, 22, 54, '#FFFFFF'), `translate(1590 350) rotate(-6) scale(${f(ease.outBack(saved))})`);
  // the coupon accordion: a zig-zag strip falling from her hand to the floor
  const n = Math.floor(2 + 7 * u);
  let strip = '';
  for (let i = 0; i < n; i++) {
    const y = -700 + i * 92, x = 380 + (i % 2 ? 36 : -36) + Math.sin(t * 3 + i) * 5;
    strip += S.g(S.rect(-100, -42, 200, 84, 8, { fill: '#FFF7C2', stroke: '#151515', 'stroke-width': 6, 'stroke-dasharray': '12 7' }) + TF(['50% OFF', 'BOGO', '$1 OFF', '2 FOR 1'][i % 4], 0, 14, 36, '#C8553D'), `translate(${f(x)} ${f(y)}) rotate(${i % 2 ? 6 : -6})`);
  }
  w += actor('mom', t, { x: 720, y: 960, s: 0.62, turn: 0.3, armR: 140, armL: 14, face: { name: 'smug', mouth: 'smirk' }, props: [{ svg: strip, layer: 'top' }] }, { arms: false });
  let o = W(cam, w);
  if (saved > 0) o += K.sparkles([[1500, 300, 30], [1750, 420, 24]], t);
  return o + flashCut(t, tMom);
}
// Grandma's streaming den: purple LED wall, obby poster, cork board with THE sticky note
function gmaRoom(t) {
  let o = S.rect(-400, -400, 2720, 1900, 0, { fill: 'url(#s12dots)' });
  const hue = ['#FF6FD8', '#5CF2FF', '#FFD21F', '#7CFF6B'][Math.floor(t * 1.5) % 4];
  o += S.rect(-400, 60, 2720, 14, 7, { fill: hue }) + S.rect(-400, 50, 2720, 34, 0, { fill: hue, opacity: 0.25 });
  o += S.circle(960, 420, 700, { fill: 'url(#s12led)' });
  o += S.rect(140, 160, 300, 400, 10, ol('#FFFFFF', 7)) + S.rect(156, 176, 268, 368, 6, { fill: '#4FB2FF' }) + miniObby(186, 470, t) + TF('OBBY QUEEN', 290, 230, 36, '#FFFFFF', { stroke: '#151515', 'stroke-width': 6, 'paint-order': 'stroke' });
  o += S.rect(1440, 180, 380, 300, 12, ol('#C98A5A', 8)) + S.rect(1456, 196, 348, 268, 6, { fill: '#D9A574' });
  o += S.g(S.rect(-80, -60, 160, 120, 4, ol('#FFF27A', 4)) + TF('NEW PW:', 0, -14, 28, '#2A1640') + TF('password3', 0, 28, 30, '#C8243F'), 'translate(1560 290) rotate(-6)');
  o += S.g(S.rect(-60, -50, 120, 100, 4, ol('#7CFF6B', 4)) + TF('STREAM', 0, -6, 24, '#2A1640') + TF('@ 4PM', 0, 26, 24, '#2A1640'), 'translate(1720 380) rotate(8)');
  o += S.circle(1560, 236, 9, { fill: '#E2233B' }) + S.circle(1720, 336, 9, { fill: '#2E7DD1' });
  o += S.rect(-400, 820, 2720, 600, 0, { fill: '#3A2A6A' });
  return o;
}
function gmaChair(x, y, s = 1) {
  return S.g(S.rect(-170, -560, 340, 420, 60, ol('#2A2A33', 8)) + S.rect(-120, -520, 240, 300, 40, ol('#FF4D8D', 6)) + S.rect(-60, -500, 120, 60, 20, { fill: '#FFFFFF', opacity: 0.25 }), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shotGmaType(t) {
  // over Grandma's shoulder: the CHANGE PASSWORD form fills in, dot by dot; ✓ on "password"
  const cam = camKeys(t, [[tGma, { ...at(980, 540, 1.1) }], [tReal, { ...at(1020, 500, 1.28) }]]);
  let w = gmaRoom(t);
  // desk + monitor
  w += S.rect(500, 300, 1180, 520, 30, ol('#1A1A22', 12)) + S.rect(530, 330, 1120, 460, 16, { fill: '#F4F6FF' });
  let form = S.rect(-360, -190, 720, 380, 26, ol('#FFFFFF', 6)) + S.rect(-360, -190, 720, 70, 26, { fill: '#2E7BFF' }) + S.rect(-360, -150, 720, 30, 0, { fill: '#2E7BFF' });
  form += T('CHANGE PASSWORD', 0, -140, 44, '#FFFFFF');
  form += TF('New password:', -320, -60, 34, '#2A1640', { 'text-anchor': 'start' }) + S.rect(-320, -40, 640, 70, 14, ol('#F4F6FF', 5));
  const typed = Math.floor(clamp((t - tGma - 0.2) * 9, 0, 13));
  form += TF('●'.repeat(typed) + (Math.floor(t * 4) % 2 ? '|' : ''), -296, 12, 40, '#2A1640', { 'text-anchor': 'start' });
  const ok = ob(seg(t, tPwd, tPwd + 0.25));
  if (ok > 0) form += S.g(S.rect(-250, -40, 500, 80, 20, ol('#3BD16F', 6)) + T('✓ PASSWORD CHANGED', 0, 18, 40, '#FFFFFF'), `translate(0 120) scale(${f(ok)})`);
  w += S.g(form, 'translate(1090 540)');
  w += S.rect(300, 820, 1320, 60, 14, ol('#2A2A33', 8));
  w += gmaChair(560, 1220, 1.0);
  const ty = (Math.sin(t * 30) > 0 ? 1 : -1);
  const headset = S.path('M-160 -700 Q-160 -960 0 -960 Q160 -960 160 -700', ln(30, '#151515')) + S.path('M-160 -700 Q-160 -960 0 -960 Q160 -960 160 -700', ln(18, '#FF4D8D')) + S.rect(-196, -760, 60, 110, 24, ol('#FF4D8D', 7)) + S.rect(136, -760, 60, 110, 24, ol('#FF4D8D', 7));
  w += actor('grandma', t, { x: 560, y: 1330, s: 0.85, view: 'back', armL: 30 + 6 * ty, armR: 30 - 6 * ty, bodyY: 2 * ty, props: [{ svg: headset, layer: 'top' }] }, { arms: false });
  let o = W(cam, w);
  o += bang('clack clack', 360, 700, 1 - seg(t, tPwd, tPwd + 0.1), 60, -6, '#FFFFFF');
  return o + flashCut(t, tGma);
}
function shotGmaThumbs(t) {
  // Grandma spins to camera: thumbs up, wink — the sticky note behind her says it all
  const cam = camKeys(t, [[tReal, { ...at(1060, 520, 1.45) }], [tCoffee, { ...at(1100, 500, 1.62) }]]);
  const spin = ob(seg(t, tReal, tReal + 0.4));
  let w = gmaRoom(t) + gmaChair(960, 1000, 0.8);
  const thumb = S.g(S.rect(-34, -40, 68, 70, 16, ol('#F2D7C6', 6)) + S.rect(-14, -90, 28, 56, 12, ol('#F2D7C6', 6)), '');
  const [hx, hy] = A.hand(140, 1);
  w += actor('grandma', t, { x: 960, y: 1010, s: 0.62, turn: lerp(0.9, 0, spin), armR: 140, armL: 20, face: { name: 'happy', eyeL: { type: 'closed' }, mouth: 'grin', fx: ['sparkles'] }, props: [{ svg: S.g(thumb, `translate(${f(hx + 10)} ${f(hy - 30)})`), layer: 'top' }] }, { arms: false });
  let o = W(cam, w);
  o += K.F.sparkle(1500, 300, 30 * bump(t, tReal + 0.3, tReal + 0.9));
  return o;
}
function coffeeMachine(t, free = 1) {
  let o = S.rect(-170, -560, 340, 560, 30, ol('#C9D1DC', 8)) + S.rect(-150, -540, 300, 70, 20, ol('#E2233B', 6)) + T('JAVA 3000', 0, -490, 40, '#FFFFFF');
  o += S.rect(-120, -440, 240, 140, 14, ol('#1C2333', 6));
  o += free > 0.5 ? T('FREE ☕', 0, -350, 56, '#5CFF7A') : T('499 R$', 0, -350, 52, '#FF5A5A');
  o += S.rect(-90, -260, 180, 160, 16, ol('#2A2E3A', 6)) + S.rect(-30, -270, 60, 40, 8, ol('#5A6078', 5));
  o += S.rect(-190, -20, 380, 30, 10, ol('#5A6078', 6));
  return o;
}
function shotCoffee(t) {
  const cam = camKeys(t, [[tCoffee, { ...at(960, 560, 1.2) }], [tFree, { ...at(1000, 520, 1.3) }], [tFree + 0.12, { ...at(1000, 470, 1.6) }], [tStream, { ...at(1000, 470, 1.65) }]]);
  const hug = ob(seg(t, tFree - 0.05, tFree + 0.3));
  let w = office(t);
  w += S.rect(900, 820, 700, 220, 12, ol('#B8C3D8', 7));
  // the old game-pass sign, crumpled on the floor
  w += S.g(S.rect(-90, -50, 180, 100, 30, ol('#2E7BFF', 5)) + TF('GAME PASS', 0, -6, 26, '#FFFFFF') + TF('499 R$', 0, 26, 24, '#FFE14D'), 'translate(760 1010) rotate(-24) scale(0.9 0.7)');
  w += S.g(coffeeMachine(t, 1), 'translate(1280 830)');
  const sip = bump(t, tCoffee + 0.2, tFree - 0.15);
  const [mx, my] = A.hand(lerp(40, 150, sip), -1);
  w += actor('dad', t, { x: 980 + 60 * hug, y: 1000, s: 0.6, turn: 0.35, lean: -6 * hug, armL: lerp(40, 150, sip), armR: lerp(20, 110, hug), face: { name: hug > 0.3 ? 'love' : 'joy' }, props: [{ svg: mug(mx + 40, my - 30, 1.0, 1, t), layer: 'top' }] }, { arms: false });
  let o = W(cam, w);
  if (hug > 0) {
    for (let i = 0; i < 6; i++) { const ph = ((t - tFree) * 0.8 + i / 6) % 1; o += S.g(S.path(K.F.heartPath(0, 0, 26), ol('#FF5A7A', 4)), `translate(${f(1000 + Math.sin(i * 2 + ph * 6) * 260)} ${f(560 - ph * 420)})`, { opacity: f(1 - ph) }); }
    o += bang('FREE!', 560, 250, seg(t, tFree, tFree + 0.12), 150, -8, '#5CFF7A');
  }
  return o + flashCut(t, tCoffee);
}

// ---------------------------------------------------------------- 4. Grandma's stream
const CHAT = [['NanaFan99', 'NANA GOAT 🐐', '#FF6FB5'], ['obbyking', 'W GRANDMA', '#5CF2FF'], ['xX_Kevin_Xx', 'lets gooo', '#FFD21F'], ['cookie_lord', '<3 <3 <3', '#7CFF6B'], ['NoobSlayer', 'she is SO fast', '#B06BFF'], ['tinytaco', 'hi nana!!', '#FF8A65'], ['zoomer12', 'GG', '#5CF2FF'], ['bloxbuddy', 'teach me pls', '#FFD21F']];
const CHAT2 = [['NanaFan99', 'NANA NO 😱', '#FF6FB5'], ['obbyking', 'DONT SAY IT', '#5CF2FF'], ['xX_Kevin_Xx', 'she said it', '#FFD21F'], ['cookie_lord', 'password3 lol', '#7CFF6B'], ['NoobSlayer', '!!!!!!!!', '#B06BFF'], ['tinytaco', 'NANAAAA', '#FF8A65']];
function streamUI(t, opts = {}) {
  // dark frame
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#17122A' });
  // game view
  const gx = 30, gy = 90, gw = 1380, gh = 780;
  const id = S.uid('gv');
  let g = S.rect(gx, gy, gw, gh, 0, { fill: 'url(#s12game)' });
  for (let i = 0; i < 7; i++) { const x = gx + ((i * 260 - t * 220) % 1820 + 1820) % 1820 - 200, y = gy + 520 - (i % 3) * 90; g += S.rect(x, y, 170, 44, 10, ol(['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF'][i % 5], 5)) + S.rect(x + 70, y + 44, 30, 400, 0, { fill: '#7A5A8A', opacity: 0.5 }); }
  for (const [x, y, s] of [[200, 160, 0.6], [900, 120, 0.5]]) g += K.E.cloud(gx + x, gy + y, s);
  const jump = Math.abs(Math.sin(t * 4.5));
  g += K.draw.grandma({ x: gx + 560, y: gy + 520 - jump * 140, s: 0.32, view: 'side', flip: true, ...A.run(t * 12), face: { name: 'determined' }, shadow: false });
  o += S.clipDef(id, S.rect(gx, gy, gw, gh, 20)) + S.g(g, null, { 'clip-path': `url(#${id})` }) + S.rect(gx, gy, gw, gh, 20, { fill: 'none', stroke: '#6A4FC8', 'stroke-width': 6 });
  // top bar: LIVE + viewers + title
  o += S.rect(30, 18, 150, 54, 14, { fill: '#E2233B' }) + S.circle(62, 45, 10, { fill: '#FFFFFF', opacity: f(0.6 + 0.4 * Math.sin(t * 6)) }) + TF('LIVE', 120, 58, 36, '#FFFFFF');
  o += S.rect(196, 18, 360, 54, 14, { fill: '#2A2246' }) + TF(`👁 ${Math.round(opts.viewers || 0).toLocaleString('en-US')}`, 376, 58, 36, '#FFFFFF');
  o += TF(opts.title || 'NanaBea plays OBBY ★ chill morning run', 580, 58, 34, '#E4D2FF', { 'text-anchor': 'start' });
  // chat column
  o += S.rect(1430, 90, 460, 780, 20, { fill: '#221A3A', stroke: '#6A4FC8', 'stroke-width': 6 }) + TF('STREAM CHAT', 1660, 140, 32, '#B9A6E8');
  const msgs = opts.chat || CHAT;
  const sc = (t * (opts.chatSpeed || 1.6)) % msgs.length;
  for (let i = 0; i < 9; i++) {
    const m = msgs[(Math.floor(sc) + i) % msgs.length];
    const y = 200 + i * 72 - (sc % 1) * 72;
    if (y < 170 || y > 840) continue;
    o += TF(m[0] + ':', 1456, y, 28, m[2], { 'text-anchor': 'start' }) + TF(m[1], 1456, y + 32, 30, '#FFFFFF', { 'text-anchor': 'start' });
  }
  return o;
}
function facecam(t, x, y, w, h, s, pose = {}) {
  const id = S.uid('fc');
  let inner = gmaRoom(t) + gmaChair(960, 1000, 0.8);
  inner += S.path('M1250 600 L1180 760', ln(14, '#2A2A33')) + S.rect(1120, 520, 70, 120, 34, ol('#3A3F55', 6));
  inner += actor('grandma', t, { x: 960, y: 1010, s: 0.62, armL: 20, armR: 20, ...pose }, pose.act || {});
  const g = S.g(inner, `translate(${x + w / 2} ${y + h / 2}) scale(${f(s)}) translate(-960 -700)`);
  return S.clipDef(id, S.rect(x, y, w, h, 18)) + S.g(g, null, { 'clip-path': `url(#${id})` }) + S.rect(x, y, w, h, 18, { fill: 'none', stroke: '#FF4D8D', 'stroke-width': 8 });
}
function shotStream(t) {
  const viewers = 2000000 * ease.inOut(seg(t, tStream + 0.3, tViewers + 0.2));
  let o = streamUI(t, { viewers });
  o += facecam(t, 60, 560, 420, 290, 0.62, { face: { name: 'determined' }, armL: 30 + 8 * Math.sin(t * 25), armR: 30 - 8 * Math.sin(t * 25), act: { arms: false } });
  const hit = ob(seg(t, tViewers, tViewers + 0.25));
  if (hit > 0) o += S.g(S.rect(-280, -60, 560, 120, 30, ol('#FFD21F', 8)) + T('2,000,000 WATCHING!', 0, 22, 56, '#2A1640'), `translate(760 250) rotate(-4) scale(${f(hit)})`);
  const cam = camKeys(t, [[tStream, { zoom: 1.0, x: 0, y: 0 }], [tCharity, { zoom: 1.06, x: -60, y: -20 }]]);
  return S.g(o, K.E.camTf(cam, 1)) + flashCut(t, tStream);
}
function shotCharity(t) {
  let o = streamUI(t, { viewers: 2000000 + (t - tCharity) * 3000, title: '♥ CHARITY STREAM for the Kitten Shelter ♥' });
  o += facecam(t, 60, 560, 420, 290, 0.62, { face: { name: 'joy' }, armL: 150, armR: 150, act: { arms: false } });
  const fill = ease.inOut(seg(t, tCharity + 0.3, l4.b + 0.1));
  let bar = S.rect(-600, -60, 1200, 120, 30, ol('#2A2246', 7)) + S.rect(-588, -48, 1176 * fill, 96, 24, { fill: '#FF6FB5' });
  bar += T(fill >= 1 ? 'GOAL REACHED! 🐱' : `RAISED: $${Math.round(50000 * fill).toLocaleString('en-US')} / $50,000`, 0, 20, 52, '#FFFFFF', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' });
  // kitten icon
  bar += S.g(S.circle(0, 0, 54, ol('#FFC08A', 6)) + S.path('M-46 -24 L-40 -74 L-10 -48 Z M46 -24 L40 -74 L10 -48 Z', ol('#FFC08A', 6)) + S.circle(-18, -6, 7, { fill: '#151515' }) + S.circle(18, -6, 7, { fill: '#151515' }) + S.path('M-10 16 Q0 26 10 16', ln(5)), 'translate(-660 0)');
  o += S.g(bar, `translate(780 ${f(lerp(1200, 790, ob(seg(t, tCharity, tCharity + 0.35))))})`);
  if (fill >= 1) o += K.confetti(t, l4.b + 0.1, 40, 6);
  for (let i = 0; i < 6; i++) { const ph = ((t - tCharity) * 0.7 + i / 6) % 1; o += S.g(S.path(K.F.heartPath(0, 0, 22), ol('#FF5A7A', 4)), `translate(${f(1500 + Math.sin(i * 2 + ph * 6) * 120)} ${f(860 - ph * 600)})`, { opacity: f(1 - ph) }); }
  return o;
}
function shotPw3(t) {
  // facecam full screen: Grandma leans into the mic and proudly shows her sticky note — to two million people
  const smash = t > tPwW;
  const cam = smash ? camKeys(t, [[tPwW, at(960, 420, 1.9)], [tWork, at(960, 420, 2.05)]]) : camKeys(t, [[tPw3, at(960, 520, 1.15)], [tPwW, at(960, 500, 1.25)]]);
  let w = gmaRoom(t) + gmaChair(960, 1000, 0.8);
  w += S.path('M1250 600 L1180 760', ln(14, '#2A2A33')) + S.rect(1120, 520, 70, 120, 34, ol('#3A3F55', 6));
  const note = S.g(S.rect(-120, -90, 240, 180, 6, ol('#FFF27A', 6)) + TF('password3', 0, 18, 44, '#C8243F'), '');
  const [hx, hy] = A.hand(150, -1);
  w += actor('grandma', t, { x: 960, y: 1010, s: 0.62, armL: 150, armR: 30, lean: 4, face: { name: 'smug', mouth: undefined, fx: ['sparkles'] }, props: [{ svg: S.g(note, `translate(${f(hx - 60)} ${f(hy - 80)}) rotate(-8)`), layer: 'top' }] }, { arms: false });
  let o = W(cam, w);
  // stream overlay: LIVE pill, viewer count, chat explodes
  o += S.rect(30, 18, 150, 54, 14, { fill: '#E2233B' }) + TF('LIVE', 120, 58, 36, '#FFFFFF') + S.rect(196, 18, 360, 54, 14, { fill: '#2A2246' }) + TF(`👁 ${(2000001 + Math.floor(seg(t, tPwW, tWork) * 48213)).toLocaleString('en-US')}`, 376, 58, 36, '#FFFFFF');
  if (smash) {
    for (let i = 0; i < 6; i++) {
      const m = CHAT2[i], k = ob(seg(t, tPwW + 0.1 + i * 0.16, tPwW + 0.3 + i * 0.16));
      if (k > 0) o += S.g(S.rect(-190, -40, 380, 80, 18, { fill: '#221A3A', stroke: m[2], 'stroke-width': 5 }) + TF(m[1], 0, 14, 36, '#FFFFFF'), `translate(${[1600, 330, 1620, 300, 1580, 360][i]} ${[200, 330, 480, 620, 760, 820][i]}) rotate(${(hash(i) - 0.5) * 14}) scale(${f(k)})`);
    }
    const sh = K.shake(t, tPwW, 0.3, 14);
    o = S.g(o, `translate(${f(sh.sx)} ${f(sh.sy)})`);
  }
  return o + flashCut(t, tPw3);
}
function hallway(t) {
  let o = S.rect(-400, -400, 2720, 1900, 0, { fill: 'url(#s12diam)' }) + S.rect(-400, 860, 2720, 600, 0, { fill: 'url(#s12oak)' });
  // Grandma's open door, purple light spilling out
  o += S.rect(1180, 200, 420, 680, 10, ol('#FFFFFF', 10)) + S.rect(1200, 220, 380, 660, 0, { fill: '#6A3FB8' }) + S.rect(1200, 220, 380, 660, 0, { fill: 'url(#s12led)' });
  o += T('NANA\'S STREAM ROOM', 1390, 180, 34, '#6A3FB8') + S.path('M1200 880 L1000 1200 L1780 1200 L1580 880 Z', { fill: '#B06BFF', opacity: 0.15 });
  o += S.rect(200, 220, 260, 200, 10, ol('#B07A42', 7)) + S.rect(220, 240, 220, 160, 4, { fill: '#BDE6FF' });
  return o;
}
function shotWork(t) {
  // Ty in the hallway, deadpan to camera; a slow facepalm
  const cam = camKeys(t, [[tWork, at(900, 560, 1.5)], [tMiaRoom, at(900, 520, 1.75)]]);
  const palm = ease.inOut(seg(t, l6.word('working').t0, l6.word('on').t0 + 0.1));
  let w = hallway(t);
  const hand = palm > 0.85 ? [{ svg: S.g(S.rect(-120, -60, 260, 112, 34, ol('#E9B38B', 8)) + S.path('M-96 -24 L110 -24 M-96 8 L110 8', ln(6, '#C98E6A')), `translate(20 ${f(-690 + 20 * Math.sin(t * 3))}) rotate(-8)`), layer: 'top' }] : [];
  w += actor('ty', t, { x: 900, y: 1010, s: 0.6, armR: lerp(10, 158, palm), armL: 8, face: { name: 'deadpan' }, headRot: -6 * palm, props: hand }, { arms: false, energy: 0.3 });
  return W(cam, w) + flashCut(t, tWork);
}

// ---------------------------------------------------------------- 5. Mia and the 412 worthless hats
const HAT_COLS = ['#FF6B6B', '#4ECDC4', '#FFD166', '#9B5DE5', '#00BBF9', '#8AC926', '#FF924C', '#F15BB5'];
function hat(kind, x, y, s, rot, col) {
  let o = '';
  switch (kind % 8) {
    case 0: o = S.path('M-70 10 Q-70 -80 0 -80 Q70 -80 70 10 Z', ol(col, 6)) + S.rect(-76, -4, 152, 34, 10, ol('#FFFFFF', 6)) + S.circle(0, -84, 18, ol('#FFFFFF', 5)); break; // beanie
    case 1: o = S.rect(-50, -120, 100, 120, 6, ol('#2A2A33', 6)) + S.rect(-50, -40, 100, 22, 0, ol(col, 4)) + S.ellipse(0, 4, 90, 18, ol('#2A2A33', 6)); break; // top hat
    case 2: o = S.path('M-110 0 Q-80 -20 -50 -10 Q-50 -80 0 -80 Q50 -80 50 -10 Q80 -20 110 0 Q60 30 0 20 Q-60 30 -110 0 Z', ol('#B07A42', 6)) + S.rect(-48, -28, 96, 14, 4, { fill: col }); break; // cowboy
    case 3: o = S.ellipse(0, -20, 84, 34, ol(col, 6)) + S.rect(-4, -66, 8, 18, 3, ol(col, 4)); break; // beret
    case 4: o = S.path('M-60 0 L-60 -60 L-30 -30 L0 -76 L30 -30 L60 -60 L60 0 Z', ol('#FFD21F', 6)) + S.circle(0, -20, 10, { fill: '#E2233B' }); break; // crown
    case 5: o = S.path('M-50 0 L0 -120 L50 0 Z', ol(col, 6)) + S.path('M-30 -40 L30 -40 M-16 -80 L16 -80', ln(8, '#FFFFFF')) + S.circle(0, -124, 12, ol('#FFE14D', 4)); break; // party hat
    case 6: o = S.path('M-60 0 Q-60 -70 0 -70 Q60 -70 60 0 Z', ol(col, 6)) + S.path('M40 -6 L120 -6 Q120 10 40 10 Z', ol(col, 6)) + S.circle(0, -70, 8, { fill: '#FFFFFF' }); break; // cap
    default: o = S.ellipse(0, 0, 100, 18, ol('#6A3FB8', 6)) + S.path('M-50 -4 L10 -140 L50 -4 Z', ol('#6A3FB8', 6)) + S.rect(-48, -24, 96, 14, 3, { fill: col }); // witch
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
const HATS = (() => {
  const H = [];
  for (let i = 0; i < 46; i++) {
    const u = hash(i * 1.37), v = hash(i * 2.71);
    const x = 960 + (u - 0.5) * 1300 * (1 - v * 0.55);
    const y = 870 - v * 300 + hash(i * 5.3) * 30;
    H.push([i, x, y, 0.8 + hash(i * 9.1) * 0.6, (hash(i * 4.4) - 0.5) * 70, HAT_COLS[i % 8]]);
  }
  return H.sort((a, b) => a[2] - b[2]);
})();
function miaRoom(t, tagFlip = 0) {
  let o = S.rect(-400, -400, 2720, 1900, 0, { fill: 'url(#s12lavP)' });
  o += S.rect(1380, 140, 420, 360, 16, ol('#FFFFFF', 10)) + S.rect(1396, 156, 388, 328, 6, { fill: 'url(#s12sky)' }) + S.path('M1590 156 L1590 484', ln(8, '#FFFFFF'));
  o += S.rect(160, 180, 360, 26, 8, ol('#FFFFFF', 6)) + hat(1, 240, 176, 0.7, 0, '#FF6FB5') + hat(4, 360, 176, 0.7, 0, '#FFD21F') + hat(5, 460, 176, 0.6, 0, '#5CF2FF');
  o += S.rect(560, 120, 300, 200, 10, ol('#FFFFFF', 7)) + T('HAT', 710, 210, 64, '#FF6FB5') + T('EMPIRE', 710, 280, 54, '#9B5DE5');
  o += S.rect(-400, 900, 2720, 600, 0, { fill: '#9B86D6' });
  // the bed under the mountain
  o += S.rect(220, 640, 1480, 280, 40, ol('#FFFFFF', 8)) + S.rect(240, 700, 1440, 170, 30, ol('#FF9EC4', 6));
  // the mountain: a soft mound, then hats on it
  o += S.path('M260 880 Q400 640 620 580 Q960 440 1300 580 Q1520 640 1660 880 Z', ol('#B79BE8', 7));
  for (const [i, x, y, s, r, c] of HATS) o += hat(i, x, y, s, r, c);
  // price tags flipping to $0
  for (let i = 0; i < 6; i++) {
    const [, x, y] = HATS[(i * 7 + 3) % HATS.length];
    const fl = seg(tagFlip, i * 0.08, i * 0.08 + 0.3);
    const sx = Math.max(0.06, Math.abs(Math.cos(fl * Math.PI)));
    const txt = fl < 0.5 ? T(['R$80K', 'R$1.2M', 'R$500K', 'R$9,999', 'R$250K', 'R$3M'][i], 0, 12, 34, '#2A1640') : T('$0', 0, 16, 48, '#E2233B');
    o += S.path(`M${f(x)} ${f(y - 40)} L${f(x + 50)} ${f(y - 90)}`, ln(3, '#2A1640')) + S.g(S.rect(-70, -30, 140, 60, 10, ol('#FFFFFF', 5)) + txt, `translate(${f(x + 70)} ${f(y - 110)}) rotate(${f(-8 + i * 3)}) scale(${f(sx)} 1)`);
  }
  return o;
}
const MIA_Y = 780; // Mia lies on the summit: her pivot lands at ~y 535
const miaFront = (t) => hat(0, 1060, 640, 1.15, 18, '#FFD166') + hat(2, 1200, 630, 1.0, -12, '#B07A42') + hat(6, 700, 660, 1.0, -20, '#00BBF9');
function shotMiaHats(t) {
  const cam = camKeys(t, [[tMiaRoom, at(960, 560, 1.05)], [tHappier, at(940, 520, 1.25)]]);
  let w = miaRoom(t, (t - tNothing) / 1.0);
  const roll = Math.sin(t * 2.2) * 3;
  w += actor('mia', t, { x: 960, y: MIA_Y, s: 0.5, rot: -64 + roll, rotY: -470, armL: 160, armR: 130, face: { name: 'happy', mouth: undefined, eyes: { look: [0, -0.6] } }, shadow: false });
  w += hat(3, 990, 590, 1.1, -14, '#FF6FB5') + miaFront(t);
  let o = W(cam, w);
  if (t > tNothing) o += bang('$0', 1480, 280, seg(t, tNothing, tNothing + 0.12) * (1 - seg(t, tHappier - 0.3, tHappier)), 130, 8, '#E2233B');
  return o + flashCut(t, tMiaRoom);
}
function shotMiaHug(t) {
  // close: she hugs an armful of hats, eyes shut happy, hearts
  const cam = camKeys(t, [[tHappier, at(870, 520, 2.0)], [tMe, at(860, 505, 2.35)]]);
  let w = miaRoom(t, 9);
  const sq = 1 + 0.04 * Math.sin(t * 6);
  w += actor('mia', t, { x: 960, y: MIA_Y, s: 0.5, rot: -64 + Math.sin(t * 2.2) * 4, rotY: -470, armL: 175, armR: 175, sx: sq, face: { name: 'joy', mouth: undefined, fx: ['blush', 'hearts'] }, shadow: false });
  w += hat(3, 980, 640, 1.3, -14, '#FF6FB5') + hat(0, 1120, 590, 1.0, 20, '#FFD166') + hat(5, 1060, 520, 0.8, 10, '#5CF2FF') + miaFront(t);
  let o = W(cam, w);
  for (let i = 0; i < 6; i++) { const ph = ((t - tHappier) * 0.6 + i / 6) % 1; o += S.g(S.path(K.F.heartPath(0, 0, 30), ol('#FF5A7A', 4)), `translate(${f(960 + Math.sin(i * 2.3 + ph * 5) * 520)} ${f(860 - ph * 760)})`, { opacity: f(1 - ph) }); }
  return o;
}

// ---------------------------------------------------------------- 6. Ty broke, Pickle's Robux, the shoe, the okay millionaire
const tyAt = SX.mid, pkAt = SX.right, miAt = SX.left;
const couchHead = (name) => SEAT - 4 - (725 - 306) * CS * (D[name].style.size || 1);
function trio(t, o = {}) {
  // the three on the couch; o: per-character pose overrides + acts
  const watch = o.watch || 0; // 0..1 heads turned to the TV
  const base = (x, extra) => ({ turn: lerp(0, 0.65, watch), ...extra });
  const cast = [
    { name: 'mia', x: miAt, pose: base(miAt, { armL: 30, armR: 12, face: { name: 'deadpan', eyes: { look: [watch ? 0.9 : 0, 0.4 * (1 - watch)] } }, props: [phoneProp()], ...(o.mia || {}) }), act: { arms: false, ...(o.miaAct || {}) } },
    { name: 'ty', x: tyAt, pose: base(tyAt, { armL: 12, armR: 12, ...(o.ty || {}) }), act: { ...(o.tyAct || {}) } },
    { name: 'pickle', x: pkAt, pose: base(pkAt, { armL: 12, armR: 12, ...(o.pickle || {}) }), act: { ...(o.pkAct || {}) } },
  ];
  return cast;
}
function phoneProp(a = 30, side = -1) { const [hx, hy] = A.hand(a, side); return { svg: S.g(K.phone(0, 0, 0.3, 8, S.rect(-150, -280, 300, 560, 0, { fill: '#B79BE8' }) + S.circle(0, -60, 60, { fill: '#FFFFFF', opacity: 0.6 })), `translate(${f(hx + 10)} ${f(hy - 40)})`), layer: 'front' }; }
function shotMe(t) {
  // "And me?" — close on Ty, he points at himself
  const cam = camKeys(t, [[tMe, at(tyAt, couchHead('ty') + 30, 2.3)], [tBroke, at(tyAt, couchHead('ty') + 30, 2.45)]]);
  const point = ob(seg(t, tMe + 0.1, tMe + 0.4));
  return W(cam, livingRoom(t, trio(t, { ty: { armR: lerp(12, 48, point), armL: lerp(12, 48, point), headRot: 8 * point, face: { name: 'happy', fx: point > 0.5 ? ['question'] : [] } }, tyAct: { arms: false } }))) + flashCut(t, tMe);
}
function shotBroke(t) {
  // "I'm broke again." — pocket inside out, a moth flutters away; R$ 0
  const cam = camKeys(t, [[tBroke, at(tyAt, couchHead('ty') + 70, 1.9)], [tLaugh, at(tyAt, couchHead('ty') + 60, 2.05)]]);
  const pull = ob(seg(t, tBroke + 0.3, tBroke + 0.6));
  const lining = (x) => S.g(S.path('M-50 0 L50 0 L44 110 Q0 140 -44 110 Z', ol('#FFFFFF', 7)) + S.path('M-26 50 L26 50 M-20 80 L20 80', ln(5, '#D9D9E0')), `translate(${x} -440) scale(1 ${f(pull)})`);
  const pocket = lining(-110) + lining(110);
  let w = livingRoom(t, trio(t, { ty: { armR: lerp(12, 40, pull), armL: lerp(12, 40, pull), face: { name: 'deadpan' }, props: pull > 0 ? [{ svg: pocket, layer: 'top' }] : [] }, tyAct: { arms: false } }));
  const age = t - tBroke - 0.5;
  if (age > 0) {
    const mx = tyAt + 10 + Math.sin(age * 8) * 40, my = couchHead('ty') + 330 - age * 430;
    const fl = Math.sin(t * 40);
    const wing = (sx) => S.path(`M0 -4 Q${sx * 30} ${f(-46 * fl)} ${sx * 54} ${f(-18 * fl)} Q${sx * 44} 14 0 6 Z`, { fill: '#EFE7D6', stroke: '#6B604E', 'stroke-width': 3 }) + S.circle(sx * 30, f(-14 * fl), 6, { fill: '#C4B79C' });
    w += S.g(wing(-1) + wing(1) + S.ellipse(0, 4, 7, 17, { fill: '#9A8E78', stroke: '#4A4234', 'stroke-width': 3 }) + S.path('M-3 -12 Q-10 -30 -18 -32 M3 -12 Q10 -30 18 -32', ln(3, '#4A4234')), `translate(${f(mx)} ${f(my)}) scale(1.7)`);
    w += C.dust(tyAt + 40, couchHead('ty') + 260, tBroke + 0.5, t);
  }
  let o = W(cam, w);
  const hk = ob(seg(t, l8.word('broke').t0, l8.word('broke').t0 + 0.2));
  if (hk > 0) o += S.g(K.counter(0, 0, 0, 1, '#FF5A5A') + TF('$0.00', 0, 100, 56, '#FF5A5A', { stroke: '#151515', 'stroke-width': 8, 'paint-order': 'stroke' }), `translate(1560 150) rotate(6) scale(${f(1.25 * hk)})`);
  return o;
}
function shotLaugh(t) {
  // "[laughs] Totally, completely broke." — he flops back laughing; wide reveals Pickle and Mia on the couch
  const cam = camKeys(t, [[tLaugh, at(1000, 620, 1.35)], [tHere, at(1000, 600, 1.45)]]);
  const flop = ob(seg(t, tLaugh + 0.1, tLaugh + 0.5));
  const shake = Math.sin(t * 22) * 3;
  const cast = trio(t, {
    ty: { armL: 40 + 30 * flop, armR: 40 + 30 * flop, lean: -4 * flop + shake * 0.5, bodyY: -6 * flop, headRot: shake, face: { name: 'joy', fx: ['blush'] } },
    pickle: { face: { name: 'joy' }, turn: -0.35, headRot: shake * 0.6 },
    mia: { face: { name: 'deadpan', eyes: { look: [0.6, 0] } }, turn: 0.3 },
  });
  return W(cam, livingRoom(t, cast)) + flashCut(t, tLaugh);
}
function shotHere(t) {
  // Pickle holds out his palm — one Robux
  const cam = camKeys(t, [[tHere, at(1100, 560, 1.75)], [tCoin, at(1120, 560, 1.85)]]);
  const reach = ob(seg(t, tHere, tHere + 0.35));
  const [hx, hy] = A.hand(lerp(12, 80, reach), -1);
  const cast = trio(t, {
    pickle: { turn: -0.45, armL: lerp(12, 80, reach), face: { name: 'happy', eyes: { look: [-0.7, 0] } }, props: [{ svg: coin(hx - 20, hy - 40, 34, 0, t * 2), layer: 'top' }] }, pkAct: { arms: false },
    ty: { turn: 0.45, face: { name: 'confused', eyes: { look: [0.7, 0.2] } } },
  });
  return W(cam, livingRoom(t, cast));
}
function shotCoinInsert(t) {
  // insert: the single Robux in Pickle's palm, glinting
  const u = seg(t, tCoin, tNext);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FF9F4F' }) + rays(960, 520, 18, 1400, '#FFE3A3', 0.35, t * 15);
  o += S.g(S.rect(-300, -60, 600, 600, 140, ol('#F8D9C0', 12)) + S.path('M-200 60 Q0 120 200 60', ln(8, '#EBC0A2')) + S.rect(-330, 300, 660, 400, 60, ol('#58B947', 12)), `translate(960 ${f(lerp(700, 650, u))}) scale(${f(lerp(0.95, 1.05, u))})`);
  o += coin(960, lerp(560, 540, u), 150, -8, 0.15 + Math.sin(t * 3) * 0.15);
  o += K.F.sparkle(1080, 420, 70 * bump(t, tCoin + 0.25, tCoin + 0.85)) + K.F.sparkle(860, 640, 40 * bump(t, tCoin + 0.4, tCoin + 1.0));
  o += bang('ting!', 1340, 330, seg(t, tCoin + 0.2, tCoin + 0.3), 90, 8, '#FFFFFF');
  return o;
}
function shotNextMansion(t) {
  // Pickle, warm: "For your next mansion."
  const cam = camKeys(t, [[tNext, at(pkAt, couchHead('pickle') + 40, 2.3)], [tThanks, at(pkAt, couchHead('pickle') + 40, 2.5)]]);
  const [hx, hy] = A.hand(70, -1);
  const cast = trio(t, { pickle: { turn: -0.4, armL: 70, face: { name: 'happy', eyes: { look: [-0.8, 0] } }, props: [{ svg: coin(hx - 20, hy - 40, 34, 0, t * 2), layer: 'top' }] }, pkAct: { arms: false } });
  return W(cam, livingRoom(t, cast)) + soft(1400, 300, 700, 's11warm', 0.6);
}
function shotThanks(t) {
  // Ty, touched, takes the coin
  const cam = camKeys(t, [[tThanks, at(tyAt + 20, couchHead('ty') + 40, 2.3)], [tSpend, at(tyAt + 20, couchHead('ty') + 40, 2.55)]]);
  const take = ease.inOut(seg(t, tThanks + 0.2, tThanks + 0.6));
  const [hx, hy] = A.hand(lerp(12, 60, take), 1);
  const cast = trio(t, { ty: { turn: 0.4, armR: lerp(12, 60, take), face: { name: 'cute', mouth: undefined, eyes: { look: [0.8, 0] }, fx: ['blush'] }, props: take > 0.8 ? [{ svg: coin(hx + 10, hy - 40, 34, 0, t * 2), layer: 'top' }] : [] }, tyAct: { arms: false } });
  return W(cam, livingRoom(t, cast)) + soft(1300, 300, 700, 's11warm', 0.6);
}
function shotSpend(t) {
  // two-shot: Ty holds the coin up — a thought bubble: a red shoe. "For you." he points at Pickle
  const cam = camKeys(t, [[tSpend, at(1100, 560, 1.6)], [tShoe, at(1100, 560, 1.7)]]);
  const up = ob(seg(t, tSpend + 0.1, tSpend + 0.4));
  const pt = ob(seg(t, tForYou - 0.1, tForYou + 0.2));
  const [hx, hy] = A.hand(lerp(60, 150, up), 1);
  const cast = trio(t, {
    ty: { turn: 0.3, armR: pt > 0 ? lerp(150, 80, pt) : lerp(60, 150, up), face: { name: 'happy', fx: ['blush'] }, props: pt > 0.5 ? [] : [{ svg: coin(hx + 10, hy - 40, 34, 0, t * 3), layer: 'top' }] }, tyAct: { arms: false },
    pickle: { turn: -0.4, face: { name: pt > 0 ? 'amazed' : 'happy', eyes: { look: [-0.7, -0.3] } } },
  });
  let w = livingRoom(t, cast);
  const b = ob(seg(t, tShoeW - 0.15, tShoeW + 0.15));
  if (b > 0) {
    let bub = S.ellipse(0, 0, 210, 140, ol('#FFFFFF', 7)) + S.circle(-150, 150, 26, ol('#FFFFFF', 6)) + S.circle(-190, 200, 14, ol('#FFFFFF', 5));
    bub += shoeIcon(0, 20, 1.1, -6) + K.F.sparkle(130, -80, 24);
    w += S.g(bub, `translate(${tyAt + 260} ${couchHead('ty') - 260}) scale(${f(b * 0.62)})`);
  }
  return W(cam, w);
}
function shotAShoe(t) {
  // smash zoom: Pickle's happy gasp — star eyes, sparkle burst behind, he pops up off the couch
  const pop = ob(seg(t, tShoe + 0.1, tShoe + 0.35));
  const cam = camKeys(t, [[tShoe, at(pkAt, couchHead('pickle') + 20, 2.2)], [tShoe + 0.15, at(pkAt, couchHead('pickle') - 10, 2.7)], [tRecord, at(pkAt, couchHead('pickle') - 20, 2.8)]]);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFE14D' }) + rays(960, 460, 24, 1600, '#FFFFFF', 0.45, t * 40);
  const cast = trio(t, { pickle: { armL: 150 * pop, armR: 150 * pop, lift: 40 * pop, face: { name: 'excited', mouth: undefined } } });
  // draw only Pickle over the burst background (the room drops away for the gag)
  const s = CS;
  const pk = actor('pickle', t, { x: pkAt, y: sitY('pickle', SEAT, s) - 30 * pop, s, shadow: false, ...cast[2].pose }, cast[2].act);
  o += W(cam, pk);
  o += K.sparkles([[300, 260, 50], [1600, 300, 60], [1500, 800, 40], [380, 760, 44]], t);
  return o;
}
function shotRecord(t) {
  // Mia, not looking up from her phone... then she does: "pretty okay millionaire"
  const cam = camKeys(t, [[tRecord, at(miAt, couchHead('mia') + 40, 2.2)], [tDay, at(miAt, couchHead('mia') + 40, 2.4)]]);
  const up = seg(t, tOkay - 0.1, tOkay + 0.15);
  const cast = trio(t, { mia: { turn: 0.35, face: { name: up > 0.5 ? 'smug' : 'deadpan', eyes: { look: up > 0.5 ? [0.8, 0] : [0.2, 0.6] } } } });
  return W(cam, livingRoom(t, cast)) + flashCut(t, tRecord);
}
function shotForADay(t) {
  // three-shot: "For like a day." — back to her phone; Ty beams; "Thanks, Mia."
  const cam = camKeys(t, [[tDay, at(1000, 600, 1.42)], [tOn, at(1000, 600, 1.5)]]);
  const cast = trio(t, {
    mia: { turn: 0.2, face: { name: 'deadpan', eyes: { look: [0.2, 0.6] } } },
    ty: { turn: -0.35, face: { name: t > tThxMia ? 'happy' : 'joy', eyes: { look: [-0.8, 0] } } },
    pickle: { turn: -0.3, face: { name: 'happy', eyes: { look: [-0.8, 0] } } },
  });
  return W(cam, livingRoom(t, cast)) + soft(500, 300, 800, 's12sun', 0.4);
}
function screenAt(t, small = false) {
  if (t < tOn + 0.1) return { inner: tvOff(), ticker: '' };
  if (t < tOn + 0.4) return { inner: tvStatic(t), ticker: '' };
  return { inner: newsScreen(t, 'every', small), ticker: 'EVERY GAME COIN = REAL MONEY  •  STARTING TOMORROW  •  CHECK YOUR OLD SAVE FILES  •  ' };
}
function shotTVOn(t) {
  // the TV clicks on by itself; all three heads snap toward it
  const cam = camKeys(t, [[tOn, at(1180, 600, 1.2)], [tNews, at(1250, 590, 1.28)]]);
  const snap = ob(seg(t, tOn + 0.15, tOn + 0.35));
  const sc = screenAt(t, true);
  const cast = trio(t, { watch: snap, ty: { face: { name: 'shocked', eyes: { look: [0.9, 0] } } }, pickle: { face: { name: 'amazed', eyes: { look: [0.9, 0] } } }, mia: { face: { name: 'shocked', eyes: { look: [0.9, 0] } } } });
  let o = W(cam, livingRoom(t, cast, { tvInner: sc.inner, ticker: sc.ticker, tvGlow: t > tOn + 0.1 ? 0.7 : 0 }));
  o += bang('*click*', 1560, 250, seg(t, tOn, tOn + 0.08) * (1 - seg(t, tOn + 0.7, tOn + 0.9)), 70, 6, '#FFFFFF');
  return o;
}
function shotBreaking(t) {
  const sc = screenAt(t);
  const push = 0.06 * seg(t, tNews, tBeat) + 0.08 * ease.out(seg(t, tEvery, tEvery + 0.2));
  let o = tvClose(t, sc.inner, sc.ticker, push);
  if (t > tMoneyW) for (let i = 0; i < 16; i++) { const y = ((t - tMoneyW) * (500 + hash(i) * 300) + hash(i * 3.3) * 300) - 200; if (y < 1150) o += gameCoin(i % 5, 80 + hash(i * 7.1) * 1760, y, 0.9, t * 120 + i * 40); }
  return o;
}
// Pickle's twelve (non-Robux) game coins, held up in his raised screen-right hand (body space)
function twelveCoins(show) {
  if (show <= 0) return '';
  const [hx, hy] = A.hand(150, 1);
  let o = '';
  for (let i = 0; i < 12; i++) o += gameCoin(0, (i % 4) * 66 - 99, -Math.floor(i / 4) * 62, 0.85, (i % 2 ? 8 : -8));
  return S.g(o, `translate(${f(hx + 60)} ${f(hy - 90)}) scale(${f(show)})`);
}
function shotBeat(t) {
  // the silent beat: the three stare at the TV. Then Pickle turns — slowly — to camera: "I have twelve of those too!"
  const cam = camKeys(t, [[tBeat, at(1000, 600, 1.38)], [tTurnPk + 0.4, at(1080, 580, 1.55)], [tTyNo, at(pkAt + 30, couchHead('pickle') + 10, 2.25)]]);
  const turn = ease.inOut(seg(t, tTurnPk, tTurnPk + 0.7));
  const show = ob(seg(t, l15.word('twelve').t0 - 0.2, l15.word('twelve').t0 + 0.1));
  const pouch = twelveCoins(show);
  const cast = trio(t, {
    watch: 1,
    ty: { face: { name: 'shocked', eyes: { look: [0.9, 0] } } },
    mia: { face: { name: 'shocked', eyes: { look: [0.9, 0] } } },
    pickle: { turn: lerp(0.65, 0, turn), armR: lerp(12, 150, show), face: { name: show > 0 ? 'excited' : 'happy', mouth: t < l15.a ? (turn > 0.6 ? 'smile' : 'line') : undefined, eyes: { look: [lerp(0.9, 0, turn), 0] } }, props: show > 0 ? [{ svg: pouch, layer: 'top' }] : [] }, pkAct: { arms: false },
  });
  let o = W(cam, livingRoom(t, cast, { tvInner: newsScreen(t, 'every', true), ticker: 'EVERY GAME COIN = REAL MONEY  •  ', tvGlow: 0.8 }));
  o += soft(1900, 500, 900, 's12tvGlow', 0.5);
  return o;
}
function shotOhNo(t) {
  // Ty: slowly turns to camera, deadpan. "...Oh no." Hold. Slow zoom. (Smash cut to the outro.)
  const z = lerp(2.75, 3.7, ease.inOut(seg(t, tTyNo, S13)));
  const cam = at(tyAt, couchHead('ty') + 10, z);
  const slide = ease.inOut(seg(t, tOhNo - 0.05, tOhNo + 0.3));  // the deadpan eye-slide from the TV to us
  const cast = trio(t, {
    watch: 1,
    ty: { turn: 0.05, face: { name: 'deadpan', eyes: { upper: 0.5, look: [lerp(0.9, 0, slide), 0] }, fx: t > l16.b + 0.3 ? ['sweat'] : [] } }, tyAct: { energy: 0.15 },
    pickle: { turn: 0, armR: 150, face: { name: 'excited', mouth: 'bigGrin' }, props: [{ svg: twelveCoins(1), layer: 'top' }] }, pkAct: { arms: false },
    mia: { face: { name: 'deadpan', eyes: { look: [0.9, 0] } } },
  });
  let o = W(cam, livingRoom(t, cast, { tvInner: newsScreen(t, 'every', true), tvGlow: 0.8 }));
  o += soft(1900, 500, 900, 's12tvGlow', 0.45);
  return o;
}

// ---------------------------------------------------------------- router
function scene(t) {
  if (t < tMorning) return shotReset(t);
  if (t < tLiving) return shotMorning(t);
  if (t < tTV1) return shotFamilyTV(t);
  if (t < tBread) return shotTVGame(t);
  if (t < tDad) return shotTVBread(t);
  if (t < tMom) return shotDadPay(t);
  if (t < tGma) return shotMom(t);
  if (t < tReal) return shotGmaType(t);
  if (t < tCoffee) return shotGmaThumbs(t);
  if (t < tStream) return shotCoffee(t);
  if (t < tCharity) return shotStream(t);
  if (t < tPw3) return shotCharity(t);
  if (t < tWork) return shotPw3(t);
  if (t < tMiaRoom) return shotWork(t);
  if (t < tHappier) return shotMiaHats(t);
  if (t < tMe) return shotMiaHug(t);
  if (t < tBroke) return shotMe(t);
  if (t < tLaugh) return shotBroke(t);
  if (t < tHere) return shotLaugh(t);
  if (t < tCoin) return shotHere(t);
  if (t < tNext) return shotCoinInsert(t);
  if (t < tThanks) return shotNextMansion(t);
  if (t < tSpend) return shotThanks(t);
  if (t < tShoe) return shotSpend(t);
  if (t < tRecord) return shotAShoe(t);
  if (t < tDay) return shotRecord(t);
  if (t < tOn) return shotForADay(t);
  if (t < tNews) return shotTVOn(t);
  if (t < tBeat) return shotBreaking(t);
  if (t < tTyNo) return shotBeat(t);
  return shotOhNo(t);
}
function look(t) {
  if (t >= tStream && t < tWork && t < tPw3) return { grade: null, vignette: 0.3 };
  if (t >= tBeat) return { grade: 'cool', vignette: 1 };
  return { grade: 'warm', vignette: 0.8 };
}
// the TV ticker lives at the bottom of the TV close-ups: lift the captions a little there
function captionY(t) { return (t >= tTV1 && t < tDad) || (t >= tNews && t < tBeat) ? 1036 : 1010; }

module.exports = { scene, look, DEFS, captionY, livingRoom, livingBg, couchBack, couchFront, sitLegs, sitY, hat, gameCoin, shoeIcon, mug, bread, SEAT, FEET };
