// SC 10 · BANK OBBY — inside the Central Bank of Robux: one giant vertical obby. Coin avalanches, price-tag floors that
// go UP while you stand on them, laser scanners that charge a viewing fee ("Fee: one hat" — NOT THE BERET!), a wall of
// bills, a DEBT conveyor, Mia buried in coins ("...Thanks"), hundreds of tiny interns ("Fee! Fee!"), and at the top the
// Robux Printer guarded by a GIANT coin-and-calculator Thirty Percent Guy — beaten by 12 × 30% = 3.6.
'use strict';

const K = require('./kit');
const { S, f, clamp, lerp, ease, seg, bump, hash, ol, ln, T, TF, camKeys, view, actor, coin } = K;
const { L } = K.V;
const C = K.C;
const A = require('./acting');
const E = require('./s10_env');
const { who, beret, ZS, towerArt, minivan, streamRig } = require('./s09');

const START = K.V.scene('SC 10').start, END = K.V.scene('SC 11').start;
const m = (i) => L('10.' + i);
const M = Array.from({ length: 22 }, (_, i) => m(i));

// ---------------------------------------------------------------- beats (all from the voice)
const tObby = M[0].word('obby').t0;
const d1 = M[0].word('was').t0 - 0.1, d2 = M[1].a - 0.1;
const tAval = M[1].word('avalanches').t0;
const d3 = M[1].word('Floors').t0 - 0.1, tUp = M[1].word('UP').t0, d4 = tUp - 0.15, tStood = M[1].word('stood').t0;
const d5 = M[1].word('Laser').t0 - 0.12, tFee1 = M[1].word('fee').t0, d6 = M[1].word('just').t0 - 0.08, tLooking = M[1].word('LOOKING').t0;
const d7 = M[2].a - 0.1, tComplete = M[2].word('complete').t0, tFeeHat = M[2].word('Fee').t0, tHat = M[2].word('hat').t0;
const d8 = M[3].a - 0.08, tBeret = M[3].word('BERET').t0;
const d9 = M[4].a - 0.05, tBills = M[4].word('bills').t0;
const d10 = M[4].word('A', 1).t0 - 0.1, tDebt = M[4].word('debt').t0;
const d11 = M[4].word('And').t0 - 0.1, tCoinA = M[4].word('avalanche').t0, tTop = M[4].word('top').t0, tOf = M[4].word('of', 2).t0;
const d12 = M[5].a - 0.05, tGrab = M[5].word('Grab').t0, tHand = M[5].word('hand').t0;
const d13 = tHand - 0.05, tClasp = tHand + 0.15, d14 = d13 + 0.9;
const d15 = M[6].a - 0.1, tDont = M[6].word("Don't").t0;
const d16 = M[7].a - 0.1, tInterns = M[7].word('interns').t0;
const d17 = M[7].word('Hundreds').t0 - 0.1, tTiny = M[7].word('tiny').t0;
const d18 = M[8].a - 0.08, FEES = [0, 1, 2, 3, 4].map((i) => M[8].word('Fee', i).t0);
const d19 = M[9].a - 0.08, d20 = M[9].word('my').t0 - 0.1, tSock = M[9].word('SOCK').t0;
const d21 = M[10].a - 0.1, tVeryTop = M[10].word('top').t0, tPrinter = M[10].word('Printer').t0;
const d22 = M[10].word('And').t0 - 0.1, tGuard = M[10].word('guarding').t0;
const d23 = M[11].a - 0.05, tCoin = M[11].word('coin').t0, tTrade = M[11].word('trade').t0;
const d24 = M[11].word('Every', 2).t0 - 0.1, tSandwich = M[11].word('SANDWICH').t0;
const d25 = M[11].word('Thirty').t0 - 0.1, tMe = M[11].word('ME').t0;
const d26 = M[12].a - 0.1, tBig = M[12].word('big').t0;
const d27 = M[13].a - 0.05, tWait = M[13].word('Wait').t0, tIdea = M[13].word('idea').t0;
const d28 = M[14].a - 0.05, tHey = M[14].a;
const d29 = M[14].word('For').t0 - 0.1, tTwelve = M[14].word('twelve').t0;
const d30 = M[15].a - 0.05, tPurchase = M[15].word('purchase').t0, tMarket = M[15].word('Marketplace').t0, tFeeM = M[15].word('fee').t0;
const d31 = M[15].word('Thirty').t0 - 0.12, tK30 = M[15].word('Thirty').t0, tKof = M[15].word('of').t0, tK12 = M[15].word('twelve').t0, tKis = M[15].word('is').t0;
const d32 = M[16].a - 0.05, tThree = M[16].word('Three').t0, tPoint = M[16].word('point').t0, tSix = M[16].word('six').t0;
const d33 = M[17].a - 0.05, tSix2 = M[17].word('SIX').t0, tDecimals = M[17].word('DECIMALS').t0;
const d34 = M[18].a - 0.05, tCompute2 = M[18].word('COMPUTE', 1).t0;
const tBoom = M[18].b + 0.05;
const d35 = M[19].a, tMath = M[19].word('MATH').t0;
const d36 = M[20].a - 0.08, tMathC = M[20].word('math').t0;
const d37 = M[21].a - 0.3, tBurn = M[21].a;

const hasBeret = (t) => t < tHat + 0.12;

// ---------------------------------------------------------------- helpers
const rotAll = (svg, deg, cx = 960, cy = 540) => (Math.abs(deg) > 0.01 ? S.g(svg, `rotate(${f(deg)} ${cx} ${cy})`) : svg);
const shook = (cam, t, a, dur, amp) => { const s = K.shake(t, a, dur, amp); cam.sx = (cam.sx || 0) + s.sx; cam.sy = (cam.sy || 0) + s.sy; return cam; };
const whiteAt = (t, tc, k = 0.6) => C.whiteFlash(k * bump(t, tc - 0.04, tc + 0.1));
// side-view runner facing right
function runner(name, t, x, y, s, o = {}) {
  const r = A.run(o.ph ?? t * 15 + name.length, o.amp ?? 1);
  const head = name === 'mia' && hasBeret(t) ? [beret('side', 0)] : [];
  return who(name, t, { x, y, s, view: 'side', flip: true, ...r, lean: 8, shadow: true, ...(o.pose || {}) }, { arms: false, ...(o.act || {}) }, head);
}
// front-view "running at the camera"
const runFront = (ph, a = 1) => ({ armL: 30 + 50 * Math.max(0, Math.sin(ph)) * a, armR: 30 + 50 * Math.max(0, -Math.sin(ph)) * a, legL: 6 * Math.sin(ph), legR: -6 * Math.sin(ph), bodyY: 14 * Math.abs(Math.sin(ph)) * a, lift: 18 * Math.abs(Math.cos(ph)) * a });
const front = (name, t, pose, act = {}, extra = []) => who(name, t, { shadow: true, ...pose }, act, name === 'mia' && hasBeret(t) ? [beret('front', 0), ...extra] : extra);
// obby stage HUD (top-left)
function stageHud(t, n, tc, label) {
  const k = 1 + 0.25 * bump(t, tc, tc + 0.35);
  let o = S.rect(0, 0, 330, 76, 38, { fill: '#06222A', opacity: 0.8, stroke: E.GOLD, 'stroke-width': 5 });
  o += S.path('M34 60 L34 16 L74 26 L34 36', { ...ol('#3BD16F', 4) }) + TF(label || `STAGE ${n}`, 200, 52, 40, '#FFFFFF');
  return S.g(o, `translate(60 50) scale(${f(k)})`);
}
// Mia's beret alone (screen space), front style
const beretAt = (x, y, sc, rotd = 0) => S.g(beret('front', 0), `translate(${f(x)} ${f(y)}) rotate(${f(rotd)}) scale(${f(sc)}) translate(4 958)`);
// the claw
function claw(x, y, grip, t) {
  let o = S.path(`M${f(x)} ${f(y - 1400)} L${f(x)} ${f(y - 70)}`, ln(26, '#151515')) + S.path(`M${f(x)} ${f(y - 1400)} L${f(x)} ${f(y - 70)}`, ln(14, '#9AA0AE'));
  o += S.rect(x - 60, y - 110, 120, 70, 16, ol('#C9D1DC', 6)) + S.circle(x, y - 75, 14, { fill: '#FF2D55' });
  const a = lerp(38, 12, grip);
  for (const sd of [-1, 1]) o += S.g(S.path('M0 0 L0 90 Q0 130 -40 140', ln(26, '#151515')) + S.path('M0 0 L0 90 Q0 130 -40 140', ln(14, '#C9D1DC')), `translate(${f(x + sd * 40)} ${f(y - 50)}) scale(${-sd} 1) rotate(${f(-a)})`);
  return o;
}
// error window
function errBox(x, y, s, txt, k) {
  if (k <= 0) return '';
  let o = S.rect(-210, -80, 420, 160, 10, ol('#E9EEF6', 6)) + S.rect(-210, -80, 420, 44, 10, { fill: '#2E5BD8', stroke: '#151515', 'stroke-width': 6 });
  o += TF('ERROR', -150, -48, 26, '#FFFFFF', { 'text-anchor': 'start' }) + S.rect(170, -72, 28, 28, 4, ol('#FF4D4D', 3)) + S.circle(-160, 26, 24, ol('#FFD21F', 4)) + T('!', -160, 40, 36, '#151515');
  o += TF(txt, 30, 36, txt.length > 14 ? 26 : 32, '#151515');
  return S.g(o, `translate(${f(x)} ${f(y)}) scale(${f(s * ease.outBack(clamp(k, 0, 1)))})`);
}
// big blocky hand (screen space): sleeve colour, cuff, skin; pointing along +x, rotated
function bigArm(x, y, len, rotd, sleeve, cuff, skin, grip = 0) {
  let o = S.rect(-len, -70, len, 140, 30, ol(sleeve, 9)) + S.rect(-90, -76, 50, 152, 14, ol(cuff, 8));
  o += S.rect(-44, -66, 150 - grip * 30, 132, 34, ol(skin, 9));
  o += S.path(`M${f(60 - grip * 20)} -40 L${f(100 - grip * 30)} -40 M${f(60 - grip * 20)} 0 L${f(100 - grip * 30)} 0 M${f(60 - grip * 20)} 40 L${f(100 - grip * 30)} 40`, ln(6, '#0003'));
  return S.g(o, `translate(${f(x)} ${f(y)}) rotate(${f(rotd)})`);
}
// the 0.6 coin: 60% of a disc
function partCoin(x, y, r, rotd, frac = 0.6) {
  const id = S.uid('s10pc');
  const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * frac;
  const R = r * 1.3;
  const d = `M0 0 L${f(Math.cos(a0) * R)} ${f(Math.sin(a0) * R)} A${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${f(Math.cos(a1) * R)} ${f(Math.sin(a1) * R)} Z`;
  const edge = `M${f(Math.cos(a0) * r)} ${f(Math.sin(a0) * r)} L0 0 L${f(Math.cos(a1) * r)} ${f(Math.sin(a1) * r)}`;
  return S.g(S.clipDef(id, S.path(d)) + S.g(coin(0, 0, r, 0, 0), null, { 'clip-path': `url(#${id})` }) + S.path(edge, ln(r * 0.12)), `translate(${f(x)} ${f(y)}) rotate(${f(rotd)})`);
}

// ---------------------------------------------------------------- B0: outside — Grandma's distraction, the trio sneaks in
function shotOutside(t) {
  const cam = camKeys(t, [[START, { zoom: 1.0, x: 0, y: -20 }], [d1 - 0.45, { zoom: 1.2, x: 0, y: 160 }], [d1, { zoom: 2.8, x: 0, y: 370 }]], ease.in);
  let sky = S.rect(-400, -400, 2800, 1900, 0, { fill: 'url(#s09skyClear)' });
  for (let i = 0; i < 18; i++) sky += K.F.sparkle(hash(i * 3 + 1) * 1920, hash(i * 7 + 2) * 420, 6 + 6 * Math.abs(Math.sin(t * 3 + i)));
  sky += S.circle(1650, 160, 70, { fill: '#FFF6D8' });
  let w = S.circle(960, 520, 520, { fill: 'url(#s10glow)', opacity: 0.55 });
  w += S.g(towerArt(t, 'gold', 1.2), 'translate(960 1000) scale(0.74)');
  w += S.rect(936, 862, 48, 92, 8, ol('#FFE98A', 5)) + S.rect(942, 870, 36, 82, 5, { fill: '#FFF6C8' });
  w += S.rect(-400, 1000, 2800, 300, 0, { fill: '#2A2050' }) + S.rect(-400, 1000, 2800, 10, 0, { fill: '#4A3F7A' });
  // the distraction: Grandma live with fans
  w += minivan(1560, 1060, 0.62, t, '', 0, 0.6);
  const gH = A.hand(150, 1);
  w += who('grandma', t, { x: 360, y: 1050, s: 0.36, turn: 0.4, armR: 150, armL: 60 + 30 * Math.sin(t * 8), face: 'excited', props: [{ svg: S.g(streamRig(t, true), `translate(${f(gH[0])} ${f(gH[1])}) rotate(16)`), layer: 'front' }] }, { energy: 1.5 });
  for (let i = 0; i < 3; i++) w += K.draw.kid(i + 3, { x: 150 + i * 120 + (i === 1 ? 300 : 0), y: 1075 + (i % 2) * 15, s: 0.3, armR: 120 + 30 * Math.sin(t * 9 + i), armL: 20, face: i % 2 ? 'joy' : 'excited', shadow: false });
  w += TF('♥', 260, 640 - ((t * 120) % 200), 48, '#FF6FB5') + TF('♥', 470, 600 - ((t * 120 + 90) % 200), 40, '#FF6FB5');
  // the trio tiptoes to the door
  const u = seg(t, START, d1 - 0.2);
  ['ty', 'mia', 'pickle'].forEach((n, i) => {
    const x = lerp(660 - i * 70, 900 - i * 70, u);
    const wk = A.walk(t * 10 + i, 0.6);
    w += who(n, t, { x, y: 1040, s: 0.27, view: 'side', flip: true, ...wk, lean: 18, bodyY: 20, armL: 70, armR: 50, face: 'sneaky' }, { arms: false }, n === 'mia' ? [beret('side', 0)] : []);
  });
  let o = view(cam, sky, 0.3) + view(cam, w, 1);
  o += view(cam, TF('sneak... sneak...', 780, 900, 30, '#FFFFFF', { opacity: f(bump(t, START, d1)) }), 1);
  o += C.whiteFlash(0.6 * (1 - seg(t, START, START + 0.25)));
  return o;
}

