// SC 05 · TY SPENDS EVERYTHING — "I BOUGHT EVERYTHING!" montage on the beat (hoverboard, sneakers, toothbrush, limo,
// Jeeves 3000, the mansion + obby, statue, 400 pizzas, line-standers), the fake friends at the gates, Pickle left outside
// by the VIP list, and the Thirty Percent Guy growing with every purchase (knee height → waist height).
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin, coinBurst, bang, rays } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const X = require('./s04_env');
const S1 = require('./s01');
const { GY, extra, kidIn, shades, headProp, poof, stamp30, kaching, purchased, thirty, thirtyPop, whip } = X;

const SC = K.V.scene('SC 05');
const T0 = SC.start, END = K.V.scene('SC 06').start;
const l0 = L('05.0'), l1 = L('05.1'), l2 = L('05.2'), l3 = L('05.3'), l4 = L('05.4'), l5 = L('05.5'), l6 = L('05.6'), l7 = L('05.7');
const l8 = L('05.8'), l9 = L('05.9'), l10 = L('05.10'), l11 = L('05.11'), l12 = L('05.12'), l13 = L('05.13'), l14 = L('05.14'), l15 = L('05.15');

// ---------------------------------------------------------------- beats (all from the voice)
const tResp = l0.word('responsible').t0, tThing = l0.word('thing').t0;
const tBuyAll = l1.a - 0.25, tBought = l1.word('BOUGHT').t0, tEvery = l1.word('EVERYTHING').t0;
const tHov = l2.a - 0.1, tHovW = l2.word('hoverboard').t0;
const tSnk = l2.word('Gold', 1).t0 - 0.05, tSnkW = l2.word('sneakers').t0;
const tBr = l2.word('A', 1).t0 - 0.05, tBrW = l2.word('toothbrush').t0, tYuck = l2.word('tastes').t0, tWay = l2.word('by').t0;
const tLimo = l3.a - 0.05, tLimoW = l3.word('limo').t0, tPit = l3.word('ball').t0;
const tBot = l3.word('A', 2).t0 - 0.05, tBotW = l3.word('robot').t0, tBotOn = l3.word('butler').t0, tJeeves = l3.word('Jeeves').t0;
const tCer = l4.a - 0.12, tServed = l4.word('served').t0;
const tMan = l5.a - 0.1, tManW = l5.word('mansion').t0;
const tObby = l5.word('with').t0 - 0.05, tObbyW = l5.word('OBBY').t0;
const tStat = l6.a - 0.1, tStatW = l6.word('statue').t0, tMyself = l6.word('myself').t0;
const tPiz = l6.word('Four').t0 - 0.08, tPizW = l6.word('pizzas').t0;
const tLine = l6.word('I').t0 - 0.1, tGuy1 = l6.word('guy').t0;
const tLine2 = l6.word('Then').t0 - 0.1, tGuy2 = l6.word('guy', 1).t0, tHim = l6.word('HIM').t0;
const tGate = l7.a - 0.15, tLot = l7.word('LOT').t0;
const tNever = l8.a - 0.05, tSchool = l8.word('Kids', 1).t0 - 0.08, tCousin = l8.word('One').t0 - 0.1, tCousinW = l8.word('cousin').t0, tBrazil = l8.word('Brazil').t0;
const tJoke = l9.a - 0.15, tBad = l9.word('Even').t0 - 0.1, tEsp = l9.word('ESPECIALLY').t0 - 0.12;
const tPk = l10.a - 0.15, tList = l10.word('But').t0 - 0.1, tVip = l10.word('VIP').t0;
const tDeny = l11.a - 0.1, tMin = l11.word('minimum').t0, tSir = l11.word('sir').t0;
const tWait = l12.a - 0.15, tOkay = l12.word("That's").t0, tSit = l12.word('wait').t0;
const tWin = l13.a - 0.15;
const tGrow = l14.a - 0.12, tG1 = l14.word('every').t0, tG2 = l14.word('bought').t0, tG3 = l14.word('something').t0;
const tChart = l14.word('the').t0 - 0.1, tBigger = l14.word('bigger').t0;
const tBurp0 = l15.a - 0.1, tFee = l15.word('fee').t0, t30 = l15.word('Thirty').t0, tPct = l15.word('percent').t0;
const tBurp = (l15.word('fee').t1 + t30) / 2 - 0.15;

// ---------------------------------------------------------------- the Thirty Percent Guy grows with every purchase
const BUYS = [tEvery, tHovW, tSnkW, tBrW, tPit, tBotOn, tManW, tObbyW, tStatW, tPizW, tGuy1, tGuy2, tG1, tG2, tG3, l14.word('got').t0, l14.word('little').t0];
// height as a fraction of Ty's height: knee (0.25) → waist (0.47)
function hf(t) {
  let n = 0;
  for (const b of BUYS) n += ease.outBack(seg(t, b + 0.05, b + 0.3));
  n += 4 * ease.outBack(seg(t, tBigger, tBigger + 0.35));
  return 0.25 + 0.22 * n / (BUYS.length + 4);
}
const thirtyS = (t, tyS) => (hf(t) * tyS) / 0.7;
// a quick "fee" visit: pops up at (x, y) next to Ty-scale tyS, grabs a coin, leaves
function feeVisit(t, t0, dur, x, y, tyS, opts = {}) {
  if (t < t0 - 0.05 || t > t0 + dur + 0.6) return '';
  const s = thirtyS(t, tyS);
  return thirtyPop(t, t0, t0 + dur, x, y, s, { armL: 120, armR: 60, face: { name: 'smug' }, turn: opts.turn ?? -0.3, ...(opts.pose || {}) }, { coins: 3 });
}

// ---------------------------------------------------------------- helpers
const ty = (t, x, y, s, pose = {}, act = {}) => actor('ty', t, { x, y, s, ...pose }, act);
const mark = (txt, x, y, k, size = 110, rot = 10, col = '#FFFFFF') => (k > 0 ? S.g(K.F.markText(txt, 0, 0, size, rot, col), `translate(${f(x)} ${f(y)}) scale(${f(ease.outBack(clamp(k, 0, 1)))})`) : '');
function rayStage(t, c1, c2, cx = 960, cy = 540) {
  return S.rect(-600, -600, 3120, 2280, 0, { fill: c1 }) + rays(cx, cy, 20, 2400, c2, 0.55, t * 14);
}
function readingGlasses(dy = 0) {
  return S.circle(-62, -704 + dy, 58, { fill: '#DFF6FF', opacity: 0.25, stroke: '#7A4A2A', 'stroke-width': 9 }) + S.circle(62, -704 + dy, 58, { fill: '#DFF6FF', opacity: 0.25, stroke: '#7A4A2A', 'stroke-width': 9 }) + S.path(`M-8 ${-712 + dy} Q0 ${-724 + dy} 8 ${-712 + dy}`, ln(8, '#7A4A2A'));
}
function book(open = 0) {
  return S.rect(-230, -150, 460, 300, 18, ol('#2E7BFF', 7)) + S.rect(-210, -130, 420, 260, 12, { fill: '#5C9BFF' }) + TF('SAVING', 0, -40, 64, '#FFFFFF') + TF('MONEY 101', 0, 36, 56, '#FFE14D') + K.coin(0, 100, 26, 0, 0);
}
function priceStamp(x, y, amt, k, s = 1, rot = -8) {
  if (k <= 0) return '';
  return S.g(K.priceTag(0, 0, amt, 1, 0), `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s * ease.outBack(clamp(k, 0, 1)))})`);
}
function goldBoard(x, y, s = 1, t = 0) {
  return S.g(S.ellipse(0, 0, 210, 36, ol('#FFC93C', 7)) + S.ellipse(0, -6, 160, 14, { fill: '#FFF1B0', opacity: 0.8 }) + S.ellipse(0, 50, 180, 16, { fill: '#5CF2FF', opacity: 0.45 }) + K.F.sparkle(150, -20, 18 * Math.abs(Math.sin(t * 6))), `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function sneaker(x, y, s = 1, flip = false) {
  const o = S.path('M-150 40 L150 40 L150 0 Q150 -40 100 -50 L30 -60 L-20 -120 L-130 -120 Q-150 -120 -150 -90 Z', ol('url(#s04gold)', 7)) +
    S.rect(-160, 20, 320, 40, 18, ol('#FFFFFF', 7)) + S.path('M-60 -100 L0 -60 M-80 -80 L-10 -40 M-100 -60 L-30 -20', ln(7, '#FFFFFF')) + K.coin(-100, -20, 22, 0, 0) + S.path('M60 -40 Q100 -36 120 -10', ln(6, '#FFFFFF', 0.7));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(flip ? -s : s)} ${f(s)})`);
}

