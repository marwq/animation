// SC 04 · THE WORLD SWITCHES TO ROBUX — the city's signs flip to Robux, a game-pass montage (bus, cafeteria, ice cream,
// supermarket VIP, skip-math, elevator, dentist, homework, free shipping, Dad's office) and the Thirty Percent Guy's debut.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, coinBurst, bang, rays } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const X = require('./s04_env');
const { GY, extra, kidIn, shades, headProp, poof, stamp30, kaching, spotlight, flip, purchased, thirty, thirtyPop, whip } = X;

const SC = K.V.scene('SC 04');
const T0 = SC.start, END = K.V.scene('SC 05').start;
const l0 = L('04.0'), l1 = L('04.1'), l2 = L('04.2'), l3 = L('04.3'), l4 = L('04.4'), l5 = L('04.5'), l6 = L('04.6'), l7 = L('04.7'), l8 = L('04.8');
const l9 = L('04.9'), l10 = L('04.10'), l11 = L('04.11'), l12 = L('04.12'), l13 = L('04.13'), l14 = L('04.14'), l15 = L('04.15'), l16 = L('04.16'), l17 = L('04.17'), l18 = L('04.18');

// ---------------------------------------------------------------- beats (all from the voice)
const tWhole = l0.word('whole').t0, tSwitch = l0.word('switched').t0, tRbx0 = l0.word('Robux').t0;
const tBus = l1.a - 0.12, tBusR = l1.word('Robux').t0;
const tCaf = l1.word('The', 1).t0 - 0.08, tCafW = l1.word('wanted', 1).t0, tCafR = l1.word('Robux', 1).t0;
const tIce = l1.word('Even').t0 - 0.1, tTag = l1.word('price').t0;
const tGP = l2.a - 0.1, tEvery = l2.word('everything').t0, tPasses = l2.word('GAME').t0;
const tVip = l3.a - 0.15, tVipW = l3.word('VIP').t0;
const tCart = l3.word('Double').t0 - 0.12, t99 = l3.word('Ninety-nine').t0;
const tLine = l4.a - 0.1, tGP1 = l4.word('Game').t0;
const tFries = l4.word('Want', 1).t0 - 0.1, tGP2 = l4.word('Game', 1).t0;
const tMath = l4.word('Want', 2).t0 - 0.1;
const tSkip = l5.a - 0.08, t999 = l5.word('Nine').t0, tSkipR = l5.word('Robux').t0;
const tShoe = l6.a - 0.15, tShoeW = l6.word('shoe').t0;
const tHave = l7.a - 0.08, tHaveW = l7.word('HAVE').t0;
const tSave = l8.a - 0.1;
const tElev = l9.a - 0.1, tElevSkip = l9.word('skip').t0, tElevGo = l9.word('pass').t0;
const tDent = l9.word('The', 1).t0 - 0.08, tNoDrill = l9.word('no').t0, tDrill = l9.word('pass', 1).t0;
const tTeach = l9.word('My').t0 - 0.08, tDelete = l9.word('delete').t0, tButton = l9.word('button').t0;
const tMom = l10.a - 0.08, tFree = l10.word('free').t0, tPhone = l10.word('called').t0 - 0.05;
const tBuy = l10.word('She').t0 - 0.1, tBought = l10.word('bought').t0;
const tAll = l10.word('For').t0 - 0.12, tEvery2 = l10.word('EVERYTHING').t0;
const tPorch = l11.a - 0.1, tDrone = l11.word('drone').t0;
const tPay = l12.a - 0.1, tPayR = l12.word('Robux').t0;
const tCoffee = l12.word('And').t0 - 0.12, tPrem = l12.word('PREMIUM').t0, tCoffeeGP = l12.word('game').t0;
const tPromo = l13.a - 0.08, tFive = l13.word('five').t0, tPromoR = l13.word('Robux').t0;
const tRank = l13.word("It's").t0 - 0.1, tRankW = l13.word('rank').t0;
const tReg = l14.a - 0.1, tHe = l14.word('HE').t0;
const tPop = l15.a - 0.1, tFee = l15.word('fee').t0, t30 = l15.word('Thirty').t0, tPct = l15.word('percent').t0;
const tBye = l15.word('Thank').t0 - 0.1, tAgain = l15.word('again').t0;
const tSplit = l16.a - 0.05, tWent = l16.word('Nobody', 1).t0;
const tSand = l16.word('He', 2).t0 - 0.1, tTook = l16.word('took').t0, tTookPct = l16.word('percent').t0;
const tDadMad = l17.a - 0.1, tSandW = l17.word('SANDWICH').t0;
const tChew = l17.b + 0.45;