// ---------------------------------------------------------------- B1: inside — tilt up the whole vertical obby
const PLAT = [[230, 700, 440, 'tags'], [1250, 430, 430, 'aval'], [260, 160, 460, 'laser'], [1200, -110, 440, 'bills'], [230, -380, 480, 'debt'], [1150, -650, 470, 'vents'], [300, -920, 440, 'tags'], [1180, -1190, 450, 'aval']];
function obbyColumn(t) {
  let o = '';
  o += E.coinPipe([[90, 1200], [90, -2600]], t, 70, -900, 1) + E.coinPipe([[1830, 1200], [1830, -2600]], t, 70, -900, 2);
  for (const [x, y, w, kind] of PLAT) {
    o += E.platform(x, y, w);
    if (kind === 'tags') for (let i = 0; i < 2; i++) o += E.priceTile(x + 10 + i * 220, y - 70, 200, ['50', '5,000'][i], i, 0, t);
    if (kind === 'aval') { o += S.g(E.coinMound(160, 90, t), `translate(${x + w - 140} ${y + 4})`); for (let i = 0; i < 4; i++) o += coin(x + w - 220 - ((t * 300 + i * 90) % 360), y - 30, 26, i * 50, t * 9 + i); }
    if (kind === 'laser') { o += E.laser(x - 40, y - 150, x + w + 60, y - 60) + E.laser(x - 40, y - 40, x + w + 60, y - 160) + E.scanner(x - 50, y - 190, 0.4, t); }
    if (kind === 'bills') for (let i = 0; i < 6; i++) o += E.bill(x + 60 + (i % 3) * 150, y - 90 - Math.floor(i / 3) * 170, 0.7, (hash(i) - 0.5) * 16, i);
    if (kind === 'debt') o += E.conveyor(x, y - 100, w, t);
    if (kind === 'vents') o += E.vent(x + 80, y - 260, 150, 100, 1, t) + E.vent(x + 260, y - 260, 150, 100, 1, t);
  }
  // the top floor + the Robux Printer
  o += E.floorBand(-200, 2120, -1520, 120);
  o += S.g(E.printer(t, 1.2), 'translate(960 -1540) scale(0.62)');
  return o;
}
function shotTiltUp(t) {
  const cam = camKeys(t, [[d1, { zoom: 1.0, x: 0, y: 40 }], [d1 + 0.25, { zoom: 1.0, x: 0, y: 0 }], [tObby - 0.1, { zoom: 0.92, x: 0, y: -2050 }], [d2, { zoom: 0.96, x: 0, y: -2120 }]]);
  const vel = Math.abs(camKeys(t + 0.02, [[d1 + 0.25, { y: 0 }], [tObby - 0.1, { y: -2050 }]]).y - camKeys(t, [[d1 + 0.25, { y: 0 }], [tObby - 0.1, { y: -2050 }]]).y) / 0.02;
  let bg = E.wall(-800, -3800, 2800, 1600);
  for (let x = -100; x < 2200; x += 700) bg += E.pilaster(x, -3800, 1600, 90);
  for (let i = 0; i < 6; i++) bg += E.vaultDoor(i % 2 ? 1300 : 600, 700 - i * 700, 180, t, t * 20 + i * 40);
  let w = E.floorBand(-400, 2300, 980, 400);
  // the trio at the bottom, from behind, looking up
  w += who('pickle', t, { x: 820, y: 1000, s: 0.34, view: 'back', armL: 14, armR: 14, headRot: -6 }, { arms: false });
  w += who('ty', t, { x: 960, y: 1004, s: 0.34, view: 'back', armL: 14, armR: 14 }, { arms: false });
  w += who('mia', t, { x: 1100, y: 1000, s: 0.34, view: 'back', armL: 14, armR: 14, headRot: 6 }, { arms: false }, [beret('front', 0)]);
  w += obbyColumn(t);
  let o = view(cam, bg, 0.55) + view(cam, w, 1);
  if (vel > 600) o += S.g(C.speedLines(0, 1920, 540, 18, 5, '#FFFFFF', 1100), 'rotate(90 960 540)', { opacity: f(clamp((vel - 600) / 2000, 0, 0.7)) });
  // "OBBY!" title
  const k = seg(t, tObby - 0.05, tObby + 0.3);
  if (k > 0) {
    o += K.rays(960, 520, 16, 1300, '#FFF1B0', 0.18 * k, t * 30);
    o += S.g(S.rect(-470, -120, 940, 240, 50, ol('#06222A', 12)) + T('BANK OBBY', 0, 40, 130, E.GOLD, { stroke: '#151515', 'stroke-width': 14, 'paint-order': 'stroke' }) + TF('50 STAGES · 0% CHILL', 0, 96, 34, '#7CF7FF') +
      K.coin(-400, -10, 54, -10, t * 4) + K.coin(400, -10, 54, 10, t * 4 + 1), `translate(960 230) rotate(-4) scale(${f(ease.outBack(k))})`);
  }
  o += whiteAt(t, d1, 0.8);
  return o;
}

// ---------------------------------------------------------------- B2: coin avalanche — tracking run uphill, leap the rolling coins
function shotAvalanche(t) {
  const v = 760, u = t - d2;
  const tyX = 600 + v * u;
  const cam = { zoom: 1.08, x: tyX - 960 + 80, y: 40 };
  shook(cam, t, d2, 1.2, 7);
  const cS = 600 + 1900 * (tAval + 0.3 - d2);
  const coinX = (k) => cS + k * 700 - 1150 * u;
  let bg = E.backdrop(t, cam.x - 1200, cam.x + 3400, -300, 820, { pil: 640 });
  let w = E.floorBand(cam.x - 1500, cam.x + 3500, 820, 500);
  // the avalanche: big rolling coins + a tumbling wave
  let wave = '';
  for (let i = 0; i < 26; i++) {
    const x = cS + 380 + hash(i) * 700 - 1150 * u, y = 820 - 40 - Math.abs(Math.sin(t * 6 + i)) * 160 * hash(i * 3);
    wave += coin(x, y, 26 + hash(i * 5) * 16, t * 400 + i * 30, t * 10 + i);
  }
  w += S.g(E.coinMound(520, 340, t), `translate(${f(cS + 1000 - 1150 * u)} 840)`) + wave;
  // rolling = rotate the big coins
  const big = [0, 1, 2].map((k) => S.g(coin(0, 0, 115, 0, 0), `translate(${f(coinX(k))} ${820 - 115}) rotate(${f(-u * 1150 / 115 * 57)})`)).join('');
  // runners: each jumps when a big coin reaches them
  const runs = [['pickle', -360], ['mia', -180], ['ty', 0]];
  for (const [n, dx] of runs) {
    const x = tyX + dx;
    let lift = 0;
    for (let k = 0; k < 3; k++) { const tm = d2 + (cS + k * 700 - (600 + dx)) / (v + 1150); lift = Math.max(lift, 260 * bump(t, tm - 0.26, tm + 0.26)); }
    w += runner(n, t, x, 820, 0.4, { pose: { lift, legL: lift > 30 ? 60 : undefined, kneeL: lift > 30 ? 90 : undefined }, act: { face: lift > 30 ? 'excited' : 'scared' } });
  }
  let o = view(cam, bg, 0.6) + view(cam, w + big, 1);
  o = rotAll(o, -7);
  o += C.speedLines(0, 1500, 500, 14, Math.floor(t * 20), '#FFFFFF', 800);
  o += K.bang('ROLL!', 1500, 260, bump(t, tAval, tAval + 0.9), 90, -10, E.GOLD);
  o += stageHud(t, 2, d2);
  return o;
}

// ---------------------------------------------------------------- B3: price-tag floors
const TILE_W = 300, TILE_GAP = 40;
function shotTags(t) {
  const v = 520, u = t - d3;
  const tyX = 640 + v * u;
  const cam = { zoom: 1.12, x: tyX - 960 + 60, y: 60 };
  let bg = E.backdrop(t, cam.x - 1200, cam.x + 3400, -300, 700, { pil: 760, seed: 3 });
  bg += S.rect(cam.x - 1500, 700, 5000, 900, 0, { fill: '#05191E' });
  for (let i = 0; i < 12; i++) bg += coin(cam.x - 600 + i * 330 + (hash(i) * 100), 1060 + hash(i * 3) * 60, 30, i * 20, t * 2 + i);
  bg += S.rect(cam.x - 1500, 960, 5000, 300, 0, { fill: 'url(#s10glow)', opacity: 0.4 });
  let w = '';
  const pos = { pickle: -340, mia: -170, ty: 0 };
  for (let j = 0; j < 14; j++) {
    const x = j * (TILE_W + TILE_GAP);
    const tEnter = d3 + (x - 640) / v;
    const age = t - tEnter;
    const val = age > 0 ? 5 * Math.pow(10, Math.min(age, 2.2) * 2.3) : 5;
    const drop = seg(age, 1.6, 2.4);
    w += E.priceTile(x, 780, TILE_W, E.fmtR(val), seg(val, 400, 2000), drop, t);
  }
  for (const [n, dx] of Object.entries(pos)) {
    const x = tyX + dx;
    const P = TILE_W + TILE_GAP, fr = (((x - 320) / P) % 1 + 1) % 1;
    const hop = 90 * Math.pow(Math.max(0, Math.cos(fr * Math.PI * 2)), 3);
    w += runner(n, t, x, 780, 0.4, { pose: { lift: hop }, act: { face: n === 'mia' ? 'deadpan' : 'scared' } });
  }
  let o = view(cam, bg, 0.6) + view(cam, w, 1);
  o = rotAll(o, 3);
  o += stageHud(t, 3, d3);
  return o;
}
function shotTagCU(t) {
  // close-up: the number under Ty's sneaker keeps going UP
  const cam = camKeys(t, [[d4, { zoom: 1.0, x: 0, y: 0 }], [tUp + 0.1, { zoom: 1.12, x: 0, y: 30 }], [d5, { zoom: 1.18, x: 0, y: 40 }]]);
  shook(cam, t, tStood + 0.15, 0.5, 10);
  const steps = [[d4, '50'], [tUp - 0.05, '500'], [tUp + 0.25, '5,000'], [tUp + 0.5, '50,000'], [tStood, '500K'], [tStood + 0.3, '5M']];
  let cur = steps[0], ci = 0;
  steps.forEach((s, i) => { if (t >= s[0]) { cur = s; ci = i; } });
  const pop = 1 + 0.18 * bump(t, cur[0], cur[0] + 0.18);
  let o = E.backdrop(t, -400, 2400, -400, 760, { pil: 900, seed: 5 }) + S.rect(0, 700, 1920, 400, 0, { fill: '#05191E' });
  let w = '';
  const leave = seg(t, tStood + 0.45, tStood + 0.7);
  const hot = seg(ci, 2, 4);
  w += S.g(E.priceTile(0, 0, 1100, null, hot, leave * 0.7, t), `translate(${f(420 + Math.sin(t * 40) * hot * 6)} 700) scale(1) `);
  w += S.g(K.robuxText(0, 0, cur[1], 160, hot > 0.5 ? '#FFFFFF' : '#2A1640'), `translate(900 ${f(810 + leave * leave * 500)}) scale(${f(pop)})`);
  // Ty's legs (big), standing then leaping off
  const jump = ease.out(leave);
  w += who('ty', t, { x: 860, y: 700 - jump * 500, s: 1.3, view: 'side', flip: true, ...(jump > 0 ? { legL: 60, kneeL: 80, legR: -30, kneeR: 40 } : { legL: 4, legR: -4 }), armL: -30, armR: 40, shadow: false, face: 'scared' }, { arms: false });
  // the up arrow
  const ak = seg(t, tUp, tUp + 0.2);
  if (ak > 0) w += S.g(S.path('M0 -160 L120 0 L50 0 L50 140 L-50 140 L-50 0 L-120 0 Z', ol('#3BD16F', 10)), `translate(1500 ${f(420 - 80 * Math.sin((t - tUp) * 8))}) scale(${f(ease.outBack(ak))})`);
  if (hot > 0.5) for (let i = 0; i < 5; i++) w += S.path(`M${500 + i * 200} ${700 - 20} q20 -40 0 -80`, ln(8, '#FF8A3D', 0.6 * hot));
  o += view(cam, w, 1);
  o += K.bang('UP!', 1520, 180, bump(t, tUp, tUp + 0.8), 120, -8, '#3BD16F');
  o += stageHud(t, 3, d3);
  return o;
}