// ---------------------------------------------------------------- environments
// the mansion's grand hall. opts.night: party lighting
function hall(t, opts = {}) {
  const night = !!opts.night;
  let o = S.rect(-800, -600, 3520, 2200, 0, { fill: night ? '#3A2458' : '#FFF4E0' });
  o += S.rect(-800, -600, 3520, 2200, 0, { fill: 'url(#wallStripes)', opacity: night ? 0.15 : 0.5 });
  // arched windows with curtains
  for (const wx of [-260, 560, 1380]) {
    o += S.path(`M${wx} 620 L${wx} 260 Q${wx + 140} 100 ${wx + 280} 260 L${wx + 280} 620 Z`, ol(night ? '#1B2A6B' : '#9FD8FF', 8));
    if (night) for (let i = 0; i < 4; i++) o += K.F.sparkle(wx + 50 + hash(i + wx) * 180, 240 + hash(i * 3 + wx) * 300, 8);
    o += S.path(`M${wx + 140} 100 L${wx + 140} 620 M${wx} 400 L${wx + 280} 400`, ln(7));
    o += S.path(`M${wx - 40} 160 Q${wx + 10} 400 ${wx - 30} 680 L${wx - 70} 680 L${wx - 70} 160 Z`, ol('#C8102E', 6)) + S.path(`M${wx + 320} 160 Q${wx + 270} 400 ${wx + 310} 680 L${wx + 350} 680 L${wx + 350} 160 Z`, ol('#C8102E', 6));
  }
  // gold pilasters
  for (const px of [-420, 400, 1220, 2040]) o += S.rect(px, 100, 80, 740, 8, ol('url(#s04gold)', 6)) + S.rect(px - 16, 90, 112, 30, 8, ol('#E2B33C', 5));
  o += S.rect(-800, 80, 3520, 26, 0, ol('#E2B33C', 5));
  // floor: marble + red carpet
  o += S.rect(-800, 830, 3520, 900, 0, { fill: 'url(#s04marble)' }) + S.rect(-800, 826, 3520, 14, 0, { fill: '#C9A262' });
  o += S.path('M760 840 L1160 840 L1400 1300 L520 1300 Z', { fill: '#C8102E' }) + S.path('M800 840 L1120 840 L1330 1300 L590 1300 Z', { fill: '#E2233B', opacity: 0.6 });
  // chandelier
  if (!opts.noChandelier) {
    const sw = Math.sin(t * 1.2) * 3;
    let ch = S.path('M0 -200 L0 0', ln(6, '#E2B33C')) + S.ellipse(0, 20, 150, 40, ol('url(#s04gold)', 6));
    for (let i = -2; i <= 2; i++) ch += S.path(`M${i * 60} 40 L${i * 60} 90`, ln(5, '#E2B33C')) + S.path(`M${i * 60} 90 l-12 26 l12 18 l12 -18 Z`, ol('#DFF6FF', 4));
    for (let i = -2; i <= 2; i++) ch += S.rect(i * 60 - 8, -20, 16, 30, 4, ol('#FFFFFF', 3)) + S.ellipse(i * 60, -30, 7, 12, { fill: '#FFB000' });
    o += S.g(ch, `translate(960 0) rotate(${f(sw)})`);
  }
  if (night) {
    // disco ball + coloured light beams
    o += S.path('M960 -40 L960 120', ln(5, '#9AA0AE')) + S.circle(960, 170, 60, ol('#C9D1DC', 6));
    for (let i = 0; i < 12; i++) o += S.rect(910 + (i % 4) * 26, 124 + Math.floor(i / 4) * 30, 18, 18, 3, { fill: ['#FFFFFF', '#5CF2FF', '#FF6FB5'][(i + Math.floor(t * 6)) % 3], opacity: 0.8 });
    const cols = ['#FF6FB5', '#5CF2FF', '#FFE14D', '#7CFF6B'];
    for (let i = 0; i < 4; i++) {
      const a = Math.sin(t * 1.6 + i * 1.7) * 30 + (i - 1.5) * 24;
      o += S.path(`M960 170 L${f(960 + Math.tan(((a - 6) * Math.PI) / 180) * 1000)} 1200 L${f(960 + Math.tan(((a + 6) * Math.PI) / 180) * 1000)} 1200 Z`, { fill: cols[i], opacity: 0.16 });
    }
  }
  return o;
}
// the villa exterior (same villa as the cold open) — day blue sky or golden hour
function villaScene(t, cam, opts = {}) {
  const golden = !!opts.golden;
  let sky = golden ? S1.goldenSky(t) : S.rect(-800, -1400, 3520, 3600, 0, { fill: 'url(#s04sky)' }) + K.E.sun(1600, 150, 80, t);
  let o = sky + view(cam, X.cloudsLayer(t, 4, 80), 0.2);
  let mid = S1.villa(t) + S1.palm(220, 760, 1, t) + S1.palm(1720, 770, 0.9, t);
  if (opts.obby !== false) mid += S1.obbyYard(t);
  mid += S.rect(-1400, 740, 4800, 900, 0, { fill: golden ? '#5FAF52' : '#6FBF5A' }) + S.rect(-1400, 740, 4800, 12, 0, { fill: '#8FD96E' });
  // driveway to the gates
  mid += S.path('M820 760 L1100 760 L1340 1300 L580 1300 Z', { fill: '#E9DFD2' });
  o += view(cam, mid, opts.k ?? 1);
  return o;
}
// tall gold gates across the frame (world coords); open 0..1 swings the two leaves apart
function gates(y = 1000, h = 520, open = 0) {
  let o = '';
  const leaf = (x0, x1) => {
    let g = S.rect(x0, y - h, x1 - x0, 26, 6, ol('#E2B33C', 5)) + S.rect(x0, y - 60, x1 - x0, 24, 6, ol('#E2B33C', 5));
    for (let x = x0 + 20; x < x1; x += 56) g += S.rect(x - 7, y - h - 30, 14, h + 30, 5, ol('#FFC93C', 4)) + S.path(`M${x - 14} ${y - h - 30} L${x} ${y - h - 70} L${x + 14} ${y - h - 30} Z`, ol('#FFC93C', 4));
    return g;
  };
  o += S.g(leaf(-400, 940), `translate(${f(-600 * open)} 0)`) + S.g(leaf(980, 2320), `translate(${f(600 * open)} 0)`);
  o += S.rect(920, y - h - 120, 80, h + 120, 10, ol('#E2B33C', 6)) + S.circle(960, y - h - 150, 50, ol('#FFC93C', 6)) + K.coin(960, y - h - 150, 36, 0, 0);
  return o;
}

// ---------------------------------------------------------------- shots
function shotResponsible(t) {
  // reading glasses + SAVING MONEY 101 in front of the mall... then a sly look
  const cam = camKeys(t, [[T0, { zoom: 1.25, x: 700, y: 60 }], [tResp, { zoom: 1.35, x: 680, y: 60 }], [tThing, { zoom: 1.4, x: 660, y: 60 }], [tThing + 0.25, { zoom: 2.0, x: 600, y: 90 }], [tBuyAll, { zoom: 2.05, x: 600, y: 90 }]]);
  const c = X.cityStreet(t, cam, { crosswalk: false });
  let w = c.street;
  const sly = t > tThing + 0.15;
  const pose = { turn: sly ? -0.25 : 0, armL: 34, armR: 34, face: sly ? { name: 'sneaky', mouth: 'smirk' } : t > tResp ? { name: 'smug', eyes: { type: 'closed' } } : { name: 'happy' }, headRot: sly ? -6 : 3 * Math.sin(t * 2) };
  const nod = t > tResp && t < tThing + 0.1 ? 8 * Math.sin((t - tResp) * 12) : 0;
  pose.headRot += nod;
  const props = [headProp(readingGlasses(), pose), { svg: S.g(book(), 'translate(0 -360) scale(0.72)'), layer: 'front' }];
  w += ty(t, 1560, 1080, 0.6, { ...pose, props }, { arms: false });
  let o = c.bg + view(cam, w, 1);
  if (sly) o += K.sparkles([[1180, 300, 30]], t);
  return o;
}
function shotBuyAll(t) {
  // smash-zoom: the giant BUY ALL button, coins + shopping bags explode, balance HUD drains
  const cam = camKeys(t, [[tBuyAll, { zoom: 1.35, x: 120, y: 60 }], [tBought, { zoom: 1.15, x: 60, y: 20 }], [tEvery, { zoom: 1.0, x: 0, y: 0 }], [tHov, { zoom: 0.95, x: 0, y: 0 }]]);
  const sh = K.shake(t, tEvery, 0.6, 18); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = rayStage(t, '#5B2E9E', '#7A4BD1', 960, 600);
  const press = bump(t, tBought - 0.12, tBought + 0.25);
  // pedestal + button
  w += S.rect(1240, 760, 260, 300, 18, ol('#2A2E3E', 7)) + S.ellipse(1370, 760, 170, 46, ol('#3A3F55', 7)) + S.ellipse(1370, 736 + 22 * press, 140, 56, ol('#FF3B3B', 8)) + TF('BUY ALL', 1370, 750 + 22 * press, 50, '#FFFFFF');
  const jump = t > tEvery ? bump(t, tEvery, tEvery + 0.5) : 0;
  w += ty(t, 900, 1060, 0.62, { turn: 0.3, armR: t < tEvery ? 60 + 40 * (1 - press) : 165, armL: t < tEvery ? 30 : 160, face: t < tBought ? { name: 'determined' } : { name: 'excited', mouth: 'scream' }, lift: 60 * jump, sy: 1 + 0.08 * jump, sx: 1 - 0.05 * jump }, { arms: false });
  // shopping bags + coins exploding
  if (t > tEvery) {
    const age = t - tEvery;
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (hash(i * 2.7) - 0.5) * 2.6, v = 900 + 600 * hash(i);
      const px = 1370 + Math.cos(a) * v * age, py = 700 + Math.sin(a) * v * age + 0.5 * 1600 * age * age;
      if (py < 1300) w += S.g(S.rect(-50, -40, 100, 110, 12, ol(['#FF6FB5', '#34C3FF', '#FFD21F', '#3BD16F', '#B06BFF'][i % 5], 6)) + S.path('M-26 -40 Q0 -90 26 -40', ln(7)) + K.coin(0, 16, 22, 0, 0), `translate(${f(px)} ${f(py)}) rotate(${f(age * 300 * (hash(i * 5) - 0.5))})`);
    }
    w += coinBurst(1370, 700, age, 34, 1300, 30, 7);
  }
  w += feeVisit(t, tEvery + 0.35, 0.9, 1620, 1060, 0.62, { turn: -0.6 });
  let o = view(cam, w, 1);
  const bal = 3000000 - 2900000 * ease.in(seg(t, tEvery, tHov + 6));
  o += K.counter(960, 110, bal, 1.1, t > tEvery ? '#FF5A5A' : '#3BD16F');
  o += C.whiteFlash(0.7 * bump(t, tEvery - 0.02, tEvery + 0.14));
  return o;
}