// ---------------------------------------------------------------- small drawing helpers
const ty = (t, x, y, s, pose = {}, act = {}) => actor('ty', t, { x, y, s, ...pose }, act);
const PCOL = ['#FF5A5A', '#FFD21F', '#3BD16F', '#34C3FF', '#B06BFF', '#FF8FC8', '#FF924C'];
// blocky Roblox hand + sleeve reaching in; (x, y) = fingertips, rot = direction (0 = pointing up)
function blockHand(x, y, rot, s = 1, sleeve = '#F2B53A', skin = '#E9B38B', item = '') {
  let o = S.rect(-46, 40, 92, 520, 16, ol(sleeve, 7)) + S.rect(-50, 40, 100, 40, 10, ol('#00000022', 0));
  o += S.rect(-42, -40, 84, 96, 22, ol(skin, 7)) + S.path('M-16 -40 L-16 -6 M10 -40 L10 -6', ln(5, '#0004'));
  o += item;
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
// a seated-at-desk student desk (front view); covers legs
function desk(x, y, w = 360, col = '#E2B47A') {
  return S.rect(x - w / 2, y, w, 36, 10, ol(col, 6)) + S.rect(x - w / 2 + 20, y + 30, w - 40, 210, 8, ol('#C9935A', 6)) + S.path(`M${x - w / 2 + 40} ${y + 70} L${x + w / 2 - 40} ${y + 70}`, ln(5, '#B07A48'));
}
// floating "?" and "!" marks
const mark = (txt, x, y, k, size = 110, rot = 10, col = '#FFFFFF') => (k > 0 ? S.g(K.F.markText(txt, 0, 0, size, rot, col), `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`) : '');
function rayBg(col1, col2, t, cx = 960, cy = 540) {
  return S.rect(-400, -400, 2720, 1880, 0, { fill: col1 }) + rays(cx, cy, 18, 2200, col2, 0.5, t * 12);
}

// ---------------------------------------------------------------- A: the city flips to Robux
function shotCity(t) {
  const cam = camKeys(t, [[T0, { zoom: 1.3, x: 120, y: -760 }], [tWhole - 0.1, { zoom: 1.0, x: 0, y: 0 }], [tRbx0, { zoom: 1.04, x: 60, y: -20 }], [tBus, { zoom: 1.12, x: 70, y: -40 }]]);
  const sh = K.shake(t, tRbx0, 0.45, 14); cam.sx = sh.sx; cam.sy = sh.sy;
  const fl = (i) => seg(t, tWhole + i * 0.13, tWhole + i * 0.13 + 0.28);
  const c = X.cityStreet(t, cam, { flip: fl, billboard: seg(t, tRbx0 - 0.12, tRbx0 + 0.16) });
  let o = c.bg;
  let w = c.street;
  // a car crossing + pedestrians on the sidewalk reacting
  w += K.E.car(lerp(-300, 2400, seg(t, T0 + 0.5, tBus + 1)), GY + 290, '#FF6FB5', t, 1.1, true);
  const peds = [[-260, 3, 1], [250, 5, -1], [640, 11, 1], [1500, 8, -1], [1860, 14, 1]];
  peds.forEach(([px, k, dir], i) => {
    const tStop = tSwitch + i * 0.12, stop = t > tStop;
    const x = px + dir * (Math.min(t, tStop) - T0) * 60;
    const ph = t * 7 + i;
    w += kidIn(k, t, stop ? { x, y: GY + 60, s: 0.34, face: { name: 'amazed', eyes: { look: [0, -0.8] } }, headRot: -6, armR: 30 + 10 * Math.sin(t * 6 + i), armL: 15 } : { x, y: GY + 60, s: 0.34, view: 'side', flip: dir > 0, ...A.walk(ph, 1) });
  });
  w += ty(t, 1080, 1010, 0.46, { turn: -0.2, face: t < tRbx0 ? { name: 'amazed', eyes: { look: [-0.3, -0.7] } } : { name: 'excited' }, armL: t > tRbx0 ? 150 : 20, armR: t > tRbx0 ? 160 : 20 }, { arms: false });
  w += coinBurst(1010, GY - 560, t - tRbx0, 30, 1000, 28, 5);
  o += view(cam, w, 1);
  o += kaching(1520, 400, t - tRbx0, 1.0, 'KA-CHING!');
  o += C.whiteFlash(1 - seg(t, T0, T0 + 0.3));
  return o;
}

// ---------------------------------------------------------------- B1: the bus
function shotBus(t) {
  const cam = camKeys(t, [[tBus, { zoom: 1.0, x: 40, y: 20 }], [tCaf, { zoom: 1.08, x: 0, y: 30 }]]);
  const stop = tBus + 0.45;
  const u = ease.out(seg(t, tBus - 0.15, stop));
  const bx = lerp(2100, 160, u);
  const sq = bump(t, stop - 0.02, stop + 0.3);
  const c = X.cityStreet(t, cam, { crosswalk: false, noFurniture: true });
  let w = c.street + X.busStop(140, GY + 40);
  const doorK = ease.out(seg(t, stop + 0.05, stop + 0.25));
  const adK = seg(t, tBusR - 0.1, tBusR + 0.15);
  const ad = flip(0, 0, adK, S.rect(-230, -60, 460, 120, 16, ol('#FFFFFF', 6)) + T('FARE $2', 0, 26, 72, '#2F9E44'), S.rect(-230, -60, 460, 120, 16, ol('#FFE14D', 6)) + K.robuxText(0, 30, '2 ONLY', 70, '#2A1640'));
  w += X.bus(bx, GY + 170, 1.2, t, { door: doorK, label: adK > 0.5 ? 'ROBUX ONLY' : 'DOWNTOWN', ad, wheelSpin: -bx * 0.9, bob: -10 * sq });
  w += C.dust(bx + 1100, GY + 160, stop - 0.05, t);
  // a kid at the door flicks a coin into the fare box
  const flick = seg(t, tBusR - 0.35, tBusR - 0.05);
  w += kidIn(5, t, { x: bx + 520, y: GY + 200, s: 0.46, view: 'side', armL: 20 + 70 * bump(flick, 0, 1), face: 'happy', shadow: true });
  if (flick > 0 && flick < 1) w += coin(lerp(bx + 470, bx + 230, flick), GY - 120 - Math.sin(flick * Math.PI) * 140, 22, flick * 400, t * 12);
  let o = c.bg + view(cam, w, 1);
  o += kaching(1500, 300, t - tBusR, 0.9);
  return o;
}

// ---------------------------------------------------------------- B2: the cafeteria
function cafeteria(t) {
  let o = S.rect(-200, -200, 2320, 1600, 0, { fill: 'url(#s04tileMint)' });
  o += S.rect(-200, 660, 2320, 30, 0, { fill: '#7FCBB4' });
  // menu board
  o += S.rect(420, 60, 1080, 380, 26, ol('#2A3A4A', 10)) + T('LUNCH MENU', 960, 140, 70, '#FFE14D');
  return o;
}
function shotCafeteria(t) {
  const cam = camKeys(t, [[tCaf, { zoom: 1.0, x: 0, y: 0 }], [tIce, { zoom: 1.08, x: 40, y: 10 }]]);
  let w = cafeteria(t);
  const items = [['PIZZA', '$3', '3'], ['TACO', '$2', '2'], ['JELLO', '$1', '1'], ['MILK', '50¢', '1']];
  items.forEach(([nm, usd, r], i) => {
    const x = 560 + i * 265, k = seg(t, tCafW + i * 0.08, tCafW + i * 0.08 + 0.22);
    w += TF(nm, x, 240, 46, '#FFFFFF') + flip(x, 330, k, S.rect(-90, -50, 180, 100, 16, ol('#FFFFFF', 5)) + T(usd, 0, 26, 64, '#2F9E44'), X.robuxCard(r), 1);
  });
  // lunch lady behind the counter
  w += extra('teacher', t, { x: 1380, y: 910, s: 0.5, face: { name: 'deadpan' }, armR: 60, armL: 20, props: [{ svg: S.ellipse(0, -930, 150, 60, { fill: '#FFFFFF', opacity: 0.85, stroke: '#151515', 'stroke-width': 5 }), layer: 'front' }] });
  // counter + sneeze guard + food trays
  w += S.rect(-200, 700, 2320, 60, 10, ol('#C9CED8', 6)) + S.rect(-200, 760, 2320, 400, 0, ol('#8FA3B8', 6));
  w += S.path('M200 520 L1700 520', ln(10, '#FFFFFF', 0.6)) + S.rect(200, 520, 1500, 180, 0, { fill: '#DFF6FF', opacity: 0.35 });
  for (let i = 0; i < 4; i++) {
    const x = 330 + i * 300;
    w += S.rect(x - 110, 660, 220, 50, 10, ol('#D9DEE8', 5));
    if (i === 0) w += S.path(`M${x - 70} 670 L${x + 70} 670 L${x} 620 Z`, ol('#FFC24A', 5)) + S.circle(x - 10, 656, 8, { fill: '#E8503A' }) + S.circle(x + 20, 662, 7, { fill: '#E8503A' });
    if (i === 1) for (let j = 0; j < 4; j++) w += S.rect(x - 80 + j * 42, 626, 34, 34, 8, ol('#3BD16F', 4));
    if (i === 2) w += S.ellipse(x, 650, 70, 24, ol('#B9805D', 5));
    if (i === 3) for (let j = 0; j < 3; j++) w += S.rect(x - 70 + j * 50, 610, 40, 56, 6, ol('#FFFFFF', 4)) + S.rect(x - 70 + j * 50, 620, 40, 14, 0, { fill: '#34C3FF' });
  }
  // register with ROBUX ONLY sticker
  w += S.rect(1560, 590, 220, 120, 16, ol('#5A6078', 6)) + S.rect(1580, 600, 180, 50, 8, ol('#BFF5B0', 4)) + K.robuxText(1670, 640, 'ONLY', 34, '#1A5A1A');
  // Ty sliding his tray, front-ish
  const slide = lerp(500, 820, ease.inOut(seg(t, tCaf, tCafR)));
  w += ty(t, slide, 1130, 0.62, { turn: 0.5, armL: 52, armR: 52, face: t > tCafR ? { name: 'shocked' } : { name: 'happy' }, props: [{ svg: S.rect(-190, -360, 380, 40, 10, ol('#FF8FC8', 6)) + S.path('M-60 -360 L60 -360 L0 -420 Z', ol('#FFC24A', 5)), layer: 'front' }] }, { arms: false });
  let o = view(cam, w, 1);
  o += kaching(1670, 470, t - tCafR, 0.8);
  return o;
}

// ---------------------------------------------------------------- B3: the ice cream truck (the six-year-old owns it now)
function shotIce(t) {
  const cam = camKeys(t, [[tIce, { zoom: 1.0, x: 0, y: 0 }], [tTag - 0.15, { zoom: 1.06, x: 40, y: 0 }], [tTag + 0.08, { zoom: 1.7, x: 150, y: 70 }], [tGP, { zoom: 1.78, x: 160, y: 70 }]]);
  const c = X.cityStreet(t, cam, { crosswalk: false });
  let w = c.street;
  const driver = K.draw.kid(6, { x: 150, y: -40, s: 0.3, turn: -0.6, face: { name: 'smug' }, armL: 70, armR: 10, props: [headProp(shades(), {})] });
  w += X.iceTruck(230, GY + 210, 1.1, t, { price: '4', priceK: seg(t, tTag - 0.05, tTag + 0.3), driver });
  // Pickle bouncing on tiptoes beside the window, eyes on the price
  const hop = Math.abs(Math.sin((t - tIce) * 8)) * 30 * (t < tTag ? 1 : 0.15);
  w += actor('pickle', t, { x: 1340, y: GY + 215, s: 0.5, lift: hop, turn: -0.5, armL: t < tTag ? 160 : 30, armR: t < tTag ? 150 : 30, face: t < tTag + 0.2 ? { name: 'excited' } : { name: 'nervous', eyes: { look: [-0.7, -0.5] } }, headRot: 4 }, { arms: false });
  w += kidIn(9, t, { x: 1640, y: GY + 215, s: 0.46, turn: -0.5, face: 'happy', armR: 80, props: [{ svg: S.g(S.path('M-24 0 L24 0 L0 80 Z', ol('#E8B26A', 4)) + S.circle(0, -18, 32, ol('#7FE0D2', 5)), 'translate(-300 -640)'), layer: 'front' }] });
  let o = c.bg + view(cam, w, 1);
  o += kaching(1580, 240, t - tTag - 0.1, 0.8);
  return o;
}

// ---------------------------------------------------------------- C: everything gets game passes
const PASSES = [
  // [screen x, y, title, price, icon] — placed over the street props seen in this shot
  [1560, 230, 'SUNSHINE+', '50', 'sun'], [300, 210, 'OXYGEN+', '5', 'air'], [600, 420, 'SHADE PASS', '10', 'tree'], [1300, 560, 'TRASH+', '2', 'trash'],
  [330, 650, 'SPLASH VIP', '15', 'splash'], [1560, 770, 'PET PIGEON', '1', 'bird'], [1790, 470, 'LAMP: ON', '3', 'lamp'],
];
function passIcon(kind) {
  const g = (inner) => S.g(inner, 'translate(0 -30)');
  switch (kind) {
    case 'sun': return g(S.circle(0, 0, 40, ol('#FFE55C', 5)) + rays(0, 0, 8, 62, '#FFB000', 0.9, 0));
    case 'air': return g(S.circle(-20, 0, 30, ol('#BDEBFF', 5)) + S.circle(26, -20, 20, ol('#BDEBFF', 5)) + S.circle(20, 26, 14, ol('#BDEBFF', 5)) + TF('O₂', -20, 12, 30, '#2E7BFF'));
    case 'splash': return g(S.path('M0 -50 Q34 -6 30 18 Q24 50 0 50 Q-24 50 -30 18 Q-34 -6 0 -50 Z', ol('#34C3FF', 5)) + S.path('M-12 10 Q-10 30 8 34', ln(6, '#FFFFFF')));
    case 'trash': return g(S.path('M-34 -30 L34 -30 L28 40 L-28 40 Z', ol('#5BAE7A', 5)) + S.rect(-40, -44, 80, 16, 6, ol('#4A956A', 5)));
    case 'tree': return g(S.circle(0, -10, 40, ol('#4CC35E', 5)) + S.rect(-8, 24, 16, 26, 4, ol('#8A5A34', 4)));
    case 'lamp': return g(S.ellipse(0, 0, 50, 26, ol('#FFF4C8', 5)) + rays(0, 0, 8, 70, '#FFE14D', 0.6, 0));
    case 'walk': return g(S.rect(-46, -40, 92, 80, 12, ol('#151515', 4)) + S.circle(0, -14, 10, { fill: '#FFFFFF' }) + S.path('M0 -2 L0 18 M0 18 L-12 34 M0 18 L12 34 M-14 6 L14 6', ln(6, '#FFFFFF')));
    case 'bird': return g(S.ellipse(0, 0, 42, 30, ol('#A9B0C2', 5)) + S.circle(26, -18, 18, ol('#A9B0C2', 5)) + S.circle(30, -22, 4, { fill: '#151515' }) + S.path('M42 -16 L56 -12 L42 -8 Z', ol('#FFB000', 3)));
    default: return '';
  }
}
function shotGamePasses(t) {
  const smash = t >= tPasses;
  const cam = smash ? camKeys(t, [[tPasses, { zoom: 2.0, x: 0, y: 110 }], [tVip, { zoom: 2.15, x: 0, y: 115 }]]) : camKeys(t, [[tGP, { zoom: 1.0, x: 0, y: 0 }], [tPasses, { zoom: 1.08, x: 0, y: 20 }]]);
  const sh = K.shake(t, tPasses, 0.35, 16); cam.sx = sh.sx; cam.sy = sh.sy;
  const camW = { ...cam, x: (cam.x || 0) + 200 };
  const c = X.cityStreet(t, camW, {});
  let w = c.street;
  // a pigeon on the sidewalk (gets its own pass)
  w += S.g(passIcon('bird').replace('translate(0 -30)', 'translate(0 0)'), `translate(1760 ${GY + 50 + Math.abs(Math.sin(t * 6)) * -8}) scale(1.1)`);
  let o = c.bg + view(camW, w, 1);
  // Ty, front and centre (screen space world)
  const look = t < tEvery ? Math.sin((t - tGP) * 3) : 0;
  let fg = ty(t, 960, 1180, 0.68, { face: smash ? { name: 'shocked', mouth: 'O' } : t > tEvery ? { name: 'amazed' } : { name: 'nervous', eyes: { look: [look, 0] } }, armL: smash ? 120 : 14, armR: smash ? 120 : 14, headRot: smash ? 0 : look * 6, sy: smash ? 1 + 0.1 * bump(t, tPasses, tPasses + 0.3) : 1 }, { arms: false });
  // passes pop on everything
  let pp = '';
  PASSES.forEach(([px, py, title, price, icon], i) => {
    const k = seg(t, tEvery + i * 0.09, tEvery + i * 0.09 + 0.3);
    pp += K.gamePass(px, py + Math.sin(t * 3 + i) * 6, title, price, 0.6, k, passIcon(icon));
  });
  o += view(cam, fg + pp, 1);
  o += bang('GAME PASSES?!', 960, 150, seg(t, tPasses + 0.05, tPasses + 0.2), 110, -6, '#5CF2FF');
  return o;
}

// ---------------------------------------------------------------- supermarket
const SHELF_DEF = (() => {
  let o = '<rect width="520" height="130" fill="#EEF3F8"/>';
  for (let p = 0; p < 7; p++) {
    const px = 14 + p * 72, col = PCOL[p % PCOL.length], kind = p % 3;
    if (kind === 0) o += S.rect(px, 22, 58, 86, 8, ol(col, 4)) + S.rect(px + 10, 44, 38, 22, 4, { fill: '#FFFFFF', opacity: 0.75 });
    else if (kind === 1) o += S.rect(px + 6, 52, 46, 56, 6, ol(col, 4)) + S.rect(px + 6, 66, 46, 14, 0, { fill: '#FFFFFF', opacity: 0.6 });
    else o += S.path(`M${px + 18} 108 L${px + 18} 52 Q${px + 18} 40 ${px + 26} 34 L${px + 26} 18 L${px + 34} 18 L${px + 34} 34 Q${px + 42} 40 ${px + 42} 52 L${px + 42} 108 Z`, ol(col, 4));
  }
  o += S.rect(0, 108, 520, 22, 0, { fill: '#C9CED8', stroke: '#151515', 'stroke-width': 4 });
  return `<pattern id="s04shelf" patternUnits="userSpaceOnUse" width="520" height="130">${o}</pattern>`;
})();
function supermarket(t, opts = {}) {
  let o = S.rect(-1000, -600, 4200, 1500, 0, { fill: '#FFF3E0' }) + S.rect(-1000, -600, 4200, 380, 0, { fill: '#FFE0C2' });
  for (let u = -1; u < 5; u++) {
    const x0 = u * 680 - 120;
    o += S.rect(x0, 240, 600, 540, 14, ol('#DDE4EE', 7)) + S.rect(x0 + 20, 260, 560, 520, 0, { fill: 'url(#s04shelf)' });
    o += S.rect(x0 + 180, 120, 240, 70, 16, ol(['#34C3FF', '#FF5A5A', '#3BD16F', '#FFD21F', '#B06BFF', '#FF8FC8'][(u + 1) % 6], 6)) + TF(['SNACKS', 'DRINKS', 'CEREAL', 'FROZEN', 'CANDY', 'BREAD'][(u + 1) % 6], x0 + 300, 168, 40, '#FFFFFF');
    o += S.path(`M${x0 + 220} 120 L${x0 + 220} 40 M${x0 + 380} 120 L${x0 + 380} 40`, ln(5));
  }
  o += S.rect(-1000, 780, 4200, 800, 0, { fill: 'url(#s04check)' }) + S.rect(-1000, 780, 4200, 14, 0, { fill: '#0002' });
  return o;
}
// shopping cart, side view facing right; (x, y) = wheels on floor
function cart(x, y, s = 1, gold = false, t = 0) {
  const c = gold ? '#FFC93C' : '#B5BCCB', d = gold ? '#C98A12' : '#7A8294';
  let o = S.path('M-150 -230 L150 -230 L120 -90 L-120 -90 Z', { fill: gold ? '#FFE9A0' : '#FFFFFF', opacity: 0.35, stroke: d, 'stroke-width': 8, 'stroke-linejoin': 'round' });
  for (let i = 1; i < 6; i++) o += S.path(`M${-150 + i * 50} -230 L${-120 + i * 40} -90`, ln(4, d));
  o += S.path('M-145 -185 L140 -185 M-132 -138 L128 -138', ln(4, d));
  o += S.path('M-150 -230 L-200 -280 L-240 -280', ln(10, d)) + S.path('M-120 -90 L-110 -40 L120 -40 L120 -90', ln(8, d));
  for (const wx of [-100, 100]) o += S.circle(wx, -18, 18, ol('#2A2A33', 5));
  if (gold) o += S.path('M-40 -250 L-40 -290 L-20 -270 L0 -296 L20 -270 L40 -290 L40 -250 Z', ol('#FFD21F', 5)) + K.F.sparkle(-160, -260, 20 * Math.abs(Math.sin(t * 6))) + K.F.sparkle(130, -110, 16 * Math.abs(Math.sin(t * 5 + 1)));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function flames(x, y, len, t, s = 1) {
  let o = '';
  for (let i = 0; i < 6; i++) {
    const ph = t * 18 + i * 1.7;
    const l = len * (0.55 + 0.45 * Math.abs(Math.sin(ph)));
    const yy = y - 20 - i * 26 + Math.sin(ph * 1.3) * 8;
    o += S.path(`M${x} ${f(yy - 24)} Q${f(x - l * 0.5)} ${f(yy - 40)} ${f(x - l)} ${f(yy)} Q${f(x - l * 0.5)} ${f(yy + 34)} ${x} ${f(yy + 24)} Z`, { fill: i % 2 ? '#FF7A1A' : '#FFB000', stroke: '#151515', 'stroke-width': 5, 'stroke-linejoin': 'round' });
    o += S.path(`M${x} ${f(yy - 10)} Q${f(x - l * 0.3)} ${f(yy - 14)} ${f(x - l * 0.55)} ${f(yy)} Q${f(x - l * 0.3)} ${f(yy + 14)} ${x} ${f(yy + 10)} Z`, { fill: '#FFF1A8' });
  }
  return S.g(o, `scale(${s})`);
}
function shotVip(t) {
  const cam = camKeys(t, [[tVip, { zoom: 1.25, x: 220, y: 90 }], [tCart, { zoom: 1.4, x: 260, y: 100 }]]);
  let w = supermarket(t);
  // a row of ordinary carts + one VIP cart glowing
  for (let i = 0; i < 3; i++) w += cart(260 + i * 150, 930, 0.9);
  const vipK = seg(t, tVipW - 0.1, tVipW + 0.2);
  if (vipK > 0) w += rays(1150, 760, 16, 520, '#FFF1B0', 0.45 * vipK, t * 30);
  w += cart(1150, 930, 1.1, vipK > 0.5, t);
  // Grandma in her headset, hyped
  w += actor('grandma', t, { x: 1560, y: 980, s: 0.5, turn: -0.4, face: vipK > 0.4 ? { name: 'excited' } : { name: 'amazed' }, armL: vipK > 0.4 ? 150 : 30, armR: vipK > 0.4 ? 160 : 40, lift: 30 * bump(t, tVipW, tVipW + 0.4) }, { arms: false });
  w += K.gamePass(1150, 440, 'SUPERMARKET VIP', '99', 0.8, seg(t, l3.a, l3.a + 0.35), S.g(cart(0, 46, 0.32, true, t), ''));
  let o = view(cam, w, 1);
  o += kaching(1380, 220, t - tVipW, 0.8, 'VIP!');
  return o;
}
function shotFireCart(t) {
  // Grandma rides the VIP cart past the queue on a trail of fire, skids to the register on "Ninety-nine"
  const arrive = t99;
  const u = seg(t, tCart, arrive);
  const cx = lerp(-400, 2560, ease.inOut(u)) + 40 * ease.out(seg(t, arrive, arrive + 0.2));
  const camX = clamp(cx - 760, -500, 1660);
  const cam = { zoom: 1.12 + 0.12 * ease.out(seg(t, arrive, tLine)), x: camX, y: 40 };
  const sh = K.shake(t, arrive, 0.4, 12); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = supermarket(t);
  // checkout counter + register on the right
  w += S.rect(2760, 700, 700, 300, 14, ol('#5A6078', 7)) + S.rect(2760, 690, 700, 30, 10, ol('#2A2E3E', 6));
  w += S.rect(2940, 540, 240, 150, 16, ol('#C9CED8', 6)) + S.rect(2960, 556, 200, 64, 8, ol('#BFF5B0', 4)) + K.robuxText(3060, 606, '99', 44, '#1A5A1A');
  // the queue (back lane): kids with carts facing right, blown about as she passes
  const Q = [[-200, 2], [300, 7], [800, 12], [1300, 4], [1800, 15], [2300, 9]];
  Q.forEach(([qx, k], i) => {
    const tp = tCart + ((qx + 400 + 200) / 2960) * (arrive - tCart);
    const spin = ease.out(seg(t, tp, tp + 0.3));
    w += kidIn(k, t, { x: qx, y: 890, s: 0.4, view: spin > 0.5 ? 'front' : 'side', flip: true, face: spin > 0.1 ? { name: 'shocked' } : { name: 'sleepy' }, armL: spin > 0.1 ? 140 : 30, armR: spin > 0.1 ? 140 : 30, rot: -10 * bump(spin, 0, 1), volume: false });
    w += cart(qx + 170, 890, 0.62);
  });
  // fire trail + Grandma on the gold cart (front lane)
  const speed = t < arrive ? 1 : 1 - seg(t, arrive, arrive + 0.4);
  if (speed > 0.05) w += C.speedLines(cx - 1300, cx - 360, 820, 14, 5, '#FFFFFF', 260);
  w += S.g(flames(0, 0, 460 * speed, t), `translate(${f(cx - 250)} 990)`);
  w += actor('grandma', t, { x: cx - 250, y: 990, s: 0.5, view: 'side', flip: true, lean: 16 * speed, armL: 75, armR: 65, legL: -8, legR: 18, face: { name: 'excited' }, shadow: false }, { arms: false });
  w += cart(cx, 1010, 1.05, true, t);
  const sk = seg(t, l3.word('speed').t0, l3.word('speed').t0 + 0.25) * (1 - seg(t, arrive - 0.1, arrive));
  if (sk > 0) w += S.g(S.rect(-80, -40, 160, 80, 20, ol('#FF5A5A', 6)) + T('x2', 0, 26, 64, '#FFFFFF'), `translate(${f(cx + 40)} 640) rotate(-8) scale(${f(ease.outBack(sk))})`);
  let o = view(cam, w, 1);
  o += X.kaching(1500, 260, t - arrive, 1.0);
  o += S.g(K.priceTag(0, 0, '99', 1.6, -8), `translate(1480 470) scale(${f(ease.outBack(seg(t, arrive + 0.1, arrive + 0.35)))})`);
  return o;
}

// ---------------------------------------------------------------- E1: the VIP checkout lane
function shotShortLine(t) {
  const cam = camKeys(t, [[tLine, { zoom: 1.0, x: -40, y: 20 }], [tGP1, { zoom: 1.05, x: 40, y: 20 }], [tFries, { zoom: 1.1, x: 100, y: 20 }]]);
  let w = supermarket(t);
  // lane 1: the endless queue facing its register
  w += S.rect(560, 640, 240, 160, 16, ol('#C9CED8', 6)) + S.rect(576, 656, 208, 60, 8, ol('#BFF5B0', 4)) + TF('LANE 1', 680, 600, 36, '#5A6078');
  w += S.rect(-600, 800, 1440, 200, 14, ol('#5A6078', 7));
  const Q = [[420, 3], [250, 8], [80, 11], [-90, 6], [-260, 13], [-430, 1]];
  Q.forEach(([qx, k], i) => {
    w += kidIn(k, t, { x: qx, y: 980, s: 0.46, view: 'side', flip: true, face: i < 2 && t > tGP1 ? { name: 'angry' } : { name: 'sleepy' }, armL: 20, armR: 10, bodyY: 6, volume: i > 2 ? false : undefined });
  });
  for (let i = 0; i < 5; i++) w += mark('z', -340 + i * 170, 560 - (i % 2) * 30, 1, 50, -10, '#FFFFFF');
  // the empty VIP lane: red carpet, gold posts, velvet rope
  w += S.rect(940, 940, 1100, 70, 10, { fill: '#D7263D' }) + S.rect(940, 940, 1100, 14, 0, { fill: '#FF4D6D', opacity: 0.6 });
  w += S.rect(1700, 620, 240, 180, 16, ol('#FFC93C', 6)) + T('VIP', 1820, 740, 90, '#2A1640');
  const open = ease.out(seg(t, tGP1 + 0.05, tGP1 + 0.4));
  for (const px of [1120, 1320]) w += S.rect(px - 10, 820, 20, 170, 6, ol('#FFC93C', 5)) + S.circle(px, 812, 18, ol('#FFC93C', 5));
  w += S.path(`M1120 850 Q${f(1220 - 60 * open)} ${f(910 + 40 * open)} ${f(lerp(1320, 1150, open))} ${f(lerp(850, 980, open))}`, ln(16, '#B3123A'));
  // the rich kid in shades strolls through
  const wk = seg(t, tGP1 + 0.25, tFries + 0.1);
  const walking = wk > 0 && wk < 1;
  w += extra('richKid', t, { x: lerp(1000, 1640, wk), y: 985, s: 0.52, view: walking ? 'side' : 'front', flip: true, ...(walking ? A.walk(t * 8) : {}), face: { name: 'smug' }, props: walking ? [] : [headProp(shades(), {})] });
  w += K.gamePass(1420, 380, 'SHORT LINE', '49', 0.8, seg(t, tGP1, tGP1 + 0.3), S.g(S.path('M-50 -20 L50 -20 M-50 0 L20 0 M-50 20 L-10 20', ln(12, '#FFD21F')), 'translate(0 -30)'));
  let o = view(cam, w, 1);
  o += kaching(1700, 560, t - tGP1, 0.7);
  return o;
}

// ---------------------------------------------------------------- E2: extra fries
function shotFries(t) {
  const cam = camKeys(t, [[tFries, { zoom: 1.0, x: 0, y: 0 }], [tGP2, { zoom: 1.06, x: 0, y: 0 }], [tGP2 + 0.15, { zoom: 1.2, x: 60, y: -20 }], [tMath, { zoom: 1.24, x: 60, y: -20 }]]);
  let w = S.rect(-400, -400, 2720, 1880, 0, { fill: '#FFD95A' }) + S.rect(-400, -400, 2720, 300, 0, { fill: '#E8503A' });
  for (let i = 0; i < 3; i++) w += S.rect(260 + i * 480, 40, 440, 260, 22, ol('#2A1A1A', 8)) + TF(['BURGER', 'FRIES', 'SODA'][i], 480 + i * 480, 110, 48, '#FFE14D') + K.robuxText(480 + i * 480, 250, ['6', '3', '2'][i], 70, '#FFFFFF');
  w += S.rect(-400, 820, 2720, 600, 0, ol('#E8503A', 8)) + S.rect(-400, 800, 2720, 40, 10, ol('#C93A2A', 6));
  const kidPose = t > tGP2 ? { face: { name: 'joy' }, armL: 150, armR: 60, lift: 20 * bump(t, tGP2, tGP2 + 0.4) } : { face: { name: 'sad', eyes: { look: [0.6, 0.5] } }, armR: 60, armL: 10 };
  const box = S.g(S.path('M-60 -110 L60 -110 L46 20 L-46 20 Z', ol('#E8503A', 6)) + (t < tGP2 ? S.path('M-30 -110 L-30 -150 M-10 -110 L-10 -140 M14 -110 L14 -146', ln(16, '#FFD21F')) : '') + K.coin(0, -40, 24, 0, 0), `translate(${f(A.hand(60, 1)[0])} ${f(A.hand(60, 1)[1] - 40)})`);
  w += kidIn(2, t, { x: 860, y: 1110, s: 0.66, ...kidPose, props: [{ svg: box, layer: 'front' }] });
  // fry geyser
  if (t > tGP2) {
    const age = t - tGP2;
    const [hx, hy] = A.hand(60, 1);
    for (let i = 0; i < 40; i++) {
      const a = -Math.PI / 2 + (hash(i * 3.3) - 0.5) * 1.4, v = 900 + 900 * hash(i);
      const px = 860 + hx * 0.62 + Math.cos(a) * v * age, py = 1110 + (hy - 140) * 0.62 + Math.sin(a) * v * age + 0.5 * 1600 * age * age;
      if (py < 1300) w += S.g(S.rect(-10, -44, 20, 88, 6, ol('#FFD21F', 4)), `translate(${f(px)} ${f(py)}) rotate(${f(age * 400 * (hash(i) - 0.5) + i * 30)})`);
    }
  }
  w += K.gamePass(1480, 470, 'EXTRA FRIES', '25', 0.85, seg(t, tGP2, tGP2 + 0.3), S.g(S.path('M-34 -40 L34 -40 L26 30 L-26 30 Z', ol('#E8503A', 5)) + S.path('M-20 -40 L-20 -70 M0 -40 L0 -76 M20 -40 L20 -66', ln(12, '#FFD21F')), 'translate(0 -10)'));
  return view(cam, w, 1) + kaching(1560, 700, t - tGP2, 0.7);
}

// ---------------------------------------------------------------- classroom
function classroom(t, opts = {}) {
  let o = S.rect(-600, -400, 3120, 1900, 0, { fill: '#FFEFC8' }) + S.rect(-600, 700, 3120, 600, 0, { fill: '#E8C98A' });
  o += S.rect(-600, 690, 3120, 20, 0, ol('#C9A262', 5));
  // windows on the left, clock and posters
  for (const wx of [-480, -180]) o += S.rect(wx, 140, 240, 340, 16, ol('#BDEBFF', 8)) + S.path(`M${wx + 120} 140 L${wx + 120} 480 M${wx} 310 L${wx + 240} 310`, ln(8));
  o += S.circle(1720, 150, 60, ol('#FFFFFF', 7)) + S.path('M1720 150 L1720 110 M1720 150 L1748 162', ln(7));
  o += S.rect(1820, 260, 200, 260, 12, ol('#B06BFF', 6)) + TF('MATH', 1920, 340, 40, '#FFFFFF') + TF('IS FUN', 1920, 390, 34, '#FFFFFF') + TF('(?)', 1920, 450, 40, '#FFE14D');
  // chalkboard
  o += S.rect(440, 90, 1040, 520, 18, ol('#B07A48', 10)) + S.rect(470, 120, 980, 460, 8, { fill: '#2F6B4A' });
  if (!opts.clean) {
    const ch = { 'font-family': 'Fredoka, sans-serif', 'font-weight': 600, fill: '#F2F6EE', opacity: 0.9 };
    o += S.el('text', { x: 520, y: 210, 'font-size': 64, ...ch }, '2x + 7 = 19') + S.el('text', { x: 520, y: 310, 'font-size': 56, ...ch }, 'x = ?') + S.el('text', { x: 980, y: 230, 'font-size': 58, ...ch }, '√144 = 12');
    o += S.el('text', { x: 1000, y: 340, 'font-size': 54, ...ch }, '3/4 + 1/8') + S.el('text', { x: 560, y: 440, 'font-size': 60, ...ch }, 'π ≈ 3.14159…') + S.el('text', { x: 1080, y: 470, 'font-size': 60, ...ch }, 'a² + b² = c²');
  }
  o += S.rect(470, 590, 980, 20, 4, ol('#C9935A', 4));
  return o;
}

// ---------------------------------------------------------------- E3/E4: skip math class
function shotMath(t) {
  const skip = t >= tSkip;
  const cam = skip ? camKeys(t, [[tSkip, { zoom: 1.0, x: 0, y: 20 }], [t999, { zoom: 1.08, x: 0, y: 10 }], [tShoe, { zoom: 1.14, x: 0, y: 0 }]])
    : camKeys(t, [[tMath, { zoom: 1.05, x: -100, y: 60 }], [tSkip, { zoom: 1.45, x: -200, y: 120 }]]);
  const sh = K.shake(t, tSkip, 0.35, 14); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = classroom(t);
  const slam = seg(t, tSkip, tSkip + 0.2);
  if (skip) w += rays(960, 350, 18, 1400, '#FFF1B0', 0.35, t * 20);
  w += K.gamePass(960, 350, 'SKIP MATH!', t > t999 ? '999' : '???', 1.25, slam, S.g(S.rect(-56, -50, 112, 80, 10, ol('#2F6B4A', 5)) + T('✖', 0, 10, 60, '#FF5A5A'), 'translate(0 -10)'));
  // background classmates
  for (const [kx, k, s] of [[300, 1, 0.5], [1640, 13, 0.5]]) w += kidIn(k, t, { x: kx, y: 1020, s, face: skip ? { name: 'amazed' } : { name: 'sleepy' }, volume: false }) + desk(kx, 860, 260);
  // Ty and Pickle at their desks
  const hope = t > tMath + 0.3;
  w += ty(t, 720, 1180, 0.62, { turn: 0.25, face: skip ? { name: 'rich' } : hope ? { name: 'amazed', eyes: { look: [0.4, -0.6] } } : { name: 'sleepy' }, armL: skip ? 150 : 20, armR: skip ? 140 : 20, headRot: skip ? 0 : -4 }, skip ? { arms: false } : { arms: false });
  w += actor('pickle', t, { x: 1220, y: 1180, s: 0.62, turn: -0.25, face: skip ? { name: 'love' } : { name: 'happy' }, armL: skip ? 140 : 15, armR: skip ? 150 : 15, lift: skip ? 20 * Math.abs(Math.sin((t - tSkip) * 7)) : 0 }, { arms: false });
  w += desk(720, 930, 420) + desk(1220, 930, 420);
  let o = view(cam, w, 1);
  o += kaching(960, 640, t - tSkipR, 0.9);
  o += C.whiteFlash(0.6 * bump(t, tSkip - 0.03, tSkip + 0.12));
  return o;
}

// ---------------------------------------------------------------- F: Pickle would sell his shoe
function shotShoe(t) {
  const phase = t < tHave ? 0 : t < tHaveW - 0.05 ? 1 : t < tSave ? 2 : 3;
  let w = classroom(t);
  let cam;
  if (phase === 0) cam = camKeys(t, [[tShoe, { zoom: 1.5, x: 200, y: 60 }], [tHave, { zoom: 1.65, x: 220, y: 40 }]]);
  else if (phase === 1) cam = camKeys(t, [[tHave, { zoom: 1.7, x: -260, y: 60 }], [tHaveW, { zoom: 1.75, x: -250, y: 60 }]]);
  else if (phase === 2) cam = { zoom: 1.0, x: 0, y: 0 };
  else cam = camKeys(t, [[tSave, { zoom: 1.5, x: 210, y: -20 }], [tElev, { zoom: 1.62, x: 210, y: -30 }]]);
  // Pickle standing on his chair, lifting the sock foot (screen-left leg)
  const raise = phase === 3 ? 0 : ease.outBack(seg(t, tShoe + 0.6, tShoe + 1.0));
  const wig = phase === 2 ? Math.sin(t * 22) * 6 : 0;
  const pFace = phase === 3 ? { name: 'sad' } : phase === 2 ? { name: 'confused' } : { name: 'excited' };
  let pk = '';
  if (phase === 3) {
    // tiny rain cloud + his SHOE FUND jar
    const [hx, hy] = A.hand(100, 1);
    const jar = S.g(S.rect(-70, -90, 140, 170, 30, { fill: '#DFF6FF', opacity: 0.7, stroke: '#151515', 'stroke-width': 6 }) + S.rect(-60, -110, 120, 26, 8, ol('#C9935A', 5)) + K.coin(-22, 40, 26, 10, 0) + K.coin(24, 50, 24, -20, 1) + K.coin(0, 10, 22, 30, 2) + S.rect(-62, -60, 124, 40, 8, ol('#FFFFFF', 4)) + TF('SHOE FUND', 0, -32, 20, '#2A1640'), `translate(${f(hx - 30)} ${f(hy - 20)})`);
    pk = actor('pickle', t, { x: 1170, y: 1050, s: 0.62, armR: 100, armL: 30, face: pFace, headRot: -4, props: [{ svg: jar, layer: 'front' }] }, { arms: false });
    const cx = 1170, cy = 330;
    pk += S.g(S.ellipse(0, 0, 150, 56, ol('#9AA0AE', 6)) + S.circle(-60, -30, 54, ol('#9AA0AE', 6)) + S.circle(40, -44, 64, ol('#9AA0AE', 6)) + S.ellipse(0, 6, 140, 44, { fill: '#9AA0AE' }), `translate(${cx} ${f(cy + Math.sin(t * 3) * 6)}) scale(${f(ease.outBack(seg(t, tSave + 0.2, tSave + 0.5)))})`);
    for (let i = 0; i < 10; i++) { const yy = ((t * 900 + i * 97) % 300); pk += S.path(`M${cx - 110 + i * 24} ${f(cy + 50 + yy)} l-6 26`, ln(5, '#7FB8FF')); }
  } else {
    pk = actor('pickle', t, { x: 1170, y: 940, s: 0.62, lift: 0, legL: 70 * raise, kneeL: 40 * raise, legR: -4, armL: 30 + 50 * raise, armR: phase === 0 && t > tShoeW ? 120 : 140, face: pFace, headRot: wig * 0.3, lean: -6 * raise }, { arms: false });
    pk = S.rect(960, 940, 420, 30, 8, ol('#E2B47A', 6)) + S.path('M1000 970 L1000 1200 M1340 970 L1340 1200', ln(14, '#9AA0AE')) + pk;
  }
  if (phase === 2) pk += mark('?', 830, 640, seg(t, tHaveW, tHaveW + 0.2), 80, -10, '#FFFFFF');
  w += desk(560, 930, 420);
  w += ty(t, 560, 1180, 0.62, { turn: 0.45, face: phase === 1 ? { name: 'deadpan', eyes: { look: [0.8, 0] } } : { name: 'deadpan' }, armL: 40, armR: 40 }, { arms: false });
  w += desk(560, 930, 420);
  w += pk;
  let o = view(cam, w, 1);
  if (phase === 0) o += K.sparkles([[1500, 260, 34], [1700, 420, 24]], t);
  if (phase === 2) o = sockInsert(t);
  return o;
}
// insert: Pickle's shoeless foot, sock toes wiggling
function sockInsert(t) {
  const k = seg(t, tHaveW - 0.05, tHaveW + 0.1);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#FFEFC8' }) + S.rect(0, 760, 1920, 400, 0, { fill: '#E8C98A' }) + rays(960, 640, 16, 1400, '#FFFFFF', 0.35, t * 10);
  const wig = Math.sin(t * 24) * 10;
  const leg = S.rect(-120, -900, 240, 760, 24, ol('#C7A97A', 9)) + S.rect(-120, -900, 60, 760, 0, { fill: '#AE9063', opacity: 0.5 }) + S.rect(-130, -190, 260, 60, 14, ol('#AE9063', 8));
  const sock = S.path(`M-120 -140 L120 -140 L120 40 Q${f(260 + wig)} 30 ${f(280 + wig)} 110 Q${f(270 + wig)} 170 ${f(160 + wig * 0.5)} 170 L-120 170 Z`, ol('#FFFFFF', 9)) + S.path('M-120 -80 L120 -80 M-120 -50 L120 -50', ln(8, '#D9DEE8'));
  o += S.g(leg + sock + S.path(`M${f(200 + wig)} 70 Q${f(230 + wig)} 100 ${f(200 + wig)} 130`, ln(6, '#D9DEE8')), `translate(${f(860)} ${f(700 - 30 * (1 - ease.outBack(k)))}) rotate(-6)`);
  o += mark('?', 1330, 420, seg(t, tHaveW + 0.1, tHaveW + 0.3), 150, 12, '#FFFFFF');
  o += K.sparkles([[1260, 760, 22]], t);
  return o;
}

// ---------------------------------------------------------------- G1: the elevator SKIP FLOORS pass
function shotElevator(t) {
  const go = t > tElevGo;
  const cam = camKeys(t, [[tElev, { zoom: 1.0, x: 0, y: 0 }], [tElevGo, { zoom: 1.08, x: 60, y: 0 }]]);
  const sh = go ? { sx: Math.sin(t * 80) * 10, sy: Math.cos(t * 67) * 14 } : { sx: 0, sy: 0 };
  cam.sx = sh.sx; cam.sy = sh.sy;
  let w = S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#s04chrome)' });
  for (let x = 120; x < 1900; x += 280) w += S.path(`M${x} 0 L${x} 1080`, ln(5, '#7A8294', 0.6));
  w += S.rect(-400, 860, 2720, 400, 0, { fill: '#5A6078' }) + S.rect(-400, 620, 2720, 26, 13, ol('#E6EAF2', 5));
  // floor display
  const floor = go ? Math.min(99, 1 + Math.floor((t - tElevGo) * 90)) : 1;
  w += S.rect(760, 40, 400, 130, 20, ol('#14141A', 7)) + T(String(floor), 960, 140, 100, '#FF5A5A') + S.path('M1100 70 L1130 110 L1070 110 Z', { fill: go ? '#FF5A5A' : '#4A2A2A' });
  // button panel
  w += S.rect(1440, 260, 260, 520, 20, ol('#D7DCE6', 7));
  for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) w += S.circle(1500 + c * 70, 310 + r * 56, 22, ol('#F4F6FA', 4)) + TF(String(1 + r * 3 + c), 1500 + c * 70, 320 + r * 56, 22, '#5A6078');
  const press = bump(t, tElevSkip, tElevSkip + 0.3);
  w += S.circle(1570, 700, 62 - 6 * press, ol('#FFC93C', 7)) + T('SKIP', 1570, 716, 40, '#2A1640');
  // the rich kid presses the gold button; a passenger gets squashed
  const squash = go ? 1 - 0.28 * ease.out(seg(t, tElevGo, tElevGo + 0.25)) : 1;
  const [hx, hy] = A.hand(90, 1);
  w += extra('richKid', t, { x: 1360, y: 1060, s: 0.62, sy: squash, sx: 2 - squash, turn: 0.4, armR: 96 + 18 * press, armL: go ? 150 : 10, face: go ? { name: 'excited' } : { name: 'smug' }, props: [headProp(shades(), {})] });
  w += kidIn(10, t, { x: 520, y: 1060, s: 0.6, sy: squash * (go ? 0.9 : 1), sx: (2 - squash) * (go ? 1.1 : 1), face: go ? { name: 'dizzy' } : { name: 'deadpan' }, volume: false, armL: go ? 60 : 10, armR: go ? 60 : 10 });
  if (!go) w += C.musicNotes(t, 760, 360);
  if (go) for (let i = 0; i < 14; i++) { const y = ((t * 3000 + i * 160) % 1300) - 200; w += S.rect(80 + hash(i) * 1760, y, 10, 160, 5, { fill: '#FFFFFF', opacity: 0.6 }); }
  w += K.gamePass(1570, 420, 'SKIP FLOORS', '15', 0.62, seg(t, tElevSkip, tElevSkip + 0.3), S.g(S.path('M0 -50 L40 0 L14 0 L14 40 L-14 40 L-14 0 L-40 0 Z', ol('#FFD21F', 5)), 'translate(0 -20)'));
  let o = view(cam, w, 1);
  o += bang('ZOOOM!', 420, 300, seg(t, tElevGo, tElevGo + 0.15), 120, -10, '#FFD21F');
  return o;
}

// ---------------------------------------------------------------- G2: the dentist's NO-DRILL pass (Pickle can't afford it)
function shotDentist(t) {
  const rev = t > tDrill;
  const cam = camKeys(t, [[tDent, { zoom: 1.08, x: 0, y: 30 }], [tDrill, { zoom: 1.2, x: 60, y: 40 }], [tDrill + 0.12, { zoom: 1.5, x: 60, y: -40 }], [tTeach, { zoom: 1.56, x: 60, y: -40 }]]);
  const sh = rev ? K.shake(t, tDrill, 1.2, 8) : { sx: 0, sy: 0 }; cam.sx = sh.sx; cam.sy = sh.sy;
  let w = S.rect(-400, -400, 2720, 1880, 0, { fill: '#CFF3EE' }) + S.rect(-400, 820, 2720, 600, 0, { fill: '#9ED9CF' });
  // tooth poster + lamp
  w += S.g(S.rect(-150, -180, 300, 360, 16, ol('#FFFFFF', 7)) + S.path('M-60 -80 Q0 -120 60 -80 Q80 -10 50 80 Q30 110 20 60 Q0 10 -20 60 Q-30 110 -50 80 Q-80 -10 -60 -80 Z', ol('#FFFFFF', 6)) + S.circle(-20, -40, 7, { fill: '#151515' }) + S.circle(22, -40, 7, { fill: '#151515' }) + S.path('M-20 -10 Q0 6 22 -10', ln(5)) + TF('BRUSH!', 0, 150, 40, '#34C3FF'), 'translate(260 400) rotate(-4)');
  w += S.path('M760 -40 L760 120 Q760 160 800 160 L900 160', ln(14, '#9AA0AE')) + S.ellipse(930, 180, 90, 46, ol('#FFF4C8', 7)) + S.path('M860 210 L760 560 L1100 560 L1000 210 Z', { fill: '#FFFFFF', opacity: 0.25 });
  // the big blue dental chair: back + headrest behind Pickle, seat and armrests in front
  w += S.path(S.roundedPath([[700, 420], [1160, 420], [1180, 900], [680, 900]], 50), ol('#34A0FF', 8)) + S.rect(820, 360, 220, 90, 40, ol('#2A86E0', 7));
  w += S.rect(900, 960, 60, 140, 6, ol('#9AA0AE', 5)) + S.rect(800, 1080, 260, 30, 10, ol('#7A8294', 5));
  w += actor('pickle', t, { x: 930, y: 960, s: 0.55, face: rev ? { name: 'scream' } : t > tNoDrill ? { name: 'nervous', eyes: { look: [-0.8, -0.4] } } : { name: 'happy' }, armL: rev ? 120 : 30, armR: rev ? 120 : 30, headRot: rev ? Math.sin(t * 40) * 4 : 0 }, { arms: false });
  w += S.rect(640, 860, 580, 110, 40, ol('#2A86E0', 8)) + S.rect(620, 760, 120, 60, 24, ol('#34A0FF', 6)) + S.rect(1120, 760, 120, 60, 24, ol('#34A0FF', 6));
  // the dentist with a giant drill
  const [hx, hy] = A.hand(60, -1);
  const drill = S.g(S.rect(-30, -60, 60, 200, 20, ol('#F4F6FA', 6)) + S.rect(-12, -150, 24, 100, 6, ol('#C9CED8', 5)) + S.path(`M0 -150 L0 -${f(200 + (rev ? Math.sin(t * 60) * 8 : 0))}`, ln(8, '#9AA0AE')), `translate(${f(hx)} ${f(hy)}) rotate(${f(rev ? -50 : -20)})`);
  w += extra('dentist', t, { x: 1500, y: 1040, s: 0.62, turn: -0.5, armL: 60, armR: 15, face: rev ? { name: 'sneaky', mouth: 'grin' } : { name: 'happy' }, props: [{ svg: drill, layer: 'front' }, { svg: S.rect(-96, -660, 192, 80, 22, ol('#BDEBFF', 5)), layer: 'front' }] });
  if (rev) for (let i = 0; i < 6; i++) w += S.path(`M${1300 + i * 10} ${560 - i * 16} q20 -10 40 0`, ln(5, '#FFFFFF', 0.8));
  w += K.gamePass(470, 330, 'NO-DRILL PASS', '75', 0.72, seg(t, tNoDrill, tNoDrill + 0.3), S.g(S.path('M-40 -40 L40 40 M40 -40 L-40 40', ln(14, '#FF5A5A')) + S.circle(0, 0, 50, { fill: 'none', stroke: '#FF5A5A', 'stroke-width': 10 }), 'translate(0 -30)'));
  // Pickle's balance bubble
  w += S.g(S.rect(-110, -50, 220, 100, 26, ol('#FFFFFF', 6)) + K.robuxText(0, 22, '12', 60, '#2A1640') + S.path('M-20 50 L0 80 L20 50', ol('#FFFFFF', 6)), `translate(1080 300) scale(${f(ease.outBack(seg(t, tNoDrill + 0.2, tNoDrill + 0.4)) * (1 - seg(t, tDrill, tDrill + 0.1)))})`);
  let o = view(cam, w, 1);
  o += bang('BZZZZT!', 1500, 260, seg(t, tDrill, tDrill + 0.15), 120, 8, '#FF5A5A');
  return o;
}

// ---------------------------------------------------------------- G3: the teacher's DELETE HOMEWORK button
function shotHomework(t) {
  const hit = t > tButton;
  const cam = camKeys(t, [[tTeach, { zoom: 1.05, x: 60, y: 40 }], [tButton, { zoom: 1.15, x: 120, y: 60 }], [tButton + 0.1, { zoom: 1.35, x: 160, y: 100 }], [tMom, { zoom: 1.4, x: 160, y: 100 }]]);
  const sh = K.shake(t, tButton, 0.35, 14); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = classroom(t);
  // teacher behind her desk, counting coins
  const [hx, hy] = A.hand(80, -1);
  w += extra('teacher', t, { x: 700, y: 1000, s: 0.58, turn: 0.3, face: hit ? { name: 'smug' } : { name: 'happy' }, armL: 80, armR: 20, props: [{ svg: X.coinPile(hx, hy + 20, 5, 30, t, 2), layer: 'front' }] });
  w += S.rect(380, 760, 700, 50, 10, ol('#B07A48', 6)) + S.rect(400, 800, 660, 300, 8, ol('#9C6A3E', 6));
  // homework stack -> pixels
  const age = t - tButton;
  if (!hit) for (let i = 0; i < 7; i++) w += S.rect(520 - (i % 2) * 6, 740 - i * 22, 200, 24, 4, ol('#FFFFFF', 4)) + S.path(`M540 ${750 - i * 22} L690 ${750 - i * 22}`, ln(3, '#9AB'));
  else for (let i = 0; i < 40; i++) {
    const a = hash(i) * Math.PI * 2, v = 300 + 500 * hash(i * 3);
    const px = 620 + Math.cos(a) * v * age, py = 660 + Math.sin(a) * v * age - 300 * age;
    if (age < 0.9) w += S.rect(px, py, 24, 24, 3, { fill: ['#FFFFFF', '#9AB0C8', '#FF5A5A', '#34C3FF'][i % 4], opacity: f(1 - age / 0.9), stroke: '#151515', 'stroke-width': 3 });
  }
  // the big red button on a pedestal + game pass
  const press = bump(t, tButton - 0.08, tButton + 0.3);
  w += S.rect(1240, 800, 180, 260, 12, ol('#5A6078', 6)) + S.ellipse(1330, 800, 120, 36, ol('#3A3F55', 6)) + S.ellipse(1330, 780 + press * 18, 96, 44, ol('#FF3B3B', 7)) + S.ellipse(1310, 766 + press * 18, 40, 14, { fill: '#FFFFFF', opacity: 0.5 });
  const slap = ease.in(seg(t, tButton - 0.25, tButton));
  w += extra('richKid', t, { x: 1560, y: 1060, s: 0.6, turn: -0.5, armL: lerp(100, 40, slap) + 30 * press, armR: hit ? 150 : 20, face: hit ? { name: 'excited' } : { name: 'determined' }, props: [headProp(shades(), {})] });
  w += K.gamePass(1330, 380, 'DELETE HOMEWORK', '200', 0.68, seg(t, tDelete, tDelete + 0.3), S.g(S.rect(-40, -50, 80, 100, 8, ol('#FFFFFF', 5)) + S.path('M-30 -50 L30 50 M30 -50 L-30 50', ln(10, '#FF5A5A')), 'translate(0 -30)'));
  let o = view(cam, w, 1);
  o += bang('DELETED!', 420, 220, seg(t, tButton + 0.05, tButton + 0.2), 110, -8, '#FF5A5A');
  return o;
}

// ---------------------------------------------------------------- H: Mom's free shipping
function livingRoom(t) {
  let o = S.rect(-400, -400, 2720, 1880, 0, { fill: '#FCE3EC' }) + S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#wallStripes)', opacity: 0.6 });
  o += S.rect(-400, 860, 2720, 600, 0, { fill: '#C9A27A' }) + S.rect(-400, 850, 2720, 16, 0, ol('#B08860', 4));
  o += S.rect(1240, 120, 460, 420, 16, ol('#BDEBFF', 9)) + S.path('M1470 120 L1470 540 M1240 330 L1700 330', ln(9));
  o += S.path('M1200 100 Q1240 330 1210 560 L1180 560 L1180 100 Z', ol('#FF8FB8', 6)) + S.path('M1740 100 Q1700 330 1730 560 L1760 560 L1760 100 Z', ol('#FF8FB8', 6));
  o += S.rect(300, 200, 260, 200, 12, ol('#FFE38A', 8)) + S.circle(430, 300, 50, ol('#FF8FB8', 5));
  return o;
}
function couch(x, y, front) {
  return front ? S.rect(x - 520, y - 150, 1040, 170, 40, ol('#3FB3A6', 8)) + S.rect(x - 600, y - 260, 140, 300, 40, ol('#2E968A', 8)) + S.rect(x + 460, y - 260, 140, 300, 40, ol('#2E968A', 8))
    : S.rect(x - 520, y - 470, 1040, 340, 50, ol('#3FB3A6', 8));
}
function freeShipIcon() {
  return S.g(S.rect(-60, -30, 80, 56, 6, ol('#C9945A', 5)) + S.rect(20, -14, 44, 40, 6, ol('#34C3FF', 5)) + S.circle(-36, 30, 13, ol('#2A2A33', 4)) + S.circle(40, 30, 13, ol('#2A2A33', 4)), 'translate(0 -40)');
}
function phoneShop(t, tapK, bought) {
  let s = S.rect(-150, -280, 300, 560, 0, { fill: '#1B2238' }) + S.rect(-150, -280, 300, 64, 0, { fill: '#2E7BFF' }) + TF('GAME PASSES', 0, -236, 30, '#FFFFFF');
  s += S.rect(-130, -196, 260, 300, 22, ol('#2A3352', 4)) + S.g(freeShipIcon(), 'translate(0 -60) scale(1.4)') + TF('FREE', 0, 30, 42, '#FFE14D') + TF('SHIPPING', 0, 76, 38, '#FFFFFF');
  s += S.rect(-110, 136, 220, 76, 26, ol(bought ? '#9AA0AE' : '#3BD16F', 4)) + TF(bought ? 'OWNED ✔' : 'BUY', 0, 186, 42, '#FFFFFF');
  s += K.robuxText(0, 252, '199', 38, '#FFE14D');
  return s;
}
function shotMom(t) {
  const close = t > tPhone;
  let o;
  if (!close) {
    const cam = camKeys(t, [[tMom, { zoom: 1.0, x: 0, y: 0 }], [tPhone, { zoom: 1.35, x: -90, y: -60 }]]);
    let w = livingRoom(t) + couch(960, 900, false);
    const [hx, hy] = A.hand(70, 1);
    w += actor('mom', t, { x: 900, y: 1010, s: 0.62, turn: 0.15, armR: 70, armL: 40, face: { name: 'smug', eyes: { look: [0.6, 0.4] } }, props: [{ svg: K.phone(hx - 30, hy - 100, 0.28, -10, phoneShop(t, 0, false)), layer: 'front' }] }, { arms: false });
    w += couch(960, 900, true);
    o = view(cam, w, 1);
  } else {
    // full-screen phone, Mom's thumb taps BUY
    const bought = t > tBought;
    let w = S.rect(0, 0, 1920, 1080, 0, { fill: '#2E968A' }) + rays(960, 540, 16, 1400, '#3FB3A6', 0.6, t * 10);
    const zk = ease.out(seg(t, tPhone, tPhone + 0.35));
    w += K.phone(960, 560, lerp(1.0, 1.55, zk), lerp(-10, 0, zk), phoneShop(t, 0, bought));
    if (t > tBuy) {
      const tap = bump(t, tBought - 0.15, tBought + 0.1);
      const hx = lerp(1500, 1010, ease.out(seg(t, tBuy, tBought - 0.12))), hy = lerp(1300, 900, ease.out(seg(t, tBuy, tBought - 0.12))) + 30 * tap;
      w += blockHand(hx, hy, -25, 1.3, '#3FB3A6', '#B9805D');
    }
    w += purchased(960, 220, seg(t, tBought, tBought + 0.25), 1.2);
    o = w + kaching(1400, 300, t - tBought, 0.9);
    o += whip(t, tPhone + 0.02, 0.5);
  }
  return o;
}
function house(t) {
  let o = S.rect(-400, -600, 2720, 2000, 0, { fill: 'url(#s04sky)' }) + X.cloudsLayer(t, 4, 60);
  o += S.rect(-400, 760, 2720, 700, 0, { fill: '#6FCF5A' }) + S.rect(-400, 760, 2720, 14, 0, { fill: '#8FE07A' });
  // the family house
  o += S.path('M520 360 L960 110 L1400 360 Z', ol('#8A5A8A', 8)) + S.rect(580, 360, 760, 420, 10, ol('#A9D8FF', 8));
  o += S.rect(880, 540, 160, 240, 12, ol('#FF8FB8', 7)) + S.circle(1010, 670, 9, { fill: '#151515' });
  for (const wx of [640, 1120]) o += S.rect(wx, 440, 180, 150, 12, ol('#FFF4C8', 7)) + S.path(`M${wx + 90} 440 L${wx + 90} 590 M${wx} 515 L${wx + 180} 515`, ln(7));
  o += S.rect(840, 760, 240, 30, 6, ol('#D9DBE6', 5));
  // fence + mailbox
  for (let x = -380; x < 2300; x += 80) if (x < 520 || x > 1400) o += S.rect(x, 700, 50, 120, 8, ol('#FFFFFF', 5));
  o += S.rect(-400, 720, 920, 20, 4, ol('#FFFFFF', 4)) + S.rect(1400, 720, 920, 20, 4, ol('#FFFFFF', 4));
  o += S.rect(1540, 760, 20, 160, 4, ol('#8A5A34', 4)) + S.rect(1490, 680, 120, 90, 30, ol('#2E7BFF', 6));
  return o;
}
function shotDrones(t) {
  const cam = camKeys(t, [[tAll, { zoom: 1.5, x: 0, y: 120 }], [tEvery2, { zoom: 1.5, x: 0, y: 100 }], [tEvery2 + 0.15, { zoom: 0.92, x: 0, y: -40 }], [tPorch, { zoom: 0.9, x: 0, y: -50 }]]);
  let w = house(t);
  // pile of parcels growing on the lawn
  const n = Math.floor(lerp(4, 22, seg(t, tAll, tPorch)));
  for (let i = 0; i < n; i++) {
    const px = 300 + (i % 9) * 150 + (Math.floor(i / 9) % 2) * 70, py = 900 - Math.floor(i / 9) * 70;
    w += S.g(X.parcel(130, 70, ['#C9945A', '#D9A86A', '#B9844A'][i % 3]), `translate(${px} ${py - 70}) rotate(${f((hash(i) - 0.5) * 12)})`);
  }
  // the swarm
  for (let i = 0; i < 14; i++) {
    const ph = (t * 0.6 + hash(i * 2.2)) % 1;
    const dx = lerp(-300, 2200, (hash(i * 7.7) + ph * 0.6) % 1.2), dy = 80 + hash(i * 3.1) * 420 + Math.sin(t * 2 + i) * 20;
    const cargo = i % 5 === 3 ? S.circle(0, 30, 30, ol('#3BD16F', 5)) + S.path('M-28 30 Q0 10 28 30', ln(4, '#2A7A3A')) : i % 5 === 1 ? S.g(S.rect(-40, 0, 80, 46, 8, ol('#FF8FB8', 5)) + TF('🎁', 0, 34, 30, '#FFF'), '') : X.parcel(80, 56);
    w += X.drone(dx, dy, 0.8, t, cargo, 70);
  }
  // a falling parcel bonks the mailbox
  const fa = seg(t, tEvery2 - 0.3, tEvery2 + 0.1);
  if (fa < 1) w += S.g(X.parcel(110, 70), `translate(1550 ${f(lerp(-200, 610, fa * fa))})`);
  else w += S.g(X.parcel(110, 70), 'translate(1550 610) rotate(8)') + bang('BONK!', 1700, 520, seg(t, tEvery2 + 0.1, tEvery2 + 0.2), 80, 10, '#FFE14D');
  let o = view(cam, w, 1);
  o += bang('FREE SHIPPING!', 960, 180, seg(t, tEvery2 + 0.1, tEvery2 + 0.3), 110, -5, '#3BD16F');
  return o;
}
function shotPorch(t) {
  const cam = camKeys(t, [[tPorch, { zoom: 1.45, x: 60, y: 90 }], [tPay, { zoom: 1.6, x: 60, y: 110 }]]);
  let w = house(t);
  // Mom on the doorstep; a drone lowers the groceries right into her hands
  const land = seg(t, tPorch, tDrone);
  const [hx, hy] = A.hand(40, 1);
  const bag = S.rect(-60, 0, 120, 120, 14, ol('#E2C08A', 5)) + S.path('M-30 0 L-30 -50 M10 0 L20 -60', ln(16, '#F2D08A')) + S.path('M24 6 L60 -40', ln(14, '#FF924C')) + S.circle(-20, 8, 18, ol('#3BD16F', 4));
  const caught = t > tDrone;
  w += actor('mom', t, { x: 960, y: 800, s: 0.42, armR: caught ? 40 : 60, armL: caught ? 40 : 20, face: caught ? { name: 'smug' } : { name: 'happy' }, props: caught ? [{ svg: S.g(bag, `translate(${f(hx - 100)} ${f(hy - 80)})`), layer: 'front' }] : [] }, {});
  if (!caught) w += X.drone(960 + 120, lerp(260, 560, ease.out(land)), 0.55, t, bag, 70);
  else w += X.drone(1080 + (t - tDrone) * 300, 560 - (t - tDrone) * 500, 0.55, t, '', 70);
  // in the back: a watermelon delivery thuds onto the lawn
  const wm = seg(t, tDrone + 0.3, tDrone + 0.6);
  w += X.drone(1500 - (t - tPorch) * 60, 420, 0.5, t, wm > 0 ? '' : S.ellipse(0, 30, 50, 36, ol('#3BD16F', 5)), 60);
  if (wm > 0) w += S.ellipse(1500 - (tDrone + 0.3 - tPorch) * 60, lerp(480, 790, wm * wm), 50, 36 * (wm >= 1 ? 0.8 : 1), ol('#3BD16F', 5));
  let o = view(cam, w, 1);
  return o;
}

// ---------------------------------------------------------------- I: Dad's office
function office(t, opts = {}) {
  let o = S.rect(-600, -400, 3120, 1900, 0, { fill: '#DDE6F2' });
  // windows with blinds and the city outside
  for (const wx of [-300, 360, 1020, 1680]) {
    o += S.rect(wx, 110, 480, 330, 10, ol('#9FD3FF', 8));
    for (let i = 0; i < 4; i++) o += S.rect(wx + 30 + i * 110, 300 - hash(i + wx) * 120, 80, 140 + hash(i + wx) * 120, 4, { fill: '#7FB2E0' });
    for (let y = 130; y < 300; y += 26) o += S.rect(wx + 4, y, 472, 12, 3, { fill: '#F4F6FA', opacity: 0.9 });
  }
  // ceiling lights
  for (let x = -200; x < 2400; x += 600) o += S.rect(x, 20, 300, 28, 8, ol('#F4F6FA', 5)) + S.path(`M${x + 20} 48 L${x - 40} 140 L${x + 340} 140 L${x + 280} 48 Z`, { fill: '#FFFFFF', opacity: 0.18 });
  o += S.rect(-600, 820, 3120, 700, 0, { fill: 'url(#s04carpet)' }) + S.rect(-600, 815, 3120, 12, 0, { fill: '#5A6A84' });
  return o;
}
// cubicle partition (front panel) at x..x+w, top y
function cubicle(x, y, w, h = 300) {
  return S.rect(x, y, w, h, 10, ol('url(#s04fabric)', 7)) + S.rect(x - 6, y - 14, w + 12, 22, 8, ol('#C9CED8', 5));
}
function monitor(x, y, s = 1, screen = '#7FD3FF') {
  return S.g(S.rect(-130, -200, 260, 190, 18, ol('#E6E2D6', 7)) + S.rect(-108, -180, 216, 140, 10, ol(screen, 5)) + S.rect(-30, -14, 60, 20, 4, ol('#C9C3B3', 5)) + S.rect(-80, 4, 160, 18, 6, ol('#C9C3B3', 5)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function coffeeMachine(x, y, s, t, opts = {}) {
  const { locked = true, deny = 0, shine = 0 } = opts;
  let o = S.rect(-170, -560, 340, 560, 30, ol('url(#s04chrome)', 8)) + S.rect(-140, -520, 280, 120, 16, ol('#14141A', 6));
  o += TF(deny > 0.5 ? 'LOCKED' : 'COFFEE', 0, -446, 46, deny > 0.5 ? '#FF5A5A' : '#5CF2FF');
  o += S.rect(-110, -370, 220, 210, 16, ol('#3A3F55', 6)) + S.path('M-20 -370 L-20 -320 L20 -320 L20 -370', ol('#9AA0AE', 5));
  // PREMIUM plate
  o += S.rect(-140, -140, 280, 70, 14, ol('url(#s04gold)', 6)) + T('PREMIUM', 0, -88, 50, '#7A4A08');
  if (shine > 0) o += S.rect(-140 + 280 * shine - 30, -140, 40, 70, 0, { fill: '#FFFFFF', opacity: f(0.7 * (1 - Math.abs(shine - 0.5) * 2)) });
  // padlock + chain
  if (locked) {
    o += S.path('M-170 -300 Q0 -250 170 -300', ln(14, '#7A8294')) + S.path('M-170 -300 Q0 -250 170 -300', ln(6, '#C9CED8'));
    o += S.path('M-34 -230 L-34 -270 Q0 -310 34 -270 L34 -230', ln(14, '#7A8294')) + S.rect(-56, -240, 112, 100, 18, ol('#FFC93C', 6)) + S.circle(0, -200, 12, { fill: '#151515' }) + S.rect(-5, -200, 10, 30, 4, { fill: '#151515' });
  }
  o += S.rect(-130, -40, 260, 40, 10, ol('#5A6078', 6));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function waterCooler(x, y, s = 1, t = 0) {
  return S.g(S.rect(-70, -300, 140, 300, 16, ol('#F4F6FA', 6)) + S.path('M-60 -300 L-60 -470 Q0 -520 60 -470 L60 -300 Z', ol('#9FD8FF', 6)) + S.ellipse(0 + Math.sin(t * 2) * 10, -380 + Math.cos(t * 3) * 20, 14, 14, { fill: '#FFFFFF', opacity: 0.6 }) + S.rect(-20, -230, 40, 24, 6, ol('#34C3FF', 4)), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function mug(empty = true) {
  return S.rect(-36, -50, 72, 90, 12, ol('#FFFFFF', 5)) + S.path('M36 -30 Q70 -10 36 20', ln(10)) + TF('#1 DAD', 0, 4, 18, '#D2364B') + (empty ? '' : S.ellipse(0, -46, 30, 8, { fill: '#6B3A1E' }));
}
function shotPayday(t) {
  const cam = camKeys(t, [[tPay, { zoom: 1.0, x: 0, y: 20 }], [tPayR, { zoom: 1.12, x: -60, y: 60 }], [tCoffee, { zoom: 1.18, x: -80, y: 70 }]]);
  let w = office(t);
  w += cubicle(1260, 560, 700) + kidIn(16, t, { x: 1560, y: 900, s: 0.42, face: 'sleepy', volume: false });
  w += cubicle(1260, 640, 700, 300);
  // Dad at his desk
  w += actor('dad', t, { x: 720, y: 1080, s: 0.6, turn: 0.2, face: { name: 'sad' }, armL: 30, armR: 30 }, { energy: 0.6 });
  w += S.rect(260, 800, 1000, 40, 10, ol('#C9B08A', 6)) + S.rect(280, 840, 960, 300, 0, ol('#B5986E', 6)) + monitor(420, 800, 1, '#7FD3FF');
  // the boss leans in and drops three coins
  const drop = seg(t, tPayR - 0.3, tPayR + 0.3);
  const bx = lerp(1700, 1240, ease.out(seg(t, tPay, tPay + 0.5)));
  w += extra('boss', t, { x: bx, y: 1100, s: 0.66, turn: -0.5, lean: -8, armL: 70, armR: 10, face: { name: 'smug' } });
  for (let i = 0; i < 3; i++) {
    const k = seg(t, tPayR - 0.1 + i * 0.12, tPayR + 0.15 + i * 0.12);
    if (k > 0) w += coin(900 + i * 50, lerp(560, 780, ease.in(k)) - (k >= 1 ? 0 : 0), 26, k >= 1 ? 80 : k * 400, k >= 1 ? 1.2 : t * 10);
  }
  w += C.sfx('clink', 950, 700, seg(t, tPayR + 0.1, tPayR + 0.2) * (1 - seg(t, tPayR + 0.8, tPayR + 1)), 60, -6, '#FFE14D');
  return view(cam, w, 1);
}
function shotCoffee(t) {
  const deny = bump(t, l12.word('coffee').t0, tPrem - 0.05);
  const cam = camKeys(t, [[tCoffee, { zoom: 1.0, x: 0, y: 0 }], [tPrem, { zoom: 1.12, x: 60, y: 20 }], [tCoffeeGP, { zoom: 1.2, x: 120, y: -20 }], [tPromo, { zoom: 1.25, x: 120, y: -20 }]]);
  let w = office(t) + waterCooler(400, 860, 1, t);
  w += S.rect(760, 820, 900, 30, 8, ol('#C9CED8', 6)) + S.rect(780, 850, 860, 300, 0, ol('#AEB7C6', 6));
  w += coffeeMachine(1180, 820, 1, t, { deny, shine: seg(t, tPrem, tPrem + 0.4) });
  const [hx, hy] = A.hand(60, 1);
  w += actor('dad', t, { x: 760, y: 1120, s: 0.7, turn: 0.4, armR: 60 + 20 * deny, armL: 20, face: t > tPrem ? { name: 'sad' } : { name: 'happy' }, props: [{ svg: S.g(mug(true), `translate(${f(hx + 10)} ${f(hy - 40)})`), layer: 'front' }] }, { arms: false, energy: 0.6 });
  w += K.gamePass(1540, 330, 'PREMIUM COFFEE', '300', 0.7, seg(t, tCoffeeGP, tCoffeeGP + 0.3), S.g(mug(false), 'translate(0 -20) scale(0.9)'));
  let o = view(cam, w, 1);
  o += bang('BZZT!', 1180, 300, seg(t, l12.word('coffee').t0, l12.word('coffee').t0 + 0.12) * (1 - seg(t, tPrem, tPrem + 0.1)), 90, -8, '#FF5A5A');
  return o;
}
function shotPromotion(t) {
  const cam = camKeys(t, [[tPromo, { zoom: 1.0, x: 0, y: 0 }], [tFive - 0.05, { zoom: 1.05, x: 0, y: 0 }], [tFive + 0.12, { zoom: 1.6, x: 200, y: -150 }], [tPromoR + 0.2, { zoom: 1.6, x: 200, y: -150 }], [tPromoR + 0.4, { zoom: 1.1, x: 0, y: 20 }], [tRank, { zoom: 1.12, x: 0, y: 20 }]]);
  const sh = K.shake(t, tPromoR, 0.5, 14); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = office(t);
  // the boss's door
  w += S.rect(1140, 160, 520, 700, 14, ol('#7A5A8A', 8)) + S.rect(1200, 220, 400, 260, 10, ol('#DDEFFF', 6)) + T('BOSS', 1400, 380, 90, '#7A5A8A', { opacity: 0.6 }) + S.circle(1600, 560, 16, ol('#FFC93C', 5));
  w += K.gamePass(1240, 330, 'MANAGER RANK', t > tFive ? '5,000' : '???', 0.85, seg(t, l13.word('promotion').t0, l13.word('promotion').t0 + 0.3), S.g(S.path('M-50 20 L-50 -30 L-25 -5 L0 -40 L25 -5 L50 -30 L50 20 Z', ol('#FFD21F', 5)), 'translate(0 -30)'));
  const mad = t > tPromoR - 0.2;
  w += actor('dad', t, { x: 640, y: 1100, s: 0.66, turn: 0.4, armR: mad ? 100 : 60, armL: mad ? 60 : 20, face: mad ? { name: 'angry', fx: ['anger', 'steam'] } : { name: 'shocked' }, lift: mad ? 14 * Math.abs(Math.sin(t * 14)) : 0 }, { arms: false });
  let o = view(cam, w, 1);
  o += bang('5,000?!', 560, 260, seg(t, tPromoR, tPromoR + 0.15), 120, -10, '#FFE14D');
  return o;
}
function shotRank(t) {
  const cam = camKeys(t, [[tRank, { zoom: 1.0, x: 0, y: 0 }], [tReg, { zoom: 1.1, x: 80, y: -20 }]]);
  let w = office(t) + cubicle(-300, 640, 900, 300);
  // the new "Manager" strolls past sipping premium coffee, rank tag floating over his head
  const wx = lerp(1700, 1150, ease.out(seg(t, tRank, tRankW)));
  const [hx, hy] = A.hand(70, 1);
  const goldMug = S.g(S.rect(-36, -50, 72, 90, 12, ol('#FFC93C', 5)) + S.path('M36 -30 Q70 -10 36 20', ln(10)) + K.F.sparkle(-40, -60, 16), `translate(${f(hx + 10)} ${f(hy - 40)})`);
  w += extra('manager', t, { x: wx, y: 1080, s: 0.66, turn: -0.3, face: { name: 'smug' }, armR: 70, armL: 12, props: [{ svg: goldMug, layer: 'front' }] });
  const tk = seg(t, tRankW - 0.1, tRankW + 0.15);
  w += S.g(S.rect(-210, -50, 420, 100, 30, ol('#2A1640', 7)) + S.path('M-170 18 L-170 -18 L-150 0 L-130 -24 L-110 0 L-90 -18 L-90 18 Z', ol('#FFD21F', 4)) + T('MANAGER', 40, 22, 62, '#FFD21F'), `translate(${f(wx)} 330) scale(${f(0.8 + 0.2 * ease.outBack(tk))})`);
  w += K.sparkles([[wx - 230, 300, 24], [wx + 230, 360, 18]], t);
  // Dad fuming in the foreground (over the shoulder)
  w += actor('dad', t, { x: 420, y: 1500, s: 0.95, turn: 0.7, face: { name: 'angry', fx: ['steam'] }, armL: 15, armR: 15, headRot: 4 }, { arms: false });
  let o = view(cam, w, 1);
  return o;
}

// ---------------------------------------------------------------- J: HE showed up — register, spotlight, pop
function storeCounter(t) {
  let o = S.rect(-400, -400, 2720, 1880, 0, { fill: '#FFE3C8' }) + S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#wallStripes)', opacity: 0.4 });
  for (let r = 0; r < 3; r++) o += S.rect(100, 140 + r * 150, 520, 130, 0, { fill: 'url(#s04shelf)' }) + S.rect(1320, 140 + r * 150, 520, 130, 0, { fill: 'url(#s04shelf)' });
  o += S.rect(-400, 700, 2720, 40, 10, ol('#3A3F55', 7)) + S.rect(-400, 740, 2720, 600, 0, ol('#5A6078', 7));
  return o;
}
// retro cash register; open = drawer 0..1; (x, y) = base on the counter. part: 'all' | 'front' (drawer front only)
function register(x, y, s, t, open = 0, part = 'all') {
  const drawer = S.rect(-230, -20 + open * 70, 460, 90, 10, ol('#7A8294', 7)) + S.rect(-60, 20 + open * 70, 120, 18, 8, { fill: '#3A3F55' });
  if (part === 'front') return S.g(drawer, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
  let o = '';
  if (open > 0.05) o += S.rect(-220, -20, 440, 30 + open * 70, 6, { fill: '#2A2E3E' }) + X.coinPile(-90, -10 + open * 40, 3, 22, t, 5) + X.coinPile(90, -10 + open * 40, 3, 22, t, 9);
  o += drawer;
  o += S.rect(-250, -260, 500, 260, 26, ol('#B5BCCB', 8)) + S.rect(-250, -100, 500, 30, 0, { fill: '#9AA0AE' });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) o += S.rect(-200 + c * 76, -230 + r * 46, 60, 36, 8, ol(r === 2 && c === 4 ? '#FF5A5A' : '#F4F6FA', 4));
  o += S.path('M60 -260 L60 -330 L240 -330 L240 -260', ol('#9AA0AE', 7)) + S.rect(76, -320, 150, 50, 6, ol('#14141A', 4));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shotRegister(t) {
  // every time anyone paid... (ka-ching x3) → push-in → lights out → one spotlight
  const pays = [l14.word('every').t0, l14.word('anyone').t0, l14.word('paid').t0];
  const tAny = l14.word('anything').t0;
  const cam = camKeys(t, [[tReg, { zoom: 1.0, x: 0, y: 0 }], [pays[2] + 0.2, { zoom: 1.05, x: 0, y: 0 }], [tAny, { zoom: 1.08, x: 0, y: -10 }], [tAny + 0.22, { zoom: 1.45, x: 0, y: -20 }], [tPop, { zoom: 1.55, x: 0, y: -20 }]]);
  const dark = seg(t, tHe - 0.05, tHe + 0.1);
  const rattle = t > l14.word('showed').t0 ? Math.sin(t * 50) * 3 : 0;
  let w = storeCounter(t);
  let open = 0;
  const HX = [460, 1460, 560];
  pays.forEach((tp, i) => {
    const k = seg(t, tp - 0.35, tp);
    if (k > 0 && t < tp + 0.5) w += blockHand(lerp(HX[i] + (i === 1 ? 300 : -300), HX[i], ease.out(k)), lerp(1250, 690, ease.out(k)) + 60 * seg(t, tp + 0.2, tp + 0.5), i === 1 ? -20 : 20, 0.9, PCOL[i + 3], ['#E9B38B', '#8D5A3B', '#F2C9A0'][i], k < 1 ? K.coin(0, -60, 34, 0, t * 6) : '');
    if (t > tp) w += K.coin(HX[i] + (i === 1 ? -30 : 30), 690, 30, 80, 1.3);
    open = Math.max(open, bump(t, tp - 0.05, tp + 0.35));
  });
  w += S.g(register(960, 700, 1.3, t, open), `rotate(${f(rattle)} 960 600)`);
  let o = view(cam, w, 1);
  pays.forEach((tp, i) => { o += kaching([460, 1460, 760][i], 220 + i * 40, t - tp, 0.65); });
  o += spotlight(960, 500, 460, dark, -120);
  o += mark('!', 1260, 220, seg(t, l14.word('showed').t0, l14.word('showed').t0 + 0.2) * dark, 140, 10, '#FFD21F');
  return o;
}
function shotPop(t) {
  // POOF! out of the drawer: calculator clack, coins snatched, -30% stamp, villain intro banner
  const cam = camKeys(t, [[tPop, { zoom: 1.35, x: 0, y: 40 }], [t30, { zoom: 1.45, x: 0, y: 30 }], [tPct, { zoom: 1.55, x: 0, y: 20 }], [tBye, { zoom: 1.6, x: 0, y: 20 }]]);
  const sh = K.shake(t, tPct, 0.3, 12); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = storeCounter(t);
  const open = ease.outBack(seg(t, tPop, tPop + 0.15));
  w += register(960, 700, 1.3, t, open);
  const grab = t > t30;
  const pose = { armR: t > tFee ? 75 : 40, armL: grab ? 115 : 40, face: grab ? { name: 'smug' } : { name: 'joy' }, turn: -0.15 };
  w += thirtyPop(t, tPop + 0.05, 0, 960, 870, 0.45, pose, { clack: t > tFee && t < t30, coins: grab ? 6 : 0 });
  w += register(960, 700, 1.3, t, open, 'front');
  let o = view(cam, w, 1);
  o += spotlight(960, 540, 560, 1, -120);
  o += stamp30(1470, 330, seg(t, tPct, tPct + 0.15), 1.1);
  // villain-intro banner
  const bk = ease.out(seg(t, tFee, tFee + 0.3)) * (1 - ease.in(seg(t, tBye - 0.2, tBye)));
  if (bk > 0) o += S.g(S.path('M-700 -70 L700 -90 L680 70 L-720 90 Z', ol('#3FD06B', 8)) + T('THE THIRTY PERCENT GUY', 0, 30, 84, '#14141A'), `translate(${f(lerp(-800, 960, bk))} 130) rotate(-3)`);
  return o;
}
function shotBye(t) {
  // "Thank you, come again!" — visor tip, wink, dive back into the drawer, DING
  const cam = camKeys(t, [[tBye, { zoom: 1.85, x: 0, y: 60 }], [tSplit, { zoom: 1.95, x: 0, y: 60 }]]);
  let w = storeCounter(t);
  const dive = seg(t, tAgain + 0.08, tAgain + 0.26);
  const shut = seg(t, tAgain + 0.24, tAgain + 0.32);
  const open = 1 - shut;
  w += register(960, 700, 1.3, t, open);
  if (dive < 1) {
    const tip = bump(t, tBye + 0.1, tAgain);
    w += thirty(t, 960, 870 + ease.in(dive) * 360, 0.45, { armR: 40 + 110 * tip, armL: 115, face: { name: 'smug', eyeR: { type: 'closed' } }, headRot: -6 * tip, shadow: false, sy: 1 + 0.2 * dive, sx: 1 - 0.2 * dive }, { coins: 5 });
  }
  w += register(960, 700, 1.3, t, open, 'front');
  let o = view(cam, w, 1);
  o += spotlight(960, 540, 560, 1, -120);
  o += bang('DING!', 1340, 380, seg(t, tAgain + 0.32, tAgain + 0.4), 120, 8, '#FFE14D');
  return o;
}

// ---------------------------------------------------------------- K1: nobody knew where he came from / went (2x2 split)
const PANELS = [
  { bg: '#FF8FB8', kind: 'vending', spawn: 452 }, { bg: '#7FD3FF', kind: 'mailbox', spawn: 282 },
  { bg: '#FFE38A', kind: 'piggy', spawn: 216 }, { bg: '#B9F0D2', kind: 'pizza', spawn: 372 },
];
function panelObj(kind, t, lid = 0) {
  switch (kind) {
    case 'vending': return S.rect(-200, -360, 400, 520, 22, ol('#E8503A', 8)) + S.rect(-160, -320, 220, 320, 10, ol('#BDEBFF', 6)) + S.rect(-150, 60, 300, 70, 10, ol('#14141A', 6)) + S.rect(90, -300, 60, 160, 8, ol('#C9CED8', 5));
    case 'mailbox': return S.rect(-20, 0, 40, 200, 6, ol('#8A5A34', 5)) + S.path('M-170 0 L-170 -170 Q-170 -280 0 -280 Q170 -280 170 -170 L170 0 Z', ol('#2E7BFF', 8)) + S.rect(-110, -150, 220, 30, 10, { fill: '#14141A' });
    case 'piggy': return S.ellipse(0, -80, 220, 150, ol('#FF9EC4', 8)) + S.circle(190, -100, 60, ol('#FF9EC4', 7)) + S.ellipse(230, -100, 26, 20, ol('#FF7FAE', 5)) + S.circle(170, -130, 8, { fill: '#151515' }) + S.rect(-60, -236, 120, 18, 8, { fill: '#7A2A4A' }) + S.rect(-150, 40, 50, 60, 10, ol('#FF9EC4', 6)) + S.rect(100, 40, 50, 60, 10, ol('#FF9EC4', 6));
    case 'pizza': return S.rect(-260, -60, 520, 140, 12, ol('#E2C08A', 7)) + T('PIZZA', 0, 40, 70, '#C8553D');
    default: return '';
  }
}
function shotSplit(t) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#14141A' });
  const comes = [l16.word('Nobody').t0, l16.word('knew').t0, l16.word('he').t0, l16.word('came').t0];
  const goes = [tWent, l16.word('knew', 1).t0, l16.word('he', 1).t0, l16.word('went').t0];
  PANELS.forEach((P, i) => {
    const px = (i % 2) * 960, py = Math.floor(i / 2) * 540;
    const id = S.uid('s04p'), cid = S.uid('s04q');
    const pin = ease.outBack(seg(t, tSplit + i * 0.06, tSplit + i * 0.06 + 0.3));
    const tc = comes[i], tg = goes[i];
    let g = S.rect(0, 0, 960, 540, 0, { fill: P.bg }) + rays(480, 300, 12, 900, '#FFFFFF', 0.18, t * 15 + i * 20);
    const obj = S.g(panelObj(P.kind, t), `translate(480 ${P.kind === 'pizza' ? 420 : 400}) scale(0.8)`);
    const on = t > tc - 0.05 && t < tg + 0.3;
    const guy = on ? S.g(thirtyPop(t, tc, tg, 480, P.spawn + 120, 0.42, { armL: 115, armR: 60, face: { name: i % 2 ? 'smug' : 'joy' } }, { coins: 4 }), null, { 'clip-path': `url(#${cid})` }) : '';
    const puffs = poof(480, P.spawn - 40, t - tc, 0.7) + poof(480, P.spawn - 40, t - tg - 0.1, 0.7);
    g += S.clipDef(cid, S.rect(0, -200, 960, P.spawn + 200));
    if (P.kind === 'pizza') g += S.g(S.rect(-260, -40, 520, 40, 10, ol('#D9B070', 7)), `translate(480 372) rotate(${f(-115 * ease.out(seg(t, tc - 0.1, tc + 0.1)) * (1 - seg(t, tg, tg + 0.2)))} -260 -20)`) + guy + obj;
    else g += obj + guy;
    g += puffs;
    if (t > tg + 0.25) g += mark('?', 780, 190, seg(t, tg + 0.25, tg + 0.45), 120, 10, '#FFFFFF');
    // his visor, left spinning in the last panel, then yanked away
    if (i === 3 && t > tg + 0.1) {
      const vs = ease.in(seg(t, tSand - 0.4, tSand - 0.1));
      g += S.g(S.path('M-80 0 L80 0 L60 30 L-60 30 Z', ol('#3FD06B', 5)) + S.rect(-80, -12, 160, 16, 6, ol('#2E6B3A', 4)), `translate(${f(480 + vs * 700)} ${f(200 - Math.sin((t - tg) * 4) * 20)}) scale(${f(Math.cos((t - tg) * 9))} 1)`);
    }
    o += S.clipDef(id, S.rect(px + 8, py + 8, 944, 524, 18));
    o += S.g(S.g(g, `translate(${px} ${py})`), `translate(${f(px + 480)} ${f(py + 270)}) scale(${f(pin)}) translate(${f(-px - 480)} ${f(-py - 270)})`, { 'clip-path': `url(#${id})` });
  });
  o += C.whiteFlash(0.4 * bump(t, tSplit - 0.05, tSplit + 0.1));
  return o;
}

// ---------------------------------------------------------------- K2-K4: Dad's sandwich
// a long sub, drawn from x=0 to len, centred on y=0; bitten removes the right third with a bite edge
function sandwich(x, y, s, rot, bitten, len = 620) {
  const W = len, n = Math.round(W / 30);
  const layers = S.rect(0, -75, W, 56, 28, ol('#F2C27A', 6)) + S.path(`M0 -20 ${Array.from({ length: n + 1 }, (_, i) => `L${i * 30} ${i % 2 ? -4 : -30}`).join(' ')} L${W} 0 L0 0 Z`, ol('#5BC85A', 5)) +
    S.rect(10, -6, W - 20, 22, 6, ol('#FF6B5A', 5)) + S.path(`M20 14 L${W - 20} 14 L${W - 50} 34 L${W - 90} 22 L${W * 0.5} 40 L${W * 0.3} 22 L60 36 Z`, ol('#FFD84A', 5)) + S.rect(0, 24, W, 52, 26, ol('#E8B064', 6)) +
    Array.from({ length: Math.floor(W / 90) }, (_, i) => S.ellipse(50 + i * 90, -58, 10, 4, { fill: '#FFF4DA' })).join('');
  let o;
  if (!bitten) o = layers;
  else {
    const id = S.uid('s04sw');
    const bx = W * 0.667;
    const clip = `M-20 -120 L${bx} -120 Q${bx - 34} -84 ${bx} -50 Q${bx - 38} -16 ${bx} 14 Q${bx - 34} 46 ${bx} 76 Q${bx - 24} 104 ${bx} 130 L-20 130 Z`;
    o = S.clipDef(id, S.path(clip)) + S.g(layers, null, { 'clip-path': `url(#${id})` });
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function shotSandwich(t) {
  const chomp = t > tTook;
  const cam = camKeys(t, [[tSand, { zoom: 1.2, x: -120, y: 0 }], [tTook, { zoom: 1.28, x: -80, y: 20 }], [tTook + 0.08, { zoom: 1.55, x: -60, y: 60 }], [tDadMad, { zoom: 1.6, x: -60, y: 60 }]]);
  const sh = K.shake(t, tTook, 0.3, 14); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = office(t) + cubicle(1300, 600, 800);
  // Dad, mouth wide open, a long sub held in both hands
  const open = t > tSand + 0.35;
  w += actor('dad', t, { x: 700, y: 1080, s: 0.7, armR: 100, armL: 100, face: chomp ? { name: 'shocked', mouth: 'O' } : { name: 'happy', mouth: open ? 'O' : 'smile', eyes: { type: 'closed' } }, props: [{ svg: sandwich(-346, -520, 1, 0, chomp, 692), layer: 'front' }] }, { arms: false });
  w += S.rect(160, 870, 1600, 40, 10, ol('#C9B08A', 6)) + S.rect(180, 910, 1560, 300, 0, ol('#B5986E', 6)) + monitor(1400, 870, 1.1, '#7FD3FF');
  // he springs up from below the desk and chomps the right third
  const jump = seg(t, tTook - 0.25, tTook);
  const back = seg(t, tTook + 0.18, tTook + 0.55);
  if (jump > 0 && back < 1) {
    const jx = lerp(1150, 920, ease.out(jump)) + 240 * back, jy = lerp(1150, 825, ease.out(jump)) + 420 * ease.in(back);
    w += thirty(t, jx, jy, 0.32, { armL: 140, armR: 120, face: chomp ? { name: 'joy', mouth: 'cat' } : { name: 'excited', mouth: 'O' }, shadow: false, rot: -12 * (1 - back) }, {});
  }
  if (chomp) for (let i = 0; i < 10; i++) { const a = t - tTook; w += S.rect(900 + hash(i) * 120 - 60 + a * 260 * (hash(i * 3) - 0.5), 680 + a * 500 * hash(i * 5) + 0.5 * 1800 * a * a, 14, 14, 3, ol(i % 3 ? '#F2C27A' : '#5BC85A', 3)); }
  w += S.rect(160, 870, 1600, 40, 10, ol('#C9B08A', 6));
  let o = view(cam, w, 1);
  o += bang('CHOMP!', 1300, 260, seg(t, tTook, tTook + 0.12), 130, 10, '#FFD21F');
  o += stamp30(1500, 560, seg(t, tTookPct, tTookPct + 0.15), 0.9);
  return o;
}
function shotDadMad(t) {
  const cam = camKeys(t, [[tDadMad, { zoom: 1.0, x: 0, y: 0 }], [tSandW - 0.05, { zoom: 1.06, x: 0, y: 0 }], [tSandW + 0.1, { zoom: 1.35, x: 0, y: -60 }], [tChew, { zoom: 1.4, x: 0, y: -60 }]]);
  const sh = K.shake(t, tSandW, 0.7, 18); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = office(t) + cubicle(-300, 680, 900, 300) + cubicle(1400, 680, 900, 300);
  const wob = Math.sin(t * 30) * 3;
  // the 2/3 sub in his left hand, the missing third outlined; right hand points at the hole
  const sw = S.g(sandwich(0, 0, 1, 0, true) + S.path('M414 -75 L620 -75 L620 76 L414 76', { fill: 'none', stroke: '#E2233B', 'stroke-width': 7, 'stroke-dasharray': '18 12' }) + T('30%', 520, 30, 70, '#E2233B'), `translate(-349 -490) rotate(${f(wob)} 0 0)`);
  w += actor('dad', t, { x: 960, y: 1330, s: 0.95, armL: 85, armR: 88 + 6 * Math.sin(t * 9), face: { name: 'angry', fx: t > tSandW ? ['anger', 'steam'] : ['anger'] }, props: [{ svg: sw, layer: 'front' }] }, { arms: false, energy: 1.5 });
  let o = view(cam, w, 1);
  o += bang('GRRR!', 420, 220, seg(t, tSandW + 0.05, tSandW + 0.2), 110, -10, '#FF5A5A');
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF2A2A', opacity: f(0.18 * bump(t, tSandW, tSandW + 0.5)) });
  return o;
}
function shotChew(t) {
  const cam = camKeys(t, [[tChew, { zoom: 1.5, x: 140, y: -110 }], [END, { zoom: 1.62, x: 140, y: -120 }]]);
  let w = office(t) + cubicle(-300, 680, 900, 300);
  w += S.rect(300, 860, 1600, 40, 10, ol('#C9B08A', 6)) + S.rect(320, 900, 1560, 300, 0, ol('#B5986E', 6));
  w += monitor(1100, 860, 1.6, '#7FD3FF');
  // Dad's sad two-thirds of a sub on the desk
  w += sandwich(560, 820, 0.5, 0, true);
  // Thirty sits on the monitor, cheeks stuffed, chewing
  const tPoof = l18.b + 0.3;
  const chew = Math.abs(Math.sin(t * 9));
  if (t < tPoof) {
    const tip = bump(t, l18.word('fee').t0, l18.b + 0.2);
    const cheeks = S.ellipse(-112, -650, 46 + 6 * chew, 40 + 4 * chew, ol('#8DCB54', 6)) + S.ellipse(112, -650, 46 + 6 * chew, 40 + 4 * chew, ol('#8DCB54', 6)) + S.ellipse(-112, -654, 20, 12, { fill: '#FF9EAA', opacity: 0.7 }) + S.ellipse(112, -654, 20, 12, { fill: '#FF9EAA', opacity: 0.7 });
    const pose = { legL: 80, legR: 80, kneeL: 90, kneeR: 90, armL: 30, armR: 40 + 110 * tip, headY: 2 * chew, face: { name: 'smug', mouth: chew > 0.5 ? 'cat' : 'line' }, shadow: false };
    w += thirty(t, 1100, 540, 0.42, { ...pose, props: [headProp(cheeks, pose)] }, { calc: tip < 0.3 });
    for (let i = 0; i < 3; i++) { const a = ((t * 1.5 + i / 3) % 1); w += S.rect(1100 + i * 24 - 30, 400 + a * 160, 12, 12, 3, ol('#F2C27A', 3)); }
  }
  w += poof(1100, 400, t - tPoof, 1.0);
  // receipt flutters down
  if (t > tPoof) {
    const a = t - tPoof;
    w += S.g(S.rect(-90, -130, 180, 260, 4, ol('#FFFFFF', 5)) + TF('RECEIPT', 0, -90, 30, '#2A1640') + TF('1/3 SANDWICH', 0, -40, 22, '#2A1640') + TF('FEE: 30%', 0, 0, 26, '#E2233B') + TF('THANK YOU!', 0, 60, 24, '#2A1640'), `translate(${f(1100 + Math.sin(a * 5) * 60)} ${f(380 + a * 160)}) rotate(${f(Math.sin(a * 5) * 18)})`);
  }
  return view(cam, w, 1);
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [T0, shotCity], [tBus, shotBus], [tCaf, shotCafeteria], [tIce, shotIce], [tGP, shotGamePasses], [tVip, shotVip], [tCart, shotFireCart],
  [tLine, shotShortLine], [tFries, shotFries], [tMath, shotMath], [tShoe, shotShoe], [tElev, shotElevator], [tDent, shotDentist], [tTeach, shotHomework],
  [tMom, shotMom], [tAll, shotDrones], [tPorch, shotPorch], [tPay, shotPayday], [tCoffee, shotCoffee], [tPromo, shotPromotion], [tRank, shotRank],
  [tReg, shotRegister], [tPop, shotPop], [tBye, shotBye], [tSplit, shotSplit], [tSand, shotSandwich], [tDadMad, shotDadMad], [tChew, shotChew],
];
const WHIPS = [tBus, tCaf, tIce, tGP, tVip, tCart, tLine, tFries, tMath, tElev, tDent, tTeach, tMom, tAll, tPorch, tPay, tCoffee, tPromo, tRank, tSand];
function scene(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  let o = SHOTS[i][1](t);
  for (const tc of WHIPS) if (Math.abs(t - tc) < 0.12) o += whip(t, tc, 0.55);
  return o;
}
const DEFS = X.DEFS + `<defs>${SHELF_DEF}</defs>`;
function look(t) {
  if (t >= tHe - 0.05 && t < tSplit) return { grade: 'cool', vignette: 1 };
  return { grade: 'warm', vignette: 0.7 };
}
module.exports = { scene, look, DEFS };