// ---------------------------------------------------------------- B4: laser scanners
function shotLasers(t) {
  const v = 260, u = t - d5;
  const cx = 960 + v * u;
  const cam = camKeys(t, [[d5, { zoom: 1.0, x: v * 0 - 40, y: 0 }], [d6, { zoom: 1.12, x: v * (d6 - d5) + 40, y: 20 }]]);
  let bg = E.backdrop(t, -800, 3000, -300, 820, { pil: 700, vault: false, seed: 2 }) + S.rect(-800, -300, 3800, 1200, 0, { fill: '#200010', opacity: 0.25 });
  let w = E.floorBand(-800, 3200, 820, 400);
  // scanners on the ceiling + sweeping beams
  const beams = [];
  for (let i = 0; i < 4; i++) {
    const sx = 500 + i * 420, sy = 0;
    const ang = Math.PI / 2 + Math.sin(t * (2.2 + i * 0.3) + i * 1.7) * 0.6;
    const ex = sx + Math.cos(ang) * 1100, ey = sy + Math.sin(ang) * 1100;
    beams.push([sx, sy, ex, ey]);
    w += E.scanner(sx, sy - 20, ang - Math.PI / 2, t);
  }
  // horizontal beams to dodge
  const hb = [[640, 'ty', 640 + 0.12], [520, 'pickle', 0], [600, 'mia', 0]];
  // runners: Ty limbos, Pickle hops, Mia flips
  const tyx = cx + 250, px = cx - 250, mx = cx;
  const limbo = bump(t, d5 + 0.3, d5 + 1.3), hopP = bump(t, d5 + 0.7, d5 + 1.25), flip = seg(t, d5 + 1.0, d5 + 1.6);
  w += runner('pickle', t, px, 820, 0.4, { amp: 0.6, pose: { lift: 200 * hopP, legL: hopP > 0.3 ? 70 : undefined, kneeL: hopP > 0.3 ? 110 : undefined, legR: hopP > 0.3 ? 50 : undefined, kneeR: hopP > 0.3 ? 100 : undefined }, act: { face: 'scared' } });
  w += runner('mia', t, mx, 820, 0.4, { amp: 0.6, pose: { lift: 170 * Math.sin(flip * Math.PI), rot: 360 * ease.inOut(flip), rotY: -400, legL: flip > 0 && flip < 1 ? 80 : undefined, kneeL: flip > 0 && flip < 1 ? 120 : undefined }, act: { face: 'determined' } });
  w += runner('ty', t, tyx, 820, 0.4, { amp: 0.5 * (1 - limbo), pose: { lean: lerp(8, -42, limbo), bodyY: 40 * limbo, legL: limbo > 0.2 ? -30 : undefined, kneeL: limbo > 0.2 ? 70 : undefined }, act: { face: limbo > 0.3 ? 'determined' : 'scared' } });
  // the sweeping beams, drawn over (they pass through everything)
  let lz = '';
  for (const [a, b, c, d] of beams) lz += E.laser(a, b, c, d, 0.9);
  lz += E.laser(-800, 820 - 330 + 50 * Math.sin(t * 3), 3200, 820 - 300 + 50 * Math.sin(t * 3), 1);
  let o = view(cam, bg, 0.6) + view(cam, w + lz, 1);
  // fee pops on "fee"
  ['ty', 'mia', 'pickle'].forEach((n, i) => {
    const k = seg(t, tFee1 - 0.1 + i * 0.07, tFee1 + 0.05 + i * 0.07);
    if (k > 0) {
      const x = [tyx, mx, px][i];
      o += view(cam, S.g(S.rect(-110, -40, 220, 80, 22, ol('#E2233B', 6)) + T('-R$5', 0, 24, 54, '#FFFFFF'), `translate(${f(x)} ${f(330 - 60 * k)}) scale(${f(ease.outBack(k))})`), 1);
    }
  });
  o += stageHud(t, 4, d5);
  return o;
}
function shotScannerPOV(t) {
  // the scanner's point of view: reticles on every kid; Ty LOOKS at it → viewing fee
  const cam = camKeys(t, [[d6, { zoom: 1.0, x: 0, y: 0 }], [tLooking, { zoom: 1.05, x: 0, y: 0 }], [tLooking + 0.15, { zoom: 1.35, x: 0, y: -60 }], [d7, { zoom: 1.4, x: 0, y: -60 }]]);
  let w = E.backdrop(t, -400, 2400, -300, 720, { pil: 640, vault: false, seed: 7 }) + E.floorBand(-400, 2400, 720, 600);
  const ph = t * 13;
  const look = t > tLooking - 0.1;
  const kids = [['pickle', 600, 0.48], ['ty', 960, 0.5], ['mia', 1320, 0.5]];
  for (const [n, x, s] of kids) {
    const rf = runFront(ph + x, 0.9);
    w += front(n, t, { x, y: 960, s, ...rf, face: n === 'ty' && look ? { name: 'shocked', eyes: { look: [0, 0] } } : n === 'mia' ? 'determined' : 'scared' }, { arms: false });
  }
  let o = view(cam, w, 1);
  // red scanner tint + HUD
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#FF0033', opacity: 0.14 }) + S.rect(0, 0, 1920, 1080, 0, { fill: 'url(#vignette)' });
  for (let y = 0; y < 1080; y += 8) if (y % 24 === 0) o += S.rect(0, y, 1920, 2, 0, { fill: '#FF5A7A', opacity: 0.12 });
  o += TF('● SCANNING', 1680, 90, 40, '#FF5A7A', { opacity: f(0.5 + 0.5 * Math.sin(t * 10)) });
  const tags = { pickle: 'R$ 12', ty: 'R$ 0 · BROKE', mia: 'HAT DETECTED' };
  for (const [n, x, s] of kids) {
    const hx = (x - 960) * cam.zoom + 960, hy = (960 - 740 * s - 540 - cam.y) * cam.zoom + 540;
    const r = 130 * cam.zoom * s / 0.5;
    const lock = n === 'ty' && look;
    const col = lock ? '#FFE14D' : '#FF5A7A';
    o += S.g(S.path(`M${-r} ${-r + 40} L${-r} ${-r} L${-r + 40} ${-r} M${r - 40} ${-r} L${r} ${-r} L${r} ${-r + 40} M${r} ${r - 40} L${r} ${r} L${r - 40} ${r} M${-r + 40} ${r} L${-r} ${r} L${-r} ${r - 40}`, ln(7, col)) +
      TF(tags[n], 0, -r - 18, 30, col), `translate(${f(hx)} ${f(hy)}) rotate(${f(lock ? 0 : Math.sin(t * 5 + x) * 6)})`);
  }
  const fk = seg(t, tLooking + 0.05, tLooking + 0.2);
  if (fk > 0) o += S.g(S.rect(-330, -70, 660, 140, 24, ol('#FFE14D', 8)) + T('VIEWING FEE: R$10', 0, 26, 64, '#2A1640'), `translate(960 880) rotate(-3) scale(${f(ease.outBack(fk))})`);
  o += K.bang('KA-CHING!', 1500, 300, bump(t, tLooking + 0.1, tLooking + 0.8), 80, 8, '#FFE14D');
  return o;
}

// ---------------------------------------------------------------- B5/B6: "Scan complete! Fee: one hat." — NOT THE BERET!
function shotScanMia(t) {
  const cam = camKeys(t, [[d7, { zoom: 1.0, x: 0, y: 0 }], [tHat, { zoom: 1.12, x: 0, y: -40 }], [d8, { zoom: 1.16, x: 0, y: -50 }]]);
  let w = E.backdrop(t, -400, 2400, -300, 900, { pil: 800, seed: 9 }) + E.floorBand(-400, 2400, 900, 400);
  const x = 800, y = 1250, s = 0.9, k = s * ZS.mia;
  const grab = seg(t, tHat - 0.05, tHat + 0.1), lift = ease.in(seg(t, tHat + 0.12, d8 + 0.2));
  const clawY = lerp(-300, y - 958 * k + 40, ease.out(seg(t, tHat - 0.6, tHat))) - lift * 900;
  w += who('mia', t, { x, y, s, armL: 16, armR: 16, face: t > tHat ? { name: 'shocked', eyes: { look: [0, -0.9] } } : { name: 'deadpan', eyes: { look: [0.3, -0.3] } } }, { arms: false }, grab > 0.5 ? [] : [beret('front', 0)]);
  if (grab > 0.5) w += beretAt(x - 4 * k, clawY + 30 - 40, k);
  if (t > tHat - 0.6) w += claw(x - 4 * k, clawY - 40, grab, t);
  // the green scan bar + grid
  const sk = seg(t, d7 + 0.05, tComplete + 0.2);
  if (sk > 0 && sk < 1) {
    const by = lerp(y - 1100 * k, y, sk);
    w += S.rect(x - 380, by - 8, 760, 16, 8, { fill: '#7CFF6B' }) + S.rect(x - 380, by - 60, 760, 120, 0, { fill: 'url(#s10green)', opacity: 0.6 });
    for (let gy = y - 1100 * k; gy < by; gy += 40) w += S.path(`M${x - 300} ${f(gy)} L${x + 300} ${f(gy)}`, ln(2, '#7CFF6B', 0.35));
  }
  w += S.g(E.scanner(0, 0, Math.PI / 2, t, '#7CFF6B'), `translate(${x} 60) scale(1.3)`);
  let o = view(cam, w, 1);
  // UI panels
  const p1 = seg(t, tComplete, tComplete + 0.2), p2 = seg(t, tFeeHat, tFeeHat + 0.2);
  if (p1 > 0) o += S.g(S.rect(-300, -60, 600, 120, 24, ol('#06222A', 7)) + T('SCAN COMPLETE ✓', 0, 22, 54, '#7CFF6B'), `translate(1420 260) scale(${f(ease.outBack(p1))})`);
  if (p2 > 0) o += S.g(S.rect(-300, -100, 600, 200, 24, ol('#06222A', 7)) + T('FEE:', -170, 20, 64, '#FF5A6E') + T('1 HAT', 110, 20, 78, E.GOLD) + TF('non-refundable', 0, 80, 30, '#9AA6B8'), `translate(1420 470) rotate(-3) scale(${f(ease.outBack(p2))})`);
  o += stageHud(t, 4, d5);
  return o;
}
function shotNotBeret(t) {
  const cam = camKeys(t, [[d8, { zoom: 1.0, x: 0, y: 0 }], [tBeret, { zoom: 1.0, x: 0, y: 0 }], [tBeret + 0.12, { zoom: 1.25, x: 0, y: -60 }], [d9, { zoom: 1.3, x: 0, y: -60 }]]);
  shook(cam, t, tBeret, 0.9, 16);
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: '#2A0A3A' }) + K.rays(960, 460, 26, 1600, '#FF6FB5', 0.25, t * 40);
  let w = '';
  const s = 1.45, x = 960, y = 1720;
  w += who('mia', t, { x, y, s, armL: 165, armR: 150 + 10 * Math.sin(t * 20), face: { name: 'angry', mouth: 'scream' } }, { arms: false });
  // the beret flies up out of reach into the FEES slot
  const u = seg(t, d8, d9);
  w += claw(1220, lerp(260, -300, u) + 40, 1, t) + beretAt(1220, lerp(260, -300, u) + 30, 0.6, Math.sin(t * 9) * 8);
  w += S.rect(1050, -40, 340, 90, 14, ol('#06222A', 7)) + T('FEES', 1220, 30, 60, E.GOLD);
  o += view(cam, w, 1);
  o += C.speedLines(0, 1920, 540, 20, Math.floor(t * 24), '#FFFFFF', 1100);
  return o;
}

// ---------------------------------------------------------------- B7: the wall of bills (head-on)
function corridor(t, vx = 960, vy = 470) {
  let o = S.rect(0, 0, 1920, 1080, 0, { fill: E.TEAL1 });
  o += S.path(`M0 0 L${vx - 260} ${vy - 200} L${vx - 260} ${vy + 160} L0 1080 Z`, { fill: E.TEAL2, stroke: '#151515', 'stroke-width': 6 }) + S.path(`M1920 0 L${vx + 260} ${vy - 200} L${vx + 260} ${vy + 160} L1920 1080 Z`, { fill: E.TEAL2, stroke: '#151515', 'stroke-width': 6 });
  o += S.path(`M0 1080 L${vx - 260} ${vy + 160} L${vx + 260} ${vy + 160} L1920 1080 Z`, { fill: 'url(#s10marble)', stroke: '#151515', 'stroke-width': 6 });
  for (let i = 0; i < 6; i++) {
    const k = ((i / 6 + t * 1.6) % 1);
    const z = 0.2 + 3 * k * k;
    const xl = vx - 260 * z, xr = vx + 260 * z, yt = vy - 200 * z, yb = vy + 160 * z;
    o += S.path(`M${f(xl)} ${f(yt)} L${f(xl)} ${f(yb)}`, ln(10 * z, E.GOLD, 0.8)) + S.path(`M${f(xr)} ${f(yt)} L${f(xr)} ${f(yb)}`, ln(10 * z, E.GOLD, 0.8));
    o += S.path(`M${f(xl)} ${f(yb)} L${f(xr)} ${f(yb)}`, ln(4 * z, '#B9CFCA', 0.7));
  }
  return o;
}
function shotBills(t) {
  const cam = camKeys(t, [[d9, { zoom: 1.0, x: 0, y: 0 }], [d10, { zoom: 1.08, x: 0, y: 20 }]]);
  shook(cam, t, tBills, 0.5, 8);
  let o = corridor(t);
  // the wall of bills, approaching
  const z = lerp(0.45, 1.35, ease.in(seg(t, d9, d10 + 0.2)));
  let wallB = '';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) {
    const i = r * 9 + c;
    wallB += E.bill(-640 + c * 160 + (r % 2) * 40, -340 + r * 170 + Math.sin(t * 9 + i) * 6, 0.82, (hash(i) - 0.5) * 18 + Math.sin(t * 7 + i) * 4, i);
  }
  o += S.g(wallB, `translate(960 ${f(470 - 40 * z)}) scale(${f(z)})`);
  let w = '';
  const kids = [['pickle', 600, 0], ['ty', 960, 1], ['mia', 1320, 2]];
  for (const [n, x, i] of kids) w += front(n, t, { x, y: 1060, s: 0.5, ...runFront(t * 15 + i * 2, 1.2), face: n === 'mia' ? 'angry' : 'scream' }, { arms: false });
  o += view(cam, w, 1);
  o += K.bang('WALL OF BILLS!', 960, 140, bump(t, tBills - 0.1, tBills + 1.0), 90, -4, '#FF5A6E');
  o += stageHud(t, 5, d9);
  return o;
}