// ------------- the montage on the beat
function shotHoverboard(t) {
  const u = ease.out(seg(t, tHov, tHovW));
  const x = lerp(-300, 900, u), bob = Math.sin(t * 9) * 8;
  let o = rayStage(t, '#1FB5A8', '#5CF2FF', 960, 560);
  o += C.speedLines(x - 1000, x - 200, 640, 12, 3, '#FFFFFF', 300) ;
  o += goldBoard(x, 860 + bob, 1.1, t);
  o += ty(t, x + 10, 846 + bob, 0.55, { view: 'side', flip: true, legL: 16, kneeL: 30, legR: -22, kneeR: 34, armL: -60, armR: 70, lean: 12 * (1 - seg(t, tHovW, tHovW + 0.3)), face: { name: 'excited' } }, { arms: false });
  o += kaching(1380, 300, t - tHovW, 0.9);
  o += priceStamp(1450, 620, '25,000', seg(t, tHovW + 0.05, tHovW + 0.25), 1.3);
  o += feeVisit(t, tHovW + 0.2, 0.55, 1640, 930, 0.55);
  return o;
}
function shotSneakers(t) {
  let o = rayStage(t, '#FF6FB5', '#FFB3DA', 960, 560);
  // velvet pillow
  o += S.path('M560 760 Q960 690 1360 760 Q1400 860 1360 900 Q960 960 560 900 Q520 860 560 760 Z', ol('#C8102E', 8)) + S.path('M620 790 Q960 740 1300 790', ln(8, '#E2233B'));
  for (const [i, sx] of [[0, 780], [1, 1140]]) {
    const k = seg(t, tSnk + i * 0.08, tSnk + i * 0.08 + 0.3);
    const y = lerp(-200, 790, ease.outBack(k));
    o += sneaker(sx, y, 1.15, i === 0);
  }
  o += K.sparkles([[700, 640, 30], [1250, 600, 36], [960, 700, 22]], t);
  o += kaching(960, 330, t - tSnkW, 0.9);
  o += priceStamp(1500, 450, '9,999', seg(t, tSnkW + 0.05, tSnkW + 0.25), 1.2);
  o += feeVisit(t, tSnkW + 0.15, 0.4, 1640, 930, 0.62);
  return o;
}
function shotToothbrush(t) {
  const yuck = t > tYuck;
  const cam = camKeys(t, [[tBr, { zoom: 1.0, x: 0, y: 0 }], [tYuck, { zoom: 1.05, x: 0, y: -10 }], [tYuck + 0.1, { zoom: 1.3, x: 0, y: -80 }], [tLimo, { zoom: 1.35, x: 0, y: -90 }]]);
  let w = S.rect(-400, -400, 2720, 1880, 0, { fill: 'url(#s04tileBath)' });
  w += S.rect(380, 60, 1160, 760, 30, ol('#DFF6FF', 12)) + S.path('M480 160 L640 100 M480 260 L760 120', ln(16, '#FFFFFF', 0.6));
  // Ty brushing, close
  const brushing = t < tYuck;
  const sc = Math.sin(t * 28) * (brushing ? 6 : 0);
  const pose = { armR: 112 + sc, armL: 20, face: yuck ? { name: 'yuck', fx: ['sweat'] } : { name: 'happy', eyes: { type: 'closed' }, mouth: 'teeth' }, headRot: yuck ? -6 : 0 };
  const [hx, hy] = A.hand(pose.armR, 1);
  const brush = S.g(S.rect(-330, -16, 330, 32, 14, ol('url(#s04gold)', 6)) + S.rect(-390, -30, 70, 34, 6, ol('#FFFFFF', 5)) + K.F.sparkle(-160, -30, 14 * Math.abs(Math.sin(t * 5))), `translate(${f(hx)} ${f(hy + 20)}) rotate(${f(yuck ? 20 : 4)})`);
  let foam = '';
  if (brushing && t > tBr + 0.3) for (let i = 0; i < 6; i++) foam += S.circle(-60 + i * 26 + Math.sin(t * 9 + i) * 6, -592 + (i % 2) * 14, 14 + (i % 3) * 5, ol('#FFFFFF', 4));
  w += ty(t, 960, 1390, 1.15, { ...pose, props: [{ svg: brush, layer: 'front' }, ...(foam ? [headProp(foam, pose)] : [])] }, { arms: false });
  if (yuck) for (let i = 0; i < 3; i++) w += S.path(`M${640 + i * 50} ${330 - i * 30} q30 -20 0 -40 q-30 -20 0 -40`, ln(8, '#7FD36B', 0.9));
  // he pops out of the toothbrush cup
  w += S.path('M1460 820 L1600 820 L1580 1000 L1480 1000 Z', ol('#B9F0D2', 6));
  w += feeVisit(t, tBrW + 0.25, 0.6, 1530, 900, 0.62);
  w += S.path('M1460 900 L1600 900 L1580 1000 L1480 1000 Z', ol('#B9F0D2', 6));
  let o = view(cam, w, 1);
  o += kaching(1500, 260, t - tBrW, 0.85);
  o += bang('BLEH!', 1340, 300, seg(t, tYuck + 0.15, tYuck + 0.3), 110, 10, '#7FD36B');
  return o;
}
function limo(x, y, s, t, len = 3200) {
  // long, low and gold; faces screen-left (front at x = 0)
  let o = '';
  for (const wx of [230, 640, len - 640, len - 230]) o += S.circle(wx, -58, 60, ol('#2A2A33', 7)) + S.circle(wx, -58, 30, ol('#F4F6FA', 5)) + S.circle(wx, -58, 10, { fill: '#C9CED8' });
  o += S.path(S.roundedPath([[0, -90], [10, -200], [180, -220], [300, -310], [len - 260, -310], [len - 80, -220], [len, -200], [len, -90]], 34), ol('url(#s04gold)', 8));
  o += S.path(`M10 -170 L${len - 10} -170`, ln(6, '#FFF1A8', 0.8)) + S.path(`M0 -120 L${len} -120`, ln(10, '#C9CED8'));
  // long run of tinted windows with chrome trim
  o += S.path(S.roundedPath([[320, -290], [len - 280, -290], [len - 160, -220], [200, -220]], 14), ol('#2A1640', 6));
  for (let i = 1; i < Math.floor((len - 500) / 260); i++) o += S.path(`M${200 + i * 260} -290 L${200 + i * 260} -220`, ln(8, '#C9CED8'));
  for (let i = 0; i < Math.floor((len - 500) / 260); i++) o += S.path(`M${300 + i * 260} -236 L${340 + i * 260} -280`, ln(6, '#FFFFFF', 0.35));
  o += S.rect(4, -190, 50, 34, 10, ol('#FFF4C8', 5)) + S.rect(len - 40, -190, 36, 40, 8, ol('#FF4D4D', 5));
  o += S.path('M150 -222 L150 -250 L170 -250', ln(6, '#C9CED8')) + K.F.sparkle(len * 0.3, -300, 18 * Math.abs(Math.sin(t * 4))) + K.F.sparkle(len * 0.7, -160, 14 * Math.abs(Math.sin(t * 5 + 1)));
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shotLimo(t) {
  // a ridiculously long gold limo; the camera pans along it to the ball-pit sunroof
  const cam = camKeys(t, [[tLimo, { zoom: 1.0, x: 1500, y: 80 }], [tPit - 0.1, { zoom: 1.0, x: -200, y: 60 }], [tPit + 0.2, { zoom: 1.12, x: -240, y: 20 }], [tBot, { zoom: 1.15, x: -250, y: 20 }]]);
  const c = X.cityStreet(t, cam, { crosswalk: false });
  let w = c.street;
  const LX = -1300, LY = GY + 230, LEN = 3600;
  w += limo(LX, LY, 1, t, LEN);
  // ball pit in the sunroof
  const pitX = 760, pitY = LY - 310;
  const pop = t > tPit;
  const age = t - tPit;
  w += ty(t, pitX, pitY + 360 - 380 * ease.outBack(seg(t, tPit - 0.05, tPit + 0.25)), 0.5, { armL: 160, armR: 160, face: { name: 'excited' } }, { arms: false });
  let balls = '';
  for (let i = 0; i < 26; i++) {
    const bx = pitX - 260 + (i % 13) * 40 + (Math.floor(i / 13) % 2) * 20, by = pitY - 8 - Math.floor(i / 13) * 26;
    let px = bx, py = by;
    if (pop && i % 2 === 0) { const a = -Math.PI / 2 + (hash(i) - 0.5) * 2.4, v = 600 + 400 * hash(i * 3); px = bx + Math.cos(a) * v * age; py = by + Math.sin(a) * v * age + 0.5 * 1600 * age * age; }
    if (py < pitY + 40 || !pop) balls += S.circle(px, py, 22, ol(['#FF5A5A', '#34C3FF', '#FFD21F', '#3BD16F', '#B06BFF'][i % 5], 4));
  }
  w += S.rect(pitX - 290, pitY - 30, 580, 50, 14, ol('#D98E12', 6)) + balls;
  w += feeVisit(t, tPit + 0.35, 0.5, pitX + 200, pitY + 10, 0.5);
  let o = c.bg + view(cam, w, 1);
  o += kaching(1500, 260, t - tLimoW, 0.8);
  o += bang('BALL PIT!', 640, 220, seg(t, tPit + 0.05, tPit + 0.2), 100, -8, '#FF6FB5');
  return o;
}
function crate(x, y, s, open) {
  // wooden crate; open: front + side panels fall away
  let o = '';
  const panel = (w, h) => S.rect(-w / 2, -h, w, h, 10, ol('#C9945A', 8)) + S.path(`M${-w / 2 + 20} ${-h + 40} L${w / 2 - 20} -40 M${-w / 2 + 20} -40 L${w / 2 - 20} ${-h + 40}`, ln(10, '#A87442')) + S.rect(-w / 2, -h, w, 40, 6, ol('#B07A48', 6)) + S.rect(-w / 2, -40, w, 40, 6, ol('#B07A48', 6));
  if (open < 1) {
    const fall = ease.in(open);
    o += S.g(panel(560, 760), `translate(${f(-200 * fall)} 0) rotate(${f(-80 * fall)} -280 0)`);
    o += S.g(panel(560, 760), `translate(${f(200 * fall)} 0) rotate(${f(80 * fall)} 280 0)`);
  }
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s)})`);
}
function shotButler(t) {
  const cam = camKeys(t, [[tBot, { zoom: 1.2, x: 0, y: 60 }], [tBotW, { zoom: 1.12, x: 0, y: 30 }], [tJeeves, { zoom: 1.2, x: -60, y: 20 }], [tCer, { zoom: 1.28, x: -60, y: 10 }]]);
  let w = hall(t);
  const open = seg(t, tBotW - 0.05, tBotW + 0.3);
  const on = t > tBotOn;
  // the butler inside, powered off until "butler"
  const pose = { x: 900, y: 980, s: 0.62, face: { name: 'happy' }, armL: on ? 10 + 30 * bump(t, tBotOn, tBotOn + 0.6) : 8, armR: on ? 70 : 8, bodyY: on ? undefined : 0 };
  const offEyes = on ? [] : [headProp(S.rect(-118, -850, 236, 228, 36, ol('#0B0E16', 7)), {})];
  w += actor('butler', t, { ...pose, props: offEyes });
  if (on) w += poof(900, 520, t - tBotOn, 0.9, '#E6EAF2');
  w += crate(900, 990, 1, open);
  // packing peanuts + steam
  if (open > 0) for (let i = 0; i < 18; i++) { const a = t - tBotW; w += S.ellipse(900 + (hash(i) - 0.5) * 700 * Math.min(1, a * 2), 980 - 30 * hash(i * 3), 18, 10, ol('#FFF4DA', 3)); }
  w += ty(t, 1500, 1010, 0.56, { turn: -0.4, face: on ? { name: 'excited' } : { name: 'amazed' }, armL: on ? 150 : 40, armR: on ? 150 : 30, lift: on ? 30 * Math.abs(Math.sin((t - tBotOn) * 8)) : 0 }, { arms: false });
  w += feeVisit(t, tBotOn + 0.3, 0.9, 520, 1010, 0.56, { turn: 0.4 });
  let o = view(cam, w, 1);
  o += kaching(1500, 280, t - tBotW, 0.8);
  if (t > tJeeves) o += S.g(S.rect(-250, -50, 500, 100, 30, ol('#14182A', 6)) + TF('JEEVES 3000', 0, 20, 58, '#5CF2FF'), `translate(780 200) scale(${f(ease.outBack(seg(t, tJeeves, tJeeves + 0.25)))}) rotate(-3)`);
  return o;
}
function shotCereal(t) {
  // golden cereal, served
  const cam = camKeys(t, [[tCer, { zoom: 1.1, x: 0, y: 40 }], [tServed, { zoom: 1.2, x: 40, y: 60 }], [tMan, { zoom: 1.35, x: 60, y: 90 }]]);
  let w = hall(t);
  // Ty seated (the table hides his legs), napkin bib
  const bib = S.path('M-90 -520 L90 -520 L60 -380 L-60 -380 Z', ol('#FFFFFF', 5));
  const spoon = t > tServed;
  w += ty(t, 760, 1120, 0.6, { turn: 0.3, armR: spoon ? 125 : 40, armL: 30, face: spoon ? { name: 'smug', eyes: { type: 'closed' } } : { name: 'amazed' }, props: [{ svg: bib, layer: 'front' }, ...(spoon ? [{ svg: S.g(S.rect(-10, -100, 20, 120, 8, ol('#E6EAF2', 4)) + S.ellipse(0, -110, 24, 16, ol('#E6EAF2', 4)) + K.coin(0, -118, 14, 0, 0), `translate(${f(A.hand(125, 1)[0])} ${f(A.hand(125, 1)[1])}) rotate(-30)`), layer: 'front' }] : [])] }, { arms: false });
  // the butler pours
  const [hx, hy] = A.hand(110, -1);
  const pourK = seg(t, tCer + 0.2, tServed);
  const box = S.g(S.rect(-60, -110, 120, 180, 10, ol('url(#s04gold)', 6)) + TF('GOLD', 0, -40, 30, '#7A4A08') + TF('O\'S', 0, 0, 30, '#7A4A08'), `translate(${f(hx)} ${f(hy - 40)}) rotate(${f(-60 * pourK)})`);
  w += actor('butler', t, { x: 1280, y: 1100, s: 0.66, turn: -0.4, armL: 110, armR: 20, lean: -6, props: [{ svg: box, layer: 'front' }] });
  // table + bowl + falling flakes
  w += S.rect(200, 840, 1520, 50, 12, ol('#FFFFFF', 6)) + S.rect(220, 890, 1480, 300, 0, ol('#8A5A34', 6)) + S.path('M220 890 L1700 890', ln(10, '#E2B33C'));
  w += S.path('M860 800 L1080 800 Q1060 880 970 880 Q880 880 860 800 Z', ol('#FFFFFF', 6)) + S.ellipse(970, 800, 110, 20, ol('#FFE14D', 5));
  if (pourK > 0 && pourK < 1) for (let i = 0; i < 10; i++) { const ph = (t * 3 + i / 10) % 1; w += K.coin(1050 - ph * 70 + (hash(i) - 0.5) * 30, 560 + ph * 240, 12, i * 30, t * 8 + i); }
  for (let i = 0; i < 5; i++) w += K.coin(920 + i * 24, 790 - (i % 2) * 8, 14, i * 40, 0.4);
  let o = view(cam, w, 1);
  o += C.sfx('clink!', 1160, 560, bump(t, tCer + 0.5, tCer + 1.1), 60, -8, '#FFE14D') + C.sfx('clink!', 1260, 640, bump(t, tCer + 0.9, tCer + 1.5), 50, 8, '#FFE14D');
  o += K.sparkles([[960, 760, 18], [1020, 740, 14]], t);
  return o;
}
function shotMansion(t) {
  // crane up to the villa, SOLD!
  const cam = camKeys(t, [[tMan, { zoom: 1.3, x: 0, y: 260 }], [tManW, { zoom: 1.05, x: 0, y: 40 }], [tObby, { zoom: 1.0, x: 0, y: 20 }]]);
  let o = villaScene(t, cam, {});
  let w = '';
  const k = seg(t, tManW - 0.05, tManW + 0.2);
  w += S.g(S.rect(-14, -60, 28, 260, 6, ol('#8A5A34', 5)) + S.rect(-180, -200, 360, 160, 18, ol('#FFFFFF', 7)) + T('SOLD!', 0, -95, 96, '#E2233B'), `translate(1420 880) rotate(${f(6 - 6 * k)}) scale(${f(ease.outBack(k))})`);
  w += ty(t, 700, 1000, 0.42, { armL: 150, armR: 150, face: { name: 'joy' }, lift: 30 * bump(t, tManW, tManW + 0.4) }, { arms: false });
  o += view(cam, w, 1);
  o += kaching(1420, 520, t - tManW - 0.1, 0.85);
  return o;
}
function shotObby(t) {
  // backyard obby: Ty parkours across the floating blocks; the villa behind
  const p = seg(t, tObby, tStat);
  const camX = lerp(-200, 700, p);
  const cam = { zoom: 1.0, x: camX, y: 0 };
  let o = S.rect(-800, -1400, 3520, 3600, 0, { fill: 'url(#s04sky)' }) + view(cam, X.cloudsLayer(t, 5, 60), 0.2);
  o += view(cam, S.g(S1.villa(t) + S1.palm(220, 760, 1, t) + S1.palm(1720, 770, 0.9, t), 'translate(560 420) scale(0.42)') + S.rect(-1400, 740, 4800, 900, 0, { fill: '#6FBF5A' }) + S.rect(-1400, 740, 4800, 12, 0, { fill: '#8FD96E' }), 0.45);
  const BL = [[300, 820, '#FF5A5A'], [700, 740, '#34C3FF'], [1100, 660, '#FFD21F'], [1500, 740, '#3BD16F'], [1900, 640, '#B06BFF'], [2300, 720, '#FF8FC8']];
  let w = '';
  BL.forEach(([bx, by, c], i) => { w += S.rect(bx - 120, by + Math.sin(t * 1.5 + i) * 6, 240, 60, 14, ol(c, 6)) + S.rect(bx - 110, by + 6 + Math.sin(t * 1.5 + i) * 6, 220, 12, 6, { fill: '#FFFFFF', opacity: 0.35 }) + S.rect(bx - 12, by + 60, 24, 800, 0, { fill: '#7A5A8A', opacity: 0.4 }); });
  // Ty hops block to block
  const hopT = 0.42, hops = (t - tObby) / hopT;
  const i0 = clamp(Math.floor(hops), 0, BL.length - 2), u = clamp(hops - i0, 0, 1);
  const [ax, ay] = BL[i0], [bx2, by2] = BL[i0 + 1];
  const tx = lerp(ax, bx2, u), tyy = lerp(ay, by2, u) - Math.sin(u * Math.PI) * 220;
  const land = u < 0.15 ? 1 - u / 0.15 : 0;
  w += ty(t, tx, tyy, 0.4, { view: 'side', flip: true, ...(u > 0.1 && u < 0.9 ? { legL: 50, kneeL: 70, legR: -30, kneeR: 40, armL: 120, armR: -40 } : A.run(t * 12, 0.6)), sy: 1 - 0.12 * land, sx: 1 + 0.08 * land, face: { name: 'excited' } }, { arms: false });
  w += feeVisit(t, tObbyW + 0.4, 0.8, BL[3][0] + 40, BL[3][1], 0.4);
  o += view(cam, w, 1);
  o += bang('OBBY!!', 960, 220, seg(t, tObbyW, tObbyW + 0.15), 140, -6, '#FFD21F');
  return o;
}
function shotStatue(t) {
  const cam = camKeys(t, [[tStat, { zoom: 1.0, x: 0, y: 0 }], [tStatW, { zoom: 1.05, x: 0, y: 0 }], [tMyself, { zoom: 1.12, x: -40, y: 20 }], [tPiz, { zoom: 1.18, x: -40, y: 20 }]]);
  let w = hall(t);
  // pedestal + statue (pose matched by Ty on "myself")
  const pose = { armR: 155, armL: 25, face: { name: 'smug' }, turn: -0.2 };
  w += S.rect(860, 860, 440, 120, 14, ol('#E9DFD2', 7)) + S.rect(900, 890, 360, 60, 8, ol('#FFC93C', 5)) + TF('TY · LEGEND', 1080, 932, 36, '#7A4A08');
  w += extra('goldTy', t, { x: 1080, y: 870, s: 0.82, ...pose, bodyY: 0, headY: 0, shadow: false });
  w += K.sparkles([[900, 300, 30], [1260, 420, 24], [1100, 120, 20]], t);
  // the curtain drops on "statue"
  const drop = ease.in(seg(t, tStatW - 0.1, tStatW + 0.25));
  if (drop < 1) w += S.g(S.path('M-260 -820 Q-200 -400 -240 0 L240 0 Q200 -400 260 -820 Z', ol('#C8102E', 8)) + S.path('M-120 -800 Q-90 -400 -110 0 M0 -810 L0 0 M120 -800 Q90 -400 110 0', ln(8, '#9E0C24')), `translate(1080 ${f(870 + drop * 900)}) scale(1 ${f(1 - drop * 0.6)})`);
  const match = t > tMyself - 0.1;
  w += ty(t, 560, 1000, 0.55, { ...(match ? pose : { armL: 20, armR: 60 }), face: match ? { name: 'smug' } : { name: 'excited' } }, { arms: false });
  w += feeVisit(t, tStatW + 0.4, 1.0, 1400, 990, 0.55);
  let o = view(cam, w, 1);
  o += kaching(1500, 240, t - tStatW, 0.85);
  return o;
}
function pizzaBox(x, y, w = 200) {
  return S.rect(x - w / 2, y - 36, w, 36, 6, ol('#E8D2A6', 5)) + S.path(`M${x - w / 2 + 16} ${y - 18} L${x + w / 2 - 16} ${y - 18}`, ln(4, '#C8553D', 0.6));
}
function shotPizza(t) {
  const cam = camKeys(t, [[tPiz, { zoom: 1.15, x: 0, y: 80 }], [tPizW, { zoom: 1.0, x: 0, y: 20 }], [tLine, { zoom: 0.96, x: 0, y: 10 }]]);
  let w = hall(t, { noChandelier: true });
  // towers of boxes to the ceiling (they drop in)
  const TW = [-280, 60, 380, 1540, 1860, 2180];
  TW.forEach((tx, i) => {
    const k = seg(t, tPiz + i * 0.12, tPiz + i * 0.12 + 0.35);
    const dy = (1 - ease.outBack(k)) * -1200;
    const sway = Math.sin(t * 2 + i) * (2 + i % 2);
    let st = '';
    for (let j = 0; j < 22; j++) st += pizzaBox(tx + Math.sin(j * 1.7 + i) * 6, 1000 - j * 38, 240);
    w += S.g(st, `translate(0 ${f(dy)}) rotate(${f(sway * 0.3)} ${tx} 1000)`);
  });
  // Ty with a slice; Thirty takes a bite (a third, naturally)
  const bit = t > tPizW + 0.45;
  const [hx, hy] = A.hand(110, 1);
  const slice = S.g(S.path('M0 0 L120 -40 L120 40 Z', ol('#FFC24A', 5)) + S.circle(70, -6, 10, { fill: '#E8503A' }) + S.circle(96, 12, 9, { fill: '#E8503A' }) + (bit ? S.circle(120, 0, 34, { fill: '#FFF4E0', stroke: 'none' }) : ''), `translate(${f(hx)} ${f(hy)}) rotate(-20)`);
  w += ty(t, 960, 1020, 0.55, { armR: 110, armL: 140, face: bit ? { name: 'shocked' } : { name: 'joy' }, props: [{ svg: slice, layer: 'front' }] }, { arms: false });
  w += feeVisit(t, tPizW + 0.3, 0.6, 1250, 1020, 0.55, { pose: { face: { name: 'joy', mouth: 'cat' } } });
  let o = view(cam, w, 1);
  const n = Math.round(400 * ease.out(seg(t, tPiz, tPizW + 0.2)));
  o += S.g(S.rect(-200, -70, 400, 140, 36, ol('#14182A', 7)) + T(String(n), 30, 40, 110, '#FFE14D') + S.path('M-160 30 L-70 -40 L-70 30 Z', ol('#FFC24A', 5)), 'translate(960 120)');
  o += kaching(1500, 300, t - tPizW, 0.8);
  return o;
}
function sign(txt, sub = '', w = 300) {
  return S.rect(-w / 2, -90, w, 140, 14, ol('#FFFFFF', 6)) + TF(txt, 0, -32, 34, '#2A1640') + (sub ? TF(sub, 0, 16, 34, '#E2233B') : '') + S.rect(-8, 50, 16, 140, 4, ol('#8A5A34', 4));
}
function shotLine(t) {
  // a guy holds Ty's spot in line; then another guy holds HIS spot... a chain to the horizon
  const two = t >= tLine2;
  const zoomOut = ease.inOut(seg(t, tHim - 0.1, tHim + 0.5));
  const cam = two ? { zoom: lerp(1.1, 0.62, zoomOut), x: lerp(-60, 300, zoomOut), y: lerp(40, -160, zoomOut) } : camKeys(t, [[tLine, { zoom: 1.0, x: -40, y: 20 }], [tLine2, { zoom: 1.1, x: -60, y: 40 }]]);
  const c = X.cityStreet(t, cam, { crosswalk: false, noFurniture: true });
  let w = c.street;
  w += S.g(S.rect(-220, -50, 440, 100, 20, ol('#FF5A5A', 6)) + TF('SNEAKER DROP!', 0, 16, 46, '#FFFFFF'), `translate(200 ${GY - 400})`);
  // the regular line (facing the shop on the left)
  for (let i = 0; i < 3; i++) w += kidIn([3, 8, 12][i], t, { x: 380 + i * 150, y: GY + 70, s: 0.4, view: 'side', face: 'sleepy', volume: false });
  // guy #1 holds Ty's spot
  const g1in = ease.out(seg(t, tGuy1 - 0.3, tGuy1));
  const g1x = lerp(1200, 850, g1in);
  const g1sit = two && t > tGuy2 + 0.2;
  w += kidIn(4, t, { x: g1x, y: GY + 80, s: 0.44, volume: false, view: g1sit ? 'front' : 'side', face: g1sit ? { name: 'smug' } : { name: 'happy' }, armR: g1sit ? 20 : 70, props: g1sit ? [] : [{ svg: S.g(sign('SAVING SPOT', 'FOR TY'), 'translate(-300 -820) scale(1.7)'), layer: 'front' }] });
  // guy #2 holds guy #1's spot
  if (two) {
    const g2in = ease.out(seg(t, tGuy2 - 0.3, tGuy2));
    w += kidIn(15, t, { x: lerp(1500, 1020, g2in), y: GY + 90, s: 0.44, volume: false, view: 'side', face: { name: 'happy' }, armL: 70, props: [{ svg: S.g(sign('SAVING SPOT', 'FOR HIM →'), 'translate(-300 -820) scale(1.7)'), layer: 'front' }] });
    // the endless chain revealed on HIM
    if (zoomOut > 0) for (let i = 0; i < 9; i++) w += kidIn((i * 7 + 2) % 18, t, { x: 1180 + i * 170, y: GY + 100 + i * 4, s: 0.42, view: 'side', face: 'happy', armL: 70, volume: false, props: [{ svg: S.g(sign('FOR HIM →', '', 260), 'translate(-300 -820) scale(1.5)'), layer: 'front' }] });
  }
  // Ty lounging on a deck chair with a juice box
  const tx = two ? 1500 + 0 : 1450;
  w += S.path(`M${tx - 160} ${GY + 190} L${tx + 160} ${GY + 120} M${tx - 120} ${GY + 200} L${tx - 120} ${GY + 130} M${tx + 120} ${GY + 200} L${tx + 120} ${GY + 120}`, ln(10, '#8A5A34'));
  w += ty(t, tx, GY + 190, 0.46, { rot: -60, rotY: -300, armL: 30, armR: 120, face: { name: 'smug' }, shadow: false, props: [headProp(shades(), {}), { svg: S.g(S.rect(-30, -50, 60, 90, 8, ol('#FF8FC8', 5)) + S.path('M10 -50 L30 -100', ln(6, '#FFFFFF')), `translate(${f(A.hand(120, 1)[0])} ${f(A.hand(120, 1)[1])})`), layer: 'front' }] }, { arms: false });
  let o = c.bg + view(cam, w, 1);
  o += kaching(1400, 260, t - tGuy1, 0.7);
  return o;
}

// ------------- the "friends"
function crowdRow(t, n, y, s, x0, dx, seed, faceFn, opts = {}) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const k = (i * 5 + seed) % 19;
    const bob = Math.abs(Math.sin(t * 5 + i * 1.3)) * 10 * (opts.bounce ?? 1);
    o += kidIn(k, t, { x: x0 + i * dx + (hash(i + seed) - 0.5) * 30, y: y - bob, s, face: faceFn(i), armL: opts.armsUp ? 120 + 30 * Math.sin(t * 6 + i) : 15, armR: opts.armsUp ? 140 + 30 * Math.sin(t * 7 + i) : 15, volume: opts.volume ?? false, turn: (hash(i * 3 + seed) - 0.5) * 0.6 });
  }
  return o;
}
function shotGates(t) {
  const cam = camKeys(t, [[tGate, { zoom: 1.25, x: 0, y: 80 }], [tLot - 0.05, { zoom: 1.2, x: 0, y: 60 }], [tLot + 0.35, { zoom: 0.7, x: 0, y: -40 }], [tNever, { zoom: 0.68, x: 0, y: -40 }]]);
  let o = villaScene(t, cam, { golden: true });
  let w = gates(980, 480, 0);
  // Ty on the balcony waving like a celebrity
  w += ty(t, 960, 470, 0.22, { armR: 150 + 20 * Math.sin(t * 8), armL: 20, face: { name: 'joy' }, shadow: false }, { arms: false });
  // the crowd outside (rows behind each other, front = closer)
  w += crowdRow(t, 13, 1060, 0.34, -1300, 270, 1, () => ({ name: 'love' }), { armsUp: true });
  w += crowdRow(t, 11, 1180, 0.42, -1250, 330, 6, (i) => ({ name: i % 2 ? 'joy' : 'excited' }), { armsUp: true });
  w += crowdRow(t, 9, 1340, 0.5, -1150, 420, 11, (i) => ({ name: i % 3 ? 'excited' : 'love' }), { armsUp: true });
  // beyond the zoom-out: a line of tiny heads to the horizon
  for (let i = 0; i < 26; i++) w += S.circle(-1700 + i * 60 + (i % 2) * 20, 1010 - i * 4, 16, ol(['#FF6B6B', '#4ECDC4', '#FFD166', '#9B5DE5', '#00BBF9'][i % 5], 4)) + S.circle(2300 + i * 60, 1010 - i * 4, 16, ol(['#FF924C', '#8AC926', '#F15BB5', '#1982C4'][i % 4], 4));
  o += view(cam, w, 1);
  o += kaching(1500, 220, t - tLot, 0.6, 'POPULAR!');
  return o;
}
function shotNever(t) {
  // close at the bars: kids Ty has never met, sticker "HELLO my name is ???"
  let o = S1.goldenSky(t) + S.rect(0, 760, 1920, 400, 0, { fill: '#B9B3C8' });
  const kids = [[480, 2, 'love'], [960, 9, 'joy'], [1440, 14, 'excited']];
  kids.forEach(([x, k, face], i) => {
    const props = [];
    if (i === 0) props.push({ svg: S.rect(-120, -500, 240, 120, 12, ol('#FFFFFF', 5)) + S.rect(-120, -500, 240, 44, 12, { fill: '#E2233B' }) + TF('HELLO my name is', 0, -470, 22, '#FFFFFF') + TF('???', 0, -400, 46, '#2A1640'), layer: 'front' });
    if (i === 2) props.push({ svg: S.g(sign('BFF??', 'LOVE U TY', 320), 'translate(330 -760)'), layer: 'front' });
    o += kidIn(k, t, { x, y: 1150 - Math.abs(Math.sin(t * 6 + i)) * 16, s: 0.8, face: { name: face }, armL: i === 1 ? 150 + 20 * Math.sin(t * 9) : 60, armR: i === 2 ? 70 : 60, props });
  });
  // gate bars in the foreground
  for (let x = 120; x < 1920; x += 240) o += S.rect(x - 22, -40, 44, 1200, 10, ol('#FFC93C', 6)) + S.rect(x - 10, -40, 10, 1200, 0, { fill: '#FFF1A8', opacity: 0.6 });
  o += S.rect(-20, 120, 1960, 40, 8, ol('#E2B33C', 6)) + S.rect(-20, 900, 1960, 40, 8, ol('#E2B33C', 6));
  return o;
}
function shotSchools(t) {
  const cam = camKeys(t, [[tSchool, { zoom: 1.0, x: 0, y: 0 }], [tCousin, { zoom: 1.08, x: 40, y: 0 }]]);
  const c = X.cityStreet(t, cam, { crosswalk: false, noFurniture: true });
  let w = c.street;
  // the yellow school bus unloading
  w += X.bus(260, GY + 170, 1.0, t, { col: '#FFC21A', dark: '#E09A0A', door: 1, label: 'OTHER SCHOOL' });
  const P = [['NORTH MIDDLE', '#2E7BFF'], ['EAST ACADEMY', '#3BD16F'], ['OTHER SCHOOL', '#E2233B']];
  for (let i = 0; i < 6; i++) {
    const age = t - tSchool - i * 0.15;
    if (age < 0) continue;
    const x = 500 + Math.min(age * 900, 400 + i * 190), wk = age * 900 < 400 + i * 190;
    const pen = P[i % 3];
    const flag = S.g(S.path('M0 0 L0 -200', ln(8, '#8A5A34')) + S.path('M0 -200 L170 -160 L0 -120 Z', ol(pen[1], 5)) + S.el('text', { x: 10, y: -150, 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 20, fill: '#FFFFFF' }, pen[0].split(' ')[0]), `translate(${f(A.hand(150, 1)[0])} ${f(A.hand(150, 1)[1])})`);
    w += kidIn((i * 3 + 5) % 19, t, { x, y: GY + 200, s: 0.44, ...(wk ? A.walkFront(t * 9 + i) : {}), armR: 150, face: { name: 'joy' }, volume: false, props: [{ svg: flag, layer: 'front' }] });
  }
  return c.bg + view(cam, w, 1);
}
function shotCousin(t) {
  const cam = camKeys(t, [[tCousin, { zoom: 1.0, x: 0, y: 0 }], [tBrazil, { zoom: 1.08, x: 60, y: -20 }], [tJoke, { zoom: 1.16, x: 80, y: -30 }]]);
  let w = S1.goldenSky(t) + S.rect(-400, 820, 2720, 600, 0, { fill: '#B9B3C8' });
  // the "cousin": green-and-yellow jersey, a VERY fake moustache
  const fall = seg(t, tBrazil + 0.05, tBrazil + 0.35), back = seg(t, tBrazil + 0.7, tBrazil + 0.9);
  const mDy = back > 0 ? lerp(420, 0, ease.out(back)) : 420 * ease.in(fall);
  const pose = { armL: back > 0 ? 120 - 60 * back : t > tCousinW - 0.1 ? 60 : 20, armR: 120, face: fall > 0 && back < 1 ? { name: 'nervous' } : { name: 'happy', mouth: 'grin' } };
  const stache = S.g(S.path('M0 -10 C-40 -40 -110 -20 -120 20 C-80 8 -40 14 0 6 C40 14 80 8 120 20 C110 -20 40 -40 0 -10 Z', ol('#1A1210', 6)) + S.rect(-30, -24, 60, 16, 4, { fill: '#F4E6C8', opacity: 0.85 }), `translate(0 ${f(-626 + mDy)}) rotate(${f(fall > 0 && back < 1 ? 40 * fall : 0)})`);
  const jersey = S.path('M-118 -500 L118 -500 L118 -330 L-118 -330 Z', { fill: '#2FA84F' }) + S.path('M-118 -470 L118 -470 M-118 -440 L118 -440', ln(14, '#FFD21F')) + TF('10', 0, -360, 70, '#FFD21F');
  w += kidIn(7, t, { x: 1100, y: 1380, s: 0.9, ...pose, props: [{ svg: jersey, layer: 'mid' }, headProp(stache, pose), { svg: S.g(sign('PRIMO!', '(COUSIN)', 320), `translate(${f(A.hand(120, 1)[0] + 60)} ${f(A.hand(120, 1)[1] - 40)}) scale(1.2)`), layer: 'front' }] });
  // Ty in the foreground, squinting
  w += ty(t, 380, 1600, 1.0, { turn: 0.7, face: { name: 'confused' }, armL: 10, armR: 10 }, { arms: false });
  let o = view(cam, w, 1);
  if (fall > 0 && back < 1) o += bang('...!', 1500, 250, fall, 100, 8, '#FFFFFF');
  return o;
}
function shotJokes(t) {
  const ph = t < tBad ? 0 : t < tEsp ? 1 : 2;
  const cam = ph === 0 ? camKeys(t, [[tJoke, { zoom: 1.0, x: 0, y: 0 }], [tBad, { zoom: 1.08, x: 0, y: 0 }]])
    : ph === 1 ? camKeys(t, [[tBad, { zoom: 1.25, x: -240, y: -40 }], [tEsp, { zoom: 1.3, x: -240, y: -40 }]])
      : camKeys(t, [[tEsp, { zoom: 1.0, x: 0, y: 40 }], [tEsp + 0.12, { zoom: 1.55, x: 260, y: 160 }], [tPk, { zoom: 1.6, x: 260, y: 170 }]]);
  const sh = ph === 2 ? K.shake(t, tEsp + 0.1, 0.4, 14) : { sx: 0, sy: 0 }; cam.sx = sh.sx; cam.sy = sh.sy;
  let w = hall(t, { night: true });
  // little stage + Ty with a mic and a joke card
  w += S.rect(260, 860, 640, 90, 12, ol('#7A4BD1', 7));
  const [hx, hy] = A.hand(120, 1);
  const mic = S.g(S.rect(-12, -10, 24, 90, 8, ol('#2A2A33', 4)) + S.circle(0, -20, 24, ol('#9AA0AE', 5)), `translate(${f(hx - 60)} ${f(hy + 40)}) rotate(-30)`);
  const card = ph >= 1 ? S.g(S.rect(-160, -110, 320, 200, 12, ol('#FFFFFF', 6)) + TF('KNOCK', 0, -40, 50, '#2A1640') + TF('KNOCK.', 0, 20, 50, '#2A1640') + TF('(that\'s it)', 0, 70, 28, '#9AA0AE'), `translate(${f(-A.hand(110, -1)[0] * -1 - 120)} ${f(A.hand(110, -1)[1] - 40)})`) : '';
  w += ty(t, 580, 880, 0.55, { armR: 120, armL: ph >= 1 ? 110 : 30, face: ph === 2 ? { name: 'deadpan' } : { name: 'happy' }, props: [{ svg: mic, layer: 'front' }, ...(card ? [{ svg: card, layer: 'front' }] : [])] }, ph === 2 ? { arms: false, energy: 0.2 } : { arms: false });
  // the crowd of "friends", laughing way too hard
  const roll = ph === 2 ? ease.out(seg(t, tEsp + 0.1, tEsp + 0.5)) : 0;
  for (let i = 0; i < 6; i++) {
    const x = 1060 + (i % 3) * 300 + (i >= 3 ? 150 : 0), y = i >= 3 ? 1180 : 1000, s = i >= 3 ? 0.56 : 0.46;
    const laugh = Math.abs(Math.sin(t * 12 + i));
    const rolling = roll > 0 && i % 2 === 0;
    w += kidIn((i * 4 + 1) % 19, t, { x, y: y - laugh * 14, s, face: ph === 2 && i % 3 === 1 ? { name: 'crying', mouth: 'bigGrin' } : { name: 'joy' }, armL: 30 + 40 * laugh, armR: 150 * (i % 2), headRot: 10 * Math.sin(t * 14 + i), rot: rolling ? -80 * roll : 0, rotY: -300, lean: -10 * laugh, volume: false });
  }
  let o = view(cam, w, 1);
  o += bang('HA HA HA!', 1500, 230, bump(t, tJoke + 0.6, tBad) * 1.2, 100, -6, '#FFE14D');
  if (ph >= 1) o += bang('BA-DUM-TSS', 520, 220, seg(t, tBad + 0.7, tBad + 0.85) * (1 - seg(t, tEsp - 0.1, tEsp)), 80, -8, '#5CF2FF');
  if (ph === 2) o += bang('HAHAHAHA!!', 1200, 200, seg(t, tEsp + 0.15, tEsp + 0.3), 120, 6, '#FF6FB5');
  return o;
}

// ------------- Pickle at the gates
function outsideGate(t, cam, dusk = 0) {
  let o = S1.goldenSky(t) + S.rect(-800, -800, 3520, 2680, 0, { fill: '#2A1A5A', opacity: f(0.45 * dusk) });
  let w = S.g(S1.villa(t), 'translate(0 -40)') + S.rect(-1400, 700, 4800, 120, 0, { fill: '#5FAF52' });
  // party glow in the windows
  for (let i = 0; i < 5; i++) w += S.rect(430 + i * 220, 480, 170, 200, 10, { fill: ['#FF6FB5', '#5CF2FF', '#FFE14D'][(i + Math.floor(t * 4)) % 3], opacity: 0.35 });
  w += gates(900, 420, 0);
  w += S.rect(-1400, 900, 4800, 600, 0, { fill: '#B9B3C8' }) + S.rect(-1400, 900, 4800, 18, 0, { fill: '#9A94AA' });
  return o + view(cam, w, 1);
}
function handCard(x, y, s = 1, rot = 0) {
  // Pickle's handmade card: crayon Ty + Pickle holding hands, a heart
  let o = S.rect(-150, -110, 300, 220, 10, ol('#FFF6D8', 6)) + S.path('M-150 -110 L-130 -90', ln(4, '#D9C28A'));
  o += S.circle(-60, -30, 22, { fill: 'none', stroke: '#1FB5A8', 'stroke-width': 6 }) + S.path('M-60 -8 L-60 40 M-60 40 L-80 76 M-60 40 L-40 76 M-90 10 L-30 10', ln(6, '#F2B53A'));
  o += S.circle(50, -30, 22, { fill: 'none', stroke: '#FF8A2B', 'stroke-width': 6 }) + S.path('M50 -8 L50 40 M50 40 L30 76 M50 40 L70 76 M20 10 L80 10', ln(6, '#58B947'));
  o += S.path(K.F.heartPath(-5, -70, 16), ol('#FF5A7A', 4)) + TF('BEST BUDS', 0, 100, 30, '#E2233B');
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})`);
}
function shotPickleGate(t) {
  // Pickle came too (with a handmade card); then Jeeves and the VIP list
  const list = t >= tList;
  const cam = list ? camKeys(t, [[tList, { zoom: 1.15, x: 0, y: 40 }], [tVip, { zoom: 1.2, x: 0, y: 60 }], [tDeny, { zoom: 1.25, x: 0, y: 80 }]]) : camKeys(t, [[tPk, { zoom: 1.35, x: -360, y: 80 }], [tList, { zoom: 1.45, x: -360, y: 100 }]]);
  let o = outsideGate(t, cam, 0.2);
  let w = '';
  // Jeeves behind the bars with his clipboard; on "VIP" the list unrolls down to the ground and rolls out to Pickle's feet
  let listRoll = '';
  if (list) {
    const [hx, hy] = A.hand(60, -1);
    w += actor('butler', t, { x: 1300, y: 900, s: 0.5, armL: 60, armR: 40, turn: -0.3, props: [{ svg: S.g(S.rect(-80, -110, 160, 220, 12, ol('#8A5A34', 6)) + S.rect(-64, -90, 128, 180, 6, ol('#FFFFFF', 4)) + TF('VIP', 0, -50, 36, '#E2B33C'), `translate(${f(hx)} ${f(hy - 40)})`), layer: 'front' }] });
    const down = ease.in(seg(t, tVip - 0.05, tVip + 0.3)), across = ease.out(seg(t, tVip + 0.3, tVip + 0.9));
    if (down > 0) {
      const lx = 1300 + hx * 0.51, ly = 900 + (hy + 40) * 0.51, gy = 990;
      const vy = lerp(ly, gy, down), ex = lerp(lx, 700, across);
      listRoll += S.rect(lx - 44, ly, 88, vy - ly, 3, ol('#FFFFFF', 4));
      for (let y = ly + 18; y < vy - 8; y += 22) listRoll += S.path(`M${f(lx - 30)} ${f(y)} L${f(lx + (Math.round(y) % 3 ? 26 : 6))} ${f(y)}`, ln(3, '#9AA0AE'));
      if (across > 0) listRoll += S.rect(ex, gy - 10, lx - ex, 34, 3, ol('#FFFFFF', 4));
      listRoll += S.circle(ex, gy + 6, 26, ol('#FFFFFF', 5)) + S.circle(ex, gy + 6, 10, { fill: '#D9DEE8' });
    }
  }
  w += gates(900, 420, 0) + listRoll;
  // Pickle outside, hopeful, holding up his card
  const [hx, hy] = A.hand(120, 1);
  w += actor('pickle', t, { x: 600, y: 1000, s: 0.52, turn: 0.35, armR: 120, armL: 30, face: list && t > tVip ? { name: 'confused', eyes: { look: [0.8, -0.4] } } : { name: 'happy', fx: ['blush'] }, lift: list ? 0 : 10 * Math.abs(Math.sin(t * 5)), props: [{ svg: handCard(hx + 40, hy - 60, 1.1, 8), layer: 'front' }] }, list ? { arms: false } : { arms: false });
  o += view(cam, w, 1);
  return o;
}
function shotDenied(t) {
  const cam = camKeys(t, [[tDeny, { zoom: 1.25, x: 0, y: 40 }], [tMin, { zoom: 1.32, x: 0, y: 30 }], [tSir, { zoom: 1.45, x: -120, y: 40 }], [tWait, { zoom: 1.5, x: -130, y: 40 }]]);
  const sh = K.shake(t, tSir, 0.35, 12); cam.sx = sh.sx; cam.sy = sh.sy;
  let o = outsideGate(t, cam, 0.35);
  let w = '';
  // Jeeves scans Pickle: red eyes, red beam, the balance check fails
  const red = S.rect(-80, -790, 60, 60, 10, { fill: '#FF4D6D' }) + S.rect(20, -790, 60, 60, 10, { fill: '#FF4D6D' });
  w += actor('butler', t, { x: 1300, y: 900, s: 0.5, turn: -0.3, armL: 90, armR: 15, props: [headProp(red, {})] });
  const beam = bump(t, tDeny + 0.1, tMin);
  if (beam > 0) w += S.path(`M${1300 - 0.51 * 350} ${900 - 0.51 * 515} L600 ${f(560 + 300 * Math.sin((t - tDeny) * 5))} L600 ${f(600 + 300 * Math.sin((t - tDeny) * 5))} Z`, { fill: '#FF3B5C', opacity: f(0.45 * beam) });
  w += gates(900, 420, 0);
  const [hx, hy] = A.hand(40, 1);
  w += actor('pickle', t, { x: 600, y: 1000, s: 0.52, turn: 0.35, armR: 40, armL: 20, face: t > tSir ? { name: 'sad' } : { name: 'nervous', eyes: { look: [0.8, -0.3] } }, props: [{ svg: handCard(hx + 20, hy, 0.9, -10), layer: 'front' }] }, { arms: false });
  o += view(cam, w, 1);
  // hologram readout
  const k = ease.outBack(seg(t, l11.word('Robux').t0, l11.word('Robux').t0 + 0.3));
  if (k > 0) {
    let h = S.rect(-300, -150, 600, 300, 26, { fill: '#10162A', opacity: 0.9, stroke: '#FF3B5C', 'stroke-width': 8 });
    h += TF('BALANCE', -140, -80, 34, '#9AA0AE') + K.robuxText(-140, 0, '12', 70, '#FFFFFF') + TF('MINIMUM', 140, -80, 34, '#9AA0AE') + K.robuxText(140, 0, '10K', 64, '#FFE14D');
    h += S.path('M0 -110 L0 40', ln(4, '#FF3B5C', 0.6)) + T(t > tMin ? '✖ DENIED' : '...', 0, 110, 60, '#FF3B5C');
    o += S.g(h, `translate(1460 260) scale(${f(k * 0.85)})`);
  }
  o += stamp30(560, 260, seg(t, tSir, tSir + 0.15), 0.9, -10, 'DENIED');
  return o;
}
function shotWaiting(t) {
  // through the bars from inside: Pickle sits on the curb. Slow push-in. Dusk.
  const cam = camKeys(t, [[tWait, { zoom: 1.05, x: 0, y: 30 }], [tWin, { zoom: 1.32, x: 0, y: 60 }]], ease.linear);
  const dusk = seg(t, tWait, tWin);
  let o = S1.goldenSky(t) + S.rect(-800, -800, 3520, 2680, 0, { fill: '#241650', opacity: f(0.35 + 0.35 * dusk) });
  let w = S.rect(-800, 760, 3520, 600, 0, { fill: '#8A84A0' }) + S.rect(-800, 760, 3520, 16, 0, { fill: '#6E6888' });
  w += S.rect(-800, 690, 3520, 70, 0, { fill: '#A9A3BC' });
  for (let i = 0; i < 3; i++) w += S1.palm(300 + i * 700, 690, 0.7, t);
  // Pickle: stands, then sits down on the curb, card on his lap
  const sit = ease.inOut(seg(t, tSit - 0.3, tSit + 0.4));
  const faceP = t < tOkay - 0.2 ? { name: 'sad', mouth: 'O' } : t < tSit ? { name: 'sad', mouth: 'smallSmile' } : { name: 'sad' };
  const [hx, hy] = A.hand(30, 1);
  w += actor('pickle', t, { x: 960, y: 920, s: 0.72, bodyY: 150 * sit, armL: 20 + 10 * sit, armR: 30, face: faceP, headRot: -5 * sit, props: [{ svg: handCard(hx - 120, hy + 30, 0.7, -6), layer: 'front' }] }, { arms: false, energy: 0.3 });
  // a lonely leaf drifting
  const lf = (t - tWait) * 0.25 % 1;
  w += S.g(S.path('M0 0 Q20 -16 40 0 Q20 16 0 0 Z', ol('#E8A23A', 3)), `translate(${f(1300 - lf * 500)} ${f(200 + lf * 600)}) rotate(${f(t * 60)})`);
  o += view(cam, w, 1);
  // the gate bars in the foreground (dark), with party light flickering on them
  const flick = 0.5 + 0.5 * Math.sin(t * 9);
  for (const x of [-60, 300, 640, 1280, 1620, 1980]) o += S.rect(x - 34, -60, 68, 1200, 12, { fill: '#2A1F3E' }) + S.rect(x + 14, -60, 12, 1200, 0, { fill: ['#FF6FB5', '#5CF2FF', '#FFE14D'][Math.floor(t * 3 + x) % 3], opacity: f(0.35 * flick) });
  o += S.rect(-20, 60, 1960, 50, 10, { fill: '#2A1F3E' }) + S.rect(-20, 940, 1960, 50, 10, { fill: '#2A1F3E' });
  o += C.musicNotes(t, 120, 860);
  return o;
}
function shotWindow(t) {
  // Ty at the window, guilty; "I didn't." — pulled back into the party, curtain swings shut
  const tD = l13.word("didn't").t0;
  const cam = camKeys(t, [[tWin, { zoom: 1.2, x: 0, y: 40 }], [tD, { zoom: 1.35, x: 0, y: 60 }]]);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#3A2A5A' }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#s04brick)' });
  let w = '';
  // inside the window: party lights
  let inside = S.rect(520, 120, 880, 760, 0, { fill: '#5A2E8A' });
  for (let i = 0; i < 5; i++) inside += S.circle(620 + i * 170, 300 + (i % 2) * 120, 120, { fill: ['#FF6FB5', '#5CF2FF', '#FFE14D'][(i + Math.floor(t * 3)) % 3], opacity: 0.25 });
  for (let i = 0; i < 4; i++) inside += kidIn((i * 3 + 2) % 19, t, { x: 640 + i * 220, y: 1040 - Math.abs(Math.sin(t * 7 + i)) * 16, s: 0.34, armL: 140, armR: 150, face: { name: 'joy' }, volume: false });
  const pull = ease.in(seg(t, tD + 0.15, tD + 0.55));
  inside += ty(t, lerp(900, 1500, pull), 1120, 0.6, { turn: -0.6, face: { name: 'sad', eyes: { look: [-0.9, 0.2] } }, armL: 20 + 60 * pull, armR: 10, rot: 10 * pull }, { arms: false, energy: 0.4 });
  // a party-hat kid's arm yanking him
  if (pull > 0) inside += S.g(S.rect(0, -30, 400, 60, 20, ol('#FF6FB5', 6)) + S.rect(-60, -40, 80, 80, 20, ol('#F2C9A0', 6)), `translate(${f(lerp(1500, 1360, pull))} 640)`);
  const id = S.uid('s05w');
  w += S.clipDef(id, S.rect(520, 120, 880, 760, 0)) + S.g(inside, null, { 'clip-path': `url(#${id})` });
  // curtain swings closed
  const cur = ease.inOut(seg(t, tD + 0.45, tD + 0.9));
  w += S.path(`M520 110 L${f(560 + 840 * cur)} 110 Q${f(520 + 860 * cur)} 500 ${f(560 + 840 * cur)} 890 L520 890 Z`, ol('#C8102E', 8));
  w += S.rect(500, 100, 920, 800, 10, { fill: 'none', stroke: '#E9DFD2', 'stroke-width': 40 }) + S.path('M960 120 L960 880 M520 500 L1400 500', ln(12, '#E9DFD2'));
  w += S.rect(470, 880, 980, 50, 10, ol('#E9DFD2', 7));
  w += S.rect(520, 120, 880, 760, 0, { fill: '#BFE6FF', opacity: 0.12 });
  o += view(cam, w, 1);
  return o;
}