// ---------------------------------------------------------------- B8: the DEBT conveyor (running in place)
function shotDebt(t) {
  const cam = camKeys(t, [[d10, { zoom: 1.0, x: 0, y: 0 }], [d11, { zoom: 1.1, x: 40, y: 20 }]]);
  let bg = E.backdrop(t, -400, 2400, -300, 760, { pil: 700, seed: 11 });
  bg += S.rect(-400, 760, 2800, 600, 0, { fill: '#05191E' });
  let w = E.conveyor(-200, 760, 2400, t, 900);
  const flash = Math.floor((t - tDebt) * 8) % 2 === 0 && t > tDebt;
  w += S.rect(560, 120, 800, 200, 40, ol('#2A0A14', 10)) + T('DEBT', 960, 270, 170, flash ? '#FFFFFF' : '#FF3B5C', { stroke: '#151515', 'stroke-width': 14, 'paint-order': 'stroke' });
  w += S.circle(960, 220, 520, { fill: 'url(#s10red)', opacity: flash ? 0.6 : 0.3 });
  const slip = bump(t, tDebt - 0.2, tDebt + 0.6);
  w += runner('pickle', t, 700 - 160 * slip, 772, 0.42, { ph: t * 22, amp: 1.3, pose: { lean: 18 - 40 * slip }, act: { face: slip > 0.3 ? 'scream' : 'scared' } });
  w += runner('mia', t, 1000, 772, 0.42, { ph: t * 22 + 2, amp: 1.3, pose: { lean: 20 }, act: { face: 'angry' } });
  w += runner('ty', t, 1280, 772, 0.42, { ph: t * 22 + 4, amp: 1.3, pose: { lean: 22 }, act: { face: 'determined' } });
  for (let i = 0; i < 8; i++) w += S.path(`M${200 + i * 260 - ((t * 900) % 260)} 740 l-60 0`, ln(6, '#FFFFFF', 0.5));
  let o = view(cam, bg, 0.7) + view(cam, w, 1);
  o += stageHud(t, 6, d10);
  return o;
}

// ---------------------------------------------------------------- B9–B11: the coin avalanche buries Mia; Ty grabs her hand
const MOUND_X = 1180;
function mound(t, k, x = MOUND_X, y = 900) {
  if (k <= 0) return '';
  return S.g(E.coinMound(420 * k, 330 * k, t), `translate(${x} ${y + 30})`);
}
function shotBuried(t) {
  const cam = camKeys(t, [[d11, { zoom: 1.0, x: 0, y: 0 }], [tCoinA - 0.1, { zoom: 1.0, x: 0, y: 0 }], [tCoinA + 0.15, { zoom: 1.0, x: 220, y: -820 }], [tTop - 0.15, { zoom: 1.0, x: 220, y: -800 }], [tTop + 0.1, { zoom: 1.12, x: 220, y: 40 }], [d12, { zoom: 1.15, x: 220, y: 60 }]]);
  shook(cam, t, tCoinA, 2.0, 10);
  let bg = E.backdrop(t, -600, 2600, -1600, 900, { pil: 700, seed: 13 });
  let w = E.floorBand(-600, 2800, 900, 500);
  // the big pipe overhead bursts
  const burst = t > tCoinA - 0.1;
  w += E.coinPipe([[-400, -700], [MOUND_X - 120, -700], [MOUND_X - 120, -560]], t, 110, 900, 3);
  w += S.rect(MOUND_X - 220, -560, 200, 80, 16, ol(E.GOLD3, 8));
  if (burst) {
    w += S.path(`M${MOUND_X - 220} -480 L${MOUND_X - 260} -440 M${MOUND_X - 20} -480 L${MOUND_X + 30} -430`, ln(10, '#FFFFFF'));
    for (let i = 0; i < 46; i++) {
      const age = ((t - tCoinA) * 1.1 + i / 46) % 1.0, gen = Math.floor((t - tCoinA) * 1.1 + i / 46);
      if ((t - tCoinA) * 1.1 + i / 46 < 1) continue;
      const x = MOUND_X - 120 + (hash(i * 3 + gen) - 0.5) * 220 * (0.4 + age), y = -480 + age * age * 1500;
      if (y < 880) w += coin(x, y, 24 + hash(i) * 14, i * 30, t * 9 + i);
    }
  }
  // Mia runs in, stops, looks up — buried on "of—"
  const buryK = ease.out(seg(t, tOf - 0.05, tOf + 0.2));
  const miaX = Math.min(MOUND_X, 600 + 900 * (t - d11));
  if (buryK < 0.85) {
    if (t < tTop - 0.2) w += runner('mia', t, miaX, 900, 0.42, { act: { face: 'determined' } });
    else w += front('mia', t, { x: MOUND_X, y: 900, s: 0.42, armL: 120, armR: 120, face: { name: 'scared', eyes: { look: [0, -1] } }, sy: 1 - 0.3 * buryK }, { arms: false });
  }
  if (t < tTop) w += runner('ty', t, miaX - 400, 900, 0.42, { act: { face: 'happy' } }) + runner('pickle', t, miaX - 620, 900, 0.42, {});
  w += mound(t, Math.max(buryK, 0.2 * seg(t, tCoinA + 0.4, tTop)));
  // the hand sticking out
  if (buryK > 0.85) w += S.g(S.rect(-22, -120, 44, 120, 10, ol('#F7B9CF', 6)) + S.rect(-26, -170, 52, 56, 14, ol('#F4D3BC', 6)), `translate(${MOUND_X + 20} ${f(900 - 300)}) rotate(${f(Math.sin(t * 12) * 12)})`);
  let o = view(cam, bg, 0.7) + view(cam, w, 1);
  o += K.bang('CREAK...', 1300, 300, bump(t, tCoinA - 0.3, tCoinA + 0.3), 70, 6, '#FFFFFF');
  o += K.bang('FWOOMP!', 960, 300, bump(t, tOf, tOf + 0.5), 110, -8, E.GOLD);
  o += stageHud(t, 7, d11);
  return o;
}
function shotDive(t) {
  // "MIA! Grab my hand!" — Ty sprints and dives at the coin pile
  const u = seg(t, d12, d13);
  const tyX = lerp(300, 1000, ease.inOut(u));
  const cam = camKeys(t, [[d12, { zoom: 1.15, x: -300, y: 40 }], [d13, { zoom: 1.25, x: 120, y: 60 }]]);
  let bg = E.backdrop(t, -600, 2600, -600, 900, { pil: 700, seed: 13 });
  let w = E.floorBand(-600, 2800, 900, 500) + mound(t, 1);
  w += S.g(S.rect(-22, -120, 44, 120, 10, ol('#F7B9CF', 6)) + S.rect(-26, -170, 52, 56, 14, ol('#F4D3BC', 6)), `translate(${MOUND_X + 20} 600) rotate(${f(Math.sin(t * 12) * 12)})`);
  const dive = seg(t, tGrab, tHand);
  if (dive <= 0) w += runner('ty', t, tyX, 900, 0.42, { act: { face: 'scream' } });
  else w += who('ty', t, { x: tyX, y: 900 - Math.sin(dive * Math.PI) * 120, s: 0.42, view: 'side', flip: true, rot: lerp(30, 80, dive), rotY: -500, armL: 170, armR: 160, legL: -20, legR: -40, kneeL: 20, kneeR: 30, face: 'determined' }, {});
  w += runner('pickle', t, tyX - 380, 900, 0.42, { act: { face: 'scared' } });
  let o = view(cam, bg, 0.7) + view(cam, w, 1);
  o += C.speedLines(0, 900, 520, 10, Math.floor(t * 20), '#FFFFFF', 500);
  o += stageHud(t, 7, d11);
  return o;
}
function shotHands(t) {
  // extreme close-up: the hands meet
  const cam = camKeys(t, [[d13, { zoom: 1.0, x: 0, y: 0 }], [d14, { zoom: 1.12, x: 0, y: 0 }]]);
  let w = S.rect(-200, -200, 2400, 1500, 0, { fill: 'url(#s10coins)' }) + S.rect(-200, -200, 2400, 1500, 0, { fill: '#2A1A00', opacity: 0.45 });
  const g = seg(t, tClasp - 0.25, tClasp);
  w += K.rays(960, 540, 18, 1400, '#FFF1B0', 0.25 * seg(t, tClasp, tClasp + 0.15), t * 20);
  w += bigArm(1010, lerp(1150, 640, ease.out(seg(t, d13, tClasp))), 700, -90, '#F7B9CF', '#E79AB5', '#F4D3BC', g);
  w += bigArm(lerp(400, 900, ease.out(g)), 560, 900, -4, '#F2B53A', '#D9962A', '#E9B38B', g);
  for (let i = 0; i < 10; i++) w += coin(hash(i) * 1920, 1000 + hash(i * 3) * 100, 60, i * 30, t * 2 + i);
  let o = view(cam, w, 1);
  o += C.burst(960, 520, seg(t, tClasp, tClasp + 0.5));
  o += K.bang('GOTCHA!', 960, 220, bump(t, tClasp, tClasp + 0.7), 100, -6, E.GOLD);
  return o;
}
function shotYank(t) {
  const u = seg(t, d14, d15);
  const cam = camKeys(t, [[d14, { zoom: 1.2, x: 120, y: 60 }], [d15, { zoom: 1.05, x: 60, y: 0 }]]);
  shook(cam, t, d14 + 0.1, 0.4, 14);
  let bg = E.backdrop(t, -600, 2600, -600, 900, { pil: 700, seed: 13 });
  let w = E.floorBand(-600, 2800, 900, 500) + mound(t, 1 - 0.3 * u);
  const pop = ease.out(seg(t, d14 + 0.05, d14 + 0.5));
  w += who('ty', t, { x: lerp(950, 760, pop), y: 900, s: 0.42, view: 'side', flip: true, lean: -30 * pop, armL: 100, armR: 90, legL: 30, kneeL: 20, legR: -20, face: 'determined', shadow: true }, { arms: false });
  w += front('mia', t, { x: lerp(MOUND_X, 1000, pop), y: 900 - 200 * Math.sin(pop * Math.PI) - 60 * (1 - pop), s: 0.42, armL: 160, armR: 20, rot: -30 * Math.sin(pop * Math.PI), rotY: -500, face: { name: 'dizzy' } }, { arms: false });
  w += K.coinBurst(MOUND_X, 760, t - d14 - 0.05, 30, 1000, 26, 9);
  let o = view(cam, bg, 0.7) + view(cam, w, 1);
  o += K.bang('SHLOOP!', 1300, 300, bump(t, d14 + 0.05, d14 + 0.8), 100, 8, E.GOLD);
  return o;
}
function shotThanks(t) {
  // "...Thanks. Don't tell anyone I said that."
  const cam = camKeys(t, [[d15, { zoom: 1.0, x: 0, y: 0 }], [d16, { zoom: 1.12, x: 60, y: -20 }]]);
  let bg = E.backdrop(t, -600, 2600, -600, 900, { pil: 760, seed: 4 }) + E.lightShafts(0, 1920, -200, 1000, t);
  let w = E.floorBand(-600, 2800, 900, 500);
  // Pickle behind, thumbs up, teary
  w += front('pickle', t, { x: 1500, y: 930, s: 0.42, turn: -0.4, armR: 150, armL: 14, face: { name: 'happy', fx: ['tears'] } }, { arms: false });
  // Ty kneeling (lower half hidden by the coin pile), Mia sitting in the coins
  const away = seg(t, tDont - 0.2, tDont + 0.1);
  w += who('ty', t, { x: 700, y: 960, s: 0.56, turn: 0.35, armL: 20, armR: 40, face: away > 0 ? { name: 'smug', eyes: { look: [0.6, 0] } } : { name: 'happy', eyes: { look: [0.6, 0] } } }, { arms: false });
  const cough = bump(t, M[6].a - 0.1, M[6].a + 0.5);
  w += who('mia', t, { x: 1080, y: 990, s: 0.58, turn: lerp(-0.2, 0.55, away), headRot: 8 * away, bodyY: 10 * cough, armL: 16, armR: 26, face: away > 0 ? { name: 'sad', eyes: { look: [1, 0.3] }, fx: ['blush'] } : { name: 'oof', eyes: { type: 'closed' } } }, { arms: false });
  // coins on her head
  for (let i = 0; i < 4; i++) w += coin(1030 + i * 34, 990 - 1020 * 0.6 + (i % 2) * 14 + 8, 20, i * 40, 0.2);
  w += S.g(E.coinMound(760, 270, t), 'translate(900 1010)');
  if (cough > 0.05) w += coin(1150 + 120 * seg(t, M[6].a, M[6].a + 0.6), 600 - 160 * Math.sin(seg(t, M[6].a, M[6].a + 0.6) * Math.PI), 18, t * 600, t * 10) + S.circle(1110, 620, 30 * cough, { fill: '#FFFFFF', opacity: f(0.6 * cough) });
  let o = view(cam, bg, 0.7) + view(cam, w, 1);
  o += K.bang('*cough*', 1330, 300, bump(t, M[6].a - 0.1, M[6].a + 0.7), 60, 6, '#FFFFFF');
  return o;
}

// ---------------------------------------------------------------- B12–B15: the interns
const VENTS = [[150, 200], [600, 170], [1050, 200], [1500, 170]];
const VW = 300, VH = 190;
function shotVents(t) {
  const cam = camKeys(t, [[d16, { zoom: 1.15, x: -260, y: 0 }], [tInterns - 0.1, { zoom: 1.05, x: 120, y: 20 }], [d17, { zoom: 1.0, x: 0, y: 40 }]]);
  let bg = E.wall(-600, -400, 2600, 1300) + E.floorBand(-600, 2600, 880, 500);
  for (const x of [-100, 2020]) bg += E.pilaster(x, -400, 880, 100);
  let w = '';
  VENTS.forEach(([x, y], i) => {
    const pop = seg(t, tInterns + i * 0.09, tInterns + i * 0.09 + 0.5);
    const rattle = seg(t, M[7].word('then').t0, tInterns) * (pop > 0 ? 0 : 1);
    w += E.vent(x, y, VW, VH, pop, t, rattle);
    // eyes + peeking heads
    const ek = seg(t, tInterns + 0.2 + i * 0.1, tInterns + 0.5 + i * 0.1);
    if (ek > 0) {
      const id = S.uid('s10v');
      let inner = '';
      for (let j = 0; j < 3; j++) inner += E.intern(x + 70 + j * 80, y + VH + 90 * (1 - ek) + (j % 2) * 12, 1.05, t + j, { run: 0, eyes: 1, talk: 0 });
      w += S.clipDef(id, S.rect(x, y, VW, VH, 6)) + S.g(inner, null, { 'clip-path': `url(#${id})` });
    } else if (t > M[7].word('then').t0) {
      for (let j = 0; j < 2; j++) w += S.ellipse(x + 120 + j * 60, y + 95, 11, 7 * (Math.floor(t * 3 + i) % 4 ? 1 : 0.2), { fill: '#7CFF6B' });
    }
  });
  // the trio below, looking up
  const kids = [['pickle', 760], ['ty', 960], ['mia', 1160]];
  for (const [n, x] of kids) w += front(n, t, { x, y: 1000, s: 0.42, armL: 30, armR: 30, face: { name: t > tInterns ? 'scared' : 'confused', eyes: { look: [0, -0.9] } } }, { arms: false });
  let o = view(cam, bg, 1) + view(cam, w, 1);
  o += K.bang('CLANG!', 700, 150, bump(t, tInterns, tInterns + 0.7), 90, -6, '#FFFFFF');
  o += stageHud(t, 8, d16);
  return o;
}
// intern stream: falls out of vent i, then runs left across the floor
function internFlow(t, t0, n = 48, floorY = 940, targetX = 300) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const [vx, vy] = VENTS[i % VENTS.length];
    const birth = t0 + (i / n) * 2.2 + hash(i) * 0.2;
    const age = t - birth;
    if (age < 0) continue;
    const fallT = 0.45;
    let x, y, rot = 0;
    if (age < fallT) { const u = age / fallT; x = vx + VW / 2 + (hash(i * 3) - 0.5) * 160 * u; y = vy + VH + u * u * (floorY - vy - VH); rot = u * 200 * (hash(i) - 0.5); }
    else { const u = age - fallT; x = vx + VW / 2 - u * (300 + 200 * hash(i * 7)); y = floorY + (hash(i * 11) - 0.5) * 40; if (x < targetX + hash(i * 5) * 260) x = targetX + hash(i * 5) * 260; }
    o += E.intern(x, y, 0.8 + hash(i * 9) * 0.3, t, { ph: t * 18 + i, flip: true, rot, talk: K.V.talking('THIRTY', t) ? Math.abs(Math.sin(t * 12 + i)) : 0 });
  }
  return o;
}
function shotPour(t) {
  const cam = camKeys(t, [[d17, { zoom: 1.0, x: 0, y: 40 }], [d18, { zoom: 0.96, x: 20, y: 40 }]]);
  shook(cam, t, M[7].word('Hundreds').t0, 2.4, 6);
  let bg = E.wall(-600, -400, 2600, 1300) + E.floorBand(-600, 2600, 880, 500);
  for (const x of [-100, 2020]) bg += E.pilaster(x, -400, 880, 100);
  let w = '';
  for (const [x, y] of VENTS) w += E.vent(x, y, VW, VH, 1, t);
  // the trio backing away to the left
  const back = seg(t, d17, d18);
  const kids = [['pickle', 380], ['ty', 200], ['mia', 30]];
  for (const [n, x] of kids) w += front(n, t, { x: x - 80 * back + 200, y: 1000, s: 0.42, turn: 0.5, armL: 60, armR: 60, face: n === 'mia' ? 'shocked' : 'scream' }, { arms: false });
  w += internFlow(t, d17 - 0.3, 64, 990, 480);
  let o = view(cam, bg, 1) + view(cam, w, 1);
  o += K.bang('HUNDREDS?!', 1300, 640, bump(t, tTiny - 0.2, tTiny + 0.9), 100, 6, '#7CFF6B');
  o += stageHud(t, 8, d16);
  return o;
}
function shotFee(t) {
  // the swarm: on every "Fee!" an intern pops into the camera
  let fi = -1; FEES.forEach((tf, i) => { if (t >= tf - 0.05) fi = i; });
  const punch = fi >= 0 ? bump(t, FEES[fi] - 0.05, FEES[fi] + 0.3) : 0;
  const cam = { zoom: 1.0 + 0.06 * punch + 0.03 * Math.max(0, fi), x: 0, y: 0 };
  if (fi >= 0) shook(cam, t, FEES[fi], 0.25, 10);
  let bg = E.backdrop(t, -400, 2400, -300, 900, { pil: 700, seed: 21 }) + E.floorBand(-400, 2400, 900, 500);
  let w = '';
  // trio in the middle, swamped
  w += front('ty', t, { x: 960, y: 960, s: 0.5, armL: 90 + 20 * Math.sin(t * 9), armR: 100 + 20 * Math.sin(t * 8), face: 'scream' }, { arms: false });
  w += front('pickle', t, { x: 640, y: 950, s: 0.5, armL: 140, armR: 30, face: 'scared' }, { arms: false });
  w += front('mia', t, { x: 1280, y: 950, s: 0.5, armL: 20, armR: 130, face: 'angry' }, { arms: false });
  // interns climbing on them + around
  const talk = K.V.talking('THIRTY', t);
  const perch = [[940, 470, 0.7], [1000, 560, 0.6], [600, 520, 0.6], [1300, 520, 0.6], [860, 700, 0.55], [1080, 720, 0.55], [700, 760, 0.6], [1220, 760, 0.6]];
  perch.forEach(([x, y, s], i) => { w += E.intern(x + Math.sin(t * 7 + i) * 10, y + Math.abs(Math.sin(t * 9 + i)) * -14, s, t, { ph: t * 20 + i, flip: i % 2, talk: talk ? Math.abs(Math.sin(t * 14 + i)) : 0, arm: Math.abs(Math.sin(t * 6 + i)) }); });
  for (let i = 0; i < 26; i++) {
    const x = (hash(i) * 2200 - 140 + t * (i % 2 ? 260 : -260)) % 2200;
    w += E.intern(x < -140 ? x + 2200 : x, 980 + (i % 3) * 30, 0.7, t, { ph: t * 20 + i, flip: i % 2, talk: talk ? Math.abs(Math.sin(t * 14 + i)) : 0 });
  }
  let o = view(cam, bg, 0.8) + view(cam, w, 1);
  // the pop-up intern for each "Fee!"
  const spots = [[330, 1150, -12], [1590, 1150, 12], [960, 1200, 0], [420, 1120, 8], [1500, 1120, -8]];
  if (fi >= 0) {
    const [x, y, r] = spots[fi];
    const k = ease.outBack(seg(t, FEES[fi] - 0.08, FEES[fi] + 0.12));
    const calc = S.g(S.rect(-60, -90, 120, 160, 14, ol('#3A3F55', 6)) + S.rect(-46, -76, 92, 40, 6, { fill: '#BFF5B0' }) + T('FEE', 0, -44, 32, '#1A3A1A'), `translate(${f(A.hand(150, 1)[0])} ${f(A.hand(150, 1)[1])})`);
    o += S.g(actor('thirty', t, { x: 0, y: 0, s: 0.95, armR: 150, armL: 40, face: { name: 'angry', mouth: 'O' }, shadow: false, props: [{ svg: calc, layer: 'front' }] }), `translate(${x} ${f(y + (1 - k) * 600)}) rotate(${r})`);
    const bk = seg(t, FEES[fi], FEES[fi] + 0.1);
    o += S.g(S.path('M-150 -80 L150 -80 Q180 -80 180 -50 L180 40 Q180 70 150 70 L40 70 L0 120 L-10 70 L-150 70 Q-180 70 -180 40 L-180 -50 Q-180 -80 -150 -80 Z', ol('#FFFFFF', 7)) + T('FEE!', 0, 30, 100, '#E2233B'),
      `translate(${x + (x < 960 ? 260 : -260)} ${y - 820}) rotate(${-r}) scale(${f(ease.outBack(bk))})`);
  }
  o += stageHud(t, 8, d16);
  return o;
}
function shotSockPanic(t) {
  const cam = camKeys(t, [[d19, { zoom: 1.0, x: 0, y: 0 }], [d20, { zoom: 1.1, x: -60, y: 60 }]]);
  let bg = E.backdrop(t, -400, 2400, -300, 900, { pil: 700, seed: 23 }) + E.floorBand(-400, 2400, 900, 500);
  let w = '';
  const pull = Math.sin(t * 14) * 10;
  w += front('pickle', t, { x: 1000, y: 1060, s: 0.72, armL: 150, armR: 120, legL: 58 + pull * 0.3, kneeL: 0, legR: -4, face: 'scream', lean: 8 }, { arms: false });
  // interns tugging his sock foot (screen-left): a tug-of-war chain
  const fx = 1000 - 278 * 0.684 - 10 + pull, fy = 1060 - 173 * 0.684;
  w += S.path(`M${f(fx)} ${f(fy)} Q${f(fx - 30)} ${f(fy + 10)} ${f(fx - 50)} ${f(fy + 30)}`, ln(22, '#151515')) + S.path(`M${f(fx)} ${f(fy)} Q${f(fx - 30)} ${f(fy + 10)} ${f(fx - 50)} ${f(fy + 30)}`, ln(12, '#FFFFFF'));
  for (let i = 0; i < 4; i++) w += E.intern(i === 0 ? fx - 46 : fx - 46 - i * 95, i === 0 ? fy + 81 : 1050 - i * 4, 1.35, t, { ph: t * 24 + i, flip: false, rot: -22 + Math.sin(t * 20 + i) * 4, run: 0.5, arm: 1 });
  for (let i = 0; i < 10; i++) w += E.intern((hash(i) * 2000 + t * 300 * (i % 2 ? 1 : -1)) % 2000, 1010, 0.7, t, { ph: t * 20 + i, flip: i % 2 });
  let o = view(cam, bg, 0.8) + view(cam, w, 1);
  o += stageHud(t, 8, d16);
  return o;
}
function shotSnip(t) {
  // close-up: an intern snips off 30% of Pickle's sock
  const cam = camKeys(t, [[d20, { zoom: 1.0, x: 0, y: 0 }], [tSock, { zoom: 1.05, x: 0, y: 0 }], [tSock + 0.1, { zoom: 1.2, x: -40, y: 20 }], [d21, { zoom: 1.22, x: -40, y: 20 }]]);
  shook(cam, t, tSock, 0.4, 14);
  let w = E.wall(-400, -400, 2400, 1500) + E.floorBand(-400, 2400, 880, 400);
  const cut = seg(t, tSock - 0.05, tSock + 0.05), away = seg(t, tSock + 0.1, d21 + 0.3);
  // leg + sock (big): pants, sock body, toe part (30%)
  let leg = S.rect(-130, -900, 260, 620, 30, ol('#C7A97A', 10)) + S.rect(-130, -340, 260, 60, 0, { fill: '#AE9063' });
  leg += S.path('M-130 -300 L130 -300 L130 -60 L-130 -60 Z', ol('#FFFFFF', 10));
  leg += S.path('M-130 -60 L130 -60 L130 60 L-130 60 Z', ol('#FFFFFF', 10));
  if (cut > 0.5) for (let i = 0; i < 4; i++) leg += S.rect(-118 + i * 62, 0, 52, 70, 22, ol('#F8D9C0', 7));
  leg += S.path('M-150 -60 L150 -60', { stroke: '#E2233B', 'stroke-width': 8, 'stroke-dasharray': '24 16', opacity: f(1 - cut) });
  w += S.g(leg, 'translate(820 860) rotate(-8)');
  if (cut <= 0.5) w += S.g(S.path('M-130 -60 L130 -60 L130 60 L-130 60 Z', ol('#FFFFFF', 10)) + TF('30%', 0, 20, 60, '#E2233B'), 'translate(820 860) rotate(-8)');
  else w += S.g(S.path('M-130 -60 L130 -60 L130 60 L-130 60 Z', ol('#FFFFFF', 10)) + TF('30%', 0, 20, 60, '#E2233B'), `translate(${f(820 + away * 900)} ${f(870 - Math.sin(away * Math.PI) * 220)}) rotate(${f(-8 + away * 40)})`);
  // the intern with scissors
  const ix = cut > 0.5 ? 1200 + away * 900 : 1220;
  w += E.intern(ix, 1060, 3.4, t, { ph: t * 20, flip: true, run: cut > 0.5 ? 1 : 0, talk: cut > 0.5 ? 0.8 : 0, arm: 0.3 });
  const sc = cut > 0.5 ? 0.05 : 0.5 + 0.5 * Math.abs(Math.sin(t * 14));
  const blade = (sg) => S.g(S.path('M0 0 L-300 -18 Q-320 -6 -300 6 L0 14 Z', ol('#DDE3EA', 7)) + S.path('M-20 2 L-280 -6', ln(4, '#FFFFFF', 0.8)) + S.circle(60, 0, 36, { fill: 'none', stroke: '#151515', 'stroke-width': 26 }) + S.circle(60, 0, 36, { fill: 'none', stroke: '#FF5A5A', 'stroke-width': 14 }), `rotate(${f(sg * 14 * sc)})`);
  w += S.g(blade(-1) + blade(1) + S.circle(0, 4, 12, ol('#9AA0AE', 5)), `translate(${f(ix - 160)} 820) rotate(-8)`, { opacity: f(1 - away) });
  let o = view(cam, w, 1);
  o += K.bang('SNIP!', 1300, 300, bump(t, tSock, tSock + 0.7), 130, -8, '#FFFFFF');
  return o;
}