// ------------- the Thirty Percent Guy grows
function shotGrow(t) {
  const cam = camKeys(t, [[tGrow, { zoom: 1.0, x: 0, y: 0 }], [tChart, { zoom: 1.1, x: 0, y: 30 }]]);
  let w = rayStage(t, '#2E7BFF', '#5C9BFF', 960, 560);
  const ITEMS = [[tG1, 'GOLD JET SKI'], [tG2, 'GOLD TRAMPOLINE'], [tG3, 'GOLD RUBBER DUCK']];
  w += ty(t, 760, 1020, 0.6, { armL: 150, armR: 150, face: { name: 'rich' }, lift: 30 * Math.max(...ITEMS.map(([ti]) => bump(t, ti, ti + 0.35))) }, { arms: false });
  ITEMS.forEach(([ti, txt], i) => {
    const k = seg(t, ti, ti + 0.2) * (1 - seg(t, (ITEMS[i + 1] || [tChart])[0] - 0.05, (ITEMS[i + 1] || [tChart])[0] + 0.05));
    w += purchased(960, 220 + i * 0, k, 1.2, txt);
  });
  const s = thirtyS(t, 0.6);
  const sq = Math.max(...ITEMS.map(([ti]) => bump(t, ti + 0.05, ti + 0.3)));
  w += thirty(t, 1240, 1020, s, { armL: 120, armR: 60, face: { name: 'joy' }, sy: 1 + 0.2 * sq, sx: 1 - 0.1 * sq, turn: -0.3 }, { coins: 3 });
  ITEMS.forEach(([ti]) => { const a = seg(t, ti + 0.05, ti + 0.5); if (a > 0 && a < 1) w += C.burst(1240, 1020 - 0.7 * 980 * s * 0.6, a, '#7CFF6B') + mark('+', 1340, 1020 - 0.7 * 980 * s - 40 * a, 1 - a, 90, 0, '#7CFF6B'); });
  let o = view(cam, w, 1);
  ITEMS.forEach(([ti], i) => { o += kaching([520, 1500, 960][i], [420, 460, 600][i], t - ti, 0.7); });
  return o;
}
function shotChart(t) {
  // a growth chart on the hall door frame: his height marks, labelled with Ty's purchases; Ty stands beside for scale
  const cam = camKeys(t, [[tChart, { zoom: 1.08, x: 60, y: 50 }], [tBigger - 0.05, { zoom: 1.12, x: 60, y: 60 }], [tBigger + 0.2, { zoom: 1.2, x: 40, y: 80 }], [tBurp0, { zoom: 1.22, x: 40, y: 80 }]]);
  const sh = K.shake(t, tBigger, 0.4, 12); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = hall(t, { noChandelier: true });
  const fx = 820, base = 1060, tyS = 0.9;
  w += S.rect(fx - 40, 100, 560, 980, 10, ol('#F6EFE3', 10)) + S.rect(fx + 10, 140, 460, 940, 0, { fill: '#8A5A34' }) + S.rect(fx + 10, 140, 460, 940, 0, { fill: 'url(#planks)', opacity: 0.5 }) + S.circle(fx + 420, 640, 16, ol('#FFC93C', 5));
  const MARKS = [[0.25, 'DAY 1'], [0.3, 'LIMO'], [0.35, '400 PIZZAS'], [0.41, 'THIS MORNING'], [0.47, 'NOW?!']];
  MARKS.forEach(([h, txt], i) => {
    const y = base - h * 980 * tyS;
    const show = i < 4 || t > tBigger + 0.25;
    if (show) w += S.path(`M${fx - 40} ${f(y)} L${fx + 40} ${f(y)}`, ln(7, i === 4 ? '#E2233B' : '#2A1640')) + S.el('text', { x: fx - 56, y: f(y + 12), 'font-family': 'Fredoka, sans-serif', 'font-weight': 700, 'font-size': 34, fill: i === 4 ? '#E2233B' : '#2A1640', 'text-anchor': 'end', stroke: '#FFF4E0', 'stroke-width': 8, 'paint-order': 'stroke' }, txt);
  });
  // him, against the frame
  const s = thirtyS(t, tyS);
  const sq = Math.max(bump(t, tBigger, tBigger + 0.4), 0.5 * bump(t, l14.word('got').t0, l14.word('got').t0 + 0.3), 0.5 * bump(t, l14.word('little').t0, l14.word('little').t0 + 0.3));
  w += thirty(t, fx + 140, base, s, { armL: 20, armR: 40, face: t > tBigger ? { name: 'smug' } : { name: 'happy' }, sy: 1 + 0.25 * sq, sx: 1 - 0.1 * sq, turn: 0.2 }, { calc: true });
  if (t > tBigger + 0.1) w += S.path(`M${fx - 40} ${f(base - 0.7 * 980 * s)} L${fx + 240} ${f(base - 0.7 * 980 * s)}`, ln(6, '#E2233B', 0.8));
  // Ty, getting nervous
  w += ty(t, fx + 680, base, tyS, { turn: -0.5, face: t > tBigger ? { name: 'shocked' } : { name: 'nervous', eyes: { look: [-0.8, 0.5] } }, armL: t > tBigger ? 120 : 20, armR: t > tBigger ? 120 : 20, lean: t > tBigger ? 4 : 0 }, { arms: false });
  let o = view(cam, w, 1);
  o += bang('BIGGER?!', 520, 180, seg(t, tBigger + 0.1, tBigger + 0.25), 110, -8, '#FF5A5A');
  return o;
}
function shotBurp(t) {
  // waist-high now: Marketplace fee! *BURP* Thirty percent!
  const cam = camKeys(t, [[tBurp0, { zoom: 1.0, x: 0, y: 60 }], [tBurp, { zoom: 1.03, x: 0, y: 60 }], [tBurp + 0.1, { zoom: 1.16, x: 40, y: 80 }], [t30, { zoom: 1.12, x: 30, y: 80 }], [END, { zoom: 1.2, x: 30, y: 90 }]]);
  const sh = K.shake(t, tBurp, 0.5, 20); cam.sx = sh.sx; cam.sy = sh.sy;
  let w = hall(t);
  const tyS = 0.8, s = thirtyS(t, tyS), base = 1000;
  const blown = bump(t, tBurp + 0.05, tBurp + 0.8);
  // the coin sack moves from Ty's hand to his
  const yank = ease.out(seg(t, tFee - 0.15, tFee + 0.2));
  const [tx, tyy] = A.hand(55, 1), [gx, gy] = A.hand(65, -1);
  const sackX = lerp(640 + tx * tyS, 1240 + gx * s * 0.7, yank), sackY = lerp(base + tyy * tyS + 70, base + gy * s * 0.7 + 60, yank);
  const sack = S.path('M-70 0 Q-90 -110 -30 -130 L30 -130 Q90 -110 70 0 Z', ol('#C9945A', 6)) + K.coin(0, -60, 34, 0, 0) + S.path('M-30 -130 L30 -130', ln(10, '#8A5A34'));
  w += ty(t, 640, base, tyS, { turn: 0.4, lean: -10 * blown, face: blown > 0.1 ? { name: 'oof', mouth: 'O' } : t > tFee ? { name: 'shocked' } : { name: 'nervous' }, armL: 20, armR: 55, headRot: -8 * blown }, { arms: false });
  w += thirty(t, 1240, base, s, { turn: -0.35, armL: 65, armR: 50, face: blown > 0.2 ? { name: 'joy', mouth: 'O' } : { name: 'smug' }, sy: 1 + 0.12 * blown, lean: -6 * blown }, { calc: true });
  w += S.g(sack, `translate(${f(sackX)} ${f(sackY)}) scale(${f(lerp(0.75, 0.9, yank))})`);
  // the burp: a green gust rolling over Ty
  if (blown > 0) {
    const a = t - tBurp;
    for (let i = 0; i < 6; i++) w += S.circle(1180 - a * 700 - i * 50, 720 + Math.sin(i * 2 + a * 6) * 30, (30 + 20 * i) * Math.min(1, a * 3), { fill: '#B6F06B', opacity: f(0.55 * blown), stroke: '#151515', 'stroke-width': 4 });
    for (let i = 0; i < 6; i++) w += S.rect(520 + hash(i) * 300 - a * 700 * hash(i * 2), 520 + i * 40, 160, 10, 5, { fill: '#B6F06B', opacity: f(0.8 * blown) });
  }
  let o = view(cam, w, 1);
  o += bang('*BURP!*', 1300, 240, seg(t, tBurp, tBurp + 0.12) * (1 - seg(t, tBurp + 0.9, tBurp + 1.1)), 140, 8, '#B6F06B');
  o += stamp30(1500, 500, seg(t, tPct, tPct + 0.15), 1.1);
  o += C.whiteFlash(seg(t, END - 0.16, END));
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [T0, shotResponsible], [tBuyAll, shotBuyAll], [tHov, shotHoverboard], [tSnk, shotSneakers], [tBr, shotToothbrush], [tLimo, shotLimo], [tBot, shotButler],
  [tCer, shotCereal], [tMan, shotMansion], [tObby, shotObby], [tStat, shotStatue], [tPiz, shotPizza], [tLine, shotLine], [tGate, shotGates], [tNever, shotNever],
  [tSchool, shotSchools], [tCousin, shotCousin], [tJoke, shotJokes], [tPk, shotPickleGate], [tDeny, shotDenied], [tWait, shotWaiting], [tWin, shotWindow],
  [tGrow, shotGrow], [tChart, shotChart], [tBurp0, shotBurp],
];
const FLASH = [tBuyAll, tHov, tSnk, tBr, tLimo, tBot, tCer, tMan, tObby, tStat, tPiz, tLine, tGate, tNever, tSchool, tCousin, tJoke, tGrow, tChart, tBurp0];
function scene(t) {
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  let o = SHOTS[i][1](t);
  for (const tc of FLASH) if (Math.abs(t - tc) < 0.12) o += whip(t, tc, 0.6);
  o += C.whiteFlash(0.7 * (1 - seg(t, T0, T0 + 0.18)));
  return o;
}
function look(t) {
  if (t >= tWait && t < tWin) return { grade: 'cool', vignette: 1 };
  if (t >= tJoke && t < tPk) return { grade: 'warm', vignette: 1 };
  return { grade: 'warm', vignette: 0.7 };
}
module.exports = { scene, look };