// ---------------------------------------------------------------- B16–B17: the top — the Robux Printer, and its guard
function topFloor(t, cam, opts = {}) {
  const { pile = 1, eyes = 0, tremble = 0, printerPower = 1.2, py = 820, ps = 0.85 } = opts;
  let bg = E.wall(-1200, -2000, 3200, 1400);
  for (let x = -500; x < 2600; x += 800) bg += E.pilaster(x, -2000, 1400, 110);
  bg += E.vaultDoor(260, 160, 200, t, t * 10) + E.vaultDoor(1660, 160, 200, t, -t * 10);
  let mid = E.lightShafts(-200, 2120, -800, 1100, t, 5);
  mid += S.g(E.printer(t, printerPower), `translate(960 ${py}) scale(${ps})`);
  let fl = E.floorBand(-1200, 3200, py, 700);
  if (pile > 0) {
    const tr = tremble * Math.sin(t * 50) * 6;
    fl += S.g(E.coinMound(560 * pile, 300 * pile, t), `translate(${f(960 + tr)} ${py + 160})`);
    if (eyes > 0) fl += S.circle(960, py - 30, 200, { fill: 'url(#s10green)', opacity: f(eyes) }) + S.ellipse(890, py - 30, 34, 20 * eyes, ol('#7CFF6B', 5)) + S.ellipse(1030, py - 30, 34, 20 * eyes, ol('#7CFF6B', 5)) +
      S.path(`M850 ${py - 66} L920 ${py - 50} M1070 ${py - 66} L1000 ${py - 50}`, ln(9, '#151515', eyes));
  }
  return view(cam, bg, 0.6) + view(cam, mid, 0.85) + view(cam, fl, 1);
}
function shotPrinter(t) {
  const cam = camKeys(t, [[d21, { zoom: 1.0, x: 0, y: 420 }], [tVeryTop + 0.2, { zoom: 1.0, x: 0, y: 400 }], [tPrinter - 0.1, { zoom: 0.8, x: 0, y: -140 }], [d22, { zoom: 0.82, x: 0, y: -150 }]]);
  shook(cam, t, tPrinter, 1.4, 8);
  let o = topFloor(t, cam, { pile: 1, ps: 1.0, py: 900 });
  // the trio climbs up over the ledge (back view)
  const up = ease.outBack(seg(t, d21 + 0.1, d21 + 0.6));
  let fg = '';
  [['pickle', 760], ['ty', 960], ['mia', 1160]].forEach(([n, x], i) => {
    fg += who(n, t, { x, y: lerp(1500, 1240, up) + (i % 2) * 10, s: 0.42, view: 'back', armL: 160 - 120 * up, armR: 160 - 120 * up }, { arms: false });
  });
  fg += S.rect(-400, 1240, 2800, 400, 0, { fill: 'url(#s10marble)' }) + S.rect(-400, 1240, 2800, 24, 0, { fill: E.GOLD, stroke: '#151515', 'stroke-width': 6 });
  o += view(cam, fg, 1.15);
  o += K.coinRain(t, 22, { speed: 600, r: 24, seed: 4 });
  o += stageHud(t, 0, d21, 'FINAL STAGE');
  return o;
}
function shotGuard(t) {
  const cam = camKeys(t, [[d22, { zoom: 0.9, x: 0, y: 0 }], [d23, { zoom: 1.3, x: 0, y: 260 }]]);
  const eyes = seg(t, tGuard + 0.1, tGuard + 0.35);
  let o = topFloor(t, cam, { pile: 1, eyes, tremble: seg(t, d22, tGuard) + 0.5, ps: 1.0, py: 900 });
  let fg = '';
  [['pickle', 330], ['ty', 520], ['mia', 1600]].forEach(([n, x]) => { fg += who(n, t, { x, y: 1420, s: 0.46, view: 'back', armL: 30, armR: 30 }, { arms: false }); });
  o += view(cam, fg, 1.2);
  return o;
}

// ---------------------------------------------------------------- B18: the boss rises — "Every coin! Every trade! Every SANDWICH! ...belongs to ME!"
function card(x, y, s, rotd) {
  return S.g(S.rect(-70, -100, 140, 200, 14, ol('#7A5CFF', 7)) + S.rect(-54, -84, 108, 110, 10, { fill: '#FFE14D' }) + S.circle(0, -30, 34, ol('#FF8AB8', 5)) + TF('LIMITED', 0, 70, 24, '#FFFFFF'), `translate(${f(x)} ${f(y)}) rotate(${f(rotd)}) scale(${f(s)})`);
}
function sandwich(bite = 0) {
  let o = S.path('M-160 30 Q0 -140 160 30 Z', ol('#E8B060', 8)) + S.rect(-170, 26, 340, 26, 8, ol('#5BD15B', 6)) + S.rect(-170, 50, 340, 26, 8, ol('#E2533B', 6)) + S.rect(-170, 74, 340, 22, 8, ol('#FFD84D', 6)) + S.rect(-160, 94, 320, 44, 16, ol('#E8B060', 8));
  if (bite <= 0) return o;
  // the 30% bite: keep only what is left of a scalloped bite line
  const id = S.uid('s10bite');
  const edge = 'M-300 -200 L80 -200 Q20 -130 80 -60 Q20 0 80 50 Q20 100 80 160 L-300 160 Z';
  return S.clipDef(id, S.path(edge)) + S.g(o, null, { 'clip-path': `url(#${id})` }) + S.path('M80 -200 Q20 -130 80 -60 Q20 0 80 50 Q20 100 80 160', { fill: 'none', stroke: '#151515', 'stroke-width': 6, opacity: 0 });
}
function shotRise(t) {
  const rise = ease.out(seg(t, d23 - 0.1, d23 + 0.7));
  const cam = camKeys(t, [[d23, { zoom: 0.9, x: 0, y: 60 }], [d24, { zoom: 1.15, x: 0, y: -60 }]]);
  shook(cam, t, d23, 1.0, 14);
  let o = topFloor(t, cam, { pile: 0, py: 1000, ps: 0.9 });
  let w = '';
  const coinUp = seg(t, tCoin - 0.1, tCoin + 0.6), tradeK = seg(t, tTrade - 0.2, tTrade + 0.1);
  const pose = { x: 960, y: lerp(2400, 1480, rise), s: 2.0, armL: lerp(20, 60, rise) + 60 * tradeK, armR: lerp(20, 130, coinUp), face: rise < 1 ? 'angry' : 'smug' };
  w += E.boss(t, pose, { display: '30%' });
  w += S.g(E.coinMound(950, 280, t), 'translate(960 1320)');
  // the flipped coin
  if (coinUp > 0) { const h = A.hand(pose.armR, 1); w += coin(960 + h[0] * 1.4, pose.y + h[1] * 1.4 - 50 - Math.sin(coinUp * Math.PI) * 320, 80, 0, t * 14); }
  if (tradeK > 0) { const h = A.hand(pose.armL, -1); w += card(960 + h[0] * 1.4, pose.y + h[1] * 1.4 - 70, 1.2, -10); }
  // coins cascading off him as he rises
  w += K.coinBurst(960, 900, t - d23, 26, 900, 28, 5);
  // tiny trio silhouettes (low angle foreground)
  let fg = '';
  [['pickle', 560], ['ty', 700], ['mia', 1360]].forEach(([n, x]) => { fg += who(n, t, { x, y: 1150, s: 0.26, view: 'back', armL: 40, armR: 40 }, { arms: false }); });
  o += view(cam, w, 1) + view(cam, fg, 1.1);
  o += K.bang('EVERY COIN!', 520, 220, bump(t, tCoin, tCoin + 1.0), 80, -8, E.GOLD);
  o += K.bang('EVERY TRADE!', 1420, 260, bump(t, tTrade, tTrade + 0.9), 80, 6, '#B06BFF');
  return o;
}
function shotSandwich(t) {
  const chomp = seg(t, tSandwich, tSandwich + 0.12);
  const cam = camKeys(t, [[d24, { zoom: 1.0, x: 0, y: 0 }], [tSandwich, { zoom: 1.05, x: 0, y: 0 }], [tSandwich + 0.1, { zoom: 1.25, x: 120, y: -40 }], [d25, { zoom: 1.27, x: 120, y: -40 }]]);
  shook(cam, t, tSandwich, 0.5, 18);
  let o = topFloor(t, { zoom: 1.4, x: 0, y: -300 }, { pile: 0 });
  let w = '';
  const pose = { x: 760, y: 1700, s: 2.4, turn: 0.2, armR: 110, armL: 20, face: chomp > 0 && chomp < 1 ? { name: 'joy', mouth: 'teeth' } : 'smug' };
  w += E.boss(t, pose, { mound: false, orbit: 0.6 });
  const sx = lerp(1380, 1060, ease.inOut(seg(t, d24, tSandwich))), sy = 640;
  w += S.g(sandwich(chomp > 0.5 ? 1 : 0), `translate(${f(sx)} ${sy}) rotate(-12) scale(1.25)`);
  if (chomp > 0.5) for (let i = 0; i < 10; i++) { const a = t - tSandwich; w += S.rect(sx + 200 + i * 20 + a * 300 * hash(i), sy - 100 + a * a * 900 + hash(i * 3) * 100, 16, 14, 4, ol('#E8B060', 3)); }
  o += view(cam, w, 1);
  o += K.bang('CHOMP!', 1500, 240, bump(t, tSandwich, tSandwich + 0.7), 130, 8, E.GOLD);
  if (chomp > 0.5) o += S.g(S.rect(-110, -50, 220, 100, 14, { fill: 'none', stroke: '#FF3B5C', 'stroke-width': 10 }) + T('-30%', 0, 34, 84, '#FF3B5C'), `translate(1500 700) rotate(-12) scale(${f(ease.outBack(seg(t, tSandwich + 0.1, tSandwich + 0.3)))})`);
  return o;
}
function shotMe(t) {
  const cam = camKeys(t, [[d25, { zoom: 0.92, x: 0, y: 40 }], [tMe, { zoom: 1.0, x: 0, y: -30 }], [tMe + 0.12, { zoom: 1.12, x: 0, y: -80 }], [d26, { zoom: 1.14, x: 0, y: -80 }]]);
  shook(cam, t, tMe, 1.0, 22);
  let o = topFloor(t, cam, { pile: 0, py: 1000, ps: 0.9 });
  const spread = ease.outBack(seg(t, d25, d25 + 0.6));
  let w = K.rays(960, 380, 20, 1600, '#FFE98A', 0.18 + 0.15 * bump(t, tMe, tMe + 0.6), t * 25);
  w += E.boss(t, { x: 960, y: 1420, s: 1.9, armL: lerp(20, 135, spread), armR: lerp(20, 135, spread), face: t > tMe - 0.1 ? { name: 'angry', mouth: 'scream' } : 'smug' }, { display: '30%', orbit: 1 });
  w += S.g(E.coinMound(950, 260, t), 'translate(960 1330)');
  let fg = '';
  [['pickle', 700], ['ty', 840], ['mia', 980]].forEach(([n, x]) => { fg += who(n, t, { x, y: 1190, s: 0.28, view: 'back', armL: 70, armR: 70, bodyY: 20 }, { arms: false }); });
  o += view(cam, w, 1) + view(cam, fg, 1.1);
  o += K.coinRain(t, 26, { speed: 700, r: 26, seed: 8 });
  o += C.whiteFlash(0.5 * bump(t, tMe - 0.02, tMe + 0.14));
  o += K.bang('ME!', 960, 200, seg(t, tMe, tMe + 0.12), 200, -6, '#7CFF6B');
  return o;
}

// ---------------------------------------------------------------- B19–B21: too big; Pickle's idea; the purchase
function shotTooBig(t) {
  // high angle down on the trio, the boss's shadow and hand looming
  const cam = camKeys(t, [[d26, { zoom: 1.0, x: 0, y: 0 }], [d27, { zoom: 1.15, x: 0, y: 40 }]]);
  let w = S.rect(-400, -400, 2800, 1900, 0, { fill: 'url(#s10marble)' });
  for (let x = -400; x < 2400; x += 300) w += S.path(`M${x} -400 L${x} 1500`, ln(6, '#B9CFCA'));
  for (let y = -400; y < 1500; y += 300) w += S.path(`M-400 ${y} L2400 ${y}`, ln(6, '#B9CFCA'));
  const grow = seg(t, d26, d27);
  w += S.ellipse(960, 380, 900 + 200 * grow, 520 + 120 * grow, { fill: '#05191E', opacity: 0.55 });
  const sh = Math.sin(t * 30) * 3;
  w += front('pickle', t, { x: 760 + sh, y: 800, s: 0.5, turn: 0.3, armL: 40, armR: 20, face: 'scared' }, { arms: false });
  w += front('mia', t, { x: 1160 - sh, y: 800, s: 0.5, turn: -0.3, armL: 20, armR: 40, face: 'shocked' }, { arms: false });
  w += front('ty', t, { x: 960, y: 820, s: 0.52, armL: 80, armR: 80, face: 'scared' }, {});
  // the giant green hand reaching down
  const hy = lerp(-200, 260, ease.inOut(grow));
  w += S.g(S.rect(-200, -900, 400, 760, 60, ol('#2B2F3A', 12)) + S.rect(-210, -180, 420, 70, 20, ol('#FFFFFF', 10)) + S.rect(-180, -120, 360, 280, 70, ol('#8DCB54', 12)) +
    [-120, -40, 40, 120].map((x) => S.rect(x - 34, 120, 68, 150, 30, ol('#8DCB54', 10))).join(''), `translate(${f(1380)} ${f(hy)}) rotate(-20)`);
  let o = view(cam, w, 1);
  o += K.bang('TOO BIG!', 520, 200, bump(t, tBig - 0.1, tBig + 0.8), 100, -8, '#FF5A6E');
  return o;
}
function shotIdea(t) {
  const cam = camKeys(t, [[d27, { zoom: 1.0, x: 0, y: 0 }], [tIdea, { zoom: 1.1, x: -40, y: -30 }], [d28, { zoom: 1.14, x: -40, y: -30 }]]);
  let o = topFloor(t, { zoom: 1.0, x: 0, y: -200 }, { pile: 0, printerPower: 0.8 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05191E', opacity: 0.35 });
  let w = '';
  w += front('ty', t, { x: 520, y: 1060, s: 0.52, turn: 0.4, armL: 20, armR: 20, face: { name: 'confused', eyes: { look: [0.6, 0] } } }, { arms: false });
  w += front('mia', t, { x: 1400, y: 1060, s: 0.52, turn: -0.4, armL: 20, armR: 20, face: { name: 'deadpan', eyes: { look: [-0.6, 0] } } }, { arms: false });
  const step = ease.outBack(seg(t, tWait - 0.1, tWait + 0.3));
  w += front('pickle', t, { x: 960, y: lerp(1120, 1190, step), s: lerp(0.62, 0.72, step), armR: lerp(20, 165, step), armL: 20, face: t > tIdea ? 'excited' : 'determined' }, { arms: false });
  const bk = seg(t, tIdea - 0.05, tIdea + 0.15);
  if (bk > 0) {
    const by = 1190 - 1080 * 0.72 * 0.95 - 120;
    w += K.rays(960, by, 12, 260, '#FFF1B0', 0.4 * bk, t * 60);
    w += S.g(S.circle(0, -30, 70, ol('#FFE14D', 8)) + S.rect(-36, 30, 72, 50, 10, ol('#9AA0AE', 6)) + S.path('M-20 -30 Q0 -70 20 -30', ln(6, '#FF8A3D')), `translate(960 ${f(by)}) scale(${f(ease.outBack(bk))})`);
  }
  o += view(cam, w, 1);
  o += C.burst(960, 300, seg(t, tIdea, tIdea + 0.5));
  return o;
}
function shotWalkUp(t) {
  const u = seg(t, d28, d29);
  const cam = camKeys(t, [[d28, { zoom: 0.9, x: -100, y: 0 }], [d29, { zoom: 0.98, x: 60, y: 0 }]]);
  let o = topFloor(t, cam, { pile: 0, py: 1000, ps: 0.9 });
  let w = '';
  const lean = ease.inOut(seg(t, d28 + 0.4, d28 + 1.6));
  w += E.boss(t, { x: 1380, y: 1360, s: 1.85, lean: 14 * lean, headRot: 10 * lean, armL: 20, armR: 30, face: { name: 'confused', eyes: { look: [-0.7, 0.7] } } }, { orbit: 0.7 });
  w += S.g(E.coinMound(640, 220, t), 'translate(1380 1060)');
  const px = lerp(260, 760, ease.out(u));
  const wave = t < M[14].word('Thirty').t0 + 0.4;
  w += who('pickle', t, { x: px, y: 1000, s: 0.3, view: 'side', flip: true, ...(u < 0.9 ? A.walk(t * 9) : {}), armL: wave ? 160 + 20 * Math.sin(t * 14) : -20, shadow: true, face: 'happy' }, { arms: false });
  [['ty', 140], ['mia', 20]].forEach(([n, x]) => { w += front(n, t, { x, y: 1000, s: 0.3, turn: 0.6, armL: 20, armR: 20, face: 'scared' }, { arms: false }); });
  o += view(cam, w, 1);
  return o;
}
function shotPalm(t) {
  // close-up: twelve Robux stacked on Pickle's palm; the boss's giant eye looks down
  const cam = camKeys(t, [[d29, { zoom: 1.0, x: 0, y: 0 }], [d30, { zoom: 1.12, x: 0, y: 20 }]]);
  let o = topFloor(t, { zoom: 1.6, x: 0, y: -400 }, { pile: 0, printerPower: 0.6 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05191E', opacity: 0.35 });
  const ey = lerp(-260, 150, ease.out(seg(t, d29, tTwelve)));
  let w = S.g(S.rect(-560, -500, 1120, 560, 120, ol('#8DCB54', 12)) + S.ellipse(0, -80, 190, 140, ol('#FFFFFF', 10)) + S.circle(lerp(-20, -60, seg(t, tTwelve, tTwelve + 0.3)), -40, 76, { fill: '#151515' }) + S.circle(-40, -70, 20, { fill: '#FFF' }) +
    S.path('M-230 -270 L200 -210', ln(30, '#3E5A1E')), `translate(1440 ${f(ey)})`);
  // forearm + open palm (side view), coins stacking on it
  const ax = lerp(560, 640, ease.out(seg(t, d29, d29 + 0.3)));
  w += S.rect(ax - 900, 790, 760, 150, 34, ol('#58B947', 9)) + S.rect(ax - 170, 782, 60, 166, 16, ol('#449A36', 8));
  w += S.path(`M${ax - 120} 790 L${ax + 330} 790 Q${ax + 380} 790 ${ax + 380} 840 L${ax + 380} 860 Q${ax + 380} 900 ${ax + 330} 900 L${ax - 120} 900 Z`, ol('#F8D9C0', 9));
  w += S.path(`M${ax + 200} 812 L${ax + 330} 812 M${ax + 200} 846 L${ax + 340} 846`, ln(5, '#0002')) + S.path(`M${ax - 40} 790 Q${ax - 30} 740 ${ax + 20} 740 Q${ax + 60} 744 ${ax + 50} 790`, ol('#F8D9C0', 8));
  const n = Math.floor(12 * seg(t, d29 + 0.1, tTwelve + 0.35));
  for (let i = 0; i < n; i++) {
    const cx = ax + 160 + Math.sin(i * 1.7) * 6, cy = 774 - i * 22;
    w += S.rect(cx - 70, cy - 10, 140, 24, 10, ol('#E0A21A', 5)) + S.ellipse(cx, cy - 10, 70, 16, ol(E.GOLD, 5)) + S.ellipse(cx, cy - 10, 40, 8, { fill: 'none', stroke: '#B97A0E', 'stroke-width': 4 });
  }
  const ck = seg(t, tTwelve, tTwelve + 0.15);
  if (ck > 0) w += S.g(S.rect(-170, -60, 340, 120, 30, ol('#06222A', 7)) + K.robuxText(0, 30, '12', 90, E.GOLD), `translate(${f(ax + 160)} 400) rotate(-6) scale(${f(ease.outBack(ck))})`);
  o += view(cam, w, 1);
  o += K.sparkles([[ax + 260, 560, 24], [ax + 60, 520, 18]], t);
  return o;
}

// ---------------------------------------------------------------- B22–B25: the purchase, the math, the meltdown
function shotGreedy(t) {
  const cam = camKeys(t, [[d30, { zoom: 1.0, x: 0, y: 0 }], [tFeeM, { zoom: 1.08, x: 0, y: -20 }], [tFeeM + 0.12, { zoom: 1.22, x: 0, y: -40 }], [d31, { zoom: 1.24, x: 0, y: -40 }]]);
  shook(cam, t, tFeeM, 0.5, 14);
  let o = topFloor(t, { zoom: 1.5, x: 0, y: -500 }, { pile: 0 });
  let w = '';
  w += E.boss(t, { x: 960, y: 1620, s: 2.2, lean: 6, armL: 60, armR: 60, face: t > tPurchase - 0.1 ? 'rich' : 'shocked' }, { orbit: 0.8 });
  o += view(cam, w, 1);
  o += K.coinRain(t, 18, { speed: 500, r: 22, seed: 12 });
  o += K.bang('KA-CHING!', 380, 260, bump(t, tPurchase, tPurchase + 0.8), 90, -10, E.GOLD);
  const sk = seg(t, tFeeM - 0.05, tFeeM + 0.08);
  if (sk > 0) o += S.g(S.rect(-470, -90, 940, 180, 20, { fill: 'none', stroke: '#FF3B5C', 'stroke-width': 16 }) + T('MARKETPLACE FEE', 0, 30, 96, '#FF3B5C'), `translate(960 820) rotate(-8) scale(${f(lerp(2.5, 1, ease.out(sk)))})`, { opacity: f(sk) });
  return o;
}
function calcBig(display, key, col = '#BFF5B0', blink = 0) {
  let o = S.rect(-520, -640, 1040, 1280, 70, ol('#3A3F55', 14));
  o += S.rect(-440, -560, 880, 300, 30, ol(col, 10));
  o += T(display, 400, -340, display.length > 7 ? 150 : 190, blink ? '#3A6A3A' : '#1A3A1A', { 'text-anchor': 'end' });
  const lab = ['7', '8', '9', '×', '4', '5', '6', '%', '1', '2', '3', '='];
  lab.forEach((s, i) => {
    const r = Math.floor(i / 4), c = i % 4, dn = i === key ? 12 : 0;
    o += S.rect(-440 + c * 225, -200 + r * 260 + dn, 190, 220, 34, ol(c === 3 ? '#FF8A3D' : i === key ? '#FFE14D' : '#D7DCE6', 9)) + T(s, -345 + c * 225, -50 + r * 260 + dn, 120, '#2A2E3A');
  });
  return o;
}
const KEYS = { '1': 8, '2': 9, '3': 10, '×': 3, '%': 7, '=': 11, '0': -1 };
function shotCalc(t) {
  // the chest calculator: 30% × 12 =
  const seq = [[tK30 - 0.05, '30', 10], [tK30 + 0.3, '30%', 7], [tKof, '30%×', 3], [tK12, '30%×1', 8], [tK12 + 0.25, '30%×12', 9], [tKis, '=', 11]];
  let disp = '0', key = -1, kt = -9;
  for (const [tt, d, k] of seq) if (t >= tt) { disp = d; key = k; kt = tt; }
  if (t - kt > 0.18) key = -1;
  if (disp === '=') disp = Math.floor(t * 4) % 2 ? '...' : '..';
  const cam = camKeys(t, [[d31, { zoom: 1.0, x: 0, y: 0 }], [d32, { zoom: 1.08, x: 0, y: 0 }]]);
  let w = S.rect(-200, -200, 2400, 1500, 0, { fill: 'url(#s10coins)' }) + S.rect(-200, -200, 2400, 1500, 0, { fill: '#2B2F3A', opacity: 0.55 });
  w += S.g(calcBig(disp, key), 'translate(900 560) scale(0.78)');
  // the giant green finger
  const kk = key >= 0 ? key : 11;
  const tx = 900 + (-345 + (kk % 4) * 225) * 0.78, ty = 560 + (-90 + Math.floor(kk / 4) * 260) * 0.78;
  const press = key >= 0 ? 1 : 0;
  w += S.g(S.rect(-60, -900, 120, 900, 50, ol('#8DCB54', 10)) + S.path('M-30 -60 L30 -60', ln(6, '#6FAE3C')), `translate(${f(tx + 40 + (1 - press) * 40)} ${f(ty + 40 - (1 - press) * 60)}) rotate(28)`);
  let o = view(cam, w, 1);
  if (key >= 0) o += K.bang('BEEP', 1620, 260, bump(t, kt, kt + 0.3), 60, 8, '#BFF5B0');
  return o;
}
function shotThreePointSix(t) {
  const disp = t < tThree ? '...' : t < tPoint ? '3' : t < tSix ? '3.' : '3.6';
  const cam = camKeys(t, [[d32, { zoom: 1.0, x: 0, y: 0 }], [tThree, { zoom: 1.05, x: 0, y: 0 }], [tPoint, { zoom: 1.15, x: 0, y: 30 }], [tSix, { zoom: 1.28, x: 0, y: 60 }], [d33, { zoom: 1.32, x: 0, y: 60 }]]);
  let o = topFloor(t, { zoom: 1.5, x: 0, y: -500 }, { pile: 0, printerPower: 0.7 });
  let w = '';
  const conf = seg(t, tPoint, tSix);
  w += E.boss(t, { x: 960, y: 1240, s: 1.75, headRot: lerp(0, 12, conf), armL: 30, armR: 30, face: { name: conf > 0.5 ? 'confused' : 'neutral', eyes: { look: [0, 0.9] }, fx: conf > 0.5 ? ['sweat'] : [] } }, { display: disp, orbit: 0.5, calcCol: t > tSix ? '#FFE98A' : '#BFF5B0' });
  o += view(cam, w, 1);
  for (const [tt, s, x] of [[tThree, '3...', 1450], [tPoint, 'POINT...', 1500], [tSix, '6!', 1450]]) o += K.bang(s, x, 380, bump(t, tt, tt + 0.7), 130, 6, '#BFF5B0');
  return o;
}
function glitchBoss(t, pose, o, g, crack = 0) {
  // RGB-split ghosts + slice displacement + cracks; g = glitch strength 0..1
  const jit = (s) => (hash(Math.floor(t * 30) + s) - 0.5) * 2;
  let out = '';
  if (g > 0) out += E.bossGhost(pose, '#FF2D55', -30 * g + 12 * jit(1) * g, 4 * jit(2) * g, 0.55 * g) + E.bossGhost(pose, '#2DE2FF', 30 * g + 12 * jit(3) * g, 4 * jit(4) * g, 0.55 * g);
  const id = S.uid('s10boss');
  const body = E.boss(t, pose, o);
  out += `<defs><g id="${id}">${body}</g></defs><use href="#${id}"/>`;
  // displaced slices
  const nS = g > 0.15 ? 3 : 0;
  for (let i = 0; i < nS; i++) {
    if (hash(Math.floor(t * 12) + i * 7) > 0.35 + 0.4 * (1 - g)) continue;
    const y = 80 + hash(Math.floor(t * 12) * 3 + i) * 900, h = 30 + hash(i + Math.floor(t * 12)) * 90;
    const cid = S.uid('s10sl');
    out += S.clipDef(cid, S.rect(0, y, 1920, h)) + S.g(`<use href="#${id}"/>`, `translate(${f(jit(i + 9) * 90 * g)} 0)`, { 'clip-path': `url(#${cid})` });
  }
  out += E.bossCrack(t, pose, crack);
  return out;
}
function shotDecimals(t) {
  const disp = t < tSix2 ? '3.6' : t < tDecimals ? (Math.floor(t * 6) % 2 ? '3.6?!' : '3.6') : 'ERR';
  const cam = camKeys(t, [[d33, { zoom: 1.0, x: 0, y: 0 }], [tSix2 + 0.1, { zoom: 1.1, x: 0, y: -20 }], [tDecimals, { zoom: 1.1, x: 0, y: -20 }], [tDecimals + 0.12, { zoom: 1.24, x: 40, y: 10 }], [d34, { zoom: 1.26, x: 40, y: 10 }]]);
  shook(cam, t, tSix2, 0.6, 14); shook(cam, t, tDecimals, 0.8, 18);
  let o = topFloor(t, { zoom: 1.2, x: 0, y: -300 }, { pile: 0, printerPower: 1.5 });
  const burst = Math.max(bump(t, tSix2, tSix2 + 0.35), bump(t, tSix2 + 0.9, tSix2 + 1.1), bump(t, tDecimals - 0.1, tDecimals + 0.4), bump(t, tDecimals + 0.6, tDecimals + 0.8));
  const pose = { x: 960, y: 1190, s: 1.55, armL: 170 + 6 * Math.sin(t * 30), armR: 170 + 6 * Math.sin(t * 33), face: t > tSix2 ? 'scream' : 'shocked' };
  let w = glitchBoss(t, pose, { display: disp, calcCol: disp === 'ERR' ? '#FF8A9A' : '#FFE98A', orbit: 0.8 }, burst * 0.8, 0.12 * seg(t, tDecimals, d34));
  // the decimal point escapes and bounces
  const dk = t - tDecimals;
  if (dk > 0) {
    const bx = 960 + 70 + dk * 520, by = 1040 - 250 * Math.abs(Math.sin(dk * 5)) * Math.exp(-dk * 0.8) - 300 * Math.exp(-dk * 6);
    w += S.circle(bx, Math.min(by, 1040), 46, ol('#1A3A1A', 8)) + S.circle(bx - 14, Math.min(by, 1040) - 14, 12, { fill: '#FFFFFF', opacity: 0.5 });
  }
  let o2 = view(cam, w, 1);
  o += rotAll(o2, -5);
  o += K.bang('DECIMALS?!', 1450, 220, bump(t, tDecimals, tDecimals + 0.8), 100, 8, '#FF5A6E');
  o += K.bang('?!', 520, 260, bump(t, tSix2, tSix2 + 0.7), 140, -10, '#FFE14D');
  return o;
}
function shotCompute(t) {
  const cam = camKeys(t, [[d34, { zoom: 0.92, x: 0, y: 40 }], [tBoom - 0.4, { zoom: 1.0, x: 0, y: 0 }], [tBoom, { zoom: 1.04, x: 0, y: 0 }], [d35, { zoom: 0.95, x: 0, y: 30 }]]);
  shook(cam, t, d34, 2.6, 8); shook(cam, t, tBoom, 0.6, 30);
  let o = topFloor(t, cam, { pile: 0, py: 1000, ps: 0.9, printerPower: 2 });
  const boom = t >= tBoom;
  if (!boom) {
    const crack = ease.in(seg(t, d34 + 0.2, tBoom - 0.1));
    const inflate = ease.out(seg(t, tCompute2 - 0.2, tBoom));
    const wob = 1 + 0.35 * inflate + 0.05 * Math.sin(t * 40) * inflate;
    const pose = { x: 960, y: 1130, s: 1.4 * wob, armL: 150 + 20 * Math.sin(t * 25), armR: 150 + 20 * Math.cos(t * 23), face: 'dizzy' };
    const g = 0.4 + 0.6 * crack;
    o += view(cam, glitchBoss(t, pose, { display: Math.floor(t * 10) % 3 ? 'ERR' : '3.6', calcCol: '#FF8A9A', orbit: 1 - crack }, g, crack), 1);
    // error windows pile up
    const errs = [[420, 280, 'DOES NOT COMPUTE'], [1500, 360, 'ERROR: 3.6'], [520, 640, 'DECIMAL NOT FOUND'], [1420, 720, 'DOES NOT COMPUTE'], [960, 180, '0.6 OF A COIN?!'], [300, 470, 'FEE OVERFLOW'], [1640, 560, 'NaN%']];
    errs.forEach(([x, y, s], i) => { o += errBox(x + Math.sin(t * 20 + i) * 4 * crack, y, 0.9, s, seg(t, d34 + 0.2 + i * 0.3, d34 + 0.35 + i * 0.3)); });
  } else {
    const age = t - tBoom;
    const ring = ease.out(clamp(age / 0.5, 0, 1));
    if (ring < 1) o += S.circle(960, 600, 100 + 1100 * ring, { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 60 * (1 - ring), opacity: f(1 - ring) });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, d = 200 + 500 * ring; if (age < 0.9) o += S.circle(960 + Math.cos(a) * d, 600 + Math.sin(a) * d * 0.7, 90 * (1 - age), { fill: '#DDF6FF', opacity: f(0.7 * (1 - age / 0.9)), stroke: '#151515', 'stroke-width': 5 }); }
    o += E.pixelBurst(960, 600, age, 80, 1.5, 3);
    o += K.coinBurst(960, 600, age, 36, 1500, 34, 4);
    o += K.confetti(t, tBoom, 70, 11);
    o += K.bang('POP!', 960, 460, bump(t, tBoom, tBoom + 0.5), 220, -6, '#FFFFFF');
  }
  o += C.whiteFlash(Math.max(0.9 * bump(t, tBoom - 0.03, tBoom + 0.18), 0));
  return o;
}

// ---------------------------------------------------------------- B26–B28: exactly 3.6 coins; "you beat him with MATH!"; "Burn."
function shotCoins(t) {
  const cam = camKeys(t, [[d35, { zoom: 1.0, x: 0, y: 0 }], [d36, { zoom: 1.08, x: 0, y: 20 }]]);
  let o = topFloor(t, { zoom: 1.0, x: 0, y: -100 }, { pile: 0, printerPower: 0.4 });
  let w = '';
  const math = seg(t, tMath - 0.1, tMath + 0.15);
  w += front('ty', t, { x: 520, y: 1050, s: 0.55, turn: 0.3, armL: lerp(40, 165, ease.outBack(math)), armR: lerp(40, 160, ease.outBack(math)), lift: 30 * bump(t, tMath, tMath + 0.4), face: 'joy' }, { arms: false });
  w += front('mia', t, { x: 1420, y: 1050, s: 0.55, turn: -0.3, armL: 16, armR: 16, face: { name: 'deadpan', eyes: { look: [-0.6, -0.4] } } }, { arms: false });
  w += front('pickle', t, { x: 960, y: 1060, s: 0.6, armL: -24, armR: -24, face: { name: 'amazed', eyes: { look: [0, -0.8] } } }, { arms: false });
  // exactly 3.6 coins fall into Pickle's cupped hands
  const hx = 960, hy = 1060 - 300 * 0.6 * 0.95;
  const drops = [d35 + 0.1, d35 + 0.35, d35 + 0.6];
  drops.forEach((td, i) => {
    const u = seg(t, td, td + 0.45);
    if (u <= 0) return;
    const x = hx - 40 + i * 40, y = lerp(-100, hy - 20 - i * 24, ease.in(u));
    w += coin(x, y, 34, 0, u < 1 ? t * 10 : 0);
    if (u >= 1) w += TF(String(i + 1), x, y - 50, 40, '#FFFFFF', { stroke: '#151515', 'stroke-width': 6, 'paint-order': 'stroke', opacity: f(1 - seg(t, td + 0.45, td + 1.2)) });
  });
  const pu = seg(t, d35 + 0.9, d35 + 1.9);
  if (pu > 0) w += partCoin(hx + 10 + Math.sin(pu * 12) * 60 * (1 - pu), lerp(-120, hy - 100, pu), 34, Math.sin(pu * 10) * 40 * (1 - pu), 0.6);
  const lk = seg(t, d35 + 1.9, d35 + 2.1);
  if (lk > 0) w += S.g(S.rect(-140, -60, 280, 120, 30, ol('#06222A', 7)) + K.robuxText(0, 30, '3.6', 80, E.GOLD), `translate(${hx} ${hy - 260}) scale(${f(ease.outBack(lk))})`);
  o += view(cam, w, 1);
  o += E.confettiFall(t, d35 - 0.4, 60, 6);
  o += K.bang('MATH!', 520, 230, bump(t, tMath, tMath + 0.8), 110, -8, '#3BD16F');
  return o;
}
function chalkboard(t, k) {
  let o = S.rect(-460, -260, 920, 520, 20, ol('#8A5A34', 14)) + S.rect(-430, -230, 860, 460, 10, { fill: '#1E4A3A' });
  const lines = [['12 × 30% = 3.6', -40], ['ROBUX ≠ DECIMALS', 70]];
  lines.forEach(([s, y], i) => { o += TF(s, -40, y, 70, '#F4F7F6', { opacity: f(seg(k, i * 0.4, i * 0.4 + 0.4)) }); });
  o += S.path('M300 -10 L340 30 L410 -60', ln(12, '#7CFF6B', seg(k, 0.3, 0.5)));
  o += S.circle(300, -150, 70, { fill: 'none', stroke: '#FF6F86', 'stroke-width': 10, opacity: f(seg(k, 0.6, 0.8)) }) + T('A+', 300, -124, 80, '#FF6F86', { opacity: f(seg(k, 0.6, 0.8)) });
  return o;
}
function shotMathClass(t) {
  const cam = camKeys(t, [[d36, { zoom: 1.0, x: 0, y: 0 }], [tMathC, { zoom: 1.08, x: 30, y: -20 }], [d37, { zoom: 1.14, x: 40, y: -30 }]]);
  let o = topFloor(t, { zoom: 1.3, x: 0, y: -300 }, { pile: 0, printerPower: 0.3 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05191E', opacity: 0.3 });
  let w = S.g(chalkboard(t, seg(t, d36, tMathC + 0.4)), 'translate(1300 380) rotate(3) scale(0.9)');
  w += front('pickle', t, { x: 640, y: 1350, s: 0.95, turn: 0.25, armL: 30, armR: 30, lean: -4, face: { name: 'smug', fx: ['sparkles'] } }, {});
  w += partCoin(640 + A.hand(30, 1)[0] * 0.9 + 30, 1350 + A.hand(30, 1)[1] * 0.9 - 30, 40, -10, 0.6);
  o += view(cam, w, 1);
  o += K.sparkles([[420, 300, 30], [900, 260, 24], [760, 160, 18]], t);
  o += E.confettiFall(t, d35 - 0.4, 40, 6);
  return o;
}
function shotBurn(t) {
  const cam = camKeys(t, [[d37, { zoom: 1.0, x: 0, y: 0 }], [tBurn, { zoom: 1.04, x: 0, y: 0 }], [tBurn + 0.1, { zoom: 1.18, x: -30, y: -40 }], [END, { zoom: 1.2, x: -30, y: -40 }]]);
  let o = topFloor(t, { zoom: 1.3, x: 200, y: -300 }, { pile: 0, printerPower: 0.3 });
  o += S.rect(0, 0, 1920, 1080, 0, { fill: '#05191E', opacity: 0.3 });
  let w = front('pickle', t, { x: 1500, y: 1250, s: 0.6, turn: -0.3, armL: 20, armR: 20, face: { name: 'smug' } }, { arms: false });
  w += front('ty', t, { x: 1760, y: 1260, s: 0.6, turn: -0.4, armL: 20, armR: 20, face: { name: 'joy', mouth: 'O' } }, { arms: false });
  w += front('mia', t, { x: 820, y: 1400, s: 1.0, turn: 0.15, armL: 16, armR: 16, face: t > tBurn + 0.3 ? { name: 'smug', mouth: 'smirk' } : 'deadpan' }, {});
  // the little flame
  const fk = seg(t, tBurn, tBurn + 0.2);
  if (fk > 0) {
    const fl = 1 + 0.08 * Math.sin(t * 20);
    w += S.g(S.path('M0 60 Q-70 40 -50 -20 Q-40 -60 -10 -90 Q-10 -40 20 -30 Q20 -80 50 -100 Q80 -40 60 10 Q50 50 0 60 Z', ol('#FF8A3D', 7)) + S.path('M0 50 Q-30 30 -20 0 Q0 -20 10 -10 Q30 10 20 40 Z', { fill: '#FFE14D' }), `translate(1180 360) scale(${f(ease.outBack(fk) * fl)})`);
  }
  o += view(cam, w, 1);
  o += K.bang('OOOH!', 1600, 420, bump(t, tBurn + 0.35, tBurn + 1.3), 70, 8, '#FFFFFF');
  return o;
}

// ---------------------------------------------------------------- router
const SHOTS = [
  [d1, shotOutside], [d2, shotTiltUp], [d3, shotAvalanche], [d4, shotTags], [d5, shotTagCU], [d6, shotLasers], [d7, shotScannerPOV], [d8, shotScanMia], [d9, shotNotBeret],
  [d10, shotBills], [d11, shotDebt], [d12, shotBuried], [d13, shotDive], [d14, shotHands], [d15, shotYank], [d16, shotThanks], [d17, shotVents], [d18, shotPour], [d19, shotFee],
  [d20, shotSockPanic], [d21, shotSnip], [d22, shotPrinter], [d23, shotGuard], [d24, shotRise], [d25, shotSandwich], [d26, shotMe], [d27, shotTooBig], [d28, shotIdea],
  [d29, shotWalkUp], [d30, shotPalm], [d31, shotGreedy], [d32, shotCalc], [d33, shotThreePointSix], [d34, shotDecimals], [d35, shotCompute], [d36, shotCoins], [d37, shotMathClass], [Infinity, shotBurn],
];
const WHIPS = [d2, d3, d5, d7, d9, d10, d11, d13, d14, d17, d18, d20, d21, d24, d25, d29, d30, d31];
function scene(t) {
  const sh = SHOTS.find(([b]) => t < b);
  let o = sh[1](t);
  for (const tc of WHIPS) o += C.whiteFlash(0.35 * bump(t, tc - 0.05, tc + 0.07));
  return o;
}
const look = (t) => (t < d1 ? { grade: 'night', vignette: 0.9 } : t >= d33 && t < tBoom ? { grade: 'cool', vignette: 1 } : { grade: 'warm', vignette: 0.9 });

module.exports = { scene, look, DEFS: E.DEFS };
